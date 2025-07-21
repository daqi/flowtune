import { FlowEngine } from '../core/flow-engine'
import { NodeRegistryManager } from '../nodes'
import { ActionService } from '../modules/action/action.service'
import { AppService } from '../modules/app/app.service'
import { AuthService } from '../modules/auth/auth.service'
import { FlowDocumentJSON, NodeType } from '../core/types'

// 创建测试用的demo流程数据 - 包含完整的节点关联关系
export const demoFlowData: FlowDocumentJSON = {
  nodes: [
    {
      id: 'start-node',
      type: 'start' as NodeType,
      data: {
        title: '开始',
        outputs: {
          type: 'object',
          properties: {
            message: { 
              type: 'string',
              default: 'Hello FlowTune!' 
            },
            userType: {
              type: 'string', 
              default: 'normal'
            }
          }
        }
      },
      blocks: []
    },
    {
      id: 'agent-node',
      type: 'agent' as NodeType,
      data: {
        title: 'Complete Agent'
      },
      blocks: [
        {
          id: 'agentLLM-node',
          type: 'agentLLM' as NodeType,
          data: {
            title: 'Agent LLM'
          },
          blocks: [
            {
              id: 'llm-in-agent',
              type: 'llm' as NodeType,
              data: {
                title: 'LLM in Agent',
                inputsValues: {
                  modelType: { type: 'constant', content: 'gpt-3.5-turbo' },
                  temperature: { type: 'constant', content: 0.7 },
                  prompt: { type: 'constant', content: '你是一个有用的助手' }
                }
              },
              blocks: []
            }
          ]
        },
        {
          id: 'agentMemory-node',
          type: 'agentMemory' as NodeType,
          data: {
            title: 'Agent Memory'
          },
          blocks: [
            {
              id: 'memory-in-agent',
              type: 'memory' as NodeType,
              data: {
                title: 'Memory in Agent'
              },
              blocks: []
            }
          ]
        },
        {
          id: 'agentTools-node',
          type: 'agentTools' as NodeType,
          data: {
            title: 'Agent Tools'
          },
          blocks: [
            {
              id: 'tool1-in-agent',
              type: 'tool' as NodeType,
              data: {
                title: 'Search Tool'
              },
              blocks: []
            },
            {
              id: 'tool2-in-agent', 
              type: 'tool' as NodeType,
              data: {
                title: 'Calculator Tool'
              },
              blocks: []
            }
          ]
        }
      ]
    },
    {
      id: 'switch-node',
      type: 'switch' as NodeType,
      data: {
        title: 'User Type Switch',
        inputsValues: {
          expression: { type: 'constant', content: '${userType}' }
        }
      },
      blocks: [
        {
          id: 'case-normal',
          type: 'case' as NodeType,
          data: {
            title: 'Normal User Case',
            inputsValues: {
              value: { type: 'constant', content: 'normal' }
            }
          },
          blocks: []
        },
        {
          id: 'case-vip',
          type: 'case' as NodeType,
          data: {
            title: 'VIP User Case',
            inputsValues: {
              value: { type: 'constant', content: 'vip' }
            }
          },
          blocks: []
        },
        {
          id: 'case-default',
          type: 'caseDefault' as NodeType,
          data: {
            title: 'Default Case'
          },
          blocks: []
        }
      ]
    },
    {
      id: 'try-catch-node',
      type: 'tryCatch' as NodeType,
      data: {
        title: 'Error Handling'
      },
      blocks: [
        {
          id: 'try-block',
          type: 'tryBlock' as NodeType,
          data: {
            title: 'Try Block'
          },
          blocks: []
        },
        {
          id: 'catch-block',
          type: 'catchBlock' as NodeType,
          data: {
            title: 'Catch Block'
          },
          blocks: []
        }
      ]
    },
    {
      id: 'end-node',
      type: 'end' as NodeType,
      data: {
        title: '结束',
        outputs: {
          type: 'object',
          properties: {
            result: { 
              type: 'string',
              default: 'flow completed with all relationships validated' 
            }
          }
        }
      },
      blocks: []
    }
  ],
  variables: {
    input: 'test input',
    userType: 'normal'
  }
}

export async function testFlowEngine() {
  console.log('🔍 开始测试新的模块化FlowEngine...')
  
  // 创建服务依赖
  const appService = new AppService()
  const authService = new AuthService() 
  const actionService = new ActionService(appService, authService)
  
  // 创建节点注册管理器
  const nodeRegistry = new NodeRegistryManager()
  
  // 创建FlowEngine实例 - 注意参数顺序：actionService, nodeRegistry
  const flowEngine = new FlowEngine(actionService, nodeRegistry)
  
  // 测试1: 获取支持的节点类型
  console.log('\n🎯 测试1: 获取支持的节点类型')
  const supportedTypes = flowEngine.getSupportedNodeTypes()
  console.log('支持的节点类型:', supportedTypes)
  console.log('节点类型数量:', supportedTypes.length)
  
  // 验证关键节点类型是否都存在
  const expectedTypes = ['start', 'end', 'agent', 'agentLLM', 'agentMemory', 'agentTools', 'switch', 'tryCatch', 'case', 'caseDefault']
  const missingTypes = expectedTypes.filter(type => !supportedTypes.includes(type))
  if (missingTypes.length > 0) {
    console.log('❌ 缺少的节点类型:', missingTypes)
  } else {
    console.log('✅ 所有关键节点类型都已注册')
  }
  
  // 测试2: 获取注册器统计信息
  console.log('\n📊 测试2: 获取注册器统计信息')
  const stats = flowEngine.getRegistryStats()
  console.log('注册器统计:', stats)
  
  // 测试3: 验证流程文档
  console.log('\n📝 测试3: 验证流程文档')
  const validation = flowEngine.validateFlowDocument(demoFlowData)
  console.log('验证结果:', validation)
  
  // 测试4: 执行流程
  console.log('\n🚀 测试4: 执行demo流程')
  try {
    const result = await flowEngine.executeFlow(demoFlowData, { userInput: '你好' })
    console.log('✅ 流程执行成功')
    console.log('执行结果:', JSON.stringify(result, null, 2))
    return result
  } catch (error) {
    console.log('❌ 流程执行失败:', error)
    throw error
  }
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testFlowEngine().catch(console.error)
}
