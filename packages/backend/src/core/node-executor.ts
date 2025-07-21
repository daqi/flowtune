import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from './types'
import { NodeRelationshipManager } from './node-relationships'

/**
 * 节点执行器基类
 */
export abstract class BaseNodeExecutor {
  abstract readonly nodeType: string
  
  /**
   * 执行节点
   */
  abstract execute(
    node: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult>

  /**
   * 验证节点配置
   */
  validate(node: FlowNode, allNodes?: FlowNode[]): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础验证
    if (!node.id) {
      errors.push('节点缺少id')
    }

    if (!node.type) {
      errors.push('节点缺少type')
    }

    if (node.type !== this.nodeType) {
      errors.push(`节点类型不匹配: 期望 ${this.nodeType}, 实际 ${node.type}`)
    }

    // 节点关联关系验证
    if (allNodes) {
      const relationshipValidation = NodeRelationshipManager.validateNodeRelationships(node, allNodes)
      errors.push(...relationshipValidation.errors)
      warnings.push(...relationshipValidation.warnings)
    }

    // 子类可以重写此方法添加特定验证
    const customValidation = this.validateNode(node)
    errors.push(...customValidation.errors)
    warnings.push(...customValidation.warnings)

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 子类可重写的节点特定验证
   */
  protected validateNode(node: FlowNode): { errors: string[]; warnings: string[] } {
    return { errors: [], warnings: [] }
  }

  /**
   * 工具方法：解析输入值
   */
  protected resolveInputValue(inputValue: any, variables: Record<string, any>): any {
    if (!inputValue) return null

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
   * 工具方法：获取嵌套对象的值
   */
  protected getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * 工具方法：记录日志
   */
  protected log(
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

  /**
   * 工具方法：评估条件
   */
  protected evaluateCondition(node: FlowNode, variables: Record<string, any>): boolean {
    const inputValues = node.data?.inputsValues
    if (!inputValues?.condition) {
      return true
    }

    const conditionValue = this.resolveInputValue(inputValues.condition, variables)
    return Boolean(conditionValue)
  }
}

/**
 * 节点注册器接口
 */
export interface NodeRegistry {
  register(executor: BaseNodeExecutor): void
  unregister(nodeType: string): void
  get(nodeType: string): BaseNodeExecutor | undefined
  getAll(): BaseNodeExecutor[]
  getNodeTypes(): string[]
}

/**
 * 默认节点注册器实现
 */
export class DefaultNodeRegistry implements NodeRegistry {
  private executors = new Map<string, BaseNodeExecutor>()

  register(executor: BaseNodeExecutor): void {
    this.executors.set(executor.nodeType, executor)
  }

  unregister(nodeType: string): void {
    this.executors.delete(nodeType)
  }

  get(nodeType: string): BaseNodeExecutor | undefined {
    return this.executors.get(nodeType)
  }

  getAll(): BaseNodeExecutor[] {
    return Array.from(this.executors.values())
  }

  getNodeTypes(): string[] {
    return Array.from(this.executors.keys())
  }
}
