/**
 * FlowTune 插件系统 - 完整表单配置示例
 * Complete Form Configuration Examples for FlowTune Plugin System
 */

import {
  INodePlugin,
  PluginCategory,
  NodeGroup,
  FormFieldType,
  ValidationTrigger
} from './index';

/**
 * HTTP 请求节点插件 - 展示完整的表单配置
 */
export const HttpRequestNodePlugin: INodePlugin = {
  id: 'flowtune.http-request',
  name: 'HTTP Request Node Plugin',
  version: '1.0.0',
  description: 'HTTP request node with comprehensive form configuration',
  author: 'FlowTune Team',
  category: PluginCategory.NODE,
  nodeTypes: [
    {
      type: 'http-request',
      displayName: 'HTTP 请求',
      description: '发送 HTTP 请求并处理响应',
      icon: '🌐',
      group: NodeGroup.API,
      tags: ['http', 'request', 'api', 'network'],
      meta: {
        deletable: true,
        copyable: true,
        editable: true,
        defaultPorts: [
          { type: 'input', name: 'trigger' },
          { type: 'output', name: 'success' },
          { type: 'output', name: 'error' }
        ],
        constraints: {
          maxInputs: 1,
          maxOutputs: 2
        }
      },
      uiMeta: {
        size: { width: 180, height: 80 },
        showInNodePanel: true,
        className: 'http-request-node'
      },
      formMeta: {
        fields: [
          // 基础配置组
          {
            name: 'method',
            type: FormFieldType.SELECT,
            label: '请求方法',
            description: '选择 HTTP 请求方法',
            defaultValue: 'GET',
            options: [
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'DELETE', label: 'DELETE' },
              { value: 'PATCH', label: 'PATCH' },
              { value: 'HEAD', label: 'HEAD' },
              { value: 'OPTIONS', label: 'OPTIONS' }
            ],
            validation: {
              required: true
            },
            order: 1,
            group: 'basic'
          },
          {
            name: 'url',
            type: FormFieldType.INPUT,
            label: '请求 URL',
            description: '完整的请求 URL 地址',
            placeholder: 'https://api.example.com/data',
            defaultValue: '',
            validation: {
              required: true,
              pattern: '^https?:\\/\\/.*',
              message: '请输入有效的 HTTP/HTTPS URL'
            },
            config: {
              inputType: 'url'
            },
            order: 2,
            group: 'basic'
          },
          
          // 请求头配置
          {
            name: 'contentType',
            type: FormFieldType.SELECT,
            label: 'Content-Type',
            description: '请求内容类型',
            defaultValue: 'application/json',
            options: [
              { value: 'application/json', label: 'application/json' },
              { value: 'application/x-www-form-urlencoded', label: 'application/x-www-form-urlencoded' },
              { value: 'multipart/form-data', label: 'multipart/form-data' },
              { value: 'text/plain', label: 'text/plain' },
              { value: 'text/xml', label: 'text/xml' }
            ],
            when: {
              field: 'method',
              operator: 'in',
              value: ['POST', 'PUT', 'PATCH']
            },
            order: 3,
            group: 'headers'
          },
          {
            name: 'customHeaders',
            type: FormFieldType.JSON,
            label: '自定义请求头',
            description: '添加自定义 HTTP 请求头（JSON 格式）',
            placeholder: '{"Authorization": "Bearer token", "X-API-Key": "key"}',
            defaultValue: {},
            validation: {
              required: false,
              validator: (value) => {
                try {
                  if (typeof value === 'string' && value.trim()) {
                    JSON.parse(value);
                  }
                  return null;
                } catch {
                  return '请输入有效的 JSON 格式';
                }
              }
            },
            order: 4,
            group: 'headers'
          },
          
          // 请求体配置
          {
            name: 'body',
            type: FormFieldType.CODE,
            label: '请求体',
            description: '请求体数据（JSON 格式）',
            placeholder: '{\n  "key": "value"\n}',
            defaultValue: '',
            validation: {
              required: false
            },
            config: {
              language: 'json',
              componentProps: {
                height: 200,
                options: {
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  folding: true
                }
              }
            },
            when: {
              field: 'method',
              operator: 'in',
              value: ['POST', 'PUT', 'PATCH']
            },
            order: 5,
            group: 'body'
          },
          
          // 超时配置
          {
            name: 'timeout',
            type: FormFieldType.SLIDER,
            label: '超时时间（秒）',
            description: '请求超时时间，0 表示无限制',
            defaultValue: 30,
            validation: {
              required: false,
              min: 0,
              max: 300
            },
            config: {
              range: { min: 0, max: 300, step: 5 }
            },
            order: 6,
            group: 'advanced'
          },
          {
            name: 'retries',
            type: FormFieldType.NUMBER,
            label: '重试次数',
            description: '失败时的重试次数',
            defaultValue: 0,
            validation: {
              required: false,
              min: 0,
              max: 10
            },
            config: {
              componentProps: {
                min: 0,
                max: 10,
                step: 1
              }
            },
            order: 7,
            group: 'advanced'
          },
          {
            name: 'followRedirects',
            type: FormFieldType.CHECKBOX,
            label: '跟随重定向',
            description: '是否自动跟随 HTTP 重定向',
            defaultValue: true,
            order: 8,
            group: 'advanced'
          },
          {
            name: 'validateSSL',
            type: FormFieldType.CHECKBOX,
            label: '验证 SSL 证书',
            description: '是否验证 HTTPS 证书',
            defaultValue: true,
            order: 9,
            group: 'advanced'
          },
          
          // 响应处理
          {
            name: 'responseFormat',
            type: FormFieldType.RADIO,
            label: '响应格式',
            description: '选择响应数据的处理格式',
            defaultValue: 'json',
            options: [
              { value: 'json', label: 'JSON 对象' },
              { value: 'text', label: '纯文本' },
              { value: 'blob', label: '二进制数据' },
              { value: 'buffer', label: '缓冲区' }
            ],
            validation: {
              required: true
            },
            order: 10,
            group: 'response'
          },
          {
            name: 'saveResponse',
            type: FormFieldType.CHECKBOX,
            label: '保存响应到变量',
            description: '是否将响应保存到工作流变量中',
            defaultValue: false,
            order: 11,
            group: 'response'
          },
          {
            name: 'responseVariableName',
            type: FormFieldType.INPUT,
            label: '响应变量名',
            description: '保存响应数据的变量名称',
            placeholder: 'httpResponse',
            defaultValue: '',
            validation: {
              required: true,
              pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$',
              message: '变量名只能包含字母、数字和下划线，且不能以数字开头'
            },
            when: {
              field: 'saveResponse',
              operator: 'equals',
              value: true
            },
            order: 12,
            group: 'response'
          }
        ],
        groups: {
          basic: {
            title: '基础配置',
            description: '基本的请求参数配置',
            defaultExpanded: true
          },
          headers: {
            title: '请求头',
            description: '配置 HTTP 请求头信息',
            collapsible: true,
            defaultExpanded: false
          },
          body: {
            title: '请求体',
            description: '配置请求体数据',
            collapsible: true,
            defaultExpanded: false
          },
          advanced: {
            title: '高级选项',
            description: '超时、重试等高级配置',
            collapsible: true,
            defaultExpanded: false
          },
          response: {
            title: '响应处理',
            description: '响应数据处理方式',
            collapsible: true,
            defaultExpanded: false
          }
        },
        layout: 'vertical',
        size: 'medium',
        defaultValues: {
          method: 'GET',
          url: '',
          contentType: 'application/json',
          customHeaders: {},
          body: '',
          timeout: 30,
          retries: 0,
          followRedirects: true,
          validateSSL: true,
          responseFormat: 'json',
          saveResponse: false,
          responseVariableName: ''
        }
      },
      validators: [
        {
          name: 'url-validator',
          validate: (node) => {
            const url = node.data.url;
            if (!url) {
              return {
                valid: false,
                errors: [{ 
                  code: 'MISSING_URL', 
                  message: '请输入请求 URL', 
                  level: 'error' 
                }]
              };
            }
            
            try {
              new URL(url);
              return { valid: true };
            } catch {
              return {
                valid: false,
                errors: [{ 
                  code: 'INVALID_URL', 
                  message: '请输入有效的 URL 地址', 
                  level: 'error' 
                }]
              };
            }
          },
          trigger: [ValidationTrigger.CREATE, ValidationTrigger.UPDATE]
        },
        {
          name: 'response-variable-validator',
          validate: (node) => {
            const { saveResponse, responseVariableName } = node.data;
            if (saveResponse && !responseVariableName) {
              return {
                valid: false,
                errors: [{ 
                  code: 'MISSING_VARIABLE_NAME', 
                  message: '保存响应时必须指定变量名', 
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
          const {
            method = 'GET',
            url,
            customHeaders = {},
            body,
            timeout = 30,
            retries = 0,
            followRedirects = true,
            validateSSL = true,
            responseFormat = 'json',
            saveResponse = false,
            responseVariableName
          } = node.data;

          try {
            // 模拟 HTTP 请求执行
            console.log(`Executing HTTP ${method} request to: ${url}`);
            console.log('Request configuration:', {
              headers: customHeaders,
              body: body || undefined,
              timeout,
              retries,
              followRedirects,
              validateSSL,
              responseFormat
            });

            // 模拟响应
            const mockResponse = {
              status: 200,
              statusText: 'OK',
              data: { message: 'Mock response', timestamp: new Date().toISOString() },
              headers: { 'content-type': 'application/json' }
            };

            // 如果需要保存响应到变量
            if (saveResponse && responseVariableName) {
              // 这里应该调用变量管理器保存数据
              console.log(`Saving response to variable: ${responseVariableName}`);
            }

            return {
              success: true,
              outputs: {
                response: mockResponse,
                status: mockResponse.status,
                data: mockResponse.data
              }
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              outputs: {
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            };
          }
        },
        canAbort: true,
        abort: async (node) => {
          console.log(`Aborting HTTP request node: ${node.id}`);
        }
      },
      eventHandlers: {
        onDataChange: (node, oldData, newData) => {
          console.log(`HTTP request node ${node.id} configuration changed`);
          
          // 当请求方法改变时，清空请求体
          if (oldData.method !== newData.method) {
            const methodsWithBody = ['POST', 'PUT', 'PATCH'];
            if (!methodsWithBody.includes(newData.method)) {
              newData.body = '';
            }
          }
        }
      }
    }
  ],
  activate: async (context) => {
    console.log('HTTP Request Node Plugin activated');
  },
  deactivate: async () => {
    console.log('HTTP Request Node Plugin deactivated');
  }
};

/**
 * 表单字段类型使用示例
 */
export const FormFieldExamples = {
  // 基础输入字段
  textInput: {
    name: 'name',
    type: FormFieldType.INPUT,
    label: '名称',
    defaultValue: '',
    config: { inputType: 'text' }
  },
  
  // 数字输入
  numberInput: {
    name: 'count',
    type: FormFieldType.NUMBER,
    label: '数量',
    defaultValue: 0,
    validation: { min: 0, max: 100 }
  },
  
  // 下拉选择
  selectField: {
    name: 'category',
    type: FormFieldType.SELECT,
    label: '分类',
    options: [
      { value: 'a', label: '分类 A' },
      { value: 'b', label: '分类 B' }
    ]
  },
  
  // 多行文本
  textareaField: {
    name: 'description',
    type: FormFieldType.TEXTAREA,
    label: '描述',
    config: { componentProps: { rows: 4 } }
  },
  
  // 复选框
  checkboxField: {
    name: 'enabled',
    type: FormFieldType.CHECKBOX,
    label: '启用',
    defaultValue: true
  },
  
  // 单选按钮
  radioField: {
    name: 'priority',
    type: FormFieldType.RADIO,
    label: '优先级',
    options: [
      { value: 'low', label: '低' },
      { value: 'medium', label: '中' },
      { value: 'high', label: '高' }
    ]
  },
  
  // 滑块
  sliderField: {
    name: 'volume',
    type: FormFieldType.SLIDER,
    label: '音量',
    defaultValue: 50,
    config: { range: { min: 0, max: 100, step: 1 } }
  },
  
  // 颜色选择器
  colorField: {
    name: 'color',
    type: FormFieldType.COLOR,
    label: '颜色',
    defaultValue: '#007acc'
  },
  
  // 日期选择器
  dateField: {
    name: 'date',
    type: FormFieldType.DATE,
    label: '日期',
    defaultValue: new Date().toISOString().split('T')[0]
  },
  
  // 时间选择器
  timeField: {
    name: 'time',
    type: FormFieldType.TIME,
    label: '时间',
    defaultValue: '12:00'
  },
  
  // JSON 编辑器
  jsonField: {
    name: 'config',
    type: FormFieldType.JSON,
    label: '配置',
    defaultValue: {}
  },
  
  // 代码编辑器
  codeField: {
    name: 'script',
    type: FormFieldType.CODE,
    label: '脚本',
    config: { language: 'javascript' }
  }
};
