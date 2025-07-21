import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * IfBlock节点执行器
 * 用于If语句中的条件分支
 */
export class IfBlockNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'ifBlock'

  async execute(
    node: FlowNode, 
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    try {
      const blockTitle = node.data?.title || 'ifBlock'
      const isTrue = blockTitle === 'true'
      const isFalse = blockTitle === 'false'

      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `执行IfBlock节点: ${blockTitle}`,
        data: { nodeId: node.id, blockTitle, isTrue, isFalse }
      })

      // 执行ifBlock中的子节点
      const childResults = []
      if (node.blocks && node.blocks.length > 0) {
        for (const childNode of node.blocks) {
          childResults.push({
            nodeId: childNode.id,
            type: childNode.type,
            executed: true
          })
        }
      }

      const result = {
        blockType: blockTitle,
        isTrue,
        isFalse,
        childResults,
        executed: true
      }

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
      const errorMessage = error instanceof Error ? error.message : 'IfBlock执行失败'
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

  validate(node: FlowNode): { valid: boolean; errors: string[]; warnings: string[] } {
    return super.validate(node)
  }
}

/**
 * TryBlock节点执行器
 * 用于TryCatch语句中的try分支
 */
export class TryBlockNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'tryBlock'

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
        message: `执行TryBlock节点`,
        data: { nodeId: node.id }
      })

      // 执行tryBlock中的子节点
      const childResults = []
      if (node.blocks && node.blocks.length > 0) {
        for (const childNode of node.blocks) {
          childResults.push({
            nodeId: childNode.id,
            type: childNode.type,
            executed: true
          })
        }
      }

      const result = {
        blockType: 'try',
        childResults,
        executed: true
      }

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
      const errorMessage = error instanceof Error ? error.message : 'TryBlock执行失败'
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

  validate(node: FlowNode): { valid: boolean; errors: string[]; warnings: string[] } {
    return super.validate(node)
  }
}

/**
 * CatchBlock节点执行器
 * 用于TryCatch语句中的catch分支
 */
export class CatchBlockNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'catchBlock'

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
        message: `执行CatchBlock节点`,
        data: { nodeId: node.id }
      })

      // 执行catchBlock中的子节点
      const childResults = []
      if (node.blocks && node.blocks.length > 0) {
        for (const childNode of node.blocks) {
          childResults.push({
            nodeId: childNode.id,
            type: childNode.type,
            executed: true
          })
        }
      }

      const result = {
        blockType: 'catch',
        childResults,
        errorHandled: true,
        executed: true
      }

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
      const errorMessage = error instanceof Error ? error.message : 'CatchBlock执行失败'
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

  validate(node: FlowNode): { valid: boolean; errors: string[]; warnings: string[] } {
    return super.validate(node)
  }
}

/**
 * BreakLoop节点执行器
 * 用于跳出循环
 */
export class BreakLoopNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'breakLoop'

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
        message: `执行BreakLoop节点`,
        data: { nodeId: node.id }
      })

      // 设置循环中断标志
      context.variables.__break_loop__ = true

      const result = {
        action: 'break',
        executed: true
      }

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
      const errorMessage = error instanceof Error ? error.message : 'BreakLoop执行失败'
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

  validate(node: FlowNode): { valid: boolean; errors: string[]; warnings: string[] } {
    return super.validate(node)
  }
}
