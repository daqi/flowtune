import { Hono } from 'hono'
import { ActionService } from '../modules/action/action.service'

export function createActionRoutes(actionService: ActionService) {
  const app = new Hono()

  // 获取所有操作
  app.get('/', (c) => {
    const query = c.req.query()
    const { appId, category } = query
    
    let actions
    if (appId) {
      actions = actionService.getActionsByAppId(appId)
    } else if (category) {
      actions = actionService.getActionsByCategory(category)
    } else {
      actions = Array.from((actionService as any).actions.values())
    }

    return c.json({
      success: true,
      data: actions,
      total: actions.length
    })
  })

  // 获取单个操作详情
  app.get('/:id', (c) => {
    const id = c.req.param('id')
    const action = actionService.getAction(id)
    
    if (!action) {
      return c.json({
        success: false,
        error: 'Action not found'
      }, 404)
    }

    return c.json({
      success: true,
      data: action
    })
  })

  // 注册新操作
  app.post('/', async (c) => {
    try {
      const body = await c.req.json()
      const action = actionService.registerAction(body)
      
      return c.json({
        success: true,
        data: action
      }, 201)
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }, 400)
    }
  })

  // 执行操作
  app.post('/:id/execute', async (c) => {
    try {
      const actionId = c.req.param('id')
      const body = await c.req.json()
      
      const action = actionService.getAction(actionId)
      if (!action) {
        return c.json({
          success: false,
          error: 'Action not found'
        }, 404)
      }

      const context = {
        actionId,
        appId: action.appId,
        authId: body.authId,
        parameters: body.parameters || {},
        headers: body.headers,
        metadata: body.metadata
      }

      const result = await actionService.executeAction(context)
      
      return c.json({
        success: true,
        data: result
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed'
      }, 400)
    }
  })

  // 批量执行操作
  app.post('/batch/execute', async (c) => {
    try {
      const { actions } = await c.req.json()
      
      if (!Array.isArray(actions)) {
        return c.json({
          success: false,
          error: 'Actions must be an array'
        }, 400)
      }

      const results = []
      for (const actionRequest of actions) {
        const { actionId, authId, parameters, headers, metadata } = actionRequest
        
        const action = actionService.getAction(actionId)
        if (!action) {
          results.push({
            actionId,
            success: false,
            error: 'Action not found'
          })
          continue
        }

        const context = {
          actionId,
          appId: action.appId,
          authId,
          parameters: parameters || {},
          headers,
          metadata
        }

        try {
          const result = await actionService.executeAction(context)
          results.push({
            actionId,
            ...result
          })
        } catch (error) {
          results.push({
            actionId,
            success: false,
            error: error instanceof Error ? error.message : 'Execution failed'
          })
        }
      }

      return c.json({
        success: true,
        data: results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Batch execution failed'
      }, 400)
    }
  })

  // 获取操作参数模板
  app.get('/:id/template', (c) => {
    const id = c.req.param('id')
    const action = actionService.getAction(id)
    
    if (!action) {
      return c.json({
        success: false,
        error: 'Action not found'
      }, 404)
    }

    // 生成参数模板
    const template: Record<string, any> = {}
    if (action.parameters) {
      action.parameters.forEach((param: any) => {
        template[param.name] = param.defaultValue !== undefined 
          ? param.defaultValue 
          : getDefaultValueByType(param.type)
      })
    }

    return c.json({
      success: true,
      data: {
        action: {
          id: action.id,
          name: action.name,
          description: action.description
        },
        template,
        schema: {
          parameters: action.parameters,
          requiresAuth: action.requiresAuth
        }
      }
    })
  })

  // 验证操作参数
  app.post('/:id/validate', async (c) => {
    try {
      const id = c.req.param('id')
      const { parameters } = await c.req.json()
      
      const action = actionService.getAction(id)
      if (!action) {
        return c.json({
          success: false,
          error: 'Action not found'
        }, 404)
      }

      // 使用 ActionService 的私有方法进行验证（需要暴露或重构）
      const validation = (actionService as any).validateParameters(action, parameters)
      
      return c.json({
        success: true,
        data: validation
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      }, 400)
    }
  })

  return app
}

// 辅助函数：根据类型获取默认值
function getDefaultValueByType(type: string): any {
  switch (type) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'array':
      return []
    case 'object':
      return {}
    default:
      return null
  }
}
