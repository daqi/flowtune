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

// 低代码配置接口
export interface LowCodeConfig {
  flowId: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  variables?: Record<string, any>
  settings?: FlowSettings
}

export interface FlowNode {
  id: string
  type: 'action' | 'condition' | 'trigger' | 'transform'
  actionId?: string
  appId?: string
  configuration: Record<string, any>
  position: { x: number; y: number }
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  condition?: string
}

export interface FlowSettings {
  timeout: number
  retryCount: number
  errorHandling: 'stop' | 'continue' | 'retry'
}
