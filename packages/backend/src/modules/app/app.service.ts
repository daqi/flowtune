import { IApp } from '../../core/types'

export class AppService {
  private apps: Map<string, IApp> = new Map()

  constructor() {
    this.initializeBuiltInApps()
  }

  /**
   * 注册新应用
   */
  registerApp(app: Omit<IApp, 'createdAt' | 'updatedAt'>): IApp {
    const newApp: IApp = {
      ...app,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.apps.set(app.id, newApp)
    return newApp
  }

  /**
   * 获取应用信息
   */
  getApp(appId: string): IApp | undefined {
    return this.apps.get(appId)
  }

  /**
   * 获取所有应用
   */
  getAllApps(): IApp[] {
    return Array.from(this.apps.values())
  }

  /**
   * 获取活跃应用
   */
  getActiveApps(): IApp[] {
    return this.getAllApps().filter(app => app.status === 'active')
  }

  /**
   * 更新应用状态
   */
  updateAppStatus(appId: string, status: IApp['status']): boolean {
    const app = this.apps.get(appId)
    if (!app) return false

    app.status = status
    app.updatedAt = new Date()
    return true
  }

  /**
   * 删除应用
   */
  removeApp(appId: string): boolean {
    return this.apps.delete(appId)
  }

  /**
   * 初始化内置应用
   */
  private initializeBuiltInApps(): void {
    // 内置应用：HTTP请求
    this.registerApp({
      id: 'http-request',
      name: 'HTTP Request',
      description: '通用HTTP请求工具',
      version: '1.0.0',
      status: 'active'
    })

    // 内置应用：数据转换
    this.registerApp({
      id: 'data-transform',
      name: 'Data Transform',
      description: '数据转换和处理工具',
      version: '1.0.0',
      status: 'active'
    })

    // 第三方应用示例
    this.registerApp({
      id: 'openai',
      name: 'OpenAI',
      description: 'OpenAI GPT API集成',
      version: '1.0.0',
      status: 'active'
    })

    this.registerApp({
      id: 'github',
      name: 'GitHub',
      description: 'GitHub API集成',
      version: '1.0.0',
      status: 'active'
    })

    this.registerApp({
      id: 'slack',
      name: 'Slack',
      description: 'Slack API集成',
      version: '1.0.0',
      status: 'active'
    })

    this.registerApp({
      id: 'wechat',
      name: 'WeChat',
      description: '微信API集成',
      version: '1.0.0',
      status: 'active'
    })

    this.registerApp({
      id: 'dingtalk',
      name: 'DingTalk',
      description: '钉钉API集成',
      version: '1.0.0',
      status: 'active'
    })
  }
}
