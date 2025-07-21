import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * If条件节点执行器
 */
export class IfNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'if'

  async execute(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    this.log(logs, 'info', '执行If节点', { nodeId: node.id })

    const condition = this.evaluateCondition(node, context.variables)
    this.log(logs, 'debug', `If条件结果: ${condition}`)

    if (!node.blocks) {
      return {
        success: true,
        data: { condition },
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        nodeType: this.nodeType
      }
    }

    // 查找true和false分支
    const trueBranch = node.blocks.find(block => block.data?.title === 'true')
    const falseBranch = node.blocks.find(block => block.data?.title === 'false')

    let executedBranch = 'none'
    
    if (condition && trueBranch) {
      this.log(logs, 'info', '执行true分支')
      // 这里需要外部调用来执行子节点
      executedBranch = 'true'
    } else if (!condition && falseBranch) {
      this.log(logs, 'info', '执行false分支')
      // 这里需要外部调用来执行子节点
      executedBranch = 'false'
    }

    const result = {
      success: true,
      condition,
      branch: executedBranch
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

    const inputValues = node.data?.inputsValues
    
    // 检查条件参数
    if (!inputValues?.condition) {
      warnings.push('If节点建议设置condition参数')
    }

    // 检查分支
    if (node.blocks) {
      const trueBranch = node.blocks.find(block => block.data?.title === 'true')
      const falseBranch = node.blocks.find(block => block.data?.title === 'false')
      
      if (!trueBranch && !falseBranch) {
        warnings.push('If节点建议至少有一个分支')
      }
    }

    return { errors, warnings }
  }
}
