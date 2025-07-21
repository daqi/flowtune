import { Hono } from 'hono'
import { FlowEngine } from '../core/flow-engine'
import { ActionService } from '../modules/action/action.service'
import { testFlowEngine, demoFlowData } from '../test/flow-engine.test'

export function createFlowRoutes(flowEngine: FlowEngine, actionService: ActionService) {
  const app = new Hono()

  // 执行流程 - 更新为支持新的FlowDocumentJSON格式
  app.post('/execute', async (c) => {
    try {
      const body = await c.req.json()
      const { flowDocument, inputData = {} } = body

      if (!flowDocument) {
        return c.json({ 
          success: false, 
          error: '缺少flowDocument参数' 
        }, 400)
      }

      const result = await flowEngine.executeFlow(flowDocument, inputData)
      
      return c.json({
        success: true,
        data: result
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : '流程执行失败'
      }, 500)
    }
  })

  // 验证流程配置
  app.post('/validate', async (c) => {
    try {
      const { flowDocument } = await c.req.json()
      
      if (!flowDocument) {
        return c.json({
          success: false,
          error: 'Flow document is required'
        }, 400)
      }

      const validation = validateFlowDocument(flowDocument)
      
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
      const { flowDocument, inputData, breakpoints } = await c.req.json()
      
      // 创建调试版本的流程执行器
      const debugResult = await debugFlow(flowEngine, flowDocument, inputData, breakpoints)
      
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

  // 获取demo流程数据
  app.get('/demo', async (c) => {
    return c.json({
      success: true,
      data: demoFlowData
    })
  })

  // 测试demo流程执行
  app.post('/test-demo', async (c) => {
    try {
      const body = await c.req.json()
      const inputData = body.inputData || {}

      const result = await flowEngine.executeFlow(demoFlowData, inputData)
      
      return c.json({
        success: true,
        data: result
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Demo流程执行失败'
      }, 500)
    }
  })

  // 运行完整测试
  app.post('/run-test', async (c) => {
    try {
      const result = await testFlowEngine()
      
      return c.json({
        success: true,
        data: result,
        message: '测试执行完成'
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : '测试执行失败'
      }, 500)
    }
  })

  // 获取支持的节点类型
  app.get('/node-types', async (c) => {
    const nodeTypes = [
      'start',
      'end', 
      'llm',
      'agent',
      'agentLLM',
      'agentMemory',
      'agentTools',
      'memory',
      'tool',
      'switch',
      'case',
      'caseDefault',
      'loop',
      'if',
      'ifBlock',
      'breakLoop',
      'tryCatch',
      'tryBlock',
      'catchBlock',
      'action',
      'condition',
      'trigger',
      'transform'
    ]

    return c.json({
      success: true,
      data: {
        nodeTypes,
        count: nodeTypes.length,
        description: '支持的流程节点类型'
      }
    })
  })

  return app
}

// 更新验证函数以支持新格式
function validateFlowDocument(flowDocument: any) {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查必需字段
  if (!flowDocument.nodes || !Array.isArray(flowDocument.nodes)) {
    errors.push('flowDocument.nodes 必须是数组')
  }

  if (flowDocument.nodes.length === 0) {
    errors.push('流程必须至少包含一个节点')
  }

  // 检查起始节点
  const startNodes = flowDocument.nodes.filter((node: any) => node.type === 'start')
  if (startNodes.length === 0) {
    warnings.push('建议添加起始节点 (start)')
  }

  // 检查结束节点
  const endNodes = flowDocument.nodes.filter((node: any) => node.type === 'end')
  if (endNodes.length === 0) {
    warnings.push('建议添加结束节点 (end)')
  }

  // 检查节点ID唯一性
  const nodeIds = flowDocument.nodes.map((node: any) => node.id)
  const duplicateIds = nodeIds.filter((id: string, index: number) => nodeIds.indexOf(id) !== index)
  if (duplicateIds.length > 0) {
    errors.push(`发现重复的节点ID: ${duplicateIds.join(', ')}`)
  }

  // 检查每个节点的基本结构
  flowDocument.nodes.forEach((node: any, index: number) => {
    if (!node.id) {
      errors.push(`节点 ${index} 缺少id字段`)
    }
    if (!node.type) {
      errors.push(`节点 ${node.id || index} 缺少type字段`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    nodeCount: flowDocument.nodes.length,
    startNodes: startNodes.length,
    endNodes: endNodes.length
  }
}

// 获取流程模板列表
function getFlowTemplates() {
  return [
    {
      id: 'simple-start-end',
      name: '简单开始结束流程',
      description: '最基本的开始到结束流程',
      category: 'basic',
      nodes: [
        {
          id: 'start-node',
          type: 'start',
          position: { x: 100, y: 100 },
          configuration: {},
          children: ['end-node']
        },
        {
          id: 'end-node',
          type: 'end',
          position: { x: 300, y: 100 },
          configuration: {}
        }
      ],
      variables: {}
    },
    {
      id: 'ai-chat-flow',
      name: 'AI对话处理流程',
      description: '使用LLM处理用户消息的完整流程',
      category: 'ai',
      nodes: [
        {
          id: 'start-node',
          type: 'start',
          position: { x: 100, y: 100 },
          configuration: {},
          children: ['llm-node']
        },
        {
          id: 'llm-node',
          type: 'llm',
          position: { x: 300, y: 100 },
          configuration: {
            model: 'gpt-3.5-turbo',
            prompt: 'You are a helpful assistant. Respond to: {{input.message}}',
            temperature: 0.7
          },
          children: ['end-node']
        },
        {
          id: 'end-node',
          type: 'end',
          position: { x: 500, y: 100 },
          configuration: {}
        }
      ],
      variables: {
        input: {
          message: '用户输入的消息'
        }
      }
    }
  ]
}

// 获取特定模板
function getFlowTemplate(templateId: string) {
  const templates = getFlowTemplates()
  return templates.find(t => t.id === templateId)
}

// 流程调试
async function debugFlow(flowEngine: FlowEngine, flowDocument: any, inputData: any, breakpoints: string[] = []) {
  // 这里可以实现更复杂的调试逻辑
  // 目前只是简单执行并返回详细信息
  
  const result = await flowEngine.executeFlow(flowDocument, inputData)
  
  return {
    execution: result,
    breakpoints,
    debugInfo: {
      totalNodes: flowDocument.nodes?.length || 0,
      executedNodes: result.results ? Object.keys(result.results).length : 0,
      executionTime: result.executionTime || 0
    }
  }
}
