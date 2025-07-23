/**
 * FlowTune 插件管理器实现
 * Plugin Manager Implementation for FlowTune
 */

import { EventEmitter } from 'events';
import {
  IPlugin,
  IPluginManager,
  INodeRegistry,
  IThemeRegistry,
  IPropertyRegistry,
  ICanvasAPI,
  IEventBus,
  IStorage,
  PluginContext,
  PluginCategory,
  IFlowNodeType,
  ITheme,
  IPropertyEditor,
  NodeGroup
} from './types';

/**
 * 插件管理器实现
 */
export class PluginManager implements IPluginManager {
  private plugins = new Map<string, IPlugin>();
  private enabledPlugins = new Set<string>();
  private nodeRegistry: INodeRegistry;
  private themeRegistry: IThemeRegistry;
  private propertyRegistry: IPropertyRegistry;
  private canvasAPI: ICanvasAPI;
  private eventBus: IEventBus;
  private storage: IStorage;

  constructor(
    nodeRegistry: INodeRegistry,
    themeRegistry: IThemeRegistry,
    propertyRegistry: IPropertyRegistry,
    canvasAPI: ICanvasAPI,
    eventBus: IEventBus,
    storage: IStorage
  ) {
    this.nodeRegistry = nodeRegistry;
    this.themeRegistry = themeRegistry;
    this.propertyRegistry = propertyRegistry;
    this.canvasAPI = canvasAPI;
    this.eventBus = eventBus;
    this.storage = storage;

    // 加载已启用的插件配置
    this.loadEnabledPlugins();
  }

  /**
   * 注册插件
   */
  async registerPlugin(plugin: IPlugin): Promise<void> {
    // 验证插件
    await this.validatePlugin(plugin);

    // 检查依赖
    await this.checkDependencies(plugin);

    // 注册插件
    this.plugins.set(plugin.id, plugin);

    // 如果插件配置为默认启用，则启用它
    if (plugin.config?.defaultEnabled) {
      await this.enablePlugin(plugin.id);
    }

    // 发布插件注册事件
    this.eventBus.emit('plugin:registered', { plugin });

    console.log(`Plugin ${plugin.name} (${plugin.id}) registered successfully`);
  }

  /**
   * 卸载插件
   */
  async unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // 如果插件已启用，先禁用
    if (this.enabledPlugins.has(pluginId)) {
      await this.disablePlugin(pluginId);
    }

    // 移除插件
    this.plugins.delete(pluginId);

    // 发布插件卸载事件
    this.eventBus.emit('plugin:unregistered', { pluginId });

    console.log(`Plugin ${plugin.name} (${pluginId}) unregistered successfully`);
  }

  /**
   * 启用插件
   */
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (this.enabledPlugins.has(pluginId)) {
      console.warn(`Plugin ${pluginId} is already enabled`);
      return;
    }

    // 检查依赖
    await this.checkDependencies(plugin);

    // 创建插件上下文
    const context = this.createPluginContext();

    try {
      // 激活插件
      await plugin.activate(context);

      // 根据插件类型注册相应的功能
      await this.registerPluginFeatures(plugin);

      // 标记为已启用
      this.enabledPlugins.add(pluginId);

      // 保存启用状态
      this.saveEnabledPlugins();

      // 发布插件启用事件
      this.eventBus.emit('plugin:enabled', { plugin });

      console.log(`Plugin ${plugin.name} (${pluginId}) enabled successfully`);
    } catch (error) {
      console.error(`Failed to enable plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * 禁用插件
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!this.enabledPlugins.has(pluginId)) {
      console.warn(`Plugin ${pluginId} is not enabled`);
      return;
    }

    try {
      // 注销插件功能
      await this.unregisterPluginFeatures(plugin);

      // 停用插件
      if (plugin.deactivate) {
        await plugin.deactivate();
      }

      // 标记为未启用
      this.enabledPlugins.delete(pluginId);

      // 保存启用状态
      this.saveEnabledPlugins();

      // 发布插件禁用事件
      this.eventBus.emit('plugin:disabled', { plugin });

      console.log(`Plugin ${plugin.name} (${pluginId}) disabled successfully`);
    } catch (error) {
      console.error(`Failed to disable plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * 获取插件
   */
  getPlugin(pluginId: string): IPlugin | null {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取启用的插件
   */
  getEnabledPlugins(): IPlugin[] {
    return Array.from(this.enabledPlugins)
      .map(id => this.plugins.get(id))
      .filter(Boolean) as IPlugin[];
  }

  /**
   * 插件是否启用
   */
  isPluginEnabled(pluginId: string): boolean {
    return this.enabledPlugins.has(pluginId);
  }

  /**
   * 验证插件
   */
  private async validatePlugin(plugin: IPlugin): Promise<void> {
    if (!plugin.id) {
      throw new Error('Plugin must have an id');
    }

    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }

    if (!plugin.version) {
      throw new Error('Plugin must have a version');
    }

    if (!plugin.activate) {
      throw new Error('Plugin must have an activate function');
    }

    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} already registered`);
    }
  }

  /**
   * 检查依赖
   */
  private async checkDependencies(plugin: IPlugin): Promise<void> {
    if (!plugin.dependencies || plugin.dependencies.length === 0) {
      return;
    }

    for (const depId of plugin.dependencies) {
      if (!this.plugins.has(depId)) {
        throw new Error(`Plugin ${plugin.id} depends on ${depId}, but it's not registered`);
      }

      if (!this.enabledPlugins.has(depId)) {
        throw new Error(`Plugin ${plugin.id} depends on ${depId}, but it's not enabled`);
      }
    }
  }

  /**
   * 创建插件上下文
   */
  private createPluginContext(): PluginContext {
    return {
      pluginManager: this,
      nodeRegistry: this.nodeRegistry,
      themeRegistry: this.themeRegistry,
      propertyRegistry: this.propertyRegistry,
      canvasAPI: this.canvasAPI,
      eventBus: this.eventBus,
      storage: this.storage
    };
  }

  /**
   * 注册插件功能
   */
  private async registerPluginFeatures(plugin: IPlugin): Promise<void> {
    switch (plugin.category) {
      case PluginCategory.NODE:
        await this.registerNodePlugin(plugin as any);
        break;
      case PluginCategory.THEME:
        await this.registerThemePlugin(plugin as any);
        break;
      case PluginCategory.PROPERTY:
        await this.registerPropertyPlugin(plugin as any);
        break;
      // 其他类型的插件可以在这里处理
    }
  }

  /**
   * 注销插件功能
   */
  private async unregisterPluginFeatures(plugin: IPlugin): Promise<void> {
    switch (plugin.category) {
      case PluginCategory.NODE:
        await this.unregisterNodePlugin(plugin as any);
        break;
      case PluginCategory.THEME:
        await this.unregisterThemePlugin(plugin as any);
        break;
      case PluginCategory.PROPERTY:
        await this.unregisterPropertyPlugin(plugin as any);
        break;
      // 其他类型的插件可以在这里处理
    }
  }

  /**
   * 注册节点插件
   */
  private async registerNodePlugin(plugin: any): Promise<void> {
    if (plugin.nodeTypes) {
      for (const nodeType of plugin.nodeTypes) {
        this.nodeRegistry.registerNodeType(nodeType);
      }
    }
  }

  /**
   * 注销节点插件
   */
  private async unregisterNodePlugin(plugin: any): Promise<void> {
    if (plugin.nodeTypes) {
      for (const nodeType of plugin.nodeTypes) {
        this.nodeRegistry.unregisterNodeType(nodeType.type);
      }
    }
  }

  /**
   * 注册主题插件
   */
  private async registerThemePlugin(plugin: any): Promise<void> {
    if (plugin.theme) {
      this.themeRegistry.registerTheme(plugin.theme);
    }
  }

  /**
   * 注销主题插件
   */
  private async unregisterThemePlugin(plugin: any): Promise<void> {
    if (plugin.theme) {
      this.themeRegistry.unregisterTheme(plugin.theme.id);
    }
  }

  /**
   * 注册属性插件
   */
  private async registerPropertyPlugin(plugin: any): Promise<void> {
    if (plugin.editors) {
      for (const editor of plugin.editors) {
        this.propertyRegistry.registerPropertyEditor(editor);
      }
    }
  }

  /**
   * 注销属性插件
   */
  private async unregisterPropertyPlugin(plugin: any): Promise<void> {
    if (plugin.editors) {
      for (const editor of plugin.editors) {
        this.propertyRegistry.unregisterPropertyEditor(editor.id);
      }
    }
  }

  /**
   * 加载已启用的插件配置
   */
  private loadEnabledPlugins(): void {
    const enabledPlugins = this.storage.get<string[]>('enabledPlugins') || [];
    for (const pluginId of enabledPlugins) {
      this.enabledPlugins.add(pluginId);
    }
  }

  /**
   * 保存已启用的插件配置
   */
  private saveEnabledPlugins(): void {
    const enabledPlugins = Array.from(this.enabledPlugins);
    this.storage.set('enabledPlugins', enabledPlugins);
  }
}

/**
 * 节点注册器实现
 */
export class NodeRegistry implements INodeRegistry {
  private nodeTypes = new Map<string, IFlowNodeType>();
  private eventBus: IEventBus;

  constructor(eventBus: IEventBus) {
    this.eventBus = eventBus;
  }

  registerNodeType(nodeType: IFlowNodeType): void {
    this.nodeTypes.set(nodeType.type, nodeType);
    this.eventBus.emit('nodeType:registered', { nodeType });
    console.log(`Node type ${nodeType.type} registered`);
  }

  unregisterNodeType(type: string): void {
    const nodeType = this.nodeTypes.get(type);
    if (nodeType) {
      this.nodeTypes.delete(type);
      this.eventBus.emit('nodeType:unregistered', { type });
      console.log(`Node type ${type} unregistered`);
    }
  }

  getNodeType(type: string): IFlowNodeType | null {
    return this.nodeTypes.get(type) || null;
  }

  getAllNodeTypes(): IFlowNodeType[] {
    return Array.from(this.nodeTypes.values());
  }

  getNodeTypesByGroup(group: NodeGroup): IFlowNodeType[] {
    return Array.from(this.nodeTypes.values()).filter(nodeType => nodeType.group === group);
  }

  searchNodeTypes(query: string): IFlowNodeType[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.nodeTypes.values()).filter(nodeType =>
      nodeType.displayName.toLowerCase().includes(lowerQuery) ||
      nodeType.description?.toLowerCase().includes(lowerQuery) ||
      nodeType.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

/**
 * 主题注册器实现
 */
export class ThemeRegistry implements IThemeRegistry {
  private themes = new Map<string, ITheme>();
  private currentTheme: ITheme | null = null;
  private eventBus: IEventBus;
  private storage: IStorage;

  constructor(eventBus: IEventBus, storage: IStorage) {
    this.eventBus = eventBus;
    this.storage = storage;
    this.loadCurrentTheme();
  }

  registerTheme(theme: ITheme): void {
    this.themes.set(theme.id, theme);
    this.eventBus.emit('theme:registered', { theme });
    console.log(`Theme ${theme.name} (${theme.id}) registered`);
  }

  unregisterTheme(themeId: string): void {
    const theme = this.themes.get(themeId);
    if (theme) {
      this.themes.delete(themeId);
      if (this.currentTheme?.id === themeId) {
        this.currentTheme = null;
      }
      this.eventBus.emit('theme:unregistered', { themeId });
      console.log(`Theme ${themeId} unregistered`);
    }
  }

  getTheme(themeId: string): ITheme | null {
    return this.themes.get(themeId) || null;
  }

  getAllThemes(): ITheme[] {
    return Array.from(this.themes.values());
  }

  setCurrentTheme(themeId: string): void {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme ${themeId} not found`);
    }

    this.currentTheme = theme;
    this.storage.set('currentTheme', themeId);
    this.eventBus.emit('theme:changed', { theme });
    console.log(`Current theme set to ${theme.name} (${themeId})`);
  }

  getCurrentTheme(): ITheme | null {
    return this.currentTheme;
  }

  private loadCurrentTheme(): void {
    const currentThemeId = this.storage.get<string>('currentTheme');
    if (currentThemeId) {
      const theme = this.themes.get(currentThemeId);
      if (theme) {
        this.currentTheme = theme;
      }
    }
  }
}

/**
 * 属性注册器实现
 */
export class PropertyRegistry implements IPropertyRegistry {
  private propertyEditors = new Map<string, IPropertyEditor>();
  private eventBus: IEventBus;

  constructor(eventBus: IEventBus) {
    this.eventBus = eventBus;
  }

  registerPropertyEditor(editor: IPropertyEditor): void {
    this.propertyEditors.set(editor.id, editor);
    this.eventBus.emit('propertyEditor:registered', { editor });
    console.log(`Property editor ${editor.name} (${editor.id}) registered`);
  }

  unregisterPropertyEditor(editorId: string): void {
    const editor = this.propertyEditors.get(editorId);
    if (editor) {
      this.propertyEditors.delete(editorId);
      this.eventBus.emit('propertyEditor:unregistered', { editorId });
      console.log(`Property editor ${editorId} unregistered`);
    }
  }

  getPropertyEditor(editorId: string): IPropertyEditor | null {
    return this.propertyEditors.get(editorId) || null;
  }

  getEditorsForType(type: string): IPropertyEditor[] {
    return Array.from(this.propertyEditors.values())
      .filter(editor => editor.supportedTypes.includes(type));
  }

  getAllPropertyEditors(): IPropertyEditor[] {
    return Array.from(this.propertyEditors.values());
  }
}

/**
 * 事件总线实现
 */
export class EventBus implements IEventBus {
  private emitter = new EventEmitter();

  emit(event: string, data?: any): void {
    this.emitter.emit(event, data);
  }

  on(event: string, handler: (data?: any) => void): () => void {
    this.emitter.on(event, handler);
    return () => this.emitter.off(event, handler);
  }

  once(event: string, handler: (data?: any) => void): () => void {
    this.emitter.once(event, handler);
    return () => this.emitter.off(event, handler);
  }

  off(event: string, handler?: (data?: any) => void): void {
    if (handler) {
      this.emitter.off(event, handler);
    } else {
      this.emitter.removeAllListeners(event);
    }
  }
}

/**
 * 存储实现（基于 localStorage）
 */
export class Storage implements IStorage {
  private prefix: string;

  constructor(prefix = 'flowtune:') {
    this.prefix = prefix;
  }

  get<T = any>(key: string): T | null {
    try {
      const value = localStorage.getItem(this.prefix + key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to get storage value for key ${key}:`, error);
      return null;
    }
  }

  set<T = any>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set storage value for key ${key}:`, error);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = this.keys();
    for (const key of keys) {
      this.remove(key);
    }
  }

  keys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }
}
