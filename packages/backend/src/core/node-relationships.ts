// 导入FlowNode类型
import { FlowNode, NodeType } from './types'

/**
 * 节点关联关系管理器
 * 处理具有强关联关系的节点组合
 */
export class NodeRelationshipManager {
  // 定义节点关联关系映射
  private static readonly NODE_RELATIONSHIPS = {
    // 父子关系 - 父节点类型 -> 允许的子节点类型
    parentChild: {
      'switch': ['case', 'caseDefault'],
      'if': ['ifBlock'],
      'loop': ['if', 'llm', 'action', 'agent', 'breakLoop'],
      'tryCatch': ['tryBlock', 'catchBlock'],
      'agent': ['agentLLM', 'agentMemory', 'agentTools'],
      'agentLLM': ['llm'],
      'agentMemory': ['memory'],
      'agentTools': ['tool']
    } as Record<NodeType, NodeType[]>,
    
    // 必需子节点 - 父节点类型 -> 必须包含的子节点类型
    requiredChildren: {
      'switch': ['case'], // Switch至少需要一个case
      'if': ['ifBlock'], // If至少需要一个ifBlock
      'tryCatch': ['tryBlock'], // TryCatch至少需要tryBlock
      'agent': ['agentLLM'], // Agent至少需要LLM组件
      'agentLLM': ['llm'], // AgentLLM必须包含LLM节点
      'agentMemory': ['memory'], // AgentMemory必须包含Memory节点
      'agentTools': ['tool'] // AgentTools必须包含Tool节点
    } as Record<NodeType, NodeType[]>,
    
    // 互斥关系 - 不能同时存在的节点类型  
    mutuallyExclusive: {
      // 目前没有严格的互斥关系，case和caseDefault是可以共存的
    } as Record<NodeType, NodeType[]>,
    
    // 依赖关系 - 节点类型 -> 依赖的父节点类型
    dependencies: {
      'case': ['switch'],
      'caseDefault': ['switch'],
      'ifBlock': ['if'],
      'tryBlock': ['tryCatch'],
      'catchBlock': ['tryCatch'],
      'breakLoop': ['loop'],
      'agentLLM': ['agent'],
      'agentMemory': ['agent'],
      'agentTools': ['agent'],
      'llm': ['agentLLM', 'loop', 'if'], // LLM可以在这些节点中
      'memory': ['agentMemory'],
      'tool': ['agentTools']
    } as Record<NodeType, NodeType[]>
  }

  /**
   * 验证节点关联关系
   */
  static validateNodeRelationships(node: FlowNode, allNodes: FlowNode[]): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证父子关系
    this.validateParentChildRelationship(node, errors, warnings)
    
    // 验证必需子节点
    this.validateRequiredChildren(node, errors, warnings)
    
    // 验证依赖关系
    this.validateDependencies(node, allNodes, errors, warnings)
    
    // 验证互斥关系
    this.validateMutuallyExclusive(node, errors, warnings)

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证父子关系
   */
  private static validateParentChildRelationship(node: FlowNode, errors: string[], warnings: string[]): void {
    const allowedChildren = this.NODE_RELATIONSHIPS.parentChild[node.type]
    
    if (allowedChildren && node.blocks) {
      for (const child of node.blocks) {
        if (!allowedChildren.includes(child.type)) {
          errors.push(`节点 ${node.type} 不允许包含子节点类型 ${child.type}，允许的类型: ${allowedChildren.join(', ')}`)
        }
      }
    }
  }

  /**
   * 验证必需子节点
   */
  private static validateRequiredChildren(node: FlowNode, errors: string[], warnings: string[]): void {
    const requiredChildren = this.NODE_RELATIONSHIPS.requiredChildren[node.type]
    
    if (requiredChildren) {
      for (const requiredType of requiredChildren) {
        const hasRequiredChild = node.blocks?.some(child => child.type === requiredType)
        if (!hasRequiredChild) {
          if (requiredType === 'case' || requiredType === 'ifBlock' || requiredType === 'tryBlock') {
            errors.push(`节点 ${node.type} 必须包含至少一个 ${requiredType} 子节点`)
          } else {
            warnings.push(`建议 ${node.type} 节点包含 ${requiredType} 子节点`)
          }
        }
      }
    }
  }

  /**
   * 验证依赖关系
   */
  private static validateDependencies(node: FlowNode, allNodes: FlowNode[], errors: string[], warnings: string[]): void {
    const dependencies = this.NODE_RELATIONSHIPS.dependencies[node.type]
    
    if (dependencies) {
      // 在递归执行中，我们需要检查节点是否在正确的父节点中
      // 这个验证通常在流程级别进行
      const hasValidParent = this.findValidParent(node, allNodes, dependencies)
      if (!hasValidParent) {
        warnings.push(`节点 ${node.type} 建议在以下父节点中使用: ${dependencies.join(', ')}`)
      }
    }
  }

  /**
   * 验证互斥关系
   */
  private static validateMutuallyExclusive(node: FlowNode, errors: string[], warnings: string[]): void {
    if (node.blocks) {
      const childTypes = node.blocks.map(child => child.type)
      
      for (const [type, exclusiveTypes] of Object.entries(this.NODE_RELATIONSHIPS.mutuallyExclusive)) {
        const nodeType = type as NodeType
        if (childTypes.includes(nodeType)) {
          for (const exclusiveType of exclusiveTypes) {
            if (childTypes.includes(exclusiveType)) {
              errors.push(`节点 ${node.type} 的子节点中 ${type} 和 ${exclusiveType} 不能同时存在`)
            }
          }
        }
      }
    }
  }

  /**
   * 查找有效的父节点
   */
  private static findValidParent(targetNode: FlowNode, allNodes: FlowNode[], validParentTypes: string[]): boolean {
    for (const node of allNodes) {
      if (validParentTypes.includes(node.type) && node.blocks) {
        const hasChild = this.hasChildRecursively(node, targetNode.id)
        if (hasChild) {
          return true
        }
      }
    }
    return false
  }

  /**
   * 递归查找子节点
   */
  private static hasChildRecursively(parent: FlowNode, targetId: string): boolean {
    if (!parent.blocks) return false
    
    for (const child of parent.blocks) {
      if (child.id === targetId) {
        return true
      }
      if (this.hasChildRecursively(child, targetId)) {
        return true
      }
    }
    return false
  }

  /**
   * 获取节点的执行顺序
   */
  static getExecutionOrder(node: FlowNode): FlowNode[] {
    const executionOrder: FlowNode[] = []
    
    switch (node.type) {
      case 'switch':
        // Switch节点需要先评估条件，再执行匹配的case
        this.addSwitchExecutionOrder(node, executionOrder)
        break
        
      case 'if':
        // If节点需要先评估条件，再执行对应的ifBlock
        this.addIfExecutionOrder(node, executionOrder)
        break
        
      case 'tryCatch':
        // TryCatch需要先执行try，出错时执行catch
        this.addTryCatchExecutionOrder(node, executionOrder)
        break
        
      case 'agent':
        // Agent需要按顺序执行LLM、Memory、Tools
        this.addAgentExecutionOrder(node, executionOrder)
        break
        
      default:
        // 默认按顺序执行所有子节点
        if (node.blocks) {
          executionOrder.push(...node.blocks)
        }
    }
    
    return executionOrder
  }

  private static addSwitchExecutionOrder(node: FlowNode, executionOrder: FlowNode[]): void {
    if (node.blocks) {
      // Switch的执行顺序由运行时的条件匹配决定
      // 这里只是添加所有可能的分支，实际执行时会选择匹配的
      executionOrder.push(...node.blocks)
    }
  }

  private static addIfExecutionOrder(node: FlowNode, executionOrder: FlowNode[]): void {
    if (node.blocks) {
      // If的执行顺序由运行时的条件决定
      executionOrder.push(...node.blocks)
    }
  }

  private static addTryCatchExecutionOrder(node: FlowNode, executionOrder: FlowNode[]): void {
    if (node.blocks) {
      // 先添加tryBlock，catchBlock在异常时执行
      const tryBlock = node.blocks.find(block => block.type === 'tryBlock')
      const catchBlocks = node.blocks.filter(block => block.type === 'catchBlock')
      
      if (tryBlock) {
        executionOrder.push(tryBlock)
      }
      executionOrder.push(...catchBlocks)
    }
  }

  private static addAgentExecutionOrder(node: FlowNode, executionOrder: FlowNode[]): void {
    if (node.blocks) {
      // Agent按照LLM -> Memory -> Tools的顺序执行
      const agentLLM = node.blocks.find(block => block.type === 'agentLLM')
      const agentMemory = node.blocks.find(block => block.type === 'agentMemory')
      const agentTools = node.blocks.find(block => block.type === 'agentTools')
      
      if (agentLLM) executionOrder.push(agentLLM)
      if (agentMemory) executionOrder.push(agentMemory)
      if (agentTools) executionOrder.push(agentTools)
    }
  }
}
