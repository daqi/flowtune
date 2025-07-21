import { Hono } from 'hono'
import { AuthService } from '../modules/auth/auth.service'

export function createAuthRoutes(authService: AuthService) {
  const app = new Hono()

  // 创建鉴权配置
  app.post('/', async (c) => {
    try {
      const body = await c.req.json()
      const auth = authService.createAuth(body)
      
      return c.json({
        success: true,
        data: auth
      }, 201)
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Creation failed'
      }, 400)
    }
  })

  // 获取鉴权配置
  app.get('/:id', (c) => {
    const id = c.req.param('id')
    const auth = authService.getAuth(id)
    
    if (!auth) {
      return c.json({
        success: false,
        error: 'Authentication configuration not found'
      }, 404)
    }

    // 隐藏敏感信息
    const safeAuth = {
      ...auth,
      credentials: Object.keys(auth.credentials).reduce((acc, key) => {
        acc[key] = key.toLowerCase().includes('secret') || 
                  key.toLowerCase().includes('password') ||
                  key.toLowerCase().includes('token') ? '***' : auth.credentials[key]
        return acc
      }, {} as Record<string, any>)
    }

    return c.json({
      success: true,
      data: safeAuth
    })
  })

  // 根据应用ID获取鉴权配置
  app.get('/app/:appId', (c) => {
    const appId = c.req.param('appId')
    const auths = authService.getAuthByAppId(appId)
    
    return c.json({
      success: true,
      data: auths,
      total: auths.length
    })
  })

  // 验证鉴权配置
  app.post('/:id/validate', async (c) => {
    try {
      const id = c.req.param('id')
      const isValid = await authService.validateAuth(id)
      
      return c.json({
        success: true,
        data: { isValid }
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      }, 400)
    }
  })

  // 刷新鉴权令牌
  app.post('/:id/refresh', async (c) => {
    try {
      const id = c.req.param('id')
      const auth = await authService.refreshAuth(id)
      
      if (!auth) {
        return c.json({
          success: false,
          error: 'Authentication configuration not found'
        }, 404)
      }

      return c.json({
        success: true,
        data: auth
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Refresh failed'
      }, 400)
    }
  })

  // 更新鉴权配置
  app.put('/:id', async (c) => {
    try {
      const id = c.req.param('id')
      const updates = await c.req.json()
      
      const success = authService.updateAuth(id, updates)
      if (!success) {
        return c.json({
          success: false,
          error: 'Authentication configuration not found'
        }, 404)
      }

      return c.json({
        success: true,
        message: 'Authentication configuration updated successfully'
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      }, 400)
    }
  })

  // 删除鉴权配置
  app.delete('/:id', (c) => {
    const id = c.req.param('id')
    const success = authService.removeAuth(id)
    
    if (!success) {
      return c.json({
        success: false,
        error: 'Authentication configuration not found'
      }, 404)
    }

    return c.json({
      success: true,
      message: 'Authentication configuration deleted successfully'
    })
  })

  // 测试鉴权连接
  app.post('/test', async (c) => {
    try {
      const { type, credentials } = await c.req.json()
      
      // 创建临时鉴权配置进行测试
      const tempAuth = authService.createAuth({
        appId: 'test',
        type,
        credentials
      })

      const isValid = await authService.validateAuth(tempAuth.id)
      
      // 删除临时配置
      authService.removeAuth(tempAuth.id)

      return c.json({
        success: true,
        data: { 
          connectionTest: isValid ? 'passed' : 'failed',
          isValid 
        }
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }, 400)
    }
  })

  return app
}
