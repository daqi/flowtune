import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * AgentTools节点执行器
 * 用于执行Agent中的工具组件
 */
export class AgentToolsNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'agentTools'

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
        message: `执行AgentTools节点`,
        data: { nodeId: node.id }
      })

      // 执行AgentTools中的子节点（通常是Tool节点）
      const results = []
      const availableTools = []

      if (node.blocks && node.blocks.length > 0) {
        for (const childNode of node.blocks) {
          if (childNode.type === 'tool') {
            // 执行Tool子节点
            const toolResult = await this.executeToolChild(childNode, context, logs)
            results.push(toolResult)
            availableTools.push(toolResult.toolName)
          }
        }
      }

      // 更新上下文中的工具数据
      if (!context.variables.__agentTools__) {
        context.variables.__agentTools__ = {}
      }

      const toolsData = {
        availableTools,
        toolResults: results,
        lastExecuted: new Date().toISOString()
      }

      context.variables.__agentTools__ = toolsData

      const result = {
        type: 'agentTools',
        toolsData,
        childResults: results,
        agentToolsCompleted: true
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
        message: `AgentTools节点执行完成`,
        data: { nodeId: node.id, toolCount: results.length, availableTools }
      })

      return executionResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AgentTools执行失败'
      logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `AgentTools节点执行失败: ${errorMessage}`,
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
   * 执行Tool子节点
   */
  private async executeToolChild(
    toolNode: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    const toolName = toolNode.data?.title || `tool_${toolNode.id}`
    const toolType = toolNode.data?.toolType || 'generic'

    logs.push({
      timestamp: new Date(),
      level: 'info',
      message: `AgentTools中执行Tool子节点: ${toolName}`,
      data: { nodeId: toolNode.id, toolName, toolType }
    })

    // 模拟工具调用
    const toolResult = await this.simulateToolCall(toolNode, toolName, toolType, context)

    return {
      nodeId: toolNode.id,
      type: 'tool',
      toolName,
      toolType,
      result: toolResult,
      executed: true
    }
  }

  /**
   * 模拟工具调用
   */
  private async simulateToolCall(
    toolNode: FlowNode,
    toolName: string,
    toolType: string,
    context: FlowExecutionContext
  ): Promise<any> {
    // 模拟工具调用延迟
    await new Promise(resolve => setTimeout(resolve, 50))

    switch (toolType) {
      case 'search':
        return this.simulateSearchTool(toolName, context)
      case 'calculation':
        return this.simulateCalculationTool(toolName, context)
      case 'api':
        return this.simulateAPITool(toolName, context)
      case 'database':
        return this.simulateDatabaseTool(toolName, context)
      default:
        return this.simulateGenericTool(toolName, context)
    }
  }

  private simulateSearchTool(toolName: string, context: FlowExecutionContext): any {
    return {
      toolType: 'search',
      action: 'search',
      query: context.variables.userInput || 'default query',
      results: [
        { title: '搜索结果1', url: 'https://example.com/1', summary: '相关内容摘要1' },
        { title: '搜索结果2', url: 'https://example.com/2', summary: '相关内容摘要2' }
      ],
      timestamp: new Date().toISOString()
    }
  }

  private simulateCalculationTool(toolName: string, context: FlowExecutionContext): any {
    return {
      toolType: 'calculation',
      action: 'calculate',
      expression: '2 + 2',
      result: 4,
      message: '计算完成',
      timestamp: new Date().toISOString()
    }
  }

  private simulateAPITool(toolName: string, context: FlowExecutionContext): any {
    return {
      toolType: 'api',
      action: 'api_call',
      endpoint: 'https://api.example.com/data',
      method: 'GET',
      response: {
        status: 'success',
        data: { message: 'API调用成功', value: 'mock_data' }
      },
      timestamp: new Date().toISOString()
    }
  }

  private simulateDatabaseTool(toolName: string, context: FlowExecutionContext): any {
    return {
      toolType: 'database',
      action: 'query',
      query: 'SELECT * FROM users WHERE active = true',
      results: [
        { id: 1, name: '用户1', active: true },
        { id: 2, name: '用户2', active: true }
      ],
      timestamp: new Date().toISOString()
    }
  }

  private simulateGenericTool(toolName: string, context: FlowExecutionContext): any {
    return {
      toolType: 'generic',
      action: 'execute',
      message: `工具 ${toolName} 执行完成`,
      context: Object.keys(context.variables),
      timestamp: new Date().toISOString()
    }
  }

  validate(node: FlowNode): { valid: boolean; errors: string[]; warnings: string[] } {
    const result = super.validate(node)

    // 检查是否包含Tool子节点
    const hasToolChild = node.blocks?.some(block => block.type === 'tool')
    if (!hasToolChild) {
      result.warnings.push('AgentTools节点建议包含至少一个Tool子节点')
    }

    // 验证Tool子节点的配置
    if (node.blocks) {
      for (const childNode of node.blocks) {
        if (childNode.type === 'tool') {
          if (!childNode.data?.title) {
            result.warnings.push(`Tool子节点 ${childNode.id} 建议设置标题`)
          }
        }
      }
    }

    return result
  }
}
