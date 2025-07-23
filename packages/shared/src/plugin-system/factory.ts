/**
 * FlowTune 插件系统工厂函数
 * Plugin System Factory for FlowTune
 */

import {
  PluginManager,
  NodeRegistry,
  ThemeRegistry,
  PropertyRegistry,
  EventBus,
  Storage
} from './core';
import { ICanvasAPI, ILogger } from './types';

/**
 * 插件系统创建配置
 */
export interface PluginSystemConfig {
  /** 存储前缀 */
  storagePrefix?: string;
  /** 画布API实现 */
  canvasAPI: ICanvasAPI;
  /** 日志记录器 */
  logger?: ILogger;
}

/**
 * 插件系统实例
 */
export interface PluginSystemInstance {
  /** 插件管理器 */
  pluginManager: PluginManager;
  /** 节点注册器 */
  nodeRegistry: NodeRegistry;
  /** 主题注册器 */
  themeRegistry: ThemeRegistry;
  /** 属性注册器 */
  propertyRegistry: PropertyRegistry;
  /** 事件总线 */
  eventBus: EventBus;
  /** 存储 */
  storage: Storage;
}

/**
 * 创建插件系统
 */
export function createPluginSystem(config: PluginSystemConfig): PluginSystemInstance {
  // 创建核心组件
  const eventBus = new EventBus();
  const storage = new Storage(config.storagePrefix);
  const nodeRegistry = new NodeRegistry(eventBus);
  const themeRegistry = new ThemeRegistry(eventBus, storage);
  const propertyRegistry = new PropertyRegistry(eventBus);
  
  // 创建插件管理器
  const pluginManager = new PluginManager(
    nodeRegistry,
    themeRegistry,
    propertyRegistry,
    config.canvasAPI,
    eventBus,
    storage
  );

  return {
    pluginManager,
    nodeRegistry,
    themeRegistry,
    propertyRegistry,
    eventBus,
    storage
  };
}

/**
 * 默认日志记录器实现
 */
export class DefaultLogger implements ILogger {
  debug(message: string, data?: any): void {
    console.debug(`[FlowTune] ${message}`, data);
  }

  info(message: string, data?: any): void {
    console.info(`[FlowTune] ${message}`, data);
  }

  warn(message: string, data?: any): void {
    console.warn(`[FlowTune] ${message}`, data);
  }

  error(message: string, error?: Error): void {
    console.error(`[FlowTune] ${message}`, error);
  }
}
