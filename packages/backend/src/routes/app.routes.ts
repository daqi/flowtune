import { Hono } from 'hono'
import { AppService } from '../modules/app/app.service'

export function createAppRoutes(appService: AppService) {
  const app = new Hono()

  // 获取所有应用
  app.get('/', (c) => {
    const apps = appService.getAllApps()
    return c.json({
      success: true,
      data: apps,
      total: apps.length
    })
  })

  // 获取活跃应用
  app.get('/active', (c) => {
    const apps = appService.getActiveApps()
    return c.json({
      success: true,
      data: apps,
      total: apps.length
    })
  })

  // 获取单个应用
  app.get('/:id', (c) => {
    const id = c.req.param('id')
    const app = appService.getApp(id)
    
    if (!app) {
      return c.json({
        success: false,
        error: 'Application not found'
      }, 404)
    }

    return c.json({
      success: true,
      data: app
    })
  })

  // 注册新应用
  app.post('/', async (c) => {
    try {
      const body = await c.req.json()
      const app = appService.registerApp(body)
      
      return c.json({
        success: true,
        data: app
      }, 201)
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }, 400)
    }
  })

  // 更新应用状态
  app.patch('/:id/status', async (c) => {
    try {
      const id = c.req.param('id')
      const { status } = await c.req.json()
      
      const success = appService.updateAppStatus(id, status)
      if (!success) {
        return c.json({
          success: false,
          error: 'Application not found'
        }, 404)
      }

      return c.json({
        success: true,
        message: 'Status updated successfully'
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      }, 400)
    }
  })

  // 删除应用
  app.delete('/:id', (c) => {
    const id = c.req.param('id')
    const success = appService.removeApp(id)
    
    if (!success) {
      return c.json({
        success: false,
        error: 'Application not found'
      }, 404)
    }

    return c.json({
      success: true,
      message: 'Application deleted successfully'
    })
  })

  return app
}
