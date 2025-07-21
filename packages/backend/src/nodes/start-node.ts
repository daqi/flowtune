import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * 开始节点执行器
 */
export class StartNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'start'

  async execute(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    this.log(logs, 'info', '执行起始节点', { nodeId: node.id })

    // 起始节点的outputs定义了初始变量
    if (node.data?.outputs?.properties) {
      for (const [key, prop] of Object.entries(node.data.outputs.properties)) {
        if (prop.default !== undefined) {
          context.variables[key] = prop.default
        }
      }
    }

    const result = {
      success: true,
      message: '流程开始',
      variables: context.variables
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

    // 开始节点通常应该有子节点
    if (!node.blocks || node.blocks.length === 0) {
      warnings.push('开始节点建议连接后续节点')
    }

    return { errors, warnings }
  }
}
