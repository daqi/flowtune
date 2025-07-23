/**
 * FlowTune 插件系统类型定义
 * Plugin System Type Definitions for FlowTune
 */

// ============= React 类型替代 =============
type ReactComponentType<P = {}> = (props: P) => any;
type ReactNode = any;
type ReactElement = any;
type CSSProperties = Record<string, any>;

// ============= DOM 事件类型替代 =============
interface MouseEvent {
  [key: string]: any;
}

interface DragEvent {
  [key: string]: any;
}

// ============= Flowgram.ai 类型替代 =============
interface FormMeta {
  [key: string]: any;
}

// ============= 表单字段配置类型 =============

/**
 * 表单字段类型
 */
export enum FormFieldType {
  INPUT = 'input',
  SELECT = 'select', 
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  SLIDER = 'slider',
  COLOR = 'color',
  DATE = 'date',
  TIME = 'time',
  FILE = 'file',
  JSON = 'json',
  CODE = 'code',
  CUSTOM = 'custom'
}

/**
 * 表单字段验证规则
 */
export interface IFormFieldValidation {
  /** 是否必填 */
  required?: boolean;
  /** 最小值/长度 */
  min?: number;
  /** 最大值/长度 */
  max?: number;
  /** 正则表达式验证 */
  pattern?: string;
  /** 自定义验证函数 */
  validator?: (value: any, allValues: Record<string, any>) => string | null;
  /** 验证错误消息 */
  message?: string;
}

/**
 * 表单字段选项（用于 select, radio 等）
 */
export interface IFormFieldOption {
  /** 选项值 */
  value: any;
  /** 显示标签 */
  label: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 选项描述 */
  description?: string;
}

/**
 * 表单字段配置
 */
export interface IFormField {
  /** 字段名称（对应节点数据的属性名） */
  name: string;
  /** 字段类型 */
  type: FormFieldType;
  /** 显示标签 */
  label: string;
  /** 字段描述/帮助文本 */
  description?: string;
  /** 占位符文本 */
  placeholder?: string;
  /** 默认值 */
  defaultValue?: any;
  /** 验证规则 */
  validation?: IFormFieldValidation;
  /** 选项列表（用于 select, radio 等） */
  options?: IFormFieldOption[];
  /** 字段配置项 */
  config?: {
    /** 输入框类型（当 type 为 input 时） */
    inputType?: 'text' | 'password' | 'email' | 'url' | 'tel';
    /** 是否多选（用于 select） */
    multiple?: boolean;
    /** 滑块范围（用于 slider） */
    range?: { min: number; max: number; step?: number };
    /** 代码编辑器语言（用于 code） */
    language?: string;
    /** 自定义组件属性 */
    componentProps?: Record<string, any>;
  };
  /** 条件显示 - 当其他字段值满足条件时才显示此字段 */
  when?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater' | 'less';
    value: any;
  };
  /** 字段在表单中的排序 */
  order?: number;
  /** 是否在单独的组中显示 */
  group?: string;
}

/**
 * 扩展的表单元数据 - 定义节点属性编辑表单
 */
export interface IExtendedFormMeta {
  /** 表单字段定义 */
  fields: IFormField[];
  /** 表单分组配置 */
  groups?: {
    [groupName: string]: {
      title: string;
      description?: string;
      collapsible?: boolean;
      defaultExpanded?: boolean;
    };
  };
  /** 表单布局 */
  layout?: 'vertical' | 'horizontal' | 'inline';
  /** 表单大小 */
  size?: 'small' | 'medium' | 'large';
  /** 节点属性默认值 */
  defaultValues?: Record<string, any>;
  /** 是否使用原生 Flowgram.ai 表单 */
  useNativeForm?: boolean;
  /** 原生表单配置（当 useNativeForm 为 true 时） */
  nativeFormMeta?: FormMeta;
}

// ============= 插件基础类型 =============

/**
 * 插件基础接口
 */
export interface IPlugin {
  /** 插件唯一标识 */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description?: string;
  /** 插件作者 */
  author?: string;
  /** 插件依赖 */
  dependencies?: string[];
  /** 插件分类 */
  category: PluginCategory;
  /** 插件配置 */
  config?: PluginConfig;
  /** 插件激活函数 */
  activate: (context: PluginContext) => void | Promise<void>;
  /** 插件停用函数 */
  deactivate?: () => void | Promise<void>;
}

/**
 * 插件分类
 */
export enum PluginCategory {
  /** 风格样式插件 */
  THEME = 'theme',
  /** 流程节点插件 */
  NODE = 'node',
  /** 属性编辑插件 */
  PROPERTY = 'property',
  /** 画布插件 */
  CANVAS = 'canvas',
  /** 工具栏插件 */
  TOOLBAR = 'toolbar',
  /** 面板插件 */
  PANEL = 'panel',
  /** 连接器插件 */
  CONNECTOR = 'connector',
  /** 运行时插件 */
  RUNTIME = 'runtime'
}

/**
 * 插件配置
 */
export interface PluginConfig {
  /** 是否默认启用 */
  defaultEnabled?: boolean;
  /** 插件配置项 */
  settings?: Record<string, any>;
  /** 插件权限要求 */
  permissions?: string[];
}

/**
 * 插件上下文
 */
export interface PluginContext {
  /** 插件管理器 */
  pluginManager: IPluginManager;
  /** 节点注册器 */
  nodeRegistry: INodeRegistry;
  /** 主题注册器 */
  themeRegistry: IThemeRegistry;
  /** 属性编辑器注册器 */
  propertyRegistry: IPropertyRegistry;
  /** 画布 API */
  canvasAPI: ICanvasAPI;
  /** 事件总线 */
  eventBus: IEventBus;
  /** 配置存储 */
  storage: IStorage;
}

// ============= 节点插件系统 =============

/**
 * 节点插件接口
 */
export interface INodePlugin extends IPlugin {
  category: PluginCategory.NODE;
  /** 节点类型集合 */
  nodeTypes: IFlowNodeType[];
}

/**
 * 流程节点类型定义
 */
export interface IFlowNodeType {
  /** 节点类型标识 */
  type: string;
  /** 节点显示名称 */
  displayName: string;
  /** 节点描述 */
  description?: string;
  /** 节点图标 */
  icon: string | ReactComponentType;
  /** 节点分组 */
  group: NodeGroup;
  /** 节点标签 */
  tags?: string[];
  /** 节点元数据 */
  meta: IFlowNodeMeta;
  /** UI元数据 */
  uiMeta: IFlowNodeUIMeta;
  /** 节点表单配置 */
  formMeta: IExtendedFormMeta;
  /** 节点验证器 */
  validators?: INodeValidator[];
  /** 节点渲染器 */
  renderer: INodeRenderer;
  /** 节点执行器 */
  executor?: INodeExecutor;
  /** 节点事件处理器 */
  eventHandlers?: INodeEventHandlers;
}

/**
 * 节点分组
 */
export enum NodeGroup {
  /** 基础节点 */
  BASIC = 'basic',
  /** 逻辑节点 */
  LOGIC = 'logic',
  /** 数据节点 */
  DATA = 'data',
  /** AI节点 */
  AI = 'ai',
  /** API节点 */
  API = 'api',
  /** 自定义节点 */
  CUSTOM = 'custom'
}

/**
 * 节点元数据
 */
export interface IFlowNodeMeta {
  /** 是否为起始节点 */
  isStart?: boolean;
  /** 是否为结束节点 */
  isEnd?: boolean;
  /** 是否可删除 */
  deletable?: boolean;
  /** 是否可复制 */
  copyable?: boolean;
  /** 是否可编辑 */
  editable?: boolean;
  /** 默认端口配置 */
  defaultPorts?: PortConfig[];
  /** 是否使用动态端口 */
  useDynamicPort?: boolean;
  /** 节点约束 */
  constraints?: NodeConstraints;
  /** 节点配置 */
  nodeConfig?: NodeConfig;
}

/**
 * 节点UI元数据
 */
export interface IFlowNodeUIMeta {
  /** 节点尺寸 */
  size?: {
    width: number;
    height: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  /** 节点样式 */
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    boxShadow?: string;
    [key: string]: any;
  };
  /** 节点包装器样式 */
  wrapperStyle?: CSSProperties;
  /** 是否可展开 */
  expandable?: boolean;
  /** 是否显示在节点面板 */
  showInNodePanel?: boolean;
  /** 自定义CSS类 */
  className?: string;
  /** 动画配置 */
  animation?: AnimationConfig;
}

/**
 * 端口配置
 */
export interface PortConfig {
  /** 端口ID */
  id?: string;
  /** 端口类型 */
  type: 'input' | 'output';
  /** 端口名称 */
  name?: string;
  /** 端口数据类型 */
  dataType?: string;
  /** 是否必需 */
  required?: boolean;
  /** 端口样式 */
  style?: PortStyle;
}

/**
 * 端口样式
 */
export interface PortStyle {
  color?: string;
  shape?: 'circle' | 'square' | 'diamond';
  size?: number;
}

/**
 * 节点约束
 */
export interface NodeConstraints {
  /** 最大输入连接数 */
  maxInputs?: number;
  /** 最大输出连接数 */
  maxOutputs?: number;
  /** 只能在特定容器中使用 */
  onlyInContainer?: string[];
  /** 不能与特定节点连接 */
  cannotConnectTo?: string[];
  /** 必须与特定节点连接 */
  mustConnectTo?: string[];
}

/**
 * 节点配置
 */
export interface NodeConfig {
  /** 超时时间(ms) */
  timeout?: number;
  /** 重试次数 */
  retryCount?: number;
  /** 缓存配置 */
  cache?: boolean;
  /** 并行执行 */
  parallel?: boolean;
  /** 自定义配置 */
  [key: string]: any;
}

/**
 * 动画配置
 */
export interface AnimationConfig {
  /** 入场动画 */
  enter?: string;
  /** 离场动画 */
  exit?: string;
  /** 悬停动画 */
  hover?: string;
  /** 选中动画 */
  select?: string;
  /** 动画持续时间 */
  duration?: number;
}

/**
 * 节点验证器
 */
export interface INodeValidator {
  /** 验证器名称 */
  name: string;
  /** 验证函数 */
  validate: (node: IFlowNode, context: ValidationContext) => ValidationResult;
  /** 验证时机 */
  trigger?: ValidationTrigger[];
}

/**
 * 验证时机
 */
export enum ValidationTrigger {
  /** 节点创建时 */
  CREATE = 'create',
  /** 节点更新时 */
  UPDATE = 'update',
  /** 连接变化时 */
  CONNECT = 'connect',
  /** 保存时 */
  SAVE = 'save',
  /** 运行前 */
  BEFORE_RUN = 'before_run'
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误消息 */
  errors?: ValidationError[];
  /** 警告消息 */
  warnings?: ValidationWarning[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误字段 */
  field?: string;
  /** 错误级别 */
  level: 'error' | 'warning';
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  /** 警告代码 */
  code: string;
  /** 警告消息 */
  message: string;
  /** 警告字段 */
  field?: string;
}

/**
 * 验证上下文
 */
export interface ValidationContext {
  /** 当前流程 */
  flow?: IFlow;
  /** 相关节点 */
  relatedNodes?: IFlowNode[];
  /** 验证配置 */
  config?: ValidationConfig;
}

/**
 * 验证配置
 */
export interface ValidationConfig {
  /** 是否严格模式 */
  strict?: boolean;
  /** 自定义规则 */
  rules?: Record<string, any>;
}

/**
 * 节点渲染器
 */
export interface INodeRenderer {
  /** 渲染函数 */
  render: (props: NodeRenderProps) => ReactElement;
  /** 预览渲染 */
  preview?: (props: NodePreviewProps) => ReactElement;
  /** 缩略图渲染 */
  thumbnail?: (props: NodeThumbnailProps) => ReactElement;
}

/**
 * 节点渲染属性
 */
export interface NodeRenderProps {
  /** 节点数据 */
  node: IFlowNode;
  /** 是否选中 */
  selected?: boolean;
  /** 是否激活 */
  activated?: boolean;
  /** 是否只读 */
  readonly?: boolean;
  /** 缩放比例 */
  scale?: number;
  /** 事件处理器 */
  eventHandlers?: INodeEventHandlers;
  /** 自定义属性 */
  [key: string]: any;
}

/**
 * 节点预览属性
 */
export interface NodePreviewProps {
  /** 节点类型 */
  nodeType: IFlowNodeType;
  /** 预览数据 */
  previewData?: any;
}

/**
 * 节点缩略图属性
 */
export interface NodeThumbnailProps {
  /** 节点类型 */
  nodeType: IFlowNodeType;
  /** 尺寸 */
  size?: { width: number; height: number };
}

/**
 * 节点执行器
 */
export interface INodeExecutor {
  /** 执行函数 */
  execute: (node: IFlowNode, context: ExecutionContext) => Promise<ExecutionResult>;
  /** 是否支持中断 */
  canAbort?: boolean;
  /** 中断执行 */
  abort?: (node: IFlowNode) => Promise<void>;
  /** 预执行检查 */
  preCheck?: (node: IFlowNode, context: ExecutionContext) => Promise<boolean>;
}

/**
 * 执行上下文
 */
export interface ExecutionContext {
  /** 流程实例 */
  flow: IFlow;
  /** 输入数据 */
  inputs: Record<string, any>;
  /** 全局变量 */
  variables: Record<string, any>;
  /** 执行配置 */
  config: ExecutionConfig;
  /** 日志记录器 */
  logger: ILogger;
}

/**
 * 执行配置
 */
export interface ExecutionConfig {
  /** 是否调试模式 */
  debug?: boolean;
  /** 超时时间 */
  timeout?: number;
  /** 最大内存使用 */
  maxMemory?: number;
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  /** 是否成功 */
  success: boolean;
  /** 输出数据 */
  outputs?: Record<string, any>;
  /** 错误信息 */
  error?: string;
  /** 执行时间 */
  duration?: number;
  /** 内存使用 */
  memoryUsage?: number;
}

/**
 * 节点事件处理器
 */
export interface INodeEventHandlers {
  /** 点击事件 */
  onClick?: (node: IFlowNode, event: MouseEvent) => void;
  /** 双击事件 */
  onDoubleClick?: (node: IFlowNode, event: MouseEvent) => void;
  /** 右键事件 */
  onContextMenu?: (node: IFlowNode, event: MouseEvent) => void;
  /** 悬停事件 */
  onMouseEnter?: (node: IFlowNode, event: MouseEvent) => void;
  /** 离开事件 */
  onMouseLeave?: (node: IFlowNode, event: MouseEvent) => void;
  /** 拖拽开始 */
  onDragStart?: (node: IFlowNode, event: DragEvent) => void;
  /** 拖拽结束 */
  onDragEnd?: (node: IFlowNode, event: DragEvent) => void;
  /** 数据变化 */
  onDataChange?: (node: IFlowNode, oldData: any, newData: any) => void;
  /** 连接变化 */
  onConnectionChange?: (node: IFlowNode, connections: IConnection[]) => void;
}

// ============= 主题插件系统 =============

/**
 * 主题插件接口
 */
export interface IThemePlugin extends IPlugin {
  category: PluginCategory.THEME;
  /** 主题配置 */
  theme: ITheme;
}

/**
 * 主题接口
 */
export interface ITheme {
  /** 主题ID */
  id: string;
  /** 主题名称 */
  name: string;
  /** 主题变量 */
  variables: ThemeVariables;
  /** 节点样式 */
  nodeStyles: NodeStyleMap;
  /** 连接线样式 */
  edgeStyles: EdgeStyleMap;
  /** 画布样式 */
  canvasStyle: CanvasStyle;
  /** 自定义CSS */
  customCSS?: string;
}

/**
 * 主题变量
 */
export interface ThemeVariables {
  /** 主色调 */
  primary: string;
  /** 次要色调 */
  secondary: string;
  /** 成功色 */
  success: string;
  /** 警告色 */
  warning: string;
  /** 错误色 */
  error: string;
  /** 背景色 */
  background: string;
  /** 表面色 */
  surface: string;
  /** 文本色 */
  text: string;
  /** 边框色 */
  border: string;
  /** 阴影 */
  shadow: string;
  /** 圆角 */
  borderRadius: string;
  /** 字体族 */
  fontFamily: string;
  /** 自定义变量 */
  [key: string]: string;
}

/**
 * 节点样式映射
 */
export type NodeStyleMap = Record<string, NodeStyle>;

/**
 * 节点样式
 */
export interface NodeStyle {
  /** 默认样式 */
  default: CSSProperties;
  /** 悬停样式 */
  hover?: CSSProperties;
  /** 选中样式 */
  selected?: CSSProperties;
  /** 激活样式 */
  active?: CSSProperties;
  /** 错误样式 */
  error?: CSSProperties;
  /** 运行中样式 */
  running?: CSSProperties;
}

/**
 * 连接线样式映射
 */
export type EdgeStyleMap = Record<string, EdgeStyle>;

/**
 * 连接线样式
 */
export interface EdgeStyle {
  /** 默认样式 */
  default: EdgeStyleConfig;
  /** 悬停样式 */
  hover?: EdgeStyleConfig;
  /** 选中样式 */
  selected?: EdgeStyleConfig;
  /** 激活样式 */
  active?: EdgeStyleConfig;
}

/**
 * 连接线样式配置
 */
export interface EdgeStyleConfig {
  /** 颜色 */
  color: string;
  /** 宽度 */
  width: number;
  /** 线型 */
  dashArray?: string;
  /** 动画 */
  animated?: boolean;
  /** 箭头 */
  arrow?: boolean;
}

/**
 * 画布样式
 */
export interface CanvasStyle {
  /** 背景色 */
  backgroundColor: string;
  /** 网格样式 */
  grid?: GridStyle;
  /** 缩放限制 */
  zoomLimits?: {
    min: number;
    max: number;
  };
}

/**
 * 网格样式
 */
export interface GridStyle {
  /** 是否显示网格 */
  visible: boolean;
  /** 网格大小 */
  size: number;
  /** 网格颜色 */
  color: string;
  /** 网格类型 */
  type: 'dot' | 'line';
}

// ============= 属性编辑插件系统 =============

/**
 * 属性编辑插件接口
 */
export interface IPropertyPlugin extends IPlugin {
  category: PluginCategory.PROPERTY;
  /** 属性编辑器 */
  editors: IPropertyEditor[];
}

/**
 * 属性编辑器
 */
export interface IPropertyEditor {
  /** 编辑器ID */
  id: string;
  /** 编辑器名称 */
  name: string;
  /** 支持的数据类型 */
  supportedTypes: string[];
  /** 编辑器组件 */
  component: ReactComponentType<PropertyEditorProps>;
  /** 编辑器配置 */
  config?: PropertyEditorConfig;
}

/**
 * 属性编辑器属性
 */
export interface PropertyEditorProps {
  /** 属性值 */
  value: any;
  /** 值变化回调 */
  onChange: (value: any) => void;
  /** 属性配置 */
  property: PropertyConfig;
  /** 是否只读 */
  readonly?: boolean;
  /** 验证错误 */
  error?: string;
}

/**
 * 属性配置
 */
export interface PropertyConfig {
  /** 属性键 */
  key: string;
  /** 属性名称 */
  name: string;
  /** 属性类型 */
  type: string;
  /** 默认值 */
  defaultValue?: any;
  /** 是否必需 */
  required?: boolean;
  /** 属性描述 */
  description?: string;
  /** 验证规则 */
  validation?: PropertyValidation;
  /** 编辑器配置 */
  editorConfig?: Record<string, any>;
}

/**
 * 属性验证
 */
export interface PropertyValidation {
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 最小长度 */
  minLength?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 正则表达式 */
  pattern?: string;
  /** 自定义验证器 */
  custom?: (value: any) => string | null;
}

/**
 * 属性编辑器配置
 */
export interface PropertyEditorConfig {
  /** 编辑器选项 */
  options?: Record<string, any>;
  /** 动态选项提供器 */
  optionsProvider?: () => Promise<any[]>;
  /** 是否支持多选 */
  multiple?: boolean;
}

// ============= 核心接口定义 =============

/**
 * 流程节点
 */
export interface IFlowNode {
  /** 节点ID */
  id: string;
  /** 节点类型 */
  type: string;
  /** 节点数据 */
  data: Record<string, any>;
  /** 节点位置 */
  position: { x: number; y: number };
  /** 节点大小 */
  size?: { width: number; height: number };
  /** 自定义属性 */
  [key: string]: any;
}

/**
 * 流程连接
 */
export interface IConnection {
  /** 连接ID */
  id: string;
  /** 源节点ID */
  sourceNodeId: string;
  /** 源端口ID */
  sourcePortId: string;
  /** 目标节点ID */
  targetNodeId: string;
  /** 目标端口ID */
  targetPortId: string;
  /** 连接数据 */
  data?: Record<string, any>;
}

/**
 * 流程
 */
export interface IFlow {
  /** 流程ID */
  id: string;
  /** 流程名称 */
  name: string;
  /** 流程版本 */
  version: string;
  /** 节点列表 */
  nodes: IFlowNode[];
  /** 连接列表 */
  edges: IConnection[];
  /** 流程配置 */
  config: FlowConfig;
  /** 流程元数据 */
  metadata?: FlowMetadata;
}

/**
 * 流程配置
 */
export interface FlowConfig {
  /** 是否自动保存 */
  autoSave?: boolean;
  /** 网格对齐 */
  snapToGrid?: boolean;
  /** 网格大小 */
  gridSize?: number;
  /** 缩放设置 */
  zoom?: ZoomConfig;
}

/**
 * 缩放配置
 */
export interface ZoomConfig {
  /** 默认缩放级别 */
  default: number;
  /** 最小缩放级别 */
  min: number;
  /** 最大缩放级别 */
  max: number;
  /** 缩放步长 */
  step: number;
}

/**
 * 流程元数据
 */
export interface FlowMetadata {
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 创建者 */
  createdBy: string;
  /** 更新者 */
  updatedBy: string;
  /** 描述 */
  description?: string;
  /** 标签 */
  tags?: string[];
}

// ============= 管理器接口 =============

/**
 * 插件管理器接口
 */
export interface IPluginManager {
  /** 注册插件 */
  registerPlugin(plugin: IPlugin): Promise<void>;
  /** 卸载插件 */
  unregisterPlugin(pluginId: string): Promise<void>;
  /** 启用插件 */
  enablePlugin(pluginId: string): Promise<void>;
  /** 禁用插件 */
  disablePlugin(pluginId: string): Promise<void>;
  /** 获取插件 */
  getPlugin(pluginId: string): IPlugin | null;
  /** 获取所有插件 */
  getAllPlugins(): IPlugin[];
  /** 获取启用的插件 */
  getEnabledPlugins(): IPlugin[];
  /** 插件是否启用 */
  isPluginEnabled(pluginId: string): boolean;
}

/**
 * 节点注册器接口
 */
export interface INodeRegistry {
  /** 注册节点类型 */
  registerNodeType(nodeType: IFlowNodeType): void;
  /** 注销节点类型 */
  unregisterNodeType(type: string): void;
  /** 获取节点类型 */
  getNodeType(type: string): IFlowNodeType | null;
  /** 获取所有节点类型 */
  getAllNodeTypes(): IFlowNodeType[];
  /** 按分组获取节点类型 */
  getNodeTypesByGroup(group: NodeGroup): IFlowNodeType[];
  /** 搜索节点类型 */
  searchNodeTypes(query: string): IFlowNodeType[];
}

/**
 * 主题注册器接口
 */
export interface IThemeRegistry {
  /** 注册主题 */
  registerTheme(theme: ITheme): void;
  /** 注销主题 */
  unregisterTheme(themeId: string): void;
  /** 获取主题 */
  getTheme(themeId: string): ITheme | null;
  /** 获取所有主题 */
  getAllThemes(): ITheme[];
  /** 设置当前主题 */
  setCurrentTheme(themeId: string): void;
  /** 获取当前主题 */
  getCurrentTheme(): ITheme | null;
}

/**
 * 属性注册器接口
 */
export interface IPropertyRegistry {
  /** 注册属性编辑器 */
  registerPropertyEditor(editor: IPropertyEditor): void;
  /** 注销属性编辑器 */
  unregisterPropertyEditor(editorId: string): void;
  /** 获取属性编辑器 */
  getPropertyEditor(editorId: string): IPropertyEditor | null;
  /** 获取支持特定类型的编辑器 */
  getEditorsForType(type: string): IPropertyEditor[];
  /** 获取所有属性编辑器 */
  getAllPropertyEditors(): IPropertyEditor[];
}

/**
 * 画布API接口
 */
export interface ICanvasAPI {
  /** 添加节点 */
  addNode(node: IFlowNode): void;
  /** 删除节点 */
  deleteNode(nodeId: string): void;
  /** 更新节点 */
  updateNode(nodeId: string, updates: Partial<IFlowNode>): void;
  /** 获取节点 */
  getNode(nodeId: string): IFlowNode | null;
  /** 获取所有节点 */
  getAllNodes(): IFlowNode[];
  /** 连接节点 */
  connectNodes(connection: IConnection): void;
  /** 断开连接 */
  disconnectNodes(connectionId: string): void;
  /** 获取连接 */
  getConnection(connectionId: string): IConnection | null;
  /** 获取所有连接 */
  getAllConnections(): IConnection[];
  /** 缩放画布 */
  zoomTo(scale: number): void;
  /** 适配画布 */
  fitView(): void;
  /** 居中显示 */
  centerView(): void;
}

/**
 * 事件总线接口
 */
export interface IEventBus {
  /** 发布事件 */
  emit(event: string, data?: any): void;
  /** 订阅事件 */
  on(event: string, handler: (data?: any) => void): () => void;
  /** 一次性订阅 */
  once(event: string, handler: (data?: any) => void): () => void;
  /** 取消订阅 */
  off(event: string, handler?: (data?: any) => void): void;
}

/**
 * 存储接口
 */
export interface IStorage {
  /** 获取值 */
  get<T = any>(key: string): T | null;
  /** 设置值 */
  set<T = any>(key: string, value: T): void;
  /** 删除值 */
  remove(key: string): void;
  /** 清空存储 */
  clear(): void;
  /** 获取所有键 */
  keys(): string[];
}

/**
 * 日志记录器接口
 */
export interface ILogger {
  /** 调试日志 */
  debug(message: string, data?: any): void;
  /** 信息日志 */
  info(message: string, data?: any): void;
  /** 警告日志 */
  warn(message: string, data?: any): void;
  /** 错误日志 */
  error(message: string, error?: Error): void;
}
