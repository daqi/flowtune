import { IAction, ActionContext, ActionResult, HttpMethod, ParameterType } from '../../core/types'
import { AppService } from '../app/app.service'
import { AuthService } from '../auth/auth.service'
import crypto from 'crypto'

export class ActionService {
  private actions: Map<string, IAction> = new Map()

  constructor(
    private appService: AppService,
    private authService: AuthService
  ) {
    this.initializeBuiltInActions()
  }

  /**
   * 注册新操作
   */
  registerAction(action: Omit<IAction, 'id'>): IAction {
    const newAction: IAction = {
      id: this.generateActionId(),
      ...action
    }
    
    this.actions.set(newAction.id, newAction)
    return newAction
  }

  /**
   * 获取操作信息
   */
  getAction(actionId: string): IAction | undefined {
    return this.actions.get(actionId)
  }

  /**
   * 根据应用ID获取操作列表
   */
  getActionsByAppId(appId: string): IAction[] {
    return Array.from(this.actions.values()).filter(action => action.appId === appId)
  }

  /**
   * 根据分类获取操作列表
   */
  getActionsByCategory(category: string): IAction[] {
    return Array.from(this.actions.values()).filter(action => action.category === category)
  }

  /**
   * 执行操作
   */
  async executeAction(context: ActionContext): Promise<ActionResult> {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()

    try {
      const action = this.actions.get(context.actionId)
      if (!action) {
        return this.createErrorResult('ACTION_NOT_FOUND', '操作不存在', startTime, requestId)
      }

      const app = this.appService.getApp(action.appId)
      if (!app || app.status !== 'active') {
        return this.createErrorResult('APP_UNAVAILABLE', '应用不可用', startTime, requestId)
      }

      // 验证参数
      const validationResult = this.validateParameters(action, context.parameters)
      if (!validationResult.isValid) {
        return this.createErrorResult('INVALID_PARAMETERS', validationResult.error!, startTime, requestId)
      }

      // 处理鉴权
      let authHeaders: Record<string, string> = {}
      if (action.requiresAuth && context.authId) {
        const isValidAuth = await this.authService.validateAuth(context.authId)
        if (!isValidAuth) {
          return this.createErrorResult('AUTH_INVALID', '鉴权无效', startTime, requestId)
        }
        authHeaders = this.authService.getAuthHeaders(context.authId)
      }

      // 执行具体操作
      const result = await this.performAction(action, context, authHeaders)
      
      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
          requestId
        }
      }

    } catch (error) {
      return this.createErrorResult(
        'EXECUTION_ERROR',
        error instanceof Error ? error.message : '执行错误',
        startTime,
        requestId,
        error
      )
    }
  }

  /**
   * 验证操作参数
   */
  private validateParameters(action: IAction, parameters: Record<string, any>): { isValid: boolean; error?: string } {
    if (!action.parameters) return { isValid: true }

    for (const param of action.parameters) {
      const value = parameters[param.name]

      // 检查必需参数
      if (param.required && (value === undefined || value === null)) {
        return { isValid: false, error: `缺少必需参数: ${param.name}` }
      }

      // 类型验证
      if (value !== undefined && value !== null) {
        const typeCheck = this.validateParameterType(value, param.type)
        if (!typeCheck) {
          return { isValid: false, error: `参数 ${param.name} 类型错误，期望: ${param.type}` }
        }

        // 验证规则
        if (param.validation) {
          const validationCheck = this.validateParameterValue(value, param.validation)
          if (!validationCheck) {
            return { isValid: false, error: `参数 ${param.name} 验证失败` }
          }
        }
      }
    }

    return { isValid: true }
  }

  private validateParameterType(value: any, type: ParameterType): boolean {
    switch (type) {
      case ParameterType.STRING:
        return typeof value === 'string'
      case ParameterType.NUMBER:
        return typeof value === 'number' && !isNaN(value)
      case ParameterType.BOOLEAN:
        return typeof value === 'boolean'
      case ParameterType.ARRAY:
        return Array.isArray(value)
      case ParameterType.OBJECT:
        return typeof value === 'object' && value !== null && !Array.isArray(value)
      case ParameterType.FILE:
        return value instanceof File || typeof value === 'string' // 文件路径或File对象
      default:
        return true
    }
  }

  private validateParameterValue(value: any, validation: any): boolean {
    if (validation.min !== undefined && value < validation.min) return false
    if (validation.max !== undefined && value > validation.max) return false
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(value)) return false
    }
    if (validation.enum && !validation.enum.includes(value)) return false
    return true
  }

  /**
   * 执行具体操作
   */
  private async performAction(
    action: IAction,
    context: ActionContext,
    authHeaders: Record<string, string>
  ): Promise<any> {
    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      ...action.headers,
      ...authHeaders,
      ...context.headers
    }

    // 构建URL和请求体
    let url = action.endpoint
    let body: any = undefined

    if (action.method === HttpMethod.GET || action.method === HttpMethod.DELETE) {
      // GET/DELETE请求将参数添加到URL
      const searchParams = new URLSearchParams()
      Object.entries(context.parameters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      if (searchParams.toString()) {
        url += (url.includes('?') ? '&' : '?') + searchParams.toString()
      }
    } else {
      // POST/PUT/PATCH请求将参数作为请求体
      body = JSON.stringify(context.parameters)
    }

    // 发送HTTP请求
    const response = await fetch(url, {
      method: action.method,
      headers,
      body
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return await response.json()
    }
    
    return await response.text()
  }

  private createErrorResult(
    code: string,
    message: string,
    startTime: number,
    requestId: string,
    details?: any
  ): ActionResult {
    return {
      success: false,
      error: {
        code,
        message,
        details
      },
      metadata: {
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        requestId
      }
    }
  }

  private generateActionId(): string {
    return `action_${crypto.randomUUID()}`
  }

  /**
   * 初始化内置操作
   */
  private initializeBuiltInActions(): void {
    // HTTP请求操作
    this.registerAction({
      appId: 'http-request',
      name: 'HTTP GET',
      description: '发送HTTP GET请求',
      method: HttpMethod.GET,
      endpoint: '',
      requiresAuth: false,
      category: 'http',
      parameters: [
        {
          name: 'url',
          type: ParameterType.STRING,
          required: true,
          description: '请求URL'
        }
      ]
    })

    // OpenAI操作示例
    this.registerAction({
      appId: 'openai',
      name: 'Chat Completion',
      description: 'OpenAI聊天补全',
      method: HttpMethod.POST,
      endpoint: 'https://api.openai.com/v1/chat/completions',
      requiresAuth: true,
      category: 'ai',
      parameters: [
        {
          name: 'model',
          type: ParameterType.STRING,
          required: true,
          description: '模型名称',
          defaultValue: 'gpt-3.5-turbo'
        },
        {
          name: 'messages',
          type: ParameterType.ARRAY,
          required: true,
          description: '对话消息'
        },
        {
          name: 'temperature',
          type: ParameterType.NUMBER,
          required: false,
          description: '温度参数',
          defaultValue: 0.7,
          validation: { min: 0, max: 2 }
        }
      ]
    })

    // GitHub操作示例
    this.registerAction({
      appId: 'github',
      name: 'Create Issue',
      description: '创建GitHub Issue',
      method: HttpMethod.POST,
      endpoint: 'https://api.github.com/repos/{owner}/{repo}/issues',
      requiresAuth: true,
      category: 'development',
      parameters: [
        {
          name: 'owner',
          type: ParameterType.STRING,
          required: true,
          description: '仓库所有者'
        },
        {
          name: 'repo',
          type: ParameterType.STRING,
          required: true,
          description: '仓库名称'
        },
        {
          name: 'title',
          type: ParameterType.STRING,
          required: true,
          description: 'Issue标题'
        },
        {
          name: 'body',
          type: ParameterType.STRING,
          required: false,
          description: 'Issue内容'
        }
      ]
    })
  }
}
