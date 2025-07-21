import { LowCodeConfig, FlowNode, ActionResult, ActionContext } from '../core/types'
import { ActionService } from '../modules/action/action.service'
import crypto from 'crypto'

export class FlowEngine {
  constructor(private actionService: ActionService) {}

  /**
   * 执行低代码流程
   */
  async executeFlow(config: LowCodeConfig, inputData: Record<string, any> = {}): Promise<FlowExecutionResult> {
    const executionId = crypto.randomUUID()
    const startTime = Date.now()
    const executionContext: FlowExecutionContext = {
      executionId,
      flowId: config.flowId,
      variables: { ...config.variables, ...inputData },
      nodeResults: new Map(),
      currentNode: null,
      status: 'running'
    }

    try {
      // 查找起始节点
      const startNodes = this.findStartNodes(config.nodes, config.edges)
      if (startNodes.length === 0) {
        throw new Error('未找到起始节点')
      }

      // 执行流程
      for (const startNode of startNodes) {
        await this.executeNodeChain(startNode, config, executionContext)
      }

      return {
        success: true,
        executionId,
        executionTime: Date.now() - startTime,
        results: Object.fromEntries(executionContext.nodeResults),
        finalVariables: executionContext.variables
      }

    } catch (error) {
      return {
        success: false,
        executionId,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : '流程执行失败',
        results: Object.fromEntries(executionContext.nodeResults),
        finalVariables: executionContext.variables
      }
    }
  }

  /**
   * 递归执行节点链
   */
  private async executeNodeChain(
    node: FlowNode,
    config: LowCodeConfig,
    context: FlowExecutionContext
  ): Promise<void> {
    context.currentNode = node.id

    try {
      let result: any

      switch (node.type) {
        case 'action':
          result = await this.executeActionNode(node, context)
          break
        case 'condition':
          result = await this.executeConditionNode(node, context)
          break
        case 'transform':
          result = await this.executeTransformNode(node, context)
          break
        case 'trigger':
          result = await this.executeTriggerNode(node, context)
          break
        default:
          throw new Error(`不支持的节点类型: ${node.type}`)
      }

      context.nodeResults.set(node.id, result)

      // 查找下一个要执行的节点
      const nextNodes = this.getNextNodes(node.id, config.edges, config.nodes, result)
      
      // 递归执行下一个节点
      for (const nextNode of nextNodes) {
        await this.executeNodeChain(nextNode, config, context)
      }

    } catch (error) {
      context.nodeResults.set(node.id, {
        success: false,
        error: error instanceof Error ? error.message : '节点执行失败'
      })
      
      // 根据错误处理策略决定是否继续
      const errorHandling = config.settings?.errorHandling || 'stop'
      if (errorHandling === 'stop') {
        throw error
      }
    }
  }

  /**
   * 执行操作节点
   */
  private async executeActionNode(node: FlowNode, context: FlowExecutionContext): Promise<ActionResult> {
    if (!node.actionId) {
      throw new Error('操作节点缺少actionId')
    }

    // 从配置和变量中解析参数
    const parameters = this.resolveParameters(node.configuration.parameters || {}, context.variables)
    
    const actionContext: ActionContext = {
      actionId: node.actionId,
      appId: node.appId!,
      authId: node.configuration.authId,
      parameters,
      headers: node.configuration.headers,
      metadata: {
        nodeId: node.id,
        executionId: context.executionId
      }
    }

    const result = await this.actionService.executeAction(actionContext)
    
    // 更新变量
    if (result.success && node.configuration.outputVariable) {
      context.variables[node.configuration.outputVariable] = result.data
    }

    return result
  }

  /**
   * 执行条件节点
   */
  private async executeConditionNode(node: FlowNode, context: FlowExecutionContext): Promise<any> {
    const condition = node.configuration.condition
    if (!condition) {
      throw new Error('条件节点缺少条件表达式')
    }

    // 简单的条件评估（实际项目中可以使用更强大的表达式引擎）
    const result = this.evaluateCondition(condition, context.variables)
    
    return {
      success: true,
      conditionResult: result,
      variables: context.variables
    }
  }

  /**
   * 执行数据转换节点
   */
  private async executeTransformNode(node: FlowNode, context: FlowExecutionContext): Promise<any> {
    const transformConfig = node.configuration.transform
    if (!transformConfig) {
      throw new Error('转换节点缺少转换配置')
    }

    let result = context.variables

    // 执行各种转换操作
    if (transformConfig.mapping) {
      result = this.applyMapping(result, transformConfig.mapping)
    }

    if (transformConfig.filter) {
      result = this.applyFilter(result, transformConfig.filter)
    }

    if (transformConfig.aggregate) {
      result = this.applyAggregation(result, transformConfig.aggregate)
    }

    // 更新变量
    if (node.configuration.outputVariable) {
      context.variables[node.configuration.outputVariable] = result
    }

    return {
      success: true,
      transformedData: result
    }
  }

  /**
   * 执行触发节点
   */
  private async executeTriggerNode(node: FlowNode, context: FlowExecutionContext): Promise<any> {
    // 触发节点通常是流程的起始点，这里可以处理webhook、定时器等触发逻辑
    return {
      success: true,
      triggered: true,
      timestamp: new Date()
    }
  }

  /**
   * 查找起始节点
   */
  private findStartNodes(nodes: FlowNode[], edges: any[]): FlowNode[] {
    const targetNodeIds = new Set(edges.map(edge => edge.target))
    return nodes.filter(node => !targetNodeIds.has(node.id))
  }

  /**
   * 获取下一个要执行的节点
   */
  private getNextNodes(
    currentNodeId: string,
    edges: any[],
    nodes: FlowNode[],
    currentResult: any
  ): FlowNode[] {
    const outgoingEdges = edges.filter(edge => edge.source === currentNodeId)
    const nextNodes: FlowNode[] = []

    for (const edge of outgoingEdges) {
      // 检查边的条件
      if (edge.condition) {
        const conditionMet = this.evaluateCondition(edge.condition, { result: currentResult })
        if (!conditionMet) continue
      }

      const nextNode = nodes.find(node => node.id === edge.target)
      if (nextNode) {
        nextNodes.push(nextNode)
      }
    }

    return nextNodes
  }

  /**
   * 解析参数中的变量引用
   */
  private resolveParameters(parameters: Record<string, any>, variables: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {}

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        // 变量引用，如 {{variable_name}}
        const variableName = value.slice(2, -2).trim()
        resolved[key] = this.getNestedValue(variables, variableName)
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveParameters(value, variables)
      } else {
        resolved[key] = value
      }
    }

    return resolved
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * 评估条件表达式
   */
  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    // 简单的条件评估实现
    // 实际项目中可以使用更强大的表达式引擎，如JSONLogic、expr-eval等
    try {
      // 替换变量引用
      let expression = condition
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        expression = expression.replace(placeholder, JSON.stringify(value))
      }

      // 安全的表达式评估（这里只是示例，生产环境需要更安全的实现）
      return Function(`"use strict"; return (${expression})`)()
    } catch {
      return false
    }
  }

  /**
   * 应用数据映射
   */
  private applyMapping(data: any, mapping: Record<string, string>): any {
    const result: any = {}
    for (const [targetKey, sourcePath] of Object.entries(mapping)) {
      result[targetKey] = this.getNestedValue(data, sourcePath)
    }
    return result
  }

  /**
   * 应用数据过滤
   */
  private applyFilter(data: any, filter: any): any {
    if (Array.isArray(data)) {
      return data.filter(item => this.evaluateCondition(filter.condition, item))
    }
    return data
  }

  /**
   * 应用数据聚合
   */
  private applyAggregation(data: any, aggregation: any): any {
    if (!Array.isArray(data)) return data

    switch (aggregation.type) {
      case 'count':
        return data.length
      case 'sum':
        return data.reduce((sum, item) => sum + (item[aggregation.field] || 0), 0)
      case 'avg':
        const sum = data.reduce((sum, item) => sum + (item[aggregation.field] || 0), 0)
        return sum / data.length
      case 'max':
        return Math.max(...data.map(item => item[aggregation.field] || 0))
      case 'min':
        return Math.min(...data.map(item => item[aggregation.field] || 0))
      default:
        return data
    }
  }
}

interface FlowExecutionContext {
  executionId: string
  flowId: string
  variables: Record<string, any>
  nodeResults: Map<string, any>
  currentNode: string | null
  status: 'running' | 'completed' | 'failed'
}

interface FlowExecutionResult {
  success: boolean
  executionId: string
  executionTime: number
  results: Record<string, any>
  finalVariables: Record<string, any>
  error?: string
}
