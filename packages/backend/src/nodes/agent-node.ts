import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'
import { NodeRelationshipManager } from '../core/node-relationships'

/**
 * Agent节点执行器
 * 用于执行Agent智能体相关的任务，统一协调agentLLM、agentMemory、agentTools
 */
export class AgentNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'agent'

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
        message: `执行Agent节点`,
        data: { nodeId: node.id }
      })

      // 按照Agent的标准执行顺序：LLM -> Memory -> Tools
      const executionOrder = NodeRelationshipManager.getExecutionOrder(node)
      const agentResults = {
        llm: null as any,
        memory: null as any,
        tools: null as any
      }

      // 创建Agent专用的执行上下文
      const agentContext = {
        ...context,
        variables: {
          ...context.variables,
          __agent__: {
            id: node.id,
            phase: 'initializing'
          }
        }
      }

      // 按顺序执行Agent组件
      for (const childNode of executionOrder) {
        logs.push({
          timestamp: new Date(),
          level: 'info',
          message: `Agent执行组件: ${childNode.type}`,
          data: { nodeId: childNode.id, agentNodeId: node.id }
        })

        agentContext.variables.__agent__.phase = childNode.type

        const componentResult = await this.executeAgentComponent(childNode, agentContext, logs)
        
        // 保存组件结果到Agent结果中
        switch (childNode.type) {
          case 'agentLLM':
            agentResults.llm = componentResult
            break
          case 'agentMemory':
            agentResults.memory = componentResult
            break
          case 'agentTools':
            agentResults.tools = componentResult
            break
        }
      }

      // 整合Agent的最终结果
      const finalResult = this.integrateAgentResults(agentResults, agentContext)

      // 保存执行结果
      const executionResult: NodeExecutionResult = {
        success: true,
        data: finalResult,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        nodeType: this.nodeType
      }

      context.nodeResults.set(node.id, executionResult)
      
      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `Agent节点执行完成`,
        data: { nodeId: node.id, finalResult }
      })

      return executionResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Agent执行失败'
      logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Agent节点执行失败: ${errorMessage}`,
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
   * 执行Agent组件
   */
  private async executeAgentComponent(
    componentNode: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    // 模拟执行Agent组件
    // 在实际实现中，这里会调用具体的组件执行器
    switch (componentNode.type) {
      case 'agentLLM':
        return this.executeAgentLLM(componentNode, context, logs)
      case 'agentMemory':
        return this.executeAgentMemory(componentNode, context, logs)
      case 'agentTools':
        return this.executeAgentTools(componentNode, context, logs)
      default:
        return { type: componentNode.type, executed: true }
    }
  }

  /**
   * 执行AgentLLM组件
   */
  private async executeAgentLLM(
    llmNode: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    // 执行LLM子节点
    const llmResults = []
    if (llmNode.blocks) {
      for (const child of llmNode.blocks) {
        if (child.type === 'llm') {
          llmResults.push({
            nodeId: child.id,
            type: 'llm',
            response: `Agent LLM回复 (基于Agent上下文)`,
            executed: true
          })
        }
      }
    }
    
    return {
      type: 'agentLLM',
      llmResults,
      agentContext: context.variables.__agent__
    }
  }

  /**
   * 执行AgentMemory组件
   */
  private async executeAgentMemory(
    memoryNode: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    return {
      type: 'agentMemory',
      memories: ['Agent记忆1', 'Agent记忆2'],
      agentContext: context.variables.__agent__
    }
  }

  /**
   * 执行AgentTools组件
   */
  private async executeAgentTools(
    toolsNode: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    const toolResults = []
    if (toolsNode.blocks) {
      for (const child of toolsNode.blocks) {
        if (child.type === 'tool') {
          toolResults.push({
            nodeId: child.id,
            toolName: child.data?.title || 'unnamed_tool',
            result: `工具执行结果 (Agent环境)`,
            executed: true
          })
        }
      }
    }
    
    return {
      type: 'agentTools',
      toolResults,
      agentContext: context.variables.__agent__
    }
  }

  /**
   * 整合Agent结果
   */
  private integrateAgentResults(agentResults: any, context: FlowExecutionContext): any {
    return {
      type: 'agent',
      components: {
        llm: agentResults.llm,
        memory: agentResults.memory,
        tools: agentResults.tools
      },
      finalResponse: this.generateAgentResponse(agentResults, context),
      agentContext: context.variables.__agent__
    }
  }

  /**
   * 生成Agent最终回复
   */
  private generateAgentResponse(agentResults: any, context: FlowExecutionContext): string {
    const userInput = context.variables.userInput || '用户输入'
    
    // 整合LLM、记忆和工具的结果
    let response = `基于用户输入"${userInput}"，Agent已处理完成。`
    
    if (agentResults.llm) {
      response += ` LLM组件已响应。`
    }
    
    if (agentResults.memory) {
      response += ` 记忆组件已更新。`
    }
    
    if (agentResults.tools) {
      response += ` 工具组件已执行。`
    }
    
    return response
  }

  validate(node: FlowNode, allNodes?: FlowNode[]): { valid: boolean; errors: string[]; warnings: string[] } {
    const result = super.validate(node, allNodes)

    // Agent特定验证
    if (!node.blocks || node.blocks.length === 0) {
      result.errors.push('Agent节点必须包含至少一个组件 (agentLLM, agentMemory, agentTools)')
    }

    // 检查必需的组件
    const hasLLM = node.blocks?.some(block => block.type === 'agentLLM')
    if (!hasLLM) {
      result.errors.push('Agent节点必须包含agentLLM组件')
    }

    // 检查组件配置
    if (node.blocks) {
      for (const component of node.blocks) {
        if (component.type === 'agentLLM' && (!component.blocks || component.blocks.length === 0)) {
          result.warnings.push('agentLLM组件建议包含LLM子节点')
        }
        if (component.type === 'agentMemory' && (!component.blocks || component.blocks.length === 0)) {
          result.warnings.push('agentMemory组件建议包含Memory子节点')
        }
        if (component.type === 'agentTools' && (!component.blocks || component.blocks.length === 0)) {
          result.warnings.push('agentTools组件建议包含Tool子节点')
        }
      }
    }

    return result
  }
}
