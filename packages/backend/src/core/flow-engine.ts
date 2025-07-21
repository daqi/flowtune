import { 
  FlowDocumentJSON, 
  FlowNode, 
  FlowExecutionResult, 
  FlowExecutionContext,
  NodeExecutionResult,
  ExecutionLog
} from '../core/types'
import { ActionService } from '../modules/action/action.service'
import { NodeRegistryManager, defaultNodeRegistry } from '../nodes'
import crypto from 'crypto'

export class FlowEngine {
  private nodeRegistry: NodeRegistryManager

  constructor(
    private actionService: ActionService,
    nodeRegistry?: NodeRegistryManager
  ) {
    this.nodeRegistry = nodeRegistry || defaultNodeRegistry
  }

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
    context.currentNode = node.id

    this.log(logs, 'info', `执行节点: ${node.type}`, { nodeId: node.id, title: node.data?.title })

    try {
      // 获取节点执行器
      const executor = this.nodeRegistry.getExecutor(node.type)
      if (!executor) {
        throw new Error(`不支持的节点类型: ${node.type}`)
      }

      // 执行节点
      const result = await executor.execute(node, context, logs)

      // 执行子节点
      if (node.blocks && node.blocks.length > 0) {
        for (const childNode of node.blocks) {
          await this.executeNode(childNode, allNodes, context, logs)
        }
      }

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '节点执行失败'
      this.log(logs, 'error', `节点执行失败: ${errorMessage}`, { nodeId: node.id, error })

      const executionResult: NodeExecutionResult = {
        success: false,
        error: errorMessage,
        executionTime: 0,
        timestamp: new Date(),
        nodeType: node.type
      }

      context.nodeResults.set(node.id, executionResult)
      return executionResult
    }
  }

  /**
   * 查找起始节点
   */
  private findStartNodes(nodes: FlowNode[]): FlowNode[] {
    return nodes.filter(node => node.type === 'start')
  }

  /**
   * 验证流程文档
   */
  validateFlowDocument(flowDocument: FlowDocumentJSON): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础验证
    if (!flowDocument.nodes || !Array.isArray(flowDocument.nodes)) {
      errors.push('flowDocument.nodes 必须是数组')
      return { valid: false, errors, warnings }
    }

    if (flowDocument.nodes.length === 0) {
      errors.push('流程必须至少包含一个节点')
      return { valid: false, errors, warnings }
    }

    // 验证每个节点 - 传入所有节点用于关联验证
    for (const node of flowDocument.nodes) {
      const executor = this.nodeRegistry.getExecutor(node.type)
      if (!executor) {
        errors.push(`不支持的节点类型: ${node.type} (节点ID: ${node.id})`)
        continue
      }

      // 使用节点执行器进行验证，传入所有节点
      const validation = executor.validate(node, flowDocument.nodes)
      if (!validation.valid) {
        errors.push(...validation.errors.map(err => `节点 ${node.id}: ${err}`))
      }
      warnings.push(...validation.warnings.map(warn => `节点 ${node.id}: ${warn}`))
    }

    // 检查起始节点
    const startNodes = this.findStartNodes(flowDocument.nodes)
    if (startNodes.length === 0) {
      warnings.push('建议添加起始节点 (start)')
    }

    // 检查结束节点
    const endNodes = flowDocument.nodes.filter(node => node.type === 'end')
    if (endNodes.length === 0) {
      warnings.push('建议添加结束节点 (end)')
    }

    // 检查节点ID唯一性
    const nodeIds = flowDocument.nodes.map(node => node.id)
    const duplicateIds = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index)
    if (duplicateIds.length > 0) {
      errors.push(`发现重复的节点ID: ${duplicateIds.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 获取支持的节点类型
   */
  getSupportedNodeTypes(): string[] {
    return this.nodeRegistry.getSupportedNodeTypes()
  }

  /**
   * 获取注册器统计信息
   */
  getRegistryStats() {
    return this.nodeRegistry.getStats()
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
