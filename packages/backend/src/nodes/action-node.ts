import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * Action操作节点执行器
 */
export class ActionNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'action'

  async execute(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    this.log(logs, 'info', '执行Action节点', { nodeId: node.id })

    const inputValues = node.data?.inputsValues || {}
    const parameters: Record<string, any> = {}

    // 解析输入参数
    for (const [key, inputValue] of Object.entries(inputValues)) {
      parameters[key] = this.resolveInputValue(inputValue, context.variables)
    }

    this.log(logs, 'debug', 'Action参数', { parameters })

    // TODO: 这里应该通过ActionService执行实际的API调用
    const result = {
      success: true,
      message: 'Action节点执行完成',
      data: { result: 'action_result' },
      parameters
    }

    return {
      success: true,
      data: result,
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
      nodeType: this.nodeType
    }
  }

  protected validateNode(node: FlowNode): { errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查是否配置了actionId
    if (!node.data?.actionId) {
      errors.push('Action节点必须配置actionId')
    }

    return { errors, warnings }
  }
}
