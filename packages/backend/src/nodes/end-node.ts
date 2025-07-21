import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * 结束节点执行器
 */
export class EndNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'end'

  async execute(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    this.log(logs, 'info', '执行结束节点', { nodeId: node.id })

    // 收集最终输出
    const outputs: Record<string, any> = {}
    if (node.data?.outputs?.properties) {
      for (const [key, prop] of Object.entries(node.data.outputs.properties)) {
        outputs[key] = context.variables[key] || prop.default
      }
    }

    const result = {
      success: true,
      message: '流程结束',
      outputs,
      finalVariables: context.variables
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

    // 结束节点不应该有子节点
    if (node.blocks && node.blocks.length > 0) {
      warnings.push('结束节点不应该有子节点')
    }

    return { errors, warnings }
  }
}
