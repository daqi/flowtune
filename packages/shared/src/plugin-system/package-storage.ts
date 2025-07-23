/**
 * FlowTune 插件包存储实现
 * Plugin Package Storage Implementation
 */

import {
  IPackageStorage,
  IInstalledPackage,
  IPackageSource,
  PackageInstallStatus
} from './package-system';

// ============= 存储接口抽象 =============

/**
 * 键值存储接口
 */
export interface IKeyValueStore {
  /** 获取值 */
  get(key: string): Promise<string | null>;
  
  /** 设置值 */
  set(key: string, value: string): Promise<void>;
  
  /** 删除值 */
  delete(key: string): Promise<void>;
  
  /** 获取所有键 */
  keys(): Promise<string[]>;
  
  /** 清空存储 */
  clear(): Promise<void>;
}

// ============= 插件包存储实现 =============

/**
 * 插件包存储实现
 */
export class PackageStorage implements IPackageStorage {
  private store: IKeyValueStore;
  private readonly PACKAGES_KEY = 'installed_packages';
  private readonly SOURCES_KEY = 'package_sources';

  constructor(store: IKeyValueStore) {
    this.store = store;
  }

  async savePackage(packageInfo: IInstalledPackage): Promise<void> {
    try {
      const packages = await this.getAllPackages();
      const existingIndex = packages.findIndex(p => p.id === packageInfo.id);
      
      if (existingIndex >= 0) {
        packages[existingIndex] = packageInfo;
      } else {
        packages.push(packageInfo);
      }
      
      await this.store.set(this.PACKAGES_KEY, JSON.stringify(packages));
    } catch (error) {
      throw new Error(`Failed to save package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPackage(packageId: string): Promise<IInstalledPackage | null> {
    try {
      const packages = await this.getAllPackages();
      return packages.find(p => p.id === packageId) || null;
    } catch (error) {
      throw new Error(`Failed to get package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPackages(): Promise<IInstalledPackage[]> {
    try {
      const packagesData = await this.store.get(this.PACKAGES_KEY);
      if (!packagesData) {
        return [];
      }
      
      const packages = JSON.parse(packagesData) as IInstalledPackage[];
      
      // 转换日期字符串为 Date 对象
      return packages.map(pkg => ({
        ...pkg,
        installedAt: new Date(pkg.installedAt),
        updatedAt: new Date(pkg.updatedAt)
      }));
    } catch (error) {
      throw new Error(`Failed to get all packages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removePackage(packageId: string): Promise<void> {
    try {
      const packages = await this.getAllPackages();
      const filteredPackages = packages.filter(p => p.id !== packageId);
      
      await this.store.set(this.PACKAGES_KEY, JSON.stringify(filteredPackages));
    } catch (error) {
      throw new Error(`Failed to remove package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePackageStatus(packageId: string, status: PackageInstallStatus, error?: string): Promise<void> {
    try {
      const packageInfo = await this.getPackage(packageId);
      if (!packageInfo) {
        throw new Error(`Package ${packageId} not found`);
      }
      
      packageInfo.status = status;
      packageInfo.updatedAt = new Date();
      
      if (error) {
        packageInfo.error = error;
      } else {
        delete packageInfo.error;
      }
      
      await this.savePackage(packageInfo);
    } catch (error) {
      throw new Error(`Failed to update package status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveSources(sources: IPackageSource[]): Promise<void> {
    try {
      await this.store.set(this.SOURCES_KEY, JSON.stringify(sources));
    } catch (error) {
      throw new Error(`Failed to save sources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSources(): Promise<IPackageSource[]> {
    try {
      const sourcesData = await this.store.get(this.SOURCES_KEY);
      if (!sourcesData) {
        // 返回默认源
        return this.getDefaultSources();
      }
      
      return JSON.parse(sourcesData) as IPackageSource[];
    } catch (error) {
      throw new Error(`Failed to get sources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============= 私有辅助方法 =============

  private getDefaultSources(): IPackageSource[] {
    return [
      {
        name: 'official',
        url: 'https://packages.flowtune.com/api',
        isDefault: true,
        config: {
          timeout: 30000,
          retries: 3
        }
      },
      {
        name: 'community',
        url: 'https://community.flowtune.com/api',
        config: {
          timeout: 15000,
          retries: 2
        }
      }
    ];
  }
}

// ============= 内存存储实现 =============

/**
 * 内存键值存储实现（用于测试和开发）
 */
export class MemoryKeyValueStore implements IKeyValueStore {
  private data: Map<string, string> = new Map();

  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }

  async clear(): Promise<void> {
    this.data.clear();
  }
}

// ============= LocalStorage 存储实现 =============

/**
 * LocalStorage 键值存储实现（用于浏览器环境）
 */
export class LocalStorageKeyValueStore implements IKeyValueStore {
  private prefix: string;

  constructor(prefix: string = 'flowtune:') {
    this.prefix = prefix;
  }

  async get(key: string): Promise<string | null> {
    try {
      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage is not available');
      }
      return localStorage.getItem(this.prefix + key);
    } catch (error) {
      throw new Error(`Failed to get from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage is not available');
      }
      localStorage.setItem(this.prefix + key, value);
    } catch (error) {
      throw new Error(`Failed to set to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage is not available');
      }
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      throw new Error(`Failed to delete from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async keys(): Promise<string[]> {
    try {
      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage is not available');
      }
      
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }
      return keys;
    } catch (error) {
      throw new Error(`Failed to get keys from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage is not available');
      }
      
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      throw new Error(`Failed to clear localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// ============= 文件存储实现 =============

/**
 * 文件系统键值存储实现（用于 Node.js 环境）
 */
export class FileKeyValueStore implements IKeyValueStore {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async get(key: string): Promise<string | null> {
    try {
      // 这里需要文件系统实现
      // 在实际使用时需要引入 fs 模块
      console.log(`[FileStore] Get: ${key} from ${this.basePath}`);
      return null; // 模拟实现
    } catch (error) {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      // 这里需要文件系统实现
      console.log(`[FileStore] Set: ${key} to ${this.basePath}`);
    } catch (error) {
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      // 这里需要文件系统实现
      console.log(`[FileStore] Delete: ${key} from ${this.basePath}`);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async keys(): Promise<string[]> {
    try {
      // 这里需要文件系统实现
      console.log(`[FileStore] List keys from ${this.basePath}`);
      return []; // 模拟实现
    } catch (error) {
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clear(): Promise<void> {
    try {
      // 这里需要文件系统实现
      console.log(`[FileStore] Clear ${this.basePath}`);
    } catch (error) {
      throw new Error(`Failed to clear directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// ============= 存储工厂函数 =============

/**
 * 创建默认的包存储
 */
export function createDefaultPackageStorage(options?: {
  type?: 'memory' | 'localStorage' | 'file';
  prefix?: string;
  basePath?: string;
}): PackageStorage {
  const { type = 'memory', prefix = 'flowtune:', basePath = './data' } = options || {};

  let store: IKeyValueStore;

  switch (type) {
    case 'localStorage':
      store = new LocalStorageKeyValueStore(prefix);
      break;
    case 'file':
      store = new FileKeyValueStore(basePath);
      break;
    case 'memory':
    default:
      store = new MemoryKeyValueStore();
      break;
  }

  return new PackageStorage(store);
}

// ============= 存储迁移工具 =============

/**
 * 存储迁移工具
 */
export class StorageMigrator {
  /**
   * 从一个存储迁移到另一个存储
   */
  static async migrate(fromStore: IKeyValueStore, toStore: IKeyValueStore): Promise<void> {
    try {
      const keys = await fromStore.keys();
      
      for (const key of keys) {
        const value = await fromStore.get(key);
        if (value !== null) {
          await toStore.set(key, value);
        }
      }
      
      console.log(`Successfully migrated ${keys.length} items`);
    } catch (error) {
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 备份存储数据
   */
  static async backup(store: IKeyValueStore): Promise<Record<string, string>> {
    try {
      const keys = await store.keys();
      const backup: Record<string, string> = {};
      
      for (const key of keys) {
        const value = await store.get(key);
        if (value !== null) {
          backup[key] = value;
        }
      }
      
      return backup;
    } catch (error) {
      throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 从备份恢复数据
   */
  static async restore(store: IKeyValueStore, backup: Record<string, string>): Promise<void> {
    try {
      for (const [key, value] of Object.entries(backup)) {
        await store.set(key, value);
      }
      
      console.log(`Successfully restored ${Object.keys(backup).length} items`);
    } catch (error) {
      throw new Error(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
