/**
 * FlowTune 插件包管理器实现
 * Plugin Package Manager Implementation
 */

import {
  IPackageManager,
  IPackageInstaller,
  IPackageStorage,
  IPluginPackage,
  IInstalledPackage,
  IPackageSource,
  IPackageInstallOptions,
  PackageInstallStatus,
  InstallProgress,
  IPluginManifest,
  PackageEvents
} from './package-system';
import { IEventBus } from './types';

// ============= 包管理器实现 =============

/**
 * 插件包管理器实现
 */
export class PackageManager implements IPackageManager {
  private installer: IPackageInstaller;
  private storage: IPackageStorage;
  private eventBus: IEventBus;

  constructor(
    installer: IPackageInstaller,
    storage: IPackageStorage,
    eventBus: IEventBus
  ) {
    this.installer = installer;
    this.storage = storage;
    this.eventBus = eventBus;
  }

  async addSource(source: IPackageSource): Promise<void> {
    const sources = await this.storage.getSources();
    const existingIndex = sources.findIndex(s => s.name === source.name);
    
    if (existingIndex >= 0) {
      sources[existingIndex] = source;
    } else {
      sources.push(source);
    }
    
    await this.storage.saveSources(sources);
    this.eventBus.emit('source:added', { source });
  }

  async removeSource(name: string): Promise<void> {
    const sources = await this.storage.getSources();
    const filteredSources = sources.filter(s => s.name !== name);
    
    await this.storage.saveSources(filteredSources);
    this.eventBus.emit('source:removed', { sourceName: name });
  }

  async getSources(): Promise<IPackageSource[]> {
    return await this.storage.getSources();
  }

  async searchPackages(query: string, source?: string): Promise<IPluginPackage[]> {
    const sources = await this.getSources();
    const targetSources = source ? sources.filter(s => s.name === source) : sources;
    
    const results: IPluginPackage[] = [];
    
    for (const src of targetSources) {
      try {
        const searchUrl = `${src.url}/search?q=${encodeURIComponent(query)}`;
        const response = await this.fetchWithAuth(searchUrl, src);
        const packages = await response.json() as IPluginPackage[];
        results.push(...packages);
      } catch (error) {
        console.warn(`Search failed for source ${src.name}:`, error);
      }
    }
    
    return results;
  }

  async getPackageInfo(packageId: string, version?: string, source?: string): Promise<IPluginPackage> {
    const sources = await this.getSources();
    const targetSources = source ? sources.filter(s => s.name === source) : sources;
    
    for (const src of targetSources) {
      try {
        const versionParam = version ? `/${version}` : '';
        const infoUrl = `${src.url}/packages/${packageId}${versionParam}`;
        const response = await this.fetchWithAuth(infoUrl, src);
        
        if (response.ok) {
          return await response.json() as IPluginPackage;
        }
      } catch (error) {
        console.warn(`Failed to get package info from ${src.name}:`, error);
      }
    }
    
    throw new Error(`Package ${packageId} not found`);
  }

  async installPackage(
    packageId: string, 
    version?: string, 
    options: IPackageInstallOptions = {}
  ): Promise<IInstalledPackage> {
    this.eventBus.emit('package:install:start', { packageId, version: version || 'latest' });
    
    try {
      // 1. 获取包信息
      const packageInfo = await this.getPackageInfo(packageId, version, options.source);
      
      // 2. 检查兼容性
      const compatibility = await this.checkCompatibility(packageInfo);
      if (!compatibility.compatible && !options.force) {
        throw new Error(`Package incompatible: ${compatibility.issues.join(', ')}`);
      }
      
      // 3. 检查依赖
      if (!options.skipDependencies && packageInfo.dependencies) {
        await this.installDependencies(packageInfo.dependencies, options);
      }
      
      // 4. 下载包
      const downloadUrl = await this.getDownloadUrl(packageInfo, options.source);
      const tempPath = `/tmp/${packageId}-${packageInfo.version}.zip`;
      
      await this.installer.downloadPackage(downloadUrl, tempPath, (progress) => {
        this.eventBus.emit('package:install:progress', { packageId, progress });
        options.onProgress?.(progress);
      });
      
      // 5. 验证包
      const validation = await this.installer.validatePackage(tempPath);
      if (!validation.valid) {
        throw new Error(`Package validation failed: ${validation.errors.join(', ')}`);
      }
      
      // 6. 安装包
      const installPath = `/plugins/${packageId}`;
      const installedPackage = await this.installer.installPackage(tempPath, installPath, (progress) => {
        this.eventBus.emit('package:install:progress', { packageId, progress });
        options.onProgress?.(progress);
      });
      
      // 7. 保存到存储
      await this.storage.savePackage(installedPackage);
      
      // 8. 自动启用（如果设置）
      if (options.autoEnable) {
        await this.enablePackage(packageId);
      }
      
      this.eventBus.emit('package:install:complete', { packageId, package: installedPackage });
      return installedPackage;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.storage.updatePackageStatus(packageId, PackageInstallStatus.INSTALL_FAILED, errorMessage);
      this.eventBus.emit('package:install:error', { packageId, error: errorMessage });
      throw error;
    }
  }

  async uninstallPackage(packageId: string): Promise<void> {
    this.eventBus.emit('package:uninstall:start', { packageId });
    
    try {
      const installedPackage = await this.storage.getPackage(packageId);
      if (!installedPackage) {
        throw new Error(`Package ${packageId} is not installed`);
      }
      
      // 1. 禁用包
      if (installedPackage.status === PackageInstallStatus.ENABLED) {
        await this.disablePackage(packageId);
      }
      
      // 2. 卸载文件
      await this.installer.uninstallPackage(installedPackage.installPath);
      
      // 3. 从存储中移除
      await this.storage.removePackage(packageId);
      
      this.eventBus.emit('package:uninstall:complete', { packageId });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.eventBus.emit('package:uninstall:error', { packageId, error: errorMessage });
      throw error;
    }
  }

  async enablePackage(packageId: string): Promise<void> {
    this.eventBus.emit('package:enable:start', { packageId });
    
    try {
      const installedPackage = await this.storage.getPackage(packageId);
      if (!installedPackage) {
        throw new Error(`Package ${packageId} is not installed`);
      }
      
      // 更新状态为启用中
      await this.storage.updatePackageStatus(packageId, PackageInstallStatus.ENABLING);
      
      // 加载并启用包中的所有插件
      for (const plugin of installedPackage.plugins) {
        if (plugin.activate) {
          await plugin.activate({} as any); // 这里需要传入实际的插件上下文
        }
      }
      
      // 更新状态为已启用
      await this.storage.updatePackageStatus(packageId, PackageInstallStatus.ENABLED);
      
      this.eventBus.emit('package:enable:complete', { packageId });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.storage.updatePackageStatus(packageId, PackageInstallStatus.ENABLE_FAILED, errorMessage);
      this.eventBus.emit('package:enable:error', { packageId, error: errorMessage });
      throw error;
    }
  }

  async disablePackage(packageId: string): Promise<void> {
    this.eventBus.emit('package:disable:start', { packageId });
    
    try {
      const installedPackage = await this.storage.getPackage(packageId);
      if (!installedPackage) {
        throw new Error(`Package ${packageId} is not installed`);
      }
      
      // 更新状态为禁用中
      await this.storage.updatePackageStatus(packageId, PackageInstallStatus.DISABLING);
      
      // 禁用包中的所有插件
      for (const plugin of installedPackage.plugins) {
        if (plugin.deactivate) {
          await plugin.deactivate();
        }
      }
      
      // 更新状态为已禁用
      await this.storage.updatePackageStatus(packageId, PackageInstallStatus.DISABLED);
      
      this.eventBus.emit('package:disable:complete', { packageId });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.eventBus.emit('package:disable:error', { packageId, error: errorMessage });
      throw error;
    }
  }

  async updatePackage(
    packageId: string, 
    version?: string, 
    options: IPackageInstallOptions = {}
  ): Promise<IInstalledPackage> {
    const currentPackage = await this.storage.getPackage(packageId);
    if (!currentPackage) {
      throw new Error(`Package ${packageId} is not installed`);
    }
    
    const fromVersion = currentPackage.version;
    const toVersion = version || 'latest';
    
    this.eventBus.emit('package:update:start', { packageId, fromVersion, toVersion });
    
    try {
      // 先卸载旧版本
      await this.uninstallPackage(packageId);
      
      // 安装新版本
      const updatedPackage = await this.installPackage(packageId, version, options);
      
      this.eventBus.emit('package:update:complete', { packageId, package: updatedPackage });
      return updatedPackage;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.eventBus.emit('package:update:error', { packageId, error: errorMessage });
      throw error;
    }
  }

  async getInstalledPackages(): Promise<IInstalledPackage[]> {
    return await this.storage.getAllPackages();
  }

  async getDependencies(packageId: string): Promise<string[]> {
    const packageInfo = await this.getPackageInfo(packageId);
    return Object.keys(packageInfo.dependencies || {});
  }

  async checkCompatibility(packageInfo: IPluginPackage): Promise<{ compatible: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // 检查最小版本要求
    if (packageInfo.config?.minVersion) {
      // 这里应该检查当前应用版本
      // const currentVersion = getCurrentAppVersion();
      // if (compareVersions(currentVersion, packageInfo.config.minVersion) < 0) {
      //   issues.push(`Requires minimum version ${packageInfo.config.minVersion}`);
      // }
    }
    
    // 检查平台兼容性
    if (packageInfo.config?.platforms) {
      const currentPlatform = this.getCurrentPlatform();
      if (!packageInfo.config.platforms.includes(currentPlatform)) {
        issues.push(`Not compatible with platform ${currentPlatform}`);
      }
    }
    
    return {
      compatible: issues.length === 0,
      issues
    };
  }

  async verifyPackage(packagePath: string): Promise<{ valid: boolean; errors: string[] }> {
    return await this.installer.validatePackage(packagePath);
  }

  // ============= 私有辅助方法 =============

  private async fetchWithAuth(url: string, source: IPackageSource): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (source.auth) {
      switch (source.auth.type) {
        case 'basic':
          const credentials = btoa(`${source.auth.credentials.username}:${source.auth.credentials.password}`);
          headers['Authorization'] = `Basic ${credentials}`;
          break;
        case 'bearer':
          headers['Authorization'] = `Bearer ${source.auth.credentials.token}`;
          break;
        case 'apikey':
          headers['X-API-Key'] = source.auth.credentials.apikey;
          break;
      }
    }
    
    return fetch(url, {
      headers,
      signal: AbortSignal.timeout(source.config?.timeout || 30000)
    });
  }

  private async getDownloadUrl(packageInfo: IPluginPackage, sourceName?: string): Promise<string> {
    const sources = await this.getSources();
    const source = sourceName ? sources.find(s => s.name === sourceName) : sources[0];
    
    if (!source) {
      throw new Error('No package source available');
    }
    
    return `${source.url}/packages/${packageInfo.id}/${packageInfo.version}/download`;
  }

  private async installDependencies(
    dependencies: Record<string, string>,
    options: IPackageInstallOptions
  ): Promise<void> {
    for (const [depId, depVersion] of Object.entries(dependencies)) {
      const existingPackage = await this.storage.getPackage(depId);
      if (!existingPackage) {
        await this.installPackage(depId, depVersion, {
          ...options,
          autoEnable: false // 依赖包不自动启用
        });
      }
    }
  }

  private getCurrentPlatform(): string {
    // 判断运行环境
    try {
      if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
        return 'web';
      } else if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
        const process = (globalThis as any).process;
        if (process?.versions?.electron) {
          return 'desktop';
        } else if (process?.versions?.node) {
          return 'node';
        }
      }
    } catch {
      // 忽略错误
    }
    return 'unknown';
  }
}
