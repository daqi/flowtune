import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * Tool节点执行器
 * 用于执行各种工具调用
 */
export class ToolNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'tool'

  async execute(
    node: FlowNode, 
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    try {
      const toolConfig = node.data?.inputsValues || {}
      const toolName = node.data?.title || `tool_${node.id}`
      const toolType = toolConfig.toolType?.content || 'generic'
      const parameters = toolConfig.parameters?.content || {}

      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `执行Tool节点: ${toolName}`,
        data: { nodeId: node.id, toolName, toolType, parameters }
      })

      const result = await this.executeTool(toolName, toolType, parameters, context)

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
      const errorMessage = error instanceof Error ? error.message : 'Tool执行失败'
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

  private async executeTool(toolName: string, toolType: string, parameters: any, context: FlowExecutionContext): Promise<any> {
    return { 
      toolName, 
      toolType, 
      parameters,
      result: `${toolName} 执行完成`,
      timestamp: new Date().toISOString() 
    }
  }

  validate(node: FlowNode): { valid: boolean; errors: string[]; warnings: string[] } {
    return super.validate(node)
  }
}
