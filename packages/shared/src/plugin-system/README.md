# FlowTune 插件系统设计文档

## 概述

FlowTune 插件系统是一个可扩展的架构，支持多种类型的插件，包括流程节点、风格样式、属性编辑控件等。该系统基于现有的 Flowgram.ai 强大基础，提供了企业级的可维护性和可扩展性。

## 核心特性

### 1. 插件类型支持
- **节点插件 (NODE)**: 自定义流程节点，包含完整的元数据、UI、验证和执行逻辑
- **主题插件 (THEME)**: 风格样式系统，支持深度定制界面外观
- **属性插件 (PROPERTY)**: 属性编辑控件，提供丰富的数据输入组件
- **画布插件 (CANVAS)**: 画布功能扩展
- **工具栏插件 (TOOLBAR)**: 工具栏自定义
- **面板插件 (PANEL)**: 侧边面板扩展
- **连接器插件 (CONNECTOR)**: 自定义连接线类型
- **运行时插件 (RUNTIME)**: 运行时功能扩展

### 2. 节点系统特性
- **完整的元数据系统**: 包含节点约束、配置、UI设置等
- **验证系统**: 支持多时机验证（创建、更新、连接、保存、运行前）
- **表单集成**: 基于 Flowgram.ai 的强大表单系统
- **事件处理**: 完整的节点生命周期事件
- **执行器**: 异步执行支持，包含中断、预检查等高级功能

### 3. 主题系统特性
- **变量系统**: 支持主题变量和动态配置
- **节点样式**: 多状态样式支持（默认、悬停、选中、激活、错误、运行中）
- **连接线样式**: 灵活的连接线外观配置
- **画布样式**: 背景、网格、缩放等全面定制
- **CSS注入**: 支持自定义 CSS 样式

### 4. 属性编辑系统
- **类型化编辑器**: 针对不同数据类型的专用编辑器
- **验证支持**: 内置和自定义验证规则
- **动态配置**: 支持动态选项和配置
- **多选支持**: 复杂数据结构编辑

## 架构设计

### 核心组件

```
PluginManager
├── NodeRegistry        # 节点类型注册管理
├── ThemeRegistry       # 主题注册管理  
├── PropertyRegistry    # 属性编辑器注册管理
├── EventBus           # 事件总线
└── Storage            # 持久化存储
```

### 插件生命周期

1. **注册** (Register): 插件被添加到系统
2. **验证** (Validate): 检查插件格式和依赖
3. **激活** (Activate): 插件开始工作，注册功能
4. **运行** (Running): 插件正常工作状态
5. **停用** (Deactivate): 插件停止工作，清理资源
6. **卸载** (Unregister): 从系统中移除插件

### 事件系统

```typescript
// 插件事件
plugin:registered    // 插件注册
plugin:unregistered  // 插件卸载
plugin:enabled      // 插件启用
plugin:disabled     // 插件禁用

// 节点事件
nodeType:registered    // 节点类型注册
nodeType:unregistered  // 节点类型注销

// 主题事件
theme:registered    // 主题注册
theme:unregistered  // 主题注销
theme:changed      // 主题切换

// 属性编辑器事件
propertyEditor:registered    // 属性编辑器注册
propertyEditor:unregistered  // 属性编辑器注销
```

## 使用示例

### 1. 系统初始化

\`\`\`typescript
import { createPluginSystem } from '@flowtune/shared';
import { MyCanvasAPI } from './canvas-api';

// 创建插件系统
const pluginSystem = createPluginSystem({
  storagePrefix: 'flowtune:',
  canvasAPI: new MyCanvasAPI()
});

const { pluginManager, nodeRegistry, themeRegistry } = pluginSystem;
\`\`\`

### 2. 创建节点插件

\`\`\`typescript
import { INodePlugin, PluginCategory, NodeGroup } from '@flowtune/shared';

const myNodePlugin: INodePlugin = {
  id: 'my-company.my-node',
  name: 'My Custom Node',
  version: '1.0.0',
  category: PluginCategory.NODE,
  nodeTypes: [{
    type: 'custom-processor',
    displayName: 'Data Processor',
    description: 'Process data with custom logic',
    icon: '⚙️',
    group: NodeGroup.DATA,
    meta: {
      deletable: true,
      copyable: true,
      defaultPorts: [
        { type: 'input', name: 'data' },
        { type: 'output', name: 'result' }
      ]
    },
    uiMeta: {
      size: { width: 200, height: 100 },
      showInNodePanel: true
    },
    formMeta: {
      render: ({ form }) => (
        <div>
          <Field name="processorType">
            {({ field }) => (
              <select {...field}>
                <option value="filter">Filter</option>
                <option value="transform">Transform</option>
                <option value="aggregate">Aggregate</option>
              </select>
            )}
          </Field>
        </div>
      ),
      validate: {
        processorType: ({ value }) => value ? undefined : 'Required'
      }
    },
    validators: [{
      name: 'data-validator',
      validate: (node) => ({ valid: true }),
      trigger: [ValidationTrigger.CREATE]
    }],
    renderer: {
      render: (props) => <MyNodeRenderer {...props} />
    },
    executor: {
      execute: async (node, context) => {
        // 执行节点逻辑
        return { success: true, outputs: {} };
      }
    }
  }],
  activate: async (context) => {
    console.log('Node plugin activated');
  }
};

// 注册插件
await pluginManager.registerPlugin(myNodePlugin);
\`\`\`

### 3. 创建主题插件

\`\`\`typescript
const myThemePlugin: IThemePlugin = {
  id: 'my-company.blue-theme',
  name: 'Blue Theme',
  version: '1.0.0',
  category: PluginCategory.THEME,
  theme: {
    id: 'blue-theme',
    name: 'Blue Theme',
    variables: {
      primary: '#2196f3',
      secondary: '#64b5f6',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#212121',
      border: '#e0e0e0',
      shadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      fontFamily: 'Roboto, sans-serif'
    },
    nodeStyles: {
      default: {
        default: {
          backgroundColor: '#ffffff',
          borderColor: '#e0e0e0',
          borderRadius: 8
        },
        selected: {
          borderColor: '#2196f3',
          borderWidth: 2
        }
      }
    },
    edgeStyles: {
      default: {
        default: {
          color: '#757575',
          width: 2
        }
      }
    },
    canvasStyle: {
      backgroundColor: '#f5f5f5',
      grid: {
        visible: true,
        size: 20,
        color: '#e0e0e0',
        type: 'dot'
      }
    }
  },
  activate: async (context) => {
    // 应用主题
    context.themeRegistry.setCurrentTheme('blue-theme');
  }
};

await pluginManager.registerPlugin(myThemePlugin);
\`\`\`

### 4. 创建属性编辑器插件

\`\`\`typescript
const SliderEditor: React.FC<PropertyEditorProps> = ({ 
  value, 
  onChange, 
  property 
}) => {
  return (
    <div>
      <label>{property.name}</label>
      <input
        type="range"
        min={property.editorConfig?.min || 0}
        max={property.editorConfig?.max || 100}
        value={value || 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span>{value}</span>
    </div>
  );
};

const propertyPlugin: IPropertyPlugin = {
  id: 'my-company.property-editors',
  name: 'Custom Property Editors',
  version: '1.0.0',
  category: PluginCategory.PROPERTY,
  editors: [{
    id: 'slider-editor',
    name: 'Slider Editor',
    supportedTypes: ['number', 'range'],
    component: SliderEditor,
    config: {
      options: {
        showValue: true,
        step: 1
      }
    }
  }],
  activate: async (context) => {
    console.log('Property editors plugin activated');
  }
};

await pluginManager.registerPlugin(propertyPlugin);
\`\`\`

## 最佳实践

### 1. 插件命名规范
- 使用反向域名格式: `company.plugin-name`
- 版本号使用语义化版本: `major.minor.patch`
- 插件名称要清晰描述功能

### 2. 节点设计原则
- **单一职责**: 每个节点只做一件事
- **可配置**: 通过表单提供必要的配置选项
- **错误处理**: 提供清晰的错误信息和恢复机制
- **性能优化**: 避免阻塞操作，使用异步执行

### 3. 主题设计建议
- **一致性**: 保持整体设计风格一致
- **可访问性**: 考虑色盲用户和对比度要求
- **响应式**: 支持不同的显示设备和分辨率
- **性能**: 避免过于复杂的 CSS 动画

### 4. 验证策略
- **及时验证**: 在适当的时机进行验证
- **用户友好**: 提供清晰的错误消息
- **性能考虑**: 避免过于频繁的验证
- **渐进式**: 支持警告和错误两个级别

## 扩展点

### 1. 自定义验证器
实现 `INodeValidator` 接口，在特定时机进行验证。

### 2. 自定义执行器
实现 `INodeExecutor` 接口，提供节点运行时逻辑。

### 3. 自定义渲染器
实现 `INodeRenderer` 接口，完全控制节点外观。

### 4. 事件处理
通过 `INodeEventHandlers` 响应节点生命周期事件。

## 技术栈集成

### 与 Flowgram.ai 集成
- 基于 Flowgram.ai 的表单系统
- 复用 Flowgram.ai 的画布引擎
- 兼容 Flowgram.ai 的节点系统

### 与 FlowTune 后端集成
- 节点执行器可以调用后端 API
- 支持与流引擎的执行结果集成
- 验证可以包含服务器端检查

### 与 Electron 集成
- 插件可以访问 Electron API
- 支持本地文件系统操作
- 可以集成原生模块

## 性能优化

### 1. 懒加载
- 插件按需加载
- 节点类型延迟注册
- 动态导入插件代码

### 2. 缓存策略
- 插件配置缓存
- 节点元数据缓存
- 主题样式缓存

### 3. 内存管理
- 及时清理停用插件资源
- 避免内存泄漏
- 优化大量节点的渲染

这个插件系统为 FlowTune 提供了强大的扩展能力，支持企业级的工作流设计器需求，同时保持了良好的开发体验和维护性。
