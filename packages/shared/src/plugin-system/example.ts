/**
 * FlowTune 插件系统使用示例
 * Plugin System Usage Example for FlowTune
 */

import {
  createPluginSystem,
  IPlugin,
  INodePlugin,
  IThemePlugin,
  PluginCategory,
  NodeGroup,
  ICanvasAPI,
  IFlowNode,
  IConnection,
  ValidationTrigger,
  FormFieldType
} from './index';

// ============= 模拟画布 API 实现 =============

class MockCanvasAPI implements ICanvasAPI {
  private nodes: IFlowNode[] = [];
  private connections: IConnection[] = [];

  addNode(node: IFlowNode): void {
    this.nodes.push(node);
    console.log(`Added node: ${node.id} (${node.type})`);
  }

  deleteNode(nodeId: string): void {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    console.log(`Deleted node: ${nodeId}`);
  }

  updateNode(nodeId: string, updates: Partial<IFlowNode>): void {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      Object.assign(node, updates);
      console.log(`Updated node: ${nodeId}`);
    }
  }

  getNode(nodeId: string): IFlowNode | null {
    return this.nodes.find(n => n.id === nodeId) || null;
  }

  getAllNodes(): IFlowNode[] {
    return [...this.nodes];
  }

  connectNodes(connection: IConnection): void {
    this.connections.push(connection);
    console.log(`Connected: ${connection.sourceNodeId} -> ${connection.targetNodeId}`);
  }

  disconnectNodes(connectionId: string): void {
    this.connections = this.connections.filter(c => c.id !== connectionId);
    console.log(`Disconnected: ${connectionId}`);
  }

  getConnection(connectionId: string): IConnection | null {
    return this.connections.find(c => c.id === connectionId) || null;
  }

  getAllConnections(): IConnection[] {
    return [...this.connections];
  }

  zoomTo(scale: number): void {
    console.log(`Zoom to: ${scale}`);
  }

  fitView(): void {
    console.log('Fit view');
  }

  centerView(): void {
    console.log('Center view');
  }
}

// ============= 示例插件定义 =============

/**
 * 基础节点插件示例
 */
const BasicNodePlugin: INodePlugin = {
  id: 'flowtune.basic-nodes',
  name: 'Basic Nodes Plugin',
  version: '1.0.0',
  description: 'Provides basic workflow nodes',
  author: 'FlowTune Team',
  category: PluginCategory.NODE,
  nodeTypes: [
    {
      type: 'timer',
      displayName: 'Timer',
      description: 'Wait for a specified duration',
      icon: '⏰',
      group: NodeGroup.BASIC,
      tags: ['time', 'delay', 'wait'],
      meta: {
        deletable: true,
        copyable: true,
        editable: true,
        defaultPorts: [
          { type: 'input', name: 'trigger' },
          { type: 'output', name: 'completed' }
        ],
        constraints: {
          maxInputs: 1,
          maxOutputs: 1
        }
      },
      uiMeta: {
        size: { width: 150, height: 60 },
        showInNodePanel: true,
        className: 'timer-node'
      },
      formMeta: {
        fields: [
          {
            name: 'duration',
            type: FormFieldType.NUMBER,
            label: '等待时长',
            description: '指定等待的时长（毫秒）',
            placeholder: '请输入等待时长',
            defaultValue: 1000,
            validation: {
              required: true,
              min: 1,
              message: '等待时长必须大于0'
            },
            config: {
              componentProps: {
                step: 100,
                min: 1
              }
            },
            order: 1,
            group: 'basic'
          },
          {
            name: 'unit',
            type: FormFieldType.SELECT,
            label: '时间单位',
            description: '选择时间单位',
            defaultValue: 'ms',
            options: [
              { value: 'ms', label: '毫秒' },
              { value: 's', label: '秒' },
              { value: 'm', label: '分钟' }
            ],
            validation: {
              required: true
            },
            order: 2,
            group: 'basic'
          },
          {
            name: 'description',
            type: FormFieldType.TEXTAREA,
            label: '节点描述',
            description: '可选的节点描述信息',
            placeholder: '输入节点描述...',
            defaultValue: '',
            config: {
              componentProps: {
                rows: 3
              }
            },
            order: 3,
            group: 'advanced'
          }
        ],
        groups: {
          basic: {
            title: '基础配置',
            description: '节点的基本参数配置',
            defaultExpanded: true
          },
          advanced: {
            title: '高级配置',
            description: '可选的高级配置项',
            collapsible: true,
            defaultExpanded: false
          }
        },
        layout: 'vertical',
        size: 'medium',
        defaultValues: {
          duration: 1000,
          unit: 'ms',
          description: ''
        }
      },
      validators: [
        {
          name: 'duration-validator',
          validate: (node) => {
            const duration = node.data.duration;
            if (!duration || duration <= 0) {
              return {
                valid: false,
                errors: [{ 
                  code: 'INVALID_DURATION', 
                  message: 'Duration must be greater than 0', 
                  level: 'error' 
                }]
              };
            }
            return { valid: true };
          },
          trigger: [ValidationTrigger.CREATE, ValidationTrigger.UPDATE]
        }
      ],
      renderer: {
        render: () => null // 简化示例，实际中需要实现 React 组件
      },
      executor: {
        execute: async (node, context) => {
          const duration = node.data.duration || 1000;
          
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                outputs: {
                  completedAt: new Date().toISOString(),
                  duration
                }
              });
            }, duration);
          });
        },
        canAbort: true,
        abort: async (node) => {
          console.log(`Aborting timer node: ${node.id}`);
        }
      },
      eventHandlers: {
        onDataChange: (node, oldData, newData) => {
          console.log(`Timer node ${node.id} data changed:`, { oldData, newData });
        }
      }
    },
    {
      type: 'log',
      displayName: 'Log Output',
      description: 'Output data to console log',
      icon: '📝',
      group: NodeGroup.BASIC,
      tags: ['log', 'debug', 'output'],
      meta: {
        deletable: true,
        copyable: true,
        editable: true,
        defaultPorts: [
          { type: 'input', name: 'data' }
        ]
      },
      uiMeta: {
        size: { width: 120, height: 50 },
        showInNodePanel: true,
        className: 'log-node'
      },
      formMeta: {
        fields: [
          {
            name: 'level',
            type: FormFieldType.SELECT,
            label: '日志级别',
            description: '选择日志输出级别',
            defaultValue: 'info',
            options: [
              { value: 'debug', label: 'Debug' },
              { value: 'info', label: 'Info' },
              { value: 'warn', label: 'Warning' },
              { value: 'error', label: 'Error' }
            ],
            validation: {
              required: true
            },
            order: 1
          },
          {
            name: 'prefix',
            type: FormFieldType.INPUT,
            label: '日志前缀',
            description: '日志消息的前缀标识',
            placeholder: '输入日志前缀',
            defaultValue: '[LOG]',
            validation: {
              required: false,
              max: 20,
              message: '前缀长度不能超过20个字符'
            },
            config: {
              inputType: 'text'
            },
            order: 2
          },
          {
            name: 'format',
            type: FormFieldType.CHECKBOX,
            label: '格式化输出',
            description: '是否格式化 JSON 数据输出',
            defaultValue: true,
            order: 3
          }
        ],
        layout: 'vertical',
        size: 'medium',
        defaultValues: {
          level: 'info',
          prefix: '[LOG]',
          format: true
        }
      },
      validators: [],
      renderer: {
        render: () => null
      },
      executor: {
        execute: async (node, context) => {
          const { level = 'info', prefix = '[LOG]' } = node.data;
          const logData = context.inputs.data;
          
          // 安全的日志输出
          if (level === 'debug') {
            console.debug(prefix, logData);
          } else if (level === 'warn') {
            console.warn(prefix, logData);
          } else if (level === 'error') {
            console.error(prefix, logData);
          } else {
            console.info(prefix, logData);
          }
          
          return {
            success: true,
            outputs: {
              logged: true,
              timestamp: new Date().toISOString()
            }
          };
        }
      }
    }
  ],
  activate: async (context) => {
    console.log('Basic Nodes Plugin activated');
    
    // 监听节点类型注册事件
    context.eventBus.on('nodeType:registered', (data) => {
      console.log(`Node type registered: ${data.nodeType.type}`);
    });
  },
  deactivate: async () => {
    console.log('Basic Nodes Plugin deactivated');
  }
};

/**
 * 默认主题插件示例
 */
const DefaultThemePlugin: IThemePlugin = {
  id: 'flowtune.default-theme',
  name: 'Default Theme Plugin',
  version: '1.0.0',
  description: 'Provides the default theme for FlowTune',
  author: 'FlowTune Team',
  category: PluginCategory.THEME,
  config: {
    defaultEnabled: true
  },
  theme: {
    id: 'default-theme',
    name: 'Default Theme',
    variables: {
      primary: '#007acc',
      secondary: '#6c757d',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#212529',
      border: '#dee2e6',
      shadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderRadius: '4px',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    },
    nodeStyles: {
      default: {
        default: {
          backgroundColor: '#ffffff',
          borderColor: '#dee2e6',
          borderWidth: 1,
          borderRadius: 4,
          color: '#212529',
          padding: 12,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        },
        hover: {
          borderColor: '#007acc',
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
        },
        selected: {
          borderColor: '#007acc',
          borderWidth: 2,
          boxShadow: '0 0 0 2px rgba(0,122,204,0.2)'
        },
        active: {
          backgroundColor: '#e7f3ff'
        },
        error: {
          borderColor: '#dc3545',
          backgroundColor: '#f8d7da'
        },
        running: {
          borderColor: '#ffc107',
          backgroundColor: '#fff3cd'
        }
      }
    },
    edgeStyles: {
      default: {
        default: {
          color: '#6c757d',
          width: 2,
          arrow: true
        },
        hover: {
          color: '#007acc',
          width: 3
        },
        selected: {
          color: '#007acc',
          width: 3
        }
      }
    },
    canvasStyle: {
      backgroundColor: '#f8f9fa',
      grid: {
        visible: true,
        size: 20,
        color: '#e9ecef',
        type: 'dot'
      },
      zoomLimits: {
        min: 0.1,
        max: 5.0
      }
    },
    customCSS: `
      .flowtune-canvas {
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      .timer-node {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      .log-node {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }
    `
  },
  activate: async (context) => {
    console.log('Default Theme Plugin activated');
    
    // 自动设置为当前主题
    context.themeRegistry.setCurrentTheme('default-theme');
  }
};

// ============= 使用示例 =============

/**
 * 插件系统使用示例
 */
export async function runPluginSystemExample() {
  console.log('=== FlowTune Plugin System Example ===\n');

  // 1. 创建插件系统
  console.log('1. Creating plugin system...');
  const canvasAPI = new MockCanvasAPI();
  const pluginSystem = createPluginSystem({
    storagePrefix: 'flowtune-example:',
    canvasAPI
  });

  const { pluginManager, nodeRegistry, themeRegistry, eventBus } = pluginSystem;

  // 2. 监听系统事件
  console.log('2. Setting up event listeners...');
  eventBus.on('plugin:enabled', (data: any) => {
    console.log(`  ✓ Plugin enabled: ${data.plugin.name}`);
  });

  eventBus.on('theme:changed', (data: any) => {
    console.log(`  ✓ Theme changed to: ${data.theme.name}`);
  });

  // 3. 注册并启用插件
  console.log('3. Registering plugins...');
  await pluginManager.registerPlugin(BasicNodePlugin);
  await pluginManager.registerPlugin(DefaultThemePlugin);

  // 4. 查看注册的节点类型
  console.log('\n4. Available node types:');
  const nodeTypes = nodeRegistry.getAllNodeTypes();
  nodeTypes.forEach((nodeType: any) => {
    console.log(`  - ${nodeType.displayName} (${nodeType.type}): ${nodeType.description}`);
  });

  // 5. 查看可用主题
  console.log('\n5. Available themes:');
  const themes = themeRegistry.getAllThemes();
  themes.forEach((theme: any) => {
    console.log(`  - ${theme.name} (${theme.id})`);
  });

  const currentTheme = themeRegistry.getCurrentTheme();
  console.log(`  Current theme: ${currentTheme?.name || 'None'}`);

  // 6. 测试节点创建和验证
  console.log('\n6. Testing node creation and validation...');
  
  // 创建一个定时器节点
  const timerNode: IFlowNode = {
    id: 'timer-1',
    type: 'timer',
    data: { duration: 2000, unit: 'ms' },
    position: { x: 100, y: 100 }
  };

  const timerNodeType = nodeRegistry.getNodeType('timer');
  if (timerNodeType) {
    // 验证节点
    for (const validator of timerNodeType.validators || []) {
      const result = validator.validate(timerNode, {});
      console.log(`  Validation ${validator.name}: ${result.valid ? '✓ Valid' : '✗ Invalid'}`);
      if (!result.valid && result.errors) {
        result.errors.forEach((error: any) => {
          console.log(`    Error: ${error.message}`);
        });
      }
    }

    // 添加到画布
    canvasAPI.addNode(timerNode);
  }

  // 7. 测试节点执行
  console.log('\n7. Testing node execution...');
  const logNodeType = nodeRegistry.getNodeType('log');
  if (logNodeType && logNodeType.executor) {
    const logNode: IFlowNode = {
      id: 'log-1',
      type: 'log',
      data: { level: 'info', prefix: '[EXAMPLE]' },
      position: { x: 300, y: 100 }
    };

    const executionResult = await logNodeType.executor.execute(logNode, {
      flow: { id: 'test-flow', name: 'Test Flow', version: '1.0.0', nodes: [], edges: [], config: {} },
      inputs: { data: 'Hello from FlowTune Plugin System!' },
      variables: {},
      config: { debug: true },
      logger: {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error
      }
    });

    console.log(`  Execution result: ${executionResult.success ? '✓ Success' : '✗ Failed'}`);
    if (executionResult.outputs) {
      console.log(`  Outputs:`, executionResult.outputs);
    }
  }

  // 8. 测试插件管理
  console.log('\n8. Plugin management status:');
  const allPlugins = pluginManager.getAllPlugins();
  const enabledPlugins = pluginManager.getEnabledPlugins();
  
  console.log(`  Total plugins: ${allPlugins.length}`);
  console.log(`  Enabled plugins: ${enabledPlugins.length}`);
  
  enabledPlugins.forEach((plugin: any) => {
    console.log(`    - ${plugin.name} v${plugin.version} (${plugin.category})`);
  });

  // 9. 测试搜索功能
  console.log('\n9. Testing search functionality...');
  const searchResults = nodeRegistry.searchNodeTypes('time');
  console.log(`  Search results for "time": ${searchResults.length} found`);
  searchResults.forEach((nodeType: any) => {
    console.log(`    - ${nodeType.displayName}: ${nodeType.description}`);
  });

  console.log('\n=== Example completed successfully ===');
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  runPluginSystemExample().catch(console.error);
}
