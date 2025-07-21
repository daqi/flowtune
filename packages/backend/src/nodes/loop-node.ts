import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * Loop循环节点执行器
 */
export class LoopNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'loop'

  async execute(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    this.log(logs, 'info', '执行Loop节点', { nodeId: node.id })

    const batchFor = node.data?.batchFor
    if (!batchFor) {
      throw new Error('Loop节点缺少batchFor配置')
    }

    const items = this.resolveInputValue(batchFor, context.variables)
    if (!Array.isArray(items)) {
      throw new Error('Loop节点的batchFor必须是数组')
    }

    const results: any[] = []
    const loopContext = {
      nodeId: node.id,
      items,
      currentIndex: 0,
      currentItem: null,
      variables: { ...context.variables }
    }

    context.loopStack.push(loopContext)

    try {
      for (let i = 0; i < items.length; i++) {
        loopContext.currentIndex = i
        loopContext.currentItem = items[i]
        
        // 设置循环变量
        context.variables.__loop_index = i
        context.variables.__loop_item = items[i]

        this.log(logs, 'debug', `Loop迭代 ${i + 1}/${items.length}`, { item: items[i] })

        // 执行循环体需要外部处理
        // 这里只记录当前循环状态
        results.push({
          index: i,
          item: items[i],
          timestamp: new Date()
        })
      }
    } finally {
      context.loopStack.pop()
      // 清理循环变量
      delete context.variables.__loop_index
      delete context.variables.__loop_item
    }

    const result = {
      success: true,
      iterations: results.length,
      totalItems: items.length,
      results
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

    // 检查batchFor配置
    if (!node.data?.batchFor) {
      errors.push('Loop节点缺少batchFor配置')
    }

    // 检查是否有循环体
    if (!node.blocks || node.blocks.length === 0) {
      warnings.push('Loop节点建议有循环体')
    }

    return { errors, warnings }
  }
}
