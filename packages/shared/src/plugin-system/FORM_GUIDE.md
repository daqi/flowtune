# FlowTune 插件系统 - 表单配置详解

## 概述

FlowTune 插件系统现在支持详细的表单配置，用于定义节点属性编辑界面。这个新的表单系统提供了丰富的字段类型、验证规则、条件显示等功能。

## 表单字段类型

### 基础字段类型

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| `INPUT` | 文本输入框 | 名称、URL、简短文本 |
| `NUMBER` | 数字输入框 | 数量、时间、大小等数值 |
| `TEXTAREA` | 多行文本框 | 描述、代码片段、长文本 |
| `SELECT` | 下拉选择框 | 枚举值、分类选择 |
| `CHECKBOX` | 复选框 | 开关选项、布尔值 |
| `RADIO` | 单选按钮组 | 互斥选择项 |

### 高级字段类型

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| `SLIDER` | 滑块控件 | 范围值、百分比调节 |
| `COLOR` | 颜色选择器 | 颜色配置、主题设置 |
| `DATE` | 日期选择器 | 日期配置 |
| `TIME` | 时间选择器 | 时间配置 |
| `FILE` | 文件选择器 | 文件上传、资源选择 |
| `JSON` | JSON 编辑器 | 复杂配置对象 |
| `CODE` | 代码编辑器 | 脚本、表达式编写 |

## 字段配置结构

```typescript
interface IFormField {
  name: string;                    // 字段名（对应节点属性）
  type: FormFieldType;             // 字段类型
  label: string;                   // 显示标签
  description?: string;            // 帮助文本
  placeholder?: string;            // 占位符
  defaultValue?: any;              // 默认值
  validation?: IFormFieldValidation; // 验证规则
  options?: IFormFieldOption[];    // 选项列表（select/radio）
  config?: object;                 // 字段特定配置
  when?: object;                   // 条件显示规则
  order?: number;                  // 排序权重
  group?: string;                  // 所属分组
}
```

## 验证规则

### 内置验证

```typescript
interface IFormFieldValidation {
  required?: boolean;              // 是否必填
  min?: number;                    // 最小值/长度
  max?: number;                    // 最大值/长度
  pattern?: string;                // 正则表达式
  message?: string;                // 错误消息
  validator?: (value, allValues) => string | null; // 自定义验证
}
```

### 验证示例

```typescript
// URL 验证
validation: {
  required: true,
  pattern: '^https?:\\/\\/.*',
  message: '请输入有效的 HTTP/HTTPS URL'
}

// 数值范围验证
validation: {
  required: true,
  min: 1,
  max: 3600,
  message: '超时时间必须在 1-3600 秒之间'
}

// 自定义验证
validation: {
  validator: (value, allValues) => {
    if (allValues.saveResponse && !value) {
      return '保存响应时必须指定变量名';
    }
    return null;
  }
}
```

## 条件显示

使用 `when` 属性可以根据其他字段的值控制字段的显示：

```typescript
// 当请求方法为 POST/PUT/PATCH 时才显示请求体字段
when: {
  field: 'method',
  operator: 'in',
  value: ['POST', 'PUT', 'PATCH']
}

// 当启用保存响应时才显示变量名字段
when: {
  field: 'saveResponse',
  operator: 'equals',
  value: true
}
```

支持的操作符：
- `equals` / `not_equals`
- `in` / `not_in` 
- `greater` / `less`

## 字段分组

通过 `groups` 配置可以将字段组织到不同的分组中：

```typescript
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
}
```

## 完整示例

### HTTP 请求节点

```typescript
formMeta: {
  fields: [
    {
      name: 'method',
      type: FormFieldType.SELECT,
      label: '请求方法',
      defaultValue: 'GET',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        // ...更多选项
      ],
      validation: { required: true },
      group: 'basic'
    },
    {
      name: 'url',
      type: FormFieldType.INPUT,
      label: '请求 URL',
      placeholder: 'https://api.example.com/data',
      validation: {
        required: true,
        pattern: '^https?:\\/\\/.*',
        message: '请输入有效的 HTTP/HTTPS URL'
      },
      config: { inputType: 'url' },
      group: 'basic'
    },
    {
      name: 'body',
      type: FormFieldType.CODE,
      label: '请求体',
      config: { 
        language: 'json',
        componentProps: { height: 200 }
      },
      when: {
        field: 'method',
        operator: 'in',
        value: ['POST', 'PUT', 'PATCH']
      },
      group: 'body'
    }
  ],
  groups: {
    basic: { title: '基础配置', defaultExpanded: true },
    body: { title: '请求体', collapsible: true }
  },
  layout: 'vertical'
}
```

## 使用建议

### 1. 字段命名
- 使用描述性的字段名，对应节点数据的属性名
- 遵循 camelCase 命名约定

### 2. 分组组织
- 将相关字段组织到同一分组
- 基础配置默认展开，高级配置可折叠
- 分组标题简洁明了

### 3. 验证规则
- 为必填字段添加 `required: true`
- 提供清晰的错误消息
- 使用合适的验证规则（min/max/pattern）

### 4. 用户体验
- 提供有意义的占位符文本
- 添加字段描述帮助用户理解
- 使用条件显示减少界面复杂度

### 5. 性能考虑
- 避免过深的嵌套配置
- 合理使用条件显示，避免频繁重渲染
- 对复杂验证使用防抖处理

## 与原生 Flowgram.ai 表单兼容

系统同时支持新的字段配置和原生 Flowgram.ai 表单：

```typescript
formMeta: {
  // 使用新的字段配置
  fields: [...],
  groups: {...},
  
  // 或者使用原生表单
  useNativeForm: true,
  nativeFormMeta: {
    // 原生 Flowgram.ai FormMeta
  }
}
```

这样既保证了向后兼容性，又提供了更强大的表单配置能力。
