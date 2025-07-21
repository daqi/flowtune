import { 
  FlowDocumentJSON, 
  FlowNode, 
  FlowExecutionResult, 
  FlowExecutionContext,
  NodeExecutionResult,
  NodeType,
  InputValue,
  LoopContext,
  ExecutionLog
} from '../core/types'
import { ActionService } from '../modules/action/action.service'
import crypto from 'crypto'

export class FlowEngine {
  constructor(private actionService: ActionService) {}

  /**
   * 执行流程
   */
  async executeFlow(
    flowDocument: FlowDocumentJSON, 
    inputData: Record<string, any> = {}
  ): Promise<FlowExecutionResult> {
    const executionId = crypto.randomUUID()
    const startTime = Date.now()
    const logs: ExecutionLog[] = []
    
    const executionContext: FlowExecutionContext = {
      executionId,
      flowId: executionId, // 使用executionId作为flowId
      variables: { ...flowDocument.variables, ...inputData },
      nodeResults: new Map(),
      currentNode: null,
      status: 'running',
      loopStack: [],
      conditionStack: []
    }

    this.log(logs, 'info', '流程开始执行', { executionId, inputData })

    try {
      // 查找起始节点
      const startNodes = this.findStartNodes(flowDocument.nodes)
      if (startNodes.length === 0) {
        throw new Error('未找到起始节点 (start)')
      }

      this.log(logs, 'info', `找到 ${startNodes.length} 个起始节点`)

      // 执行流程 - 按顺序执行所有根级节点
      for (const startNode of startNodes) {
        await this.executeNode(startNode, flowDocument.nodes, executionContext, logs)
      }

      executionContext.status = 'completed'
      this.log(logs, 'info', '流程执行完成')

      return {
        success: true,
        executionId,
        executionTime: Date.now() - startTime,
        results: Object.fromEntries(executionContext.nodeResults),
        finalVariables: executionContext.variables,
        logs
      }

    } catch (error) {
      executionContext.status = 'failed'
      const errorMessage = error instanceof Error ? error.message : '流程执行失败'
      this.log(logs, 'error', errorMessage, { error })

      return {
        success: false,
        executionId,
        executionTime: Date.now() - startTime,
        error: errorMessage,
        results: Object.fromEntries(executionContext.nodeResults),
        finalVariables: executionContext.variables,
        logs
      }
    }
  }

  /**
   * 执行单个节点
   */
  private async executeNode(
    node: FlowNode,
    allNodes: FlowNode[],
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    context.currentNode = node.id

    this.log(logs, 'info', `执行节点: ${node.type}`, { nodeId: node.id, title: node.data?.title })

    try {
      let result: any

      switch (node.type) {
        case 'start':
          result = await this.executeStartNode(node, context, logs)
          break
        case 'end':
          result = await this.executeEndNode(node, context, logs)
          break
        case 'llm':
          result = await this.executeLLMNode(node, context, logs)
          break
        case 'agent':
          result = await this.executeAgentNode(node, context, logs)
          break
        case 'switch':
          result = await this.executeSwitchNode(node, context, logs)
          break
        case 'loop':
          result = await this.executeLoopNode(node, context, logs)
          break
        case 'if':
          result = await this.executeIfNode(node, context, logs)
          break
        case 'tryCatch':
          result = await this.executeTryCatchNode(node, context, logs)
          break
        case 'action':
          result = await this.executeActionNode(node, context, logs)
          break
        default:
          this.log(logs, 'warn', `未实现的节点类型: ${node.type}`, { nodeId: node.id })
          result = { success: true, message: `节点 ${node.type} 跳过执行` }
      }

      const executionResult: NodeExecutionResult = {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        nodeType: node.type
      }

      context.nodeResults.set(node.id, executionResult)

      // 执行子节点
      if (node.blocks && node.blocks.length > 0) {
        for (const childNode of node.blocks) {
          await this.executeNode(childNode, allNodes, context, logs)
        }
      }

      return executionResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '节点执行失败'
      this.log(logs, 'error', `节点执行失败: ${errorMessage}`, { nodeId: node.id, error })

      const executionResult: NodeExecutionResult = {
        success: false,
        error: errorMessage,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        nodeType: node.type
      }

      context.nodeResults.set(node.id, executionResult)
      return executionResult
    }
  }

  /**
   * 执行起始节点
   */
  private async executeStartNode(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    this.log(logs, 'info', '执行起始节点', { nodeId: node.id })

    // 起始节点的outputs定义了初始变量
    if (node.data?.outputs?.properties) {
      for (const [key, prop] of Object.entries(node.data.outputs.properties)) {
        if (prop.default !== undefined) {
          context.variables[key] = prop.default
        }
      }
    }

    return {
      success: true,
      message: '流程开始',
      variables: context.variables
    }
  }

  /**
   * 执行结束节点
   */
  private async executeEndNode(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    this.log(logs, 'info', '执行结束节点', { nodeId: node.id })

    // 收集最终输出
    const outputs: Record<string, any> = {}
    if (node.data?.outputs?.properties) {
      for (const [key, prop] of Object.entries(node.data.outputs.properties)) {
        outputs[key] = context.variables[key] || prop.default
      }
    }

    return {
      success: true,
      message: '流程结束',
      outputs,
      finalVariables: context.variables
    }
  }

  /**
   * 执行LLM节点
   */
  private async executeLLMNode(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
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

    // 这里应该调用实际的LLM API
    const result = `LLM回复 (${modelType}): 基于提示 "${prompt}" 生成的回复`

    // 更新变量
    context.variables.llm_result = result

    return {
      success: true,
      result,
      parameters,
      model: modelType
    }
  }

  /**
   * 执行Agent节点
   */
  private async executeAgentNode(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    this.log(logs, 'info', '执行Agent节点', { nodeId: node.id })

    const results: Record<string, any> = {}

    // 执行Agent的各个组件
    if (node.blocks) {
      for (const block of node.blocks) {
        const blockResult = await this.executeNode(block, [], context, logs)
        results[block.type] = blockResult.data
      }
    }

    return {
      success: true,
      message: 'Agent执行完成',
      components: results
    }
  }

  /**
   * 执行Switch节点
   */
  private async executeSwitchNode(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    this.log(logs, 'info', '执行Switch节点', { nodeId: node.id })

    if (!node.blocks) {
      return { success: true, message: 'Switch节点无分支' }
    }

    // 依次检查case条件
    for (const caseBlock of node.blocks) {
      if (caseBlock.type === 'case') {
        const condition = this.evaluateCondition(caseBlock, context.variables)
        if (condition) {
          this.log(logs, 'info', `执行Case分支: ${caseBlock.data?.title}`, { caseId: caseBlock.id })
          await this.executeNode(caseBlock, [], context, logs)
          return { success: true, branch: caseBlock.id, condition: true }
        }
      }
    }

    // 执行default分支
    const defaultBlock = node.blocks.find(block => block.type === 'caseDefault')
    if (defaultBlock) {
      this.log(logs, 'info', '执行Default分支', { defaultId: defaultBlock.id })
      await this.executeNode(defaultBlock, [], context, logs)
      return { success: true, branch: defaultBlock.id, condition: false }
    }

    return { success: true, message: '无匹配的分支' }
  }

  /**
   * 执行Loop节点
   */
  private async executeLoopNode(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    this.log(logs, 'info', '执行Loop节点', { nodeId: node.id })

    const batchFor = node.data?.batchFor
    if (!batchFor) {
      throw new Error('Loop节点缺少batchFor配置')
    }

    const items = this.resolveInputValue(batchFor, context.variables)
    if (!Array.isArray(items)) {
      throw new Error('Loop节点的batchFor必须是数组')
    }

    const loopContext: LoopContext = {
      nodeId: node.id,
      items,
      currentIndex: 0,
      currentItem: null,
      variables: { ...context.variables }
    }

    context.loopStack.push(loopContext)
    const results: any[] = []

    try {
      for (let i = 0; i < items.length; i++) {
        loopContext.currentIndex = i
        loopContext.currentItem = items[i]
        
        // 设置循环变量
        context.variables.__loop_index = i
        context.variables.__loop_item = items[i]

        this.log(logs, 'debug', `Loop迭代 ${i + 1}/${items.length}`, { item: items[i] })

        // 执行循环体
        if (node.blocks) {
          for (const block of node.blocks) {
            const blockResult = await this.executeNode(block, [], context, logs)
            
            // 检查是否有break
            if (this.shouldBreakLoop(block, blockResult)) {
              this.log(logs, 'info', 'Loop中断', { index: i })
              break
            }
          }
        }

        results.push(context.variables.__loop_item)
      }
    } finally {
      context.loopStack.pop()
      // 清理循环变量
      delete context.variables.__loop_index
      delete context.variables.__loop_item
    }

    return {
      success: true,
      iterations: results.length,
      totalItems: items.length,
      results
    }
  }

  /**
   * 执行If节点
   */
  private async executeIfNode(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    this.log(logs, 'info', '执行If节点', { nodeId: node.id })

    const condition = this.evaluateCondition(node, context.variables)
    this.log(logs, 'debug', `If条件结果: ${condition}`)

    if (!node.blocks) {
      return { success: true, condition }
    }

    // 查找true和false分支
    const trueBranch = node.blocks.find(block => block.data?.title === 'true')
    const falseBranch = node.blocks.find(block => block.data?.title === 'false')

    if (condition && trueBranch) {
      this.log(logs, 'info', '执行true分支')
      await this.executeNode(trueBranch, [], context, logs)
      return { success: true, condition: true, branch: 'true' }
    } else if (!condition && falseBranch) {
      this.log(logs, 'info', '执行false分支')
      await this.executeNode(falseBranch, [], context, logs)
      return { success: true, condition: false, branch: 'false' }
    }

    return { success: true, condition, branch: 'none' }
  }

  /**
   * 执行TryCatch节点
   */
  private async executeTryCatchNode(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    this.log(logs, 'info', '执行TryCatch节点', { nodeId: node.id })

    if (!node.blocks) {
      return { success: true, message: 'TryCatch节点无子块' }
    }

    const tryBlock = node.blocks.find(block => block.type === 'tryBlock')
    const catchBlocks = node.blocks.filter(block => block.type === 'catchBlock')

    if (!tryBlock) {
      throw new Error('TryCatch节点缺少tryBlock')
    }

    try {
      this.log(logs, 'info', '执行try块')
      await this.executeNode(tryBlock, [], context, logs)
      return { success: true, executed: 'try', error: null }
    } catch (error) {
      this.log(logs, 'warn', 'try块执行失败，尝试catch块', { error })

      // 尝试执行catch块
      for (const catchBlock of catchBlocks) {
        try {
          const condition = this.evaluateCondition(catchBlock, { ...context.variables, error })
          if (condition) {
            this.log(logs, 'info', `执行catch块: ${catchBlock.data?.title}`)
            await this.executeNode(catchBlock, [], context, logs)
            return { success: true, executed: 'catch', catchBlock: catchBlock.id, error }
          }
        } catch (catchError) {
          this.log(logs, 'error', 'catch块执行也失败', { catchError })
        }
      }

      // 所有catch块都失败，重新抛出错误
      throw error
    }
  }

  /**
   * 执行Action节点
   */
  private async executeActionNode(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    this.log(logs, 'info', '执行Action节点', { nodeId: node.id })

    // 这里可以集成ActionService来执行实际的API调用
    // 暂时返回模拟结果
    return {
      success: true,
      message: 'Action节点执行完成',
      data: { result: 'action_result' }
    }
  }

  /**
   * 查找起始节点
   */
  private findStartNodes(nodes: FlowNode[]): FlowNode[] {
    return nodes.filter(node => node.type === 'start')
  }

  /**
   * 解析输入值
   */
  private resolveInputValue(inputValue: InputValue, variables: Record<string, any>): any {
    switch (inputValue.type) {
      case 'constant':
        return inputValue.content
      case 'ref':
        if (Array.isArray(inputValue.content) && inputValue.content.length >= 2) {
          const [nodeId, path] = inputValue.content
          const nodeResult = variables[nodeId] || {}
          return this.getNestedValue(nodeResult, path)
        }
        return inputValue.content
      case 'variable':
        return variables[inputValue.content] || inputValue.content
      default:
        return inputValue.content
    }
  }

  /**
   * 评估条件
   */
  private evaluateCondition(node: FlowNode, variables: Record<string, any>): boolean {
    const inputValues = node.data?.inputsValues
    if (!inputValues?.condition) {
      return true
    }

    const conditionValue = this.resolveInputValue(inputValues.condition, variables)
    return Boolean(conditionValue)
  }

  /**
   * 检查是否应该中断循环
   */
  private shouldBreakLoop(node: FlowNode, result: NodeExecutionResult): boolean {
    // 检查是否有breakLoop节点
    if (node.type === 'breakLoop') {
      return true
    }

    // 递归检查子节点
    if (node.blocks) {
      return node.blocks.some(block => this.shouldBreakLoop(block, result))
    }

    return false
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * 记录日志
   */
  private log(
    logs: ExecutionLog[], 
    level: 'info' | 'warn' | 'error' | 'debug', 
    message: string, 
    data?: any
  ): void {
    logs.push({
      timestamp: new Date(),
      level,
      message,
      data
    })
  }
}
