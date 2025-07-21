import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * Memory节点执行器
 * 用于记忆存储和检索操作
 */
export class MemoryNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'memory'

  async execute(
    node: FlowNode, 
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    try {
      const memoryConfig = node.data?.inputsValues || {}
      const operation = memoryConfig.operation?.content || 'store'
      const memoryType = memoryConfig.memoryType?.content || 'conversation'

      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `执行Memory节点: ${operation}`,
        data: { nodeId: node.id, operation, memoryType }
      })

      const result = await this.executeMemoryOperation(operation, memoryType, context)

      const executionResult: NodeExecutionResult = {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        nodeType: this.nodeType
      }

      context.nodeResults.set(node.id, executionResult)
      return executionResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Memory操作失败'
      const executionResult: NodeExecutionResult = {
        success: false,
        error: errorMessage,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        nodeType: this.nodeType
      }

      context.nodeResults.set(node.id, executionResult)
      return executionResult
    }
  }

  private async executeMemoryOperation(operation: string, memoryType: string, context: FlowExecutionContext): Promise<any> {
    return { operation, memoryType, timestamp: new Date().toISOString() }
  }

  validate(node: FlowNode): { valid: boolean; errors: string[]; warnings: string[] } {
    return super.validate(node)
  }
}
