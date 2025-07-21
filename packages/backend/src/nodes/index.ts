import { BaseNodeExecutor, DefaultNodeRegistry, NodeRegistry } from '../core/node-executor'
import { StartNodeExecutor } from './start-node'
import { EndNodeExecutor } from './end-node'
import { LLMNodeExecutor } from './llm-node'
import { IfNodeExecutor } from './if-node'
import { LoopNodeExecutor } from './loop-node'
import { ActionNodeExecutor } from './action-node'
import { AgentNodeExecutor } from './agent-node'
import { SwitchNodeExecutor } from './switch-node'
import { TryCatchNodeExecutor } from './try-catch-node'
import { AgentLLMNodeExecutor } from './agent-llm-node'
import { AgentMemoryNodeExecutor } from './agent-memory-node'
import { AgentToolsNodeExecutor } from './agent-tools-node'
import { MemoryNodeExecutor } from './memory-node'
import { ToolNodeExecutor } from './tool-node'
import { CaseNodeExecutor, CaseDefaultNodeExecutor } from './case-node'
import { 
  IfBlockNodeExecutor, 
  TryBlockNodeExecutor, 
  CatchBlockNodeExecutor, 
  BreakLoopNodeExecutor 
} from './block-nodes'

/**
 * 节点注册器管理器
 */
export class NodeRegistryManager {
  private registry: NodeRegistry

  constructor(registry?: NodeRegistry) {
    this.registry = registry || new DefaultNodeRegistry()
    this.registerDefaultNodes()
  }

  /**
   * 注册默认节点
   */
  private registerDefaultNodes(): void {
    // 基础节点
    this.registry.register(new StartNodeExecutor())
    this.registry.register(new EndNodeExecutor())
    
    // 业务节点
    this.registry.register(new LLMNodeExecutor())
    this.registry.register(new ActionNodeExecutor())
    this.registry.register(new AgentNodeExecutor())
    
    // Agent子组件节点
    this.registry.register(new AgentLLMNodeExecutor())
    this.registry.register(new AgentMemoryNodeExecutor())
    this.registry.register(new AgentToolsNodeExecutor())
    
    // 工具和记忆节点
    this.registry.register(new MemoryNodeExecutor())
    this.registry.register(new ToolNodeExecutor())
    
    // 控制流节点
    this.registry.register(new IfNodeExecutor())
    this.registry.register(new LoopNodeExecutor())
    this.registry.register(new SwitchNodeExecutor())
    this.registry.register(new TryCatchNodeExecutor())
    
    // 分支和块节点
    this.registry.register(new CaseNodeExecutor())
    this.registry.register(new CaseDefaultNodeExecutor())
    this.registry.register(new IfBlockNodeExecutor())
    this.registry.register(new TryBlockNodeExecutor())
    this.registry.register(new CatchBlockNodeExecutor())
    this.registry.register(new BreakLoopNodeExecutor())
  }

  /**
   * 获取注册器
   */
  getRegistry(): NodeRegistry {
    return this.registry
  }

  /**
   * 注册新节点
   */
  register(executor: BaseNodeExecutor): void {
    this.registry.register(executor)
  }

  /**
   * 注销节点
   */
  unregister(nodeType: string): void {
    this.registry.unregister(nodeType)
  }

  /**
   * 获取节点执行器
   */
  getExecutor(nodeType: string): BaseNodeExecutor | undefined {
    return this.registry.get(nodeType)
  }

  /**
   * 获取所有支持的节点类型
   */
  getSupportedNodeTypes(): string[] {
    return this.registry.getNodeTypes()
  }

  /**
   * 检查是否支持某个节点类型
   */
  isSupported(nodeType: string): boolean {
    return this.registry.get(nodeType) !== undefined
  }

  /**
   * 获取节点统计信息
   */
  getStats(): { totalTypes: number; supportedTypes: string[] } {
    const supportedTypes = this.getSupportedNodeTypes()
    return {
      totalTypes: supportedTypes.length,
      supportedTypes
    }
  }
}

// 导出默认实例
export const defaultNodeRegistry = new NodeRegistryManager()
