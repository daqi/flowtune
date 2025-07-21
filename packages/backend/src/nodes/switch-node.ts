import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'
import { NodeRelationshipManager } from '../core/node-relationships'

/**
 * Switch节点执行器
 * 用于根据条件选择不同的执行分支，与case/caseDefault节点强关联
 */
export class SwitchNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'switch'

  async execute(
    node: FlowNode, 
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    try {
      // 获取Switch条件表达式
      const switchConfig = node.data?.inputsValues || {}
      const expression = switchConfig.expression?.content || ''

      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `执行Switch节点`,
        data: { nodeId: node.id, expression }
      })

      // 计算表达式的值
      const expressionValue = this.evaluateExpression(expression, context.variables)
      
      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `Switch表达式计算结果: ${expressionValue}`,
        data: { nodeId: node.id, expression, result: expressionValue }
      })

      // 查找匹配的case分支
      const { matchedCase, executedBranch } = this.findMatchingCase(node, expressionValue, logs)

      let result = null
      if (matchedCase) {
        logs.push({
          timestamp: new Date(),
          level: 'info',
          message: `执行匹配的分支: ${executedBranch}`,
          data: { nodeId: node.id, branch: executedBranch, caseNodeId: matchedCase.id }
        })

        // 执行匹配的case分支及其子节点
        result = await this.executeCaseBranch(matchedCase, context, logs)
      } else {
        logs.push({
          timestamp: new Date(),
          level: 'warn',
          message: `没有找到匹配的分支`,
          data: { nodeId: node.id, expressionValue }
        })

        result = { message: '没有匹配的分支', value: expressionValue }
      }

      // 保存执行结果
      const executionResult: NodeExecutionResult = {
        success: true,
        data: {
          expressionValue,
          executedBranch,
          matchedCaseId: matchedCase?.id,
          result
        },
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        nodeType: this.nodeType
      }

      context.nodeResults.set(node.id, executionResult)
      
      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `Switch节点执行完成`,
        data: { nodeId: node.id, executedBranch, success: true }
      })

      return executionResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Switch执行失败'
      logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Switch节点执行失败: ${errorMessage}`,
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
   * 查找匹配的case分支
   */
  private findMatchingCase(
    node: FlowNode, 
    expressionValue: any, 
    logs: ExecutionLog[]
  ): { matchedCase: FlowNode | null; executedBranch: string | null } {
    let matchedCase: FlowNode | null = null
    let executedBranch: string | null = null

    if (node.blocks && node.blocks.length > 0) {
      // 首先查找匹配的case
      for (const caseNode of node.blocks) {
        if (caseNode.type === 'case') {
          const caseValue = this.getCaseValue(caseNode)
          if (this.matchCase(expressionValue, caseValue)) {
            matchedCase = caseNode
            executedBranch = String(caseValue)
            break
          }
        }
      }

      // 如果没有找到匹配的case，查找默认case
      if (!matchedCase) {
        const defaultCase = node.blocks.find(block => block.type === 'caseDefault')
        if (defaultCase) {
          matchedCase = defaultCase
          executedBranch = 'default'
        }
      }
    }

    return { matchedCase, executedBranch }
  }

  /**
   * 获取case节点的值
   */
  private getCaseValue(caseNode: FlowNode): any {
    // 优先从inputsValues获取
    const inputsValues = caseNode.data?.inputsValues
    if (inputsValues?.value?.content !== undefined) {
      return inputsValues.value.content
    }
    
    // 其次从condition获取 (兼容旧格式)
    if (inputsValues?.condition?.content !== undefined) {
      return inputsValues.condition.content
    }
    
    // 最后返回节点标题
    return caseNode.data?.title || null
  }

  /**
   * 计算表达式的值
   */
  private evaluateExpression(expression: string, variables: Record<string, any>): any {
    try {
      // 简单的表达式计算实现
      // 在实际项目中可能需要更安全的表达式解析器
      
      // 替换变量引用
      let evaluatedExpression = expression
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\$\\{${key}\\}|\\$${key}\\b`, 'g')
        evaluatedExpression = evaluatedExpression.replace(regex, JSON.stringify(value))
      }
      
      // 对于简单的表达式，直接返回变量值
      if (evaluatedExpression.startsWith('${') && evaluatedExpression.endsWith('}')) {
        const varName = evaluatedExpression.slice(2, -1)
        return variables[varName]
      }
      
      // 否则尝试作为字面量解析
      try {
        return JSON.parse(evaluatedExpression)
      } catch {
        return evaluatedExpression
      }
    } catch (error) {
      // 表达式计算失败，返回原始表达式
      return expression
    }
  }

  /**
   * 检查case是否匹配
   */
  private matchCase(expressionValue: any, caseValue: any): boolean {
    // 严格相等比较
    if (expressionValue === caseValue) {
      return true
    }
    
    // 字符串比较
    if (String(expressionValue) === String(caseValue)) {
      return true
    }
    
    // 数字比较
    if (Number(expressionValue) === Number(caseValue) && !isNaN(Number(expressionValue))) {
      return true
    }
    
    return false
  }

  /**
   * 执行case分支
   */
  private async executeCaseBranch(
    caseNode: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    // 执行case分支中的子节点
    if (caseNode.blocks && caseNode.blocks.length > 0) {
      const results = []
      for (const childNode of caseNode.blocks) {
        // 这里需要调用FlowEngine的executeNode方法
        // 为了简化，先返回模拟结果
        results.push({
          nodeId: childNode.id,
          type: childNode.type,
          executed: true,
          timestamp: new Date()
        })
      }
      return { caseResults: results }
    }
    
    return { message: 'case分支执行完成', caseType: caseNode.type }
  }

  validate(node: FlowNode, allNodes?: FlowNode[]): { valid: boolean; errors: string[]; warnings: string[] } {
    const result = super.validate(node, allNodes)

    // Switch特定验证
    const switchConfig = node.data?.inputsValues || {}
    
    if (!switchConfig.expression?.content) {
      result.errors.push('Switch节点必须设置表达式')
    }

    // 检查是否有case分支
    const caseBranches = node.blocks?.filter(block => 
      block.type === 'case' || block.type === 'caseDefault'
    ) || []
    
    if (caseBranches.length === 0) {
      result.errors.push('Switch节点必须包含至少一个case或caseDefault分支')
    }

    // 检查case分支配置
    const cases = node.blocks?.filter(block => block.type === 'case') || []
    const defaultCases = node.blocks?.filter(block => block.type === 'caseDefault') || []

    if (defaultCases.length > 1) {
      result.errors.push('Switch节点只能包含一个caseDefault分支')
    }

    // 验证case配置
    for (const caseNode of cases) {
      const caseValue = this.getCaseValue(caseNode)
      if (caseValue === null || caseValue === undefined) {
        result.warnings.push(`Case分支 ${caseNode.id} 建议设置匹配值`)
      }
    }

    return result
  }
}
