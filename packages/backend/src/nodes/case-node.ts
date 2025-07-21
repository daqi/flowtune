import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * Case节点执行器
 * 用于Switch语句中的分支判断
 */
export class CaseNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'case'

  async execute(
    node: FlowNode, 
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    try {
      const caseConfig = node.data?.inputsValues || {}
      const condition = caseConfig.condition?.content
      const value = caseConfig.value?.content

      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `执行Case节点`,
        data: { nodeId: node.id, condition, value }
      })

      // Case节点通常由Switch节点调用，这里主要是标记执行
      const result = {
        caseValue: value,
        condition,
        matched: true,
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
      const errorMessage = error instanceof Error ? error.message : 'Case执行失败'
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
 * CaseDefault节点执行器
 * 用于Switch语句中的默认分支
 */
export class CaseDefaultNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'caseDefault'

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
        message: `执行CaseDefault节点`,
        data: { nodeId: node.id }
      })

      const result = {
        isDefault: true,
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
      const errorMessage = error instanceof Error ? error.message : 'CaseDefault执行失败'
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
