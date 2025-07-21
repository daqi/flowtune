import { FlowEngine } from '../core/flow-engine'
import { FlowDocumentJSON } from '../core/types'
import { ActionService } from '../modules/action/action.service'
import { AppService } from '../modules/app/app.service'
import { AuthService } from '../modules/auth/auth.service'

// 前端demo数据
const demoFlowData: FlowDocumentJSON = {
  nodes: [
    {
      id: 'start_0',
      type: 'start',
      blocks: [],
      data: {
        title: 'Start',
        outputs: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              default: 'Hello Flow.',
            },
            enable: {
              type: 'boolean',
              default: true,
            },
            array_obj: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  int: {
                    type: 'number',
                  },
                  str: {
                    type: 'string',
                  },
                },
              },
              default: [
                { int: 1, str: 'first' },
                { int: 2, str: 'second' },
                { int: 3, str: 'third' }
              ]
            },
          },
        },
      },
    },
    {
      id: 'llm_0',
      type: 'llm',
      blocks: [],
      data: {
        title: 'LLM',
        inputsValues: {
          modelType: {
            type: 'constant',
            content: 'gpt-3.5-turbo',
          },
          temperature: {
            type: 'constant',
            content: 0.5,
          },
          systemPrompt: {
            type: 'constant',
            content: '# Role\nYou are an AI assistant.\n',
          },
          prompt: {
            type: 'ref',
            content: ['start_0', 'query'],
          },
        },
        inputs: {
          type: 'object',
          required: ['modelType', 'temperature', 'prompt'],
          properties: {
            modelType: {
              type: 'string',
            },
            temperature: {
              type: 'number',
            },
            systemPrompt: {
              type: 'string',
            },
            prompt: {
              type: 'string',
            },
          },
        },
        outputs: {
          type: 'object',
          properties: {
            result: { type: 'string' },
          },
        },
      },
    },
    {
      id: 'loop_0',
      type: 'loop',
      data: {
        title: 'Loop',
        batchFor: {
          type: 'ref',
          content: ['start_0', 'array_obj'],
        },
      },
      blocks: [
        {
          id: 'if_0',
          type: 'if',
          data: {
            title: 'If',
            inputsValues: {
              condition: { 
                type: 'constant', 
                content: true 
              },
            },
            inputs: {
              type: 'object',
              required: ['condition'],
              properties: {
                condition: {
                  type: 'boolean',
                },
              },
            },
          },
          blocks: [
            {
              id: 'if_true',
              type: 'ifBlock',
              data: {
                title: 'true',
              },
              blocks: [],
            },
            {
              id: 'if_false',
              type: 'ifBlock',
              data: {
                title: 'false',
              },
              blocks: [
                {
                  id: 'break_0',
                  type: 'breakLoop',
                  data: {
                    title: 'BreakLoop',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'end_0',
      type: 'end',
      blocks: [],
      data: {
        title: 'End',
        outputs: {
          type: 'object',
          properties: {
            result: {
              type: 'string',
            },
          },
        },
      },
    },
  ],
}

/**
 * 测试flow engine执行
 */
export async function testFlowEngine() {
  console.log('🧪 开始测试FlowEngine...')
  
  try {
    // 初始化服务
    const appService = new AppService()
    const authService = new AuthService()
    const actionService = new ActionService(appService, authService)
    const flowEngine = new FlowEngine(actionService)

    // 执行流程
    const result = await flowEngine.executeFlow(demoFlowData, {
      customInput: 'test input'
    })

    console.log('✅ 流程执行成功!')
    console.log('执行结果:', JSON.stringify(result, null, 2))

    // 验证结果
    if (result.success) {
      console.log('🎉 测试通过 - 流程成功执行')
      console.log('执行时间:', result.executionTime + 'ms')
      console.log('最终变量:', result.finalVariables)
      
      if (result.logs) {
        console.log('执行日志:')
        result.logs.forEach(log => {
          console.log(`[${log.level.toUpperCase()}] ${log.message}`)
        })
      }
    } else {
      console.log('❌ 测试失败 - 流程执行出错')
      console.log('错误信息:', result.error)
    }

    return result

  } catch (error) {
    console.error('💥 测试异常:', error)
    throw error
  }
}

/**
 * 导出用于其他地方调用的测试数据
 */
export { demoFlowData }
