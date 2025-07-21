import { Hono } from 'hono'
import { FlowEngine } from '../core/flow-engine'
import { ActionService } from '../modules/action/action.service'

export function createFlowRoutes(flowEngine: FlowEngine, actionService: ActionService) {
  const app = new Hono()

  // 执行流程
  app.post('/execute', async (c) => {
    try {
      const body = await c.req.json()
      const { config, inputData } = body
      
      if (!config) {
        return c.json({
          success: false,
          error: 'Flow configuration is required'
        }, 400)
      }

      const result = await flowEngine.executeFlow(config, inputData)
      
      return c.json({
        success: true,
        data: result
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Flow execution failed'
      }, 400)
    }
  })

  // 验证流程配置
  app.post('/validate', async (c) => {
    try {
      const { config } = await c.req.json()
      
      if (!config) {
        return c.json({
          success: false,
          error: 'Flow configuration is required'
        }, 400)
      }

      const validation = validateFlowConfig(config, actionService)
      
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

  // 获取流程模板
  app.get('/templates', (c) => {
    const templates = getFlowTemplates()
    
    return c.json({
      success: true,
      data: templates
    })
  })

  // 获取特定模板
  app.get('/templates/:templateId', (c) => {
    const templateId = c.req.param('templateId')
    const template = getFlowTemplate(templateId)
    
    if (!template) {
      return c.json({
        success: false,
        error: 'Template not found'
      }, 404)
    }

    return c.json({
      success: true,
      data: template
    })
  })

  // 创建流程模板
  app.post('/templates', async (c) => {
    try {
      const template = await c.req.json()
      
      // 这里可以保存到数据库
      // 目前只是返回确认
      
      return c.json({
        success: true,
        data: {
          ...template,
          id: `template_${Date.now()}`,
          createdAt: new Date()
        }
      }, 201)
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Template creation failed'
      }, 400)
    }
  })

  // 流程调试接口
  app.post('/debug', async (c) => {
    try {
      const { config, inputData, breakpoints } = await c.req.json()
      
      // 创建调试版本的流程执行器
      const debugResult = await debugFlow(flowEngine, config, inputData, breakpoints)
      
      return c.json({
        success: true,
        data: debugResult
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Debug failed'
      }, 400)
    }
  })

  return app
}

// 验证流程配置
function validateFlowConfig(config: any, actionService: ActionService) {
  const errors: string[] = []
  const warnings: string[] = []

  // 验证基本结构
  if (!config.flowId) {
    errors.push('Flow ID is required')
  }

  if (!config.nodes || !Array.isArray(config.nodes)) {
    errors.push('Nodes array is required')
  }

  if (!config.edges || !Array.isArray(config.edges)) {
    errors.push('Edges array is required')
  }

  if (config.nodes) {
    // 验证节点
    config.nodes.forEach((node: any, index: number) => {
      if (!node.id) {
        errors.push(`Node at index ${index} missing ID`)
      }

      if (!node.type) {
        errors.push(`Node ${node.id} missing type`)
      }

      if (node.type === 'action') {
        if (!node.actionId) {
          errors.push(`Action node ${node.id} missing actionId`)
        } else {
          const action = actionService.getAction(node.actionId)
          if (!action) {
            errors.push(`Action ${node.actionId} not found for node ${node.id}`)
          }
        }
      }
    })

    // 检查是否有起始节点
    const nodeIds = new Set(config.nodes.map((n: any) => n.id))
    const targetNodes = new Set(config.edges?.map((e: any) => e.target) || [])
    const startNodes = config.nodes.filter((n: any) => !targetNodes.has(n.id))
    
    if (startNodes.length === 0) {
      warnings.push('No start nodes found (nodes with no incoming edges)')
    }

    // 检查是否有孤立节点
    const connectedNodes = new Set([
      ...(config.edges?.map((e: any) => e.source) || []),
      ...(config.edges?.map((e: any) => e.target) || [])
    ])
    
    const isolatedNodes = config.nodes.filter((n: any) => !connectedNodes.has(n.id))
    if (isolatedNodes.length > 0) {
      warnings.push(`Isolated nodes found: ${isolatedNodes.map((n: any) => n.id).join(', ')}`)
    }
  }

  if (config.edges) {
    // 验证边
    config.edges.forEach((edge: any, index: number) => {
      if (!edge.source) {
        errors.push(`Edge at index ${index} missing source`)
      }

      if (!edge.target) {
        errors.push(`Edge at index ${index} missing target`)
      }

      // 检查节点是否存在
      if (config.nodes) {
        const nodeIds = new Set(config.nodes.map((n: any) => n.id))
        if (edge.source && !nodeIds.has(edge.source)) {
          errors.push(`Edge source node ${edge.source} not found`)
        }
        if (edge.target && !nodeIds.has(edge.target)) {
          errors.push(`Edge target node ${edge.target} not found`)
        }
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// 获取流程模板列表
function getFlowTemplates() {
  return [
    {
      id: 'simple-http',
      name: '简单HTTP请求',
      description: '发送HTTP请求并处理响应',
      category: 'basic',
      nodes: [
        {
          id: 'start',
          type: 'trigger',
          position: { x: 100, y: 100 },
          configuration: {}
        },
        {
          id: 'http-request',
          type: 'action',
          actionId: 'http-get',
          position: { x: 300, y: 100 },
          configuration: {
            parameters: {
              url: '{{input.url}}'
            }
          }
        }
      ],
      edges: [
        {
          id: 'start-to-http',
          source: 'start',
          target: 'http-request'
        }
      ]
    },
    {
      id: 'ai-chat',
      name: 'AI对话处理',
      description: '使用OpenAI处理用户消息',
      category: 'ai',
      nodes: [
        {
          id: 'start',
          type: 'trigger',
          position: { x: 100, y: 100 },
          configuration: {}
        },
        {
          id: 'ai-chat',
          type: 'action',
          actionId: 'openai-chat',
          position: { x: 300, y: 100 },
          configuration: {
            parameters: {
              model: 'gpt-3.5-turbo',
              messages: '{{input.messages}}',
              temperature: 0.7
            }
          }
        }
      ],
      edges: [
        {
          id: 'start-to-ai',
          source: 'start',
          target: 'ai-chat'
        }
      ]
    }
  ]
}

// 获取特定模板
function getFlowTemplate(templateId: string) {
  const templates = getFlowTemplates()
  return templates.find(t => t.id === templateId)
}

// 流程调试
async function debugFlow(flowEngine: FlowEngine, config: any, inputData: any, breakpoints: string[] = []) {
  // 这里可以实现更复杂的调试逻辑
  // 目前只是简单执行并返回详细信息
  
  const result = await flowEngine.executeFlow(config, inputData)
  
  return {
    execution: result,
    breakpoints,
    debugInfo: {
      totalNodes: config.nodes?.length || 0,
      totalEdges: config.edges?.length || 0,
      executedNodes: Object.keys(result.results || {}).length
    }
  }
}
