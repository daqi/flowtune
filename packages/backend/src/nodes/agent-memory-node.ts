import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * AgentMemory节点执行器
 * 用于执行Agent中的记忆组件
 */
export class AgentMemoryNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'agentMemory'

  async execute(
    node: FlowNode, 
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    try {
      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `执行AgentMemory节点`,
        data: { nodeId: node.id }
      })

      // 执行AgentMemory中的子节点（通常是Memory节点）
      const results = []
      if (node.blocks && node.blocks.length > 0) {
        for (const childNode of node.blocks) {
          if (childNode.type === 'memory') {
            // 执行Memory子节点
            const memoryResult = await this.executeMemoryChild(childNode, context, logs)
            results.push(memoryResult)
          }
        }
      }

      // 更新上下文中的记忆数据
      if (!context.variables.__agentMemory__) {
        context.variables.__agentMemory__ = {}
      }

      const memoryData = {
        sessionId: context.executionId,
        memories: results,
        lastUpdated: new Date().toISOString()
      }

      context.variables.__agentMemory__ = memoryData

      const result = {
        type: 'agentMemory',
        memoryData,
        childResults: results,
        agentMemoryCompleted: true
      }

      // 保存执行结果
      const executionResult: NodeExecutionResult = {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        nodeType: this.nodeType
      }

      context.nodeResults.set(node.id, executionResult)
      
      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `AgentMemory节点执行完成`,
        data: { nodeId: node.id, memoryCount: results.length }
      })

      return executionResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AgentMemory执行失败'
      logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `AgentMemory节点执行失败: ${errorMessage}`,
        data: { nodeId: node.id, error }
      })

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

  /**
   * 执行Memory子节点
   */
  private async executeMemoryChild(
    memoryNode: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    logs.push({
      timestamp: new Date(),
      level: 'info',
      message: `AgentMemory中执行Memory子节点`,
      data: { nodeId: memoryNode.id }
    })

    // 模拟记忆操作
    const memoryOperation = await this.simulateMemoryOperation(memoryNode, context)

    return {
      nodeId: memoryNode.id,
      type: 'memory',
      operation: memoryOperation,
      executed: true
    }
  }

  /**
   * 模拟记忆操作
   */
  private async simulateMemoryOperation(
    memoryNode: FlowNode,
    context: FlowExecutionContext
  ): Promise<any> {
    // 模拟记忆存储和检索
    const memoryType = memoryNode.data?.memoryType || 'conversation'
    const currentMemories = context.variables.__agentMemory__?.memories || []

    switch (memoryType) {
      case 'conversation':
        return this.handleConversationMemory(context)
      case 'facts':
        return this.handleFactsMemory(context)
      case 'context':
        return this.handleContextMemory(context)
      default:
        return this.handleDefaultMemory(context)
    }
  }

  private handleConversationMemory(context: FlowExecutionContext): any {
    return {
      type: 'conversation',
      action: 'store',
      data: {
        userInput: context.variables.userInput || '',
        timestamp: new Date().toISOString(),
        context: 'Agent conversation memory'
      }
    }
  }

  private handleFactsMemory(context: FlowExecutionContext): any {
    return {
      type: 'facts',
      action: 'retrieve',
      data: {
        retrievedFacts: ['事实1', '事实2', '事实3'],
        relevanceScore: 0.85,
        context: 'Agent facts memory'
      }
    }
  }

  private handleContextMemory(context: FlowExecutionContext): any {
    return {
      type: 'context',
      action: 'update',
      data: {
        contextWindow: Object.keys(context.variables),
        contextSize: JSON.stringify(context.variables).length,
        context: 'Agent context memory'
      }
    }
  }

  private handleDefaultMemory(context: FlowExecutionContext): any {
    return {
      type: 'default',
      action: 'generic',
      data: {
        message: '默认记忆操作',
        variables: Object.keys(context.variables),
        context: 'Agent default memory'
      }
    }
  }

  validate(node: FlowNode): { valid: boolean; errors: string[]; warnings: string[] } {
    const result = super.validate(node)

    // 检查是否包含Memory子节点
    const hasMemoryChild = node.blocks?.some(block => block.type === 'memory')
    if (!hasMemoryChild) {
      result.warnings.push('AgentMemory节点建议包含至少一个Memory子节点')
    }

    return result
  }
}
