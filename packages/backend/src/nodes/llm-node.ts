import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * LLM节点执行器
 */
export class LLMNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'llm'

  async execute(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    this.log(logs, 'info', '执行LLM节点', { nodeId: node.id })

    const inputValues = node.data?.inputsValues || {}
    const parameters: Record<string, any> = {}

    // 解析输入参数
    for (const [key, inputValue] of Object.entries(inputValues)) {
      parameters[key] = this.resolveInputValue(inputValue, context.variables)
    }

    this.log(logs, 'debug', 'LLM参数', { parameters })

    // 模拟LLM调用
    const prompt = parameters.prompt || ''
    const systemPrompt = parameters.systemPrompt || ''
    const modelType = parameters.modelType || 'gpt-3.5-turbo'
    const temperature = parameters.temperature || 0.5

    // TODO: 这里应该调用实际的LLM API
    const result = `LLM回复 (${modelType}): 基于提示 "${prompt}" 生成的回复`

    // 更新变量
    context.variables.llm_result = result

    const executionResult = {
      success: true,
      result,
      parameters,
      model: modelType
    }

    return {
      success: true,
      data: executionResult,
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
      nodeType: this.nodeType
    }
  }

  protected validateNode(node: FlowNode): { errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    const inputValues = node.data?.inputsValues || {}
    
    // 检查必需的prompt参数
    if (!inputValues.prompt) {
      warnings.push('LLM节点建议设置prompt参数')
    }

    // 检查模型类型
    if (inputValues.modelType && typeof inputValues.modelType !== 'string') {
      errors.push('modelType参数必须是字符串')
    }

    // 检查temperature参数
    if (inputValues.temperature) {
      const temp = inputValues.temperature
      if (typeof temp === 'number' && (temp < 0 || temp > 2)) {
        warnings.push('temperature参数建议在0-2之间')
      }
    }

    return { errors, warnings }
  }
}
