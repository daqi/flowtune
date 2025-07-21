import { IAuth, AuthType } from '../../core/types'
import crypto from 'crypto'

export class AuthService {
  private auths: Map<string, IAuth> = new Map()

  /**
   * 创建鉴权配置
   */
  createAuth(authData: Omit<IAuth, 'id' | 'isValid' | 'createdAt' | 'updatedAt'>): IAuth {
    const auth: IAuth = {
      id: this.generateAuthId(),
      ...authData,
      isValid: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.auths.set(auth.id, auth)
    return auth
  }

  /**
   * 获取鉴权配置
   */
  getAuth(authId: string): IAuth | undefined {
    return this.auths.get(authId)
  }

  /**
   * 根据应用ID获取鉴权配置
   */
  getAuthByAppId(appId: string): IAuth[] {
    return Array.from(this.auths.values()).filter(auth => auth.appId === appId)
  }

  /**
   * 验证鉴权是否有效
   */
  async validateAuth(authId: string): Promise<boolean> {
    const auth = this.auths.get(authId)
    if (!auth) return false

    // 检查是否过期
    if (auth.expiresAt && auth.expiresAt < new Date()) {
      auth.isValid = false
      return false
    }

    // 根据不同类型进行验证
    switch (auth.type) {
      case AuthType.API_KEY:
        return this.validateApiKey(auth)
      case AuthType.BEARER_TOKEN:
        return this.validateBearerToken(auth)
      case AuthType.OAUTH2:
        return this.validateOAuth2(auth)
      default:
        return auth.isValid
    }
  }

  /**
   * 刷新鉴权令牌
   */
  async refreshAuth(authId: string): Promise<IAuth | null> {
    const auth = this.auths.get(authId)
    if (!auth) return null

    switch (auth.type) {
      case AuthType.OAUTH2:
        return this.refreshOAuth2Token(auth)
      default:
        return auth
    }
  }

  /**
   * 更新鉴权配置
   */
  updateAuth(authId: string, updates: Partial<Omit<IAuth, 'id' | 'createdAt'>>): boolean {
    const auth = this.auths.get(authId)
    if (!auth) return false

    Object.assign(auth, updates, { updatedAt: new Date() })
    return true
  }

  /**
   * 删除鉴权配置
   */
  removeAuth(authId: string): boolean {
    return this.auths.delete(authId)
  }

  /**
   * 获取鉴权头部
   */
  getAuthHeaders(authId: string): Record<string, string> {
    const auth = this.auths.get(authId)
    if (!auth || !auth.isValid) return {}

    switch (auth.type) {
      case AuthType.API_KEY:
        return {
          'X-API-Key': auth.credentials.apiKey,
          ...(auth.credentials.headerName && {
            [auth.credentials.headerName]: auth.credentials.apiKey
          })
        }
      case AuthType.BEARER_TOKEN:
        return {
          'Authorization': `Bearer ${auth.credentials.token}`
        }
      case AuthType.BASIC_AUTH:
        const encoded = Buffer.from(
          `${auth.credentials.username}:${auth.credentials.password}`
        ).toString('base64')
        return {
          'Authorization': `Basic ${encoded}`
        }
      case AuthType.OAUTH2:
        return {
          'Authorization': `Bearer ${auth.credentials.accessToken}`
        }
      default:
        return auth.credentials.headers || {}
    }
  }

  private generateAuthId(): string {
    return `auth_${crypto.randomUUID()}`
  }

  private async validateApiKey(auth: IAuth): Promise<boolean> {
    // 实际实现中可以调用对应平台的验证接口
    return !!auth.credentials.apiKey
  }

  private async validateBearerToken(auth: IAuth): Promise<boolean> {
    // 实际实现中可以验证token的有效性
    return !!auth.credentials.token
  }

  private async validateOAuth2(auth: IAuth): Promise<boolean> {
    // 检查access token是否存在且未过期
    const { accessToken, expiresIn, createdAt } = auth.credentials
    if (!accessToken) return false

    if (expiresIn && createdAt) {
      const tokenCreatedAt = new Date(createdAt)
      const expirationTime = new Date(tokenCreatedAt.getTime() + expiresIn * 1000)
      return expirationTime > new Date()
    }

    return true
  }

  private async refreshOAuth2Token(auth: IAuth): Promise<IAuth> {
    // 实际实现中使用refresh token获取新的access token
    // 这里只是示例
    if (auth.credentials.refreshToken) {
      // 模拟刷新操作
      auth.credentials.accessToken = `new_token_${Date.now()}`
      auth.credentials.createdAt = new Date().toISOString()
      auth.updatedAt = new Date()
    }
    return auth
  }
}
