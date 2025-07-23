/**
 * FlowTune Plugin System
 * 
 * 一个企业级的插件系统，支持工作流设计器的可扩展性和可维护性
 * Enterprise-level plugin system for extensible and maintainable workflow designer
 * 
 * 包含功能：
 * - 8类插件支持（节点、主题、属性、画布、工具栏、面板、连接器、运行时）
 * - 完整的表单配置系统（14种字段类型）
 * - 插件包管理系统（安装、存储、依赖管理）
 * - 跨平台兼容性（Web、桌面）
 */

// ============= Core Types =============
export * from './types';

// ============= Core Implementation =============
export * from './core';

// ============= Package Management System =============
export * from './package-system';
export * from './package-manager';
export * from './package-installer';
export * from './package-storage';

// ============= Examples =============
export { runPluginSystemExample } from './example';
export { HttpRequestNodePlugin, FormFieldExamples } from './form-examples';
export { runPackageSystemExample } from './package-example';

// ============= Factory Functions =============
export { createPluginSystem, DefaultLogger } from './factory';
