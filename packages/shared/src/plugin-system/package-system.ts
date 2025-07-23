/**
 * FlowTune 插件包系统
 * Plugin Package System for FlowTune
 */

import { IPlugin, PluginCategory, PluginContext } from './types';

// ============= 插件包类型定义 =============

/**
 * 插件包信息
 */
export interface IPluginPackage {
  /** 包唯一标识 */
  id: string;
  /** 包名称 */
  name: string;
  /** 包版本 */
  version: string;
  /** 包描述 */
  description: string;
  /** 作者信息 */
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  /** 包主页 */
  homepage?: string;
  /** 许可证 */
  license?: string;
  /** 关键词 */
  keywords?: string[];
  /** 包含的插件列表 */
  plugins: IPlugin[];
  /** 依赖的其他包 */
  dependencies?: Record<string, string>;
  /** 开发依赖 */
  devDependencies?: Record<string, string>;
  /** 安装脚本 */
  scripts?: {
    install?: string;
    uninstall?: string;
    postInstall?: string;
    preUninstall?: string;
  };
  /** 包配置 */
  config?: {
    /** 是否需要重启应用 */
    requiresRestart?: boolean;
    /** 最小支持版本 */
    minVersion?: string;
    /** 最大支持版本 */
    maxVersion?: string;
    /** 支持的平台 */
    platforms?: string[];
  };
  /** 资源文件 */
  assets?: {
    /** 图标 */
    icon?: string;
    /** 截图 */
    screenshots?: string[];
    /** 文档 */
    documentation?: string;
    /** 示例 */
    examples?: string[];
  };
}

/**
 * 插件包清单文件
 */
export interface IPluginManifest extends Omit<IPluginPackage, 'plugins'> {
  /** 入口文件 */
  main: string;
  /** 类型定义文件 */
  types?: string;
  /** 包文件列表 */
  files?: string[];
}

/**
 * 插件包安装状态
 */
export enum PackageInstallStatus {
  /** 未安装 */
  NOT_INSTALLED = 'not_installed',
  /** 下载中 */
  DOWNLOADING = 'downloading',
  /** 解压中 */
  EXTRACTING = 'extracting',
  /** 安装中 */
  INSTALLING = 'installing',
  /** 已安装 */
  INSTALLED = 'installed',
  /** 启用中 */
  ENABLING = 'enabling',
  /** 已启用 */
  ENABLED = 'enabled',
  /** 禁用中 */
  DISABLING = 'disabling',
  /** 已禁用 */
  DISABLED = 'disabled',
  /** 卸载中 */
  UNINSTALLING = 'uninstalling',
  /** 安装失败 */
  INSTALL_FAILED = 'install_failed',
  /** 启用失败 */
  ENABLE_FAILED = 'enable_failed'
}

/**
 * 插件包信息
 */
export interface IInstalledPackage extends IPluginPackage {
  /** 安装状态 */
  status: PackageInstallStatus;
  /** 安装路径 */
  installPath: string;
  /** 安装时间 */
  installedAt: Date;
  /** 最后更新时间 */
  updatedAt: Date;
  /** 安装错误信息 */
  error?: string;
}

/**
 * 插件包源配置
 */
export interface IPackageSource {
  /** 源名称 */
  name: string;
  /** 源 URL */
  url: string;
  /** 是否默认源 */
  isDefault?: boolean;
  /** 认证信息 */
  auth?: {
    type: 'basic' | 'bearer' | 'apikey';
    credentials: Record<string, string>;
  };
  /** 源配置 */
  config?: {
    /** 超时时间 */
    timeout?: number;
    /** 重试次数 */
    retries?: number;
  };
}

/**
 * 插件包安装选项
 */
export interface IPackageInstallOptions {
  /** 是否强制安装 */
  force?: boolean;
  /** 是否安装开发依赖 */
  includeDev?: boolean;
  /** 安装后是否自动启用 */
  autoEnable?: boolean;
  /** 是否跳过依赖检查 */
  skipDependencies?: boolean;
  /** 安装源 */
  source?: string;
  /** 进度回调 */
  onProgress?: (progress: InstallProgress) => void;
}

/**
 * 安装进度信息
 */
export interface InstallProgress {
  /** 当前阶段 */
  stage: 'download' | 'extract' | 'install' | 'enable';
  /** 进度百分比 (0-100) */
  progress: number;
  /** 当前消息 */
  message: string;
  /** 总字节数（下载阶段） */
  totalBytes?: number;
  /** 已下载字节数 */
  downloadedBytes?: number;
}

// ============= 插件包管理器接口 =============

/**
 * 插件包管理器接口
 */
export interface IPackageManager {
  /** 添加包源 */
  addSource(source: IPackageSource): Promise<void>;
  
  /** 移除包源 */
  removeSource(name: string): Promise<void>;
  
  /** 获取所有包源 */
  getSources(): Promise<IPackageSource[]>;
  
  /** 搜索包 */
  searchPackages(query: string, source?: string): Promise<IPluginPackage[]>;
  
  /** 获取包信息 */
  getPackageInfo(packageId: string, version?: string, source?: string): Promise<IPluginPackage>;
  
  /** 安装包 */
  installPackage(packageId: string, version?: string, options?: IPackageInstallOptions): Promise<IInstalledPackage>;
  
  /** 卸载包 */
  uninstallPackage(packageId: string): Promise<void>;
  
  /** 启用包 */
  enablePackage(packageId: string): Promise<void>;
  
  /** 禁用包 */
  disablePackage(packageId: string): Promise<void>;
  
  /** 更新包 */
  updatePackage(packageId: string, version?: string, options?: IPackageInstallOptions): Promise<IInstalledPackage>;
  
  /** 获取已安装的包列表 */
  getInstalledPackages(): Promise<IInstalledPackage[]>;
  
  /** 获取包的依赖关系 */
  getDependencies(packageId: string): Promise<string[]>;
  
  /** 检查包的兼容性 */
  checkCompatibility(packageInfo: IPluginPackage): Promise<{ compatible: boolean; issues: string[] }>;
  
  /** 验证包的完整性 */
  verifyPackage(packagePath: string): Promise<{ valid: boolean; errors: string[] }>;
}

// ============= 插件包安装器接口 =============

/**
 * 插件包安装器接口
 */
export interface IPackageInstaller {
  /** 下载包 */
  downloadPackage(url: string, destination: string, onProgress?: (progress: InstallProgress) => void): Promise<string>;
  
  /** 解压包 */
  extractPackage(packagePath: string, destination: string, onProgress?: (progress: InstallProgress) => void): Promise<string>;
  
  /** 安装包 */
  installPackage(packagePath: string, installPath: string, onProgress?: (progress: InstallProgress) => void): Promise<IInstalledPackage>;
  
  /** 卸载包 */
  uninstallPackage(packagePath: string): Promise<void>;
  
  /** 验证包 */
  validatePackage(packagePath: string): Promise<{ valid: boolean; manifest?: IPluginManifest; errors: string[] }>;
}

// ============= 插件包存储接口 =============

/**
 * 插件包存储接口
 */
export interface IPackageStorage {
  /** 保存包信息 */
  savePackage(packageInfo: IInstalledPackage): Promise<void>;
  
  /** 获取包信息 */
  getPackage(packageId: string): Promise<IInstalledPackage | null>;
  
  /** 获取所有包 */
  getAllPackages(): Promise<IInstalledPackage[]>;
  
  /** 删除包信息 */
  removePackage(packageId: string): Promise<void>;
  
  /** 更新包状态 */
  updatePackageStatus(packageId: string, status: PackageInstallStatus, error?: string): Promise<void>;
  
  /** 保存包源配置 */
  saveSources(sources: IPackageSource[]): Promise<void>;
  
  /** 获取包源配置 */
  getSources(): Promise<IPackageSource[]>;
}

// ============= 插件包事件 =============

/**
 * 插件包事件类型
 */
export interface PackageEvents {
  'package:install:start': { packageId: string; version: string };
  'package:install:progress': { packageId: string; progress: InstallProgress };
  'package:install:complete': { packageId: string; package: IInstalledPackage };
  'package:install:error': { packageId: string; error: string };
  'package:uninstall:start': { packageId: string };
  'package:uninstall:complete': { packageId: string };
  'package:uninstall:error': { packageId: string; error: string };
  'package:enable:start': { packageId: string };
  'package:enable:complete': { packageId: string };
  'package:enable:error': { packageId: string; error: string };
  'package:disable:start': { packageId: string };
  'package:disable:complete': { packageId: string };
  'package:disable:error': { packageId: string; error: string };
  'package:update:start': { packageId: string; fromVersion: string; toVersion: string };
  'package:update:complete': { packageId: string; package: IInstalledPackage };
  'package:update:error': { packageId: string; error: string };
  'source:added': { source: IPackageSource };
  'source:removed': { sourceName: string };
}

// ============= 插件包工厂函数 =============

/**
 * 创建插件包
 */
export function createPluginPackage(config: {
  id: string;
  name: string;
  version: string;
  description: string;
  author: { name: string; email?: string; url?: string };
  plugins: IPlugin[];
  [key: string]: any;
}): IPluginPackage {
  return {
    ...config
  };
}

/**
 * 创建混合插件包示例
 */
export function createMixedPluginPackage(): IPluginPackage {
  return {
    id: 'flowtune.mixed-package',
    name: 'FlowTune Mixed Plugin Package',
    version: '1.0.0',
    description: 'A mixed plugin package containing nodes, themes, and property editors',
    author: {
      name: 'FlowTune Team',
      email: 'team@flowtune.com'
    },
    homepage: 'https://flowtune.com/packages/mixed-package',
    license: 'MIT',
    keywords: ['workflow', 'nodes', 'themes', 'properties'],
    plugins: [
      // 节点插件
      {
        id: 'flowtune.mixed-package.nodes',
        name: 'Mixed Package Nodes',
        version: '1.0.0',
        description: 'Collection of workflow nodes',
        author: 'FlowTune Team',
        category: PluginCategory.NODE,
        activate: async (context: PluginContext) => {
          console.log('Mixed Package Nodes activated');
        }
      },
      // 主题插件
      {
        id: 'flowtune.mixed-package.theme',
        name: 'Mixed Package Theme',
        version: '1.0.0',
        description: 'Custom theme for the package',
        author: 'FlowTune Team',
        category: PluginCategory.THEME,
        activate: async (context: PluginContext) => {
          console.log('Mixed Package Theme activated');
        }
      },
      // 属性编辑器插件
      {
        id: 'flowtune.mixed-package.properties',
        name: 'Mixed Package Properties',
        version: '1.0.0',
        description: 'Custom property editors',
        author: 'FlowTune Team',
        category: PluginCategory.PROPERTY,
        activate: async (context: PluginContext) => {
          console.log('Mixed Package Properties activated');
        }
      }
    ],
    dependencies: {
      'flowtune.core': '^1.0.0'
    },
    config: {
      requiresRestart: false,
      minVersion: '1.0.0',
      platforms: ['web', 'desktop']
    },
    assets: {
      icon: 'icon.png',
      screenshots: ['screenshot1.png', 'screenshot2.png'],
      documentation: 'README.md'
    }
  };
}
