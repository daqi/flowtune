import { BaseNodeExecutor } from '../core/node-executor'
import { FlowNode, FlowExecutionContext, NodeExecutionResult, ExecutionLog } from '../core/types'

/**
 * TryCatch节点执行器
 * 用于异常处理和错误恢复
 */
export class TryCatchNodeExecutor extends BaseNodeExecutor {
  readonly nodeType = 'tryCatch'

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
        message: `执行TryCatch节点`,
        data: { nodeId: node.id }
      })

      // 查找try和catch分支
      const tryBlock = this.findBlock(node, 'tryBlock')
      const catchBlock = this.findBlock(node, 'catchBlock')

      if (!tryBlock) {
        throw new Error('TryCatch节点必须包含try分支')
      }

      let result: any = null
      let executedBranch = 'none'
      let thrownError: any = null

      try {
        // 执行try分支
        logs.push({
          timestamp: new Date(),
          level: 'info',
          message: `执行try分支`,
          data: { nodeId: node.id }
        })

        result = await this.executeTryBlock(tryBlock, context, logs)
        executedBranch = 'try'

        logs.push({
          timestamp: new Date(),
          level: 'info',
          message: `try分支执行成功`,
          data: { nodeId: node.id, result }
        })

      } catch (tryError) {
        thrownError = tryError
        const errorMessage = tryError instanceof Error ? tryError.message : 'try分支执行失败'
        
        logs.push({
          timestamp: new Date(),
          level: 'warn',
          message: `try分支执行失败: ${errorMessage}`,
          data: { nodeId: node.id, error: tryError }
        })

        if (catchBlock) {
          try {
            // 将错误信息添加到执行上下文中
            const errorContext = {
              ...context,
              variables: {
                ...context.variables,
                __error__: {
                  message: errorMessage,
                  type: tryError?.constructor?.name || 'Error',
                  stack: tryError instanceof Error ? tryError.stack : undefined
                }
              }
            }

            logs.push({
              timestamp: new Date(),
              level: 'info',
              message: `执行catch分支`,
              data: { nodeId: node.id, errorMessage }
            })

            result = await this.executeCatchBlock(catchBlock, errorContext, logs)
            executedBranch = 'catch'

            logs.push({
              timestamp: new Date(),
              level: 'info',
              message: `catch分支执行成功`,
              data: { nodeId: node.id, result }
            })

          } catch (catchError) {
            // catch分支也失败了
            const catchErrorMessage = catchError instanceof Error ? catchError.message : 'catch分支执行失败'
            logs.push({
              timestamp: new Date(),
              level: 'error',
              message: `catch分支执行失败: ${catchErrorMessage}`,
              data: { nodeId: node.id, error: catchError }
            })

            throw new Error(`try分支失败: ${errorMessage}, catch分支也失败: ${catchErrorMessage}`)
          }
        } else {
          // 没有catch分支，重新抛出错误
          throw tryError
        }
      }

      // 保存执行结果
      const executionResult: NodeExecutionResult = {
        success: true,
        data: {
          result,
          executedBranch,
          error: thrownError ? {
            message: thrownError instanceof Error ? thrownError.message : String(thrownError),
            type: thrownError?.constructor?.name || 'Error'
          } : null
        },
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        nodeType: this.nodeType
      }

      context.nodeResults.set(node.id, executionResult)
      
      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `TryCatch节点执行完成`,
        data: { nodeId: node.id, executedBranch }
      })

      return executionResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'TryCatch执行失败'
      logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `TryCatch节点执行失败: ${errorMessage}`,
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
   * 查找指定类型的子块
   */
  private findBlock(node: FlowNode, blockType: string): FlowNode | null {
    if (!node.blocks) return null
    
    return node.blocks.find(block => block.type === blockType) || null
  }

  /**
   * 执行try分支
   */
  private async executeTryBlock(
    tryBlock: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    // 执行try分支中的子节点
    if (tryBlock.blocks && tryBlock.blocks.length > 0) {
      const results = []
      for (const childNode of tryBlock.blocks) {
        // 这里需要调用FlowEngine的executeNode方法
        // 为了简化，先模拟执行
        
        // 模拟可能的异常情况
        if (childNode.data?.simulateError) {
          throw new Error(`模拟节点执行错误: ${childNode.id}`)
        }
        
        results.push({
          nodeId: childNode.id,
          type: childNode.type,
          executed: true,
          timestamp: new Date()
        })
      }
      return { tryResults: results }
    }
    
    return { message: 'try分支执行完成' }
  }

  /**
   * 执行catch分支
   */
  private async executeCatchBlock(
    catchBlock: FlowNode,
    context: FlowExecutionContext,
    logs: ExecutionLog[]
  ): Promise<any> {
    // 执行catch分支中的子节点
    if (catchBlock.blocks && catchBlock.blocks.length > 0) {
      const results = []
      for (const childNode of catchBlock.blocks) {
        // 这里需要调用FlowEngine的executeNode方法
        // 为了简化，先模拟执行
        results.push({
          nodeId: childNode.id,
          type: childNode.type,
          executed: true,
          errorHandled: true,
          timestamp: new Date()
        })
      }
      return { catchResults: results, errorHandled: true }
    }
    
    return { message: 'catch分支执行完成', errorHandled: true }
  }

  validate(node: FlowNode): { valid: boolean; errors: string[]; warnings: string[] } {
    const result = super.validate(node)

    // TryCatch特定验证
    const tryBlock = this.findBlock(node, 'tryBlock')
    const catchBlock = this.findBlock(node, 'catchBlock')

    if (!tryBlock) {
      result.errors.push('TryCatch节点必须包含try分支')
    }

    if (!catchBlock) {
      result.warnings.push('建议添加catch分支来处理异常')
    }

    // 检查try分支是否有内容
    if (tryBlock && (!tryBlock.blocks || tryBlock.blocks.length === 0)) {
      result.warnings.push('try分支为空，建议添加要执行的节点')
    }

    return result
  }
}
