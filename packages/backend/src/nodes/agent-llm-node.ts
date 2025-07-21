import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * AgentLLM节点执行器
 * 用于执行Agent中的LLM组件
 */
export class AgentLLMNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'agentLLM'

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
        message: `执行AgentLLM节点`,
        data: { nodeId: node.id }
      })

      // 执行AgentLLM中的子节点（通常是LLM节点）
      const results = []
      if (node.blocks && node.blocks.length > 0) {
        for (const childNode of node.blocks) {
          if (childNode.type === 'llm') {
            // 执行LLM子节点
            const llmResult = await this.executeLLMChild(childNode, context, logs)
            results.push(llmResult)
          }
        }
      }

      const result = {
        type: 'agentLLM',
        childResults: results,
        agentLLMCompleted: true
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
        message: `AgentLLM节点执行完成`,
        data: { nodeId: node.id, results }
      })

      return executionResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AgentLLM执行失败'
      logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `AgentLLM节点执行失败: ${errorMessage}`,
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
   * 执行LLM子节点
   */
  private async executeLLMChild(
    llmNode: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    // 获取LLM配置
    const llmConfig = llmNode.data?.inputsValues || {}
    const modelType = llmConfig.modelType?.content || 'gpt-3.5-turbo'
    const temperature = llmConfig.temperature?.content || 0.5
    const systemPrompt = llmConfig.systemPrompt?.content || ''
    const prompt = llmConfig.prompt?.content || ''

    logs.push({
      timestamp: new Date(),
      level: 'info',
      message: `AgentLLM中执行LLM子节点`,
      data: { 
        nodeId: llmNode.id, 
        modelType, 
        temperature,
        promptLength: prompt.length 
      }
    })

    // 模拟LLM调用
    // 在实际实现中，这里会调用真实的LLM API
    const response = await this.simulateLLMCall(modelType, systemPrompt, prompt, temperature)

    return {
      nodeId: llmNode.id,
      type: 'llm',
      modelType,
      temperature,
      response,
      executed: true
    }
  }

  /**
   * 模拟LLM调用
   */
  private async simulateLLMCall(
    modelType: string,
    systemPrompt: string,
    prompt: string,
    temperature: number
  ): Promise<string> {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return `AgentLLM模拟回复 (模型: ${modelType}, 温度: ${temperature}): 基于系统提示 "${systemPrompt}" 和用户提示 "${prompt}" 的智能回复`
  }

  validate(node: FlowNode): { valid: boolean; errors: string[]; warnings: string[] } {
    const result = super.validate(node)

    // 检查是否包含LLM子节点
    const hasLLMChild = node.blocks?.some(block => block.type === 'llm')
    if (!hasLLMChild) {
      result.warnings.push('AgentLLM节点建议包含至少一个LLM子节点')
    }

    // 验证LLM子节点的配置
    if (node.blocks) {
      for (const childNode of node.blocks) {
        if (childNode.type === 'llm') {
          const llmConfig = childNode.data?.inputsValues || {}
          if (!llmConfig.prompt?.content) {
            result.warnings.push(`LLM子节点 ${childNode.id} 建议设置提示词`)
          }
        }
      }
    }

    return result
  }
}
