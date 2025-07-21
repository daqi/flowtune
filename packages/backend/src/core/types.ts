// 应用层基础接口
export interface IApp {
  id: string
  name: string
  description?: string
  version: string
  status: 'active' | 'inactive' | 'deprecated'
  createdAt: Date
  updatedAt: Date
}

// 鉴权层基础接口
export interface IAuth {
  id: string
  appId: string
  type: AuthType
  credentials: Record<string, any>
  isValid: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

// 操作层基础接口
export interface IAction {
  id: string
  appId: string
  name: string
  description?: string
  method: HttpMethod
  endpoint: string
  headers?: Record<string, string>
  parameters?: ActionParameter[]
  responseSchema?: Record<string, any>
  requiresAuth: boolean
  category?: string
  tags?: string[]
}

// 操作参数定义
export interface ActionParameter {
  name: string
  type: ParameterType
  required: boolean
  description?: string
  defaultValue?: any
  validation?: ParameterValidation
}

// 参数验证规则
export interface ParameterValidation {
  min?: number
  max?: number
  pattern?: string
  enum?: any[]
  format?: string
}

// 操作执行上下文
export interface ActionContext {
  actionId: string
  appId: string
  authId?: string
  parameters: Record<string, any>
  headers?: Record<string, string>
  metadata?: Record<string, any>
}

// 操作执行结果
export interface ActionResult {
  success: boolean
  data?: any
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    executionTime: number
    timestamp: Date
    requestId: string
  }
}

// 类型枚举
export enum AuthType {
  API_KEY = 'api_key',
  BEARER_TOKEN = 'bearer_token',
  BASIC_AUTH = 'basic_auth',
  OAUTH2 = 'oauth2',
  WEBHOOK = 'webhook',
  CUSTOM = 'custom'
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

export enum ParameterType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
  FILE = 'file'
}

// 平台集成接口
export interface IPlatformIntegration {
  platformName: string
  baseUrl: string
  authenticate(credentials: Record<string, any>): Promise<IAuth>
  executeAction(context: ActionContext): Promise<ActionResult>
  validateCredentials(auth: IAuth): Promise<boolean>
  refreshToken?(auth: IAuth): Promise<IAuth>
}

// 低代码配置接口 - 匹配前端FlowDocumentJSON结构
export interface FlowDocumentJSON {
  nodes: FlowNode[]
  edges?: FlowEdge[]
  variables?: Record<string, any>
  settings?: FlowSettings
}

// 流程节点 - 匹配前端节点结构
export interface FlowNode {
  id: string
  type: NodeType
  data?: NodeData
  blocks?: FlowNode[]
  meta?: NodeMeta
}

// 节点数据结构
export interface NodeData {
  title?: string
  inputs?: JsonSchema
  outputs?: JsonSchema
  inputsValues?: Record<string, InputValue>
  batchFor?: InputValue
  [key: string]: any
}

// 节点元数据
export interface NodeMeta {
  defaultExpanded?: boolean
  [key: string]: any
}

// 输入值类型
export interface InputValue {
  type: 'constant' | 'ref' | 'variable'
  content: any
}

// JSON Schema定义
export interface JsonSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean'
  properties?: Record<string, JsonSchemaProperty>
  items?: JsonSchema
  required?: string[]
  default?: any
}

export interface JsonSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  properties?: Record<string, JsonSchemaProperty>
  items?: JsonSchemaProperty
  default?: any
  extra?: {
    formComponent?: string
    [key: string]: any
  }
}

// 节点类型枚举
export type NodeType = 
  | 'start'
  | 'end'
  | 'llm'
  | 'agent'
  | 'agentLLM'
  | 'agentMemory' 
  | 'agentTools'
  | 'memory'
  | 'tool'
  | 'switch'
  | 'case'
  | 'caseDefault'
  | 'loop'
  | 'if'
  | 'ifBlock'
  | 'breakLoop'
  | 'tryCatch'
  | 'tryBlock'
  | 'catchBlock'
  | 'action'
  | 'condition'
  | 'trigger'
  | 'transform'

// 流程边
export interface FlowEdge {
  id: string
  source: string
  target: string
  condition?: string
  sourceHandle?: string
  targetHandle?: string
}

// 流程设置
export interface FlowSettings {
  timeout?: number
  retryCount?: number
  errorHandling?: 'stop' | 'continue' | 'retry'
  parallelExecution?: boolean
  maxConcurrency?: number
}

// 流程执行上下文
export interface FlowExecutionContext {
  executionId: string
  flowId: string
  variables: Record<string, any>
  nodeResults: Map<string, NodeExecutionResult>
  currentNode: string | null
  status: 'running' | 'completed' | 'failed' | 'paused'
  loopStack: LoopContext[]
  conditionStack: ConditionContext[]
}

// 节点执行结果
export interface NodeExecutionResult {
  success: boolean
  data?: any
  error?: string
  executionTime: number
  timestamp: Date
  nodeType: NodeType
}

// 循环上下文
export interface LoopContext {
  nodeId: string
  items: any[]
  currentIndex: number
  currentItem: any
  variables: Record<string, any>
}

// 条件上下文
export interface ConditionContext {
  nodeId: string
  conditionResult: boolean
  branchTaken: string
}

// 流程执行结果
export interface FlowExecutionResult {
  success: boolean
  executionId: string
  executionTime: number
  results: Record<string, NodeExecutionResult>
  finalVariables: Record<string, any>
  error?: string
  logs?: ExecutionLog[]
}

// 执行日志
export interface ExecutionLog {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  nodeId?: string
  message: string
  data?: any
}
