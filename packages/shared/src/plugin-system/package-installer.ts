/**
 * FlowTune 插件包安装器实现
 * Plugin Package Installer Implementation
 */

import {
  IPackageInstaller,
  IInstalledPackage,
  IPluginManifest,
  PackageInstallStatus,
  InstallProgress
} from './package-system';

// ============= 文件系统接口抽象 =============

/**
 * 文件系统操作接口
 */
export interface IFileSystem {
  /** 读取文件 */
  readFile(path: string): Promise<Buffer>;
  
  /** 写入文件 */
  writeFile(path: string, data: Buffer | string): Promise<void>;
  
  /** 创建目录 */
  mkdir(path: string, recursive?: boolean): Promise<void>;
  
  /** 删除文件/目录 */
  remove(path: string): Promise<void>;
  
  /** 检查文件/目录是否存在 */
  exists(path: string): Promise<boolean>;
  
  /** 列出目录内容 */
  readdir(path: string): Promise<string[]>;
  
  /** 获取文件信息 */
  stat(path: string): Promise<{ isFile(): boolean; isDirectory(): boolean; size: number }>;
  
  /** 复制文件/目录 */
  copy(src: string, dest: string): Promise<void>;
}

/**
 * HTTP 客户端接口
 */
export interface IHttpClient {
  /** 下载文件 */
  download(url: string, destination: string, onProgress?: (progress: InstallProgress) => void): Promise<string>;
}

/**
 * 压缩文件处理接口
 */
export interface IArchiveHandler {
  /** 解压文件 */
  extract(archivePath: string, destination: string, onProgress?: (progress: InstallProgress) => void): Promise<string>;
  
  /** 压缩文件 */
  compress(sourcePath: string, destination: string): Promise<string>;
}

// ============= 插件包安装器实现 =============

/**
 * 插件包安装器实现
 */
export class PackageInstaller implements IPackageInstaller {
  private fs: IFileSystem;
  private http: IHttpClient;
  private archive: IArchiveHandler;

  constructor(
    fs: IFileSystem,
    http: IHttpClient,
    archive: IArchiveHandler
  ) {
    this.fs = fs;
    this.http = http;
    this.archive = archive;
  }

  async downloadPackage(
    url: string,
    destination: string,
    onProgress?: (progress: InstallProgress) => void
  ): Promise<string> {
    onProgress?.({
      stage: 'download',
      progress: 0,
      message: 'Starting download...'
    });

    try {
      const downloadedPath = await this.http.download(url, destination, onProgress);
      
      onProgress?.({
        stage: 'download',
        progress: 100,
        message: 'Download completed'
      });
      
      return downloadedPath;
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractPackage(
    packagePath: string,
    destination: string,
    onProgress?: (progress: InstallProgress) => void
  ): Promise<string> {
    onProgress?.({
      stage: 'extract',
      progress: 0,
      message: 'Starting extraction...'
    });

    try {
      // 确保目标目录存在
      await this.fs.mkdir(destination, true);
      
      const extractedPath = await this.archive.extract(packagePath, destination, onProgress);
      
      onProgress?.({
        stage: 'extract',
        progress: 100,
        message: 'Extraction completed'
      });
      
      return extractedPath;
    } catch (error) {
      throw new Error(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async installPackage(
    packagePath: string,
    installPath: string,
    onProgress?: (progress: InstallProgress) => void
  ): Promise<IInstalledPackage> {
    onProgress?.({
      stage: 'install',
      progress: 0,
      message: 'Starting installation...'
    });

    try {
      // 1. 验证包
      const validation = await this.validatePackage(packagePath);
      if (!validation.valid || !validation.manifest) {
        throw new Error(`Invalid package: ${validation.errors.join(', ')}`);
      }

      const manifest = validation.manifest;

      onProgress?.({
        stage: 'install',
        progress: 20,
        message: 'Validating package...'
      });

      // 2. 解压包到临时目录
      const tempDir = `${installPath}_temp`;
      await this.extractPackage(packagePath, tempDir, (extractProgress) => {
        onProgress?.({
          stage: 'install',
          progress: 20 + (extractProgress.progress * 0.4), // 20-60%
          message: extractProgress.message
        });
      });

      onProgress?.({
        stage: 'install',
        progress: 60,
        message: 'Loading package manifest...'
      });

      // 3. 加载包的完整信息
      const packageInfo = await this.loadPackageInfo(tempDir, manifest);

      onProgress?.({
        stage: 'install',
        progress: 70,
        message: 'Installing package files...'
      });

      // 4. 移动到最终安装目录
      if (await this.fs.exists(installPath)) {
        await this.fs.remove(installPath);
      }
      await this.fs.copy(tempDir, installPath);

      onProgress?.({
        stage: 'install',
        progress: 80,
        message: 'Running install scripts...'
      });

      // 5. 运行安装脚本
      if (manifest.scripts?.install) {
        await this.runScript(manifest.scripts.install, installPath);
      }

      onProgress?.({
        stage: 'install',
        progress: 90,
        message: 'Finalizing installation...'
      });

      // 6. 清理临时文件
      await this.fs.remove(tempDir);
      if (await this.fs.exists(packagePath)) {
        await this.fs.remove(packagePath);
      }

      // 7. 创建已安装包信息
      const installedPackage: IInstalledPackage = {
        ...packageInfo,
        status: PackageInstallStatus.INSTALLED,
        installPath,
        installedAt: new Date(),
        updatedAt: new Date()
      };

      onProgress?.({
        stage: 'install',
        progress: 100,
        message: 'Installation completed'
      });

      return installedPackage;

    } catch (error) {
      // 清理失败的安装
      try {
        if (await this.fs.exists(`${installPath}_temp`)) {
          await this.fs.remove(`${installPath}_temp`);
        }
        if (await this.fs.exists(installPath)) {
          await this.fs.remove(installPath);
        }
      } catch {
        // 忽略清理错误
      }

      throw new Error(`Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uninstallPackage(packagePath: string): Promise<void> {
    try {
      // 1. 读取包清单
      const manifestPath = `${packagePath}/package.json`;
      if (await this.fs.exists(manifestPath)) {
        const manifestContent = await this.fs.readFile(manifestPath);
        const manifest: IPluginManifest = JSON.parse(manifestContent.toString());

        // 2. 运行卸载前脚本
        if (manifest.scripts?.preUninstall) {
          await this.runScript(manifest.scripts.preUninstall, packagePath);
        }

        // 3. 运行卸载脚本
        if (manifest.scripts?.uninstall) {
          await this.runScript(manifest.scripts.uninstall, packagePath);
        }
      }

      // 4. 删除包文件
      if (await this.fs.exists(packagePath)) {
        await this.fs.remove(packagePath);
      }

    } catch (error) {
      throw new Error(`Uninstallation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validatePackage(packagePath: string): Promise<{
    valid: boolean;
    manifest?: IPluginManifest;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // 1. 检查文件是否存在
      if (!(await this.fs.exists(packagePath))) {
        errors.push('Package file does not exist');
        return { valid: false, errors };
      }

      // 2. 如果是压缩文件，先解压到临时目录验证
      let validatePath = packagePath;
      let tempDir = '';

      if (packagePath.endsWith('.zip') || packagePath.endsWith('.tar.gz')) {
        tempDir = `${packagePath}_validate_temp`;
        validatePath = await this.extractPackage(packagePath, tempDir);
      }

      try {
        // 3. 检查清单文件
        const manifestPath = `${validatePath}/package.json`;
        if (!(await this.fs.exists(manifestPath))) {
          errors.push('Package manifest (package.json) not found');
        } else {
          // 4. 验证清单文件格式
          const manifestContent = await this.fs.readFile(manifestPath);
          const manifest: IPluginManifest = JSON.parse(manifestContent.toString());

          // 5. 验证必需字段
          if (!manifest.id) errors.push('Package ID is required');
          if (!manifest.name) errors.push('Package name is required');
          if (!manifest.version) errors.push('Package version is required');
          if (!manifest.main) errors.push('Package main entry is required');

          // 6. 检查入口文件
          const mainPath = `${validatePath}/${manifest.main}`;
          if (!(await this.fs.exists(mainPath))) {
            errors.push(`Main entry file ${manifest.main} not found`);
          }

          // 7. 检查声明的文件
          if (manifest.files) {
            for (const file of manifest.files) {
              const filePath = `${validatePath}/${file}`;
              if (!(await this.fs.exists(filePath))) {
                errors.push(`Declared file ${file} not found`);
              }
            }
          }

          if (errors.length === 0) {
            return { valid: true, manifest, errors: [] };
          }
        }

      } finally {
        // 清理临时文件
        if (tempDir && await this.fs.exists(tempDir)) {
          await this.fs.remove(tempDir);
        }
      }

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { valid: false, errors };
  }

  // ============= 私有辅助方法 =============

  private async loadPackageInfo(packagePath: string, manifest: IPluginManifest): Promise<any> {
    try {
      // 动态加载包的主入口文件
      const mainPath = `${packagePath}/${manifest.main}`;
      
      // 这里需要根据运行环境选择不同的加载方式
      // 在 Node.js 环境中可以使用 require 或 import
      // 在浏览器环境中需要其他方式
      
      // 模拟加载过程，实际实现需要根据环境调整
      return {
        ...manifest,
        plugins: [] // 这里应该从主入口文件中获取插件列表
      };

    } catch (error) {
      throw new Error(`Failed to load package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async runScript(script: string, workingDir: string): Promise<void> {
    try {
      // 这里需要根据运行环境执行脚本
      // 在 Node.js 环境中可以使用 child_process
      // 在浏览器环境中可能需要其他方式
      
      console.log(`Running script: ${script} in ${workingDir}`);
      
      // 模拟脚本执行
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      throw new Error(`Script execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// ============= 默认实现工厂 =============

/**
 * 创建默认的包安装器
 */
export function createDefaultPackageInstaller(): PackageInstaller {
  // 这里需要根据运行环境提供合适的实现
  const fs: IFileSystem = new MockFileSystem();
  const http: IHttpClient = new MockHttpClient();
  const archive: IArchiveHandler = new MockArchiveHandler();

  return new PackageInstaller(fs, http, archive);
}

// ============= 模拟实现（用于示例） =============

class MockFileSystem implements IFileSystem {
  async readFile(path: string): Promise<Buffer> {
    console.log(`[Mock] Reading file: ${path}`);
    return Buffer.from('mock file content');
  }

  async writeFile(path: string, data: Buffer | string): Promise<void> {
    console.log(`[Mock] Writing file: ${path}`);
  }

  async mkdir(path: string, recursive?: boolean): Promise<void> {
    console.log(`[Mock] Creating directory: ${path} (recursive: ${recursive})`);
  }

  async remove(path: string): Promise<void> {
    console.log(`[Mock] Removing: ${path}`);
  }

  async exists(path: string): Promise<boolean> {
    console.log(`[Mock] Checking exists: ${path}`);
    return true;
  }

  async readdir(path: string): Promise<string[]> {
    console.log(`[Mock] Reading directory: ${path}`);
    return ['file1.js', 'file2.json'];
  }

  async stat(path: string): Promise<{ isFile(): boolean; isDirectory(): boolean; size: number }> {
    console.log(`[Mock] Getting stats: ${path}`);
    return {
      isFile: () => true,
      isDirectory: () => false,
      size: 1024
    };
  }

  async copy(src: string, dest: string): Promise<void> {
    console.log(`[Mock] Copying: ${src} -> ${dest}`);
  }
}

class MockHttpClient implements IHttpClient {
  async download(url: string, destination: string, onProgress?: (progress: InstallProgress) => void): Promise<string> {
    console.log(`[Mock] Downloading: ${url} -> ${destination}`);
    
    // 模拟下载进度
    for (let i = 0; i <= 100; i += 10) {
      onProgress?.({
        stage: 'download',
        progress: i,
        message: `Downloading... ${i}%`,
        totalBytes: 1024000,
        downloadedBytes: (1024000 * i) / 100
      });
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return destination;
  }
}

class MockArchiveHandler implements IArchiveHandler {
  async extract(archivePath: string, destination: string, onProgress?: (progress: InstallProgress) => void): Promise<string> {
    console.log(`[Mock] Extracting: ${archivePath} -> ${destination}`);
    
    // 模拟解压进度
    for (let i = 0; i <= 100; i += 20) {
      onProgress?.({
        stage: 'extract',
        progress: i,
        message: `Extracting... ${i}%`
      });
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    return destination;
  }

  async compress(sourcePath: string, destination: string): Promise<string> {
    console.log(`[Mock] Compressing: ${sourcePath} -> ${destination}`);
    return destination;
  }
}
