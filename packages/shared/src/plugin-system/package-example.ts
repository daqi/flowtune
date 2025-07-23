/**
 * FlowTune 插件包系统使用示例
 * Plugin Package System Usage Example
 */

import {
  createPluginPackage,
  createMixedPluginPackage,
  IPackageManager,
  IPluginPackage,
  IInstalledPackage,
  PackageInstallStatus
} from './package-system';
import { PackageManager } from './package-manager';
import { createDefaultPackageInstaller } from './package-installer';
import { createDefaultPackageStorage } from './package-storage';
import { EventBus } from './core';
import { 
  INodePlugin, 
  IThemePlugin, 
  IPropertyPlugin,
  PluginCategory, 
  NodeGroup,
  FormFieldType 
} from './types';

// ============= 示例插件包定义 =============

/**
 * 数据处理插件包
 */
export function createDataProcessingPackage(): IPluginPackage {
  const nodePlugin: INodePlugin = {
    id: 'flowtune.data-processing.nodes',
    name: 'Data Processing Nodes',
    version: '1.0.0',
    description: 'Nodes for data transformation and processing',
    author: 'FlowTune Team',
    category: PluginCategory.NODE,
    nodeTypes: [
      {
        type: 'csv-parser',
        displayName: 'CSV Parser',
        description: 'Parse CSV data into structured format',
        icon: '📊',
        group: NodeGroup.DATA,
        tags: ['csv', 'parser', 'data'],
        meta: {
          deletable: true,
          copyable: true,
          editable: true,
          defaultPorts: [
            { type: 'input', name: 'csvData' },
            { type: 'output', name: 'parsed' }
          ]
        },
        uiMeta: {
          size: { width: 160, height: 70 },
          showInNodePanel: true,
          className: 'csv-parser-node'
        },
        formMeta: {
          fields: [
            {
              name: 'delimiter',
              type: FormFieldType.SELECT,
              label: '分隔符',
              defaultValue: ',',
              options: [
                { value: ',', label: '逗号 (,)' },
                { value: ';', label: '分号 (;)' },
                { value: '\t', label: '制表符 (\\t)' },
                { value: '|', label: '竖线 (|)' }
              ],
              validation: { required: true }
            },
            {
              name: 'hasHeader',
              type: FormFieldType.CHECKBOX,
              label: '包含标题行',
              defaultValue: true
            },
            {
              name: 'skipEmptyLines',
              type: FormFieldType.CHECKBOX,
              label: '跳过空行',
              defaultValue: true
            }
          ],
          layout: 'vertical'
        },
        validators: [],
        renderer: { render: () => null },
        executor: {
          execute: async (node, context) => {
            const { delimiter = ',', hasHeader = true, skipEmptyLines = true } = node.data;
            const csvData = context.inputs.csvData as string;
            
            // 模拟 CSV 解析
            const lines = csvData.split('\n').filter(line => !skipEmptyLines || line.trim());
            const headers = hasHeader ? lines[0].split(delimiter) : [];
            const dataLines = hasHeader ? lines.slice(1) : lines;
            
            const parsed = dataLines.map(line => {
              const values = line.split(delimiter);
              if (hasHeader) {
                const obj: Record<string, string> = {};
                headers.forEach((header, index) => {
                  obj[header.trim()] = values[index]?.trim() || '';
                });
                return obj;
              }
              return values.map(v => v.trim());
            });
            
            return {
              success: true,
              outputs: { parsed }
            };
          }
        }
      },
      {
        type: 'json-transformer',
        displayName: 'JSON Transformer',
        description: 'Transform JSON data using JSONPath expressions',
        icon: '🔄',
        group: NodeGroup.DATA,
        tags: ['json', 'transform', 'jsonpath'],
        meta: {
          deletable: true,
          copyable: true,
          editable: true,
          defaultPorts: [
            { type: 'input', name: 'jsonData' },
            { type: 'output', name: 'transformed' }
          ]
        },
        uiMeta: {
          size: { width: 180, height: 80 },
          showInNodePanel: true,
          className: 'json-transformer-node'
        },
        formMeta: {
          fields: [
            {
              name: 'transformations',
              type: FormFieldType.JSON,
              label: '转换规则',
              description: '定义 JSON 转换规则',
              defaultValue: {},
              validation: { required: true }
            },
            {
              name: 'preserveOriginal',
              type: FormFieldType.CHECKBOX,
              label: '保留原始数据',
              defaultValue: false
            }
          ],
          layout: 'vertical'
        },
        validators: [],
        renderer: { render: () => null },
        executor: {
          execute: async (node, context) => {
            const { transformations, preserveOriginal } = node.data;
            const jsonData = context.inputs.jsonData;
            
            // 模拟 JSON 转换
            const transformed = preserveOriginal 
              ? { ...jsonData, ...transformations }
              : transformations;
            
            return {
              success: true,
              outputs: { transformed }
            };
          }
        }
      }
    ],
    activate: async (context) => {
      console.log('Data Processing Nodes activated');
    }
  };

  const themePlugin: IThemePlugin = {
    id: 'flowtune.data-processing.theme',
    name: 'Data Processing Theme',
    version: '1.0.0',
    description: 'Theme optimized for data processing workflows',
    author: 'FlowTune Team',
    category: PluginCategory.THEME,
    theme: {
      id: 'data-processing-theme',
      name: 'Data Processing',
      variables: {
        primary: '#4f46e5',
        secondary: '#7c3aed',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#1e293b',
        border: '#e2e8f0',
        shadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderRadius: '6px',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
      },
      nodeStyles: {
        'csv-parser': {
          default: {
            backgroundColor: '#e0f2fe',
            borderColor: '#0891b2',
            color: '#0c4a6e'
          }
        },
        'json-transformer': {
          default: {
            backgroundColor: '#f3e8ff',
            borderColor: '#8b5cf6',
            color: '#581c87'
          }
        }
      },
      edgeStyles: {
        default: {
          default: {
            color: '#64748b',
            width: 2,
            arrow: true
          }
        }
      },
      canvasStyle: {
        backgroundColor: '#f8fafc',
        grid: {
          visible: true,
          size: 20,
          color: '#e2e8f0',
          type: 'dot'
        }
      },
      customCSS: `
        .csv-parser-node {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          color: white;
        }
        .json-transformer-node {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }
      `
    },
    activate: async (context) => {
      console.log('Data Processing Theme activated');
    }
  };

  return createPluginPackage({
    id: 'flowtune.data-processing',
    name: 'Data Processing Package',
    version: '1.0.0',
    description: 'Complete data processing solution with nodes and theme',
    author: {
      name: 'FlowTune Team',
      email: 'team@flowtune.com',
      url: 'https://flowtune.com'
    },
    homepage: 'https://flowtune.com/packages/data-processing',
    license: 'MIT',
    keywords: ['data', 'processing', 'csv', 'json', 'transform'],
    plugins: [nodePlugin, themePlugin],
    dependencies: {
      'flowtune.core': '^1.0.0'
    },
    config: {
      requiresRestart: false,
      minVersion: '1.0.0',
      platforms: ['web', 'desktop']
    },
    assets: {
      icon: 'data-processing-icon.png',
      screenshots: ['screenshot1.png', 'screenshot2.png'],
      documentation: 'README.md'
    }
  });
}

/**
 * AI 集成插件包
 */
export function createAIIntegrationPackage(): IPluginPackage {
  const nodePlugin: INodePlugin = {
    id: 'flowtune.ai-integration.nodes',
    name: 'AI Integration Nodes',
    version: '1.0.0',
    description: 'Nodes for AI model integration',
    author: 'FlowTune Team',
    category: PluginCategory.NODE,
    nodeTypes: [
      {
        type: 'openai-chat',
        displayName: 'OpenAI Chat',
        description: 'Chat with OpenAI GPT models',
        icon: '🤖',
        group: NodeGroup.AI,
        tags: ['ai', 'openai', 'chat', 'gpt'],
        meta: {
          deletable: true,
          copyable: true,
          editable: true,
          defaultPorts: [
            { type: 'input', name: 'prompt' },
            { type: 'output', name: 'response' }
          ]
        },
        uiMeta: {
          size: { width: 160, height: 70 },
          showInNodePanel: true,
          className: 'openai-chat-node'
        },
        formMeta: {
          fields: [
            {
              name: 'apiKey',
              type: FormFieldType.INPUT,
              label: 'API Key',
              placeholder: 'Enter OpenAI API key',
              config: { inputType: 'password' },
              validation: { required: true }
            },
            {
              name: 'model',
              type: FormFieldType.SELECT,
              label: '模型',
              defaultValue: 'gpt-3.5-turbo',
              options: [
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                { value: 'gpt-4', label: 'GPT-4' },
                { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
              ]
            },
            {
              name: 'temperature',
              type: FormFieldType.SLIDER,
              label: '创造性',
              defaultValue: 0.7,
              config: { range: { min: 0, max: 2, step: 0.1 } }
            },
            {
              name: 'maxTokens',
              type: FormFieldType.NUMBER,
              label: '最大令牌数',
              defaultValue: 1000,
              validation: { min: 1, max: 4000 }
            }
          ],
          groups: {
            auth: { title: '认证', defaultExpanded: true },
            model: { title: '模型配置', defaultExpanded: true }
          },
          layout: 'vertical'
        },
        validators: [],
        renderer: { render: () => null },
        executor: {
          execute: async (node, context) => {
            const { apiKey, model, temperature, maxTokens } = node.data;
            const prompt = context.inputs.prompt as string;
            
            // 模拟 OpenAI API 调用
            const response = `AI Response to: ${prompt} (using ${model})`;
            
            return {
              success: true,
              outputs: { response }
            };
          }
        }
      }
    ],
    activate: async (context) => {
      console.log('AI Integration Nodes activated');
    }
  };

  const propertyPlugin: IPropertyPlugin = {
    id: 'flowtune.ai-integration.properties',
    name: 'AI Property Editors',
    version: '1.0.0',
    description: 'Custom property editors for AI configurations',
    author: 'FlowTune Team',
    category: PluginCategory.PROPERTY,
    editors: [
      {
        id: 'ai-model-selector',
        name: 'AI Model Selector',
        supportedTypes: ['string'],
        component: () => null
      }
    ],
    activate: async (context) => {
      console.log('AI Property Editors activated');
    }
  };

  return createPluginPackage({
    id: 'flowtune.ai-integration',
    name: 'AI Integration Package',
    version: '1.0.0',
    description: 'Complete AI integration solution',
    author: {
      name: 'FlowTune Team',
      email: 'team@flowtune.com'
    },
    plugins: [nodePlugin, propertyPlugin],
    dependencies: {
      'flowtune.core': '^1.0.0',
      'flowtune.data-processing': '^1.0.0'
    },
    config: {
      requiresRestart: false,
      minVersion: '1.2.0',
      platforms: ['web', 'desktop']
    }
  });
}

// ============= 包系统使用示例 =============

/**
 * 插件包系统使用示例
 */
export async function runPackageSystemExample() {
  console.log('=== FlowTune Plugin Package System Example ===\n');

  // 1. 创建包系统组件
  console.log('1. Creating package system components...');
  const eventBus = new EventBus();
  const installer = createDefaultPackageInstaller();
  const storage = createDefaultPackageStorage({ type: 'memory' });
  const packageManager = new PackageManager(installer, storage, eventBus);

  // 2. 监听包系统事件
  console.log('2. Setting up package event listeners...');
  setupPackageEventListeners(eventBus);

  // 3. 添加包源
  console.log('3. Adding package sources...');
  await packageManager.addSource({
    name: 'official',
    url: 'https://packages.flowtune.com/api',
    isDefault: true
  });

  await packageManager.addSource({
    name: 'local-dev',
    url: 'http://localhost:3001/api',
    auth: {
      type: 'apikey',
      credentials: { apikey: 'dev-key-123' }
    }
  });

  // 4. 创建示例包
  console.log('4. Creating example packages...');
  const dataPackage = createDataProcessingPackage();
  const aiPackage = createAIIntegrationPackage();
  const mixedPackage = createMixedPluginPackage();

  console.log(`Created packages:`);
  console.log(`  - ${dataPackage.name} v${dataPackage.version}`);
  console.log(`  - ${aiPackage.name} v${aiPackage.version}`);
  console.log(`  - ${mixedPackage.name} v${mixedPackage.version}`);

  // 5. 模拟包安装流程
  console.log('\n5. Simulating package installation...');
  
  try {
    // 安装数据处理包
    const installedDataPackage = await installPackageWithProgress(
      packageManager,
      'flowtune.data-processing',
      '1.0.0'
    );
    console.log(`✓ Installed: ${installedDataPackage.name}`);

    // 安装 AI 集成包（有依赖）
    const installedAIPackage = await installPackageWithProgress(
      packageManager,
      'flowtune.ai-integration',
      '1.0.0'
    );
    console.log(`✓ Installed: ${installedAIPackage.name}`);

  } catch (error) {
    console.error('Installation failed:', error);
  }

  // 6. 查看已安装的包
  console.log('\n6. Checking installed packages...');
  const installedPackages = await packageManager.getInstalledPackages();
  
  console.log(`Total installed packages: ${installedPackages.length}`);
  installedPackages.forEach(pkg => {
    console.log(`  - ${pkg.name} v${pkg.version} (${pkg.status})`);
    console.log(`    Plugins: ${pkg.plugins.length}`);
    console.log(`    Install path: ${pkg.installPath}`);
    console.log(`    Installed at: ${pkg.installedAt.toISOString()}`);
  });

  // 7. 测试包管理操作
  console.log('\n7. Testing package management operations...');
  
  // 启用包
  await packageManager.enablePackage('flowtune.data-processing');
  console.log('✓ Enabled data processing package');

  // 禁用包
  await packageManager.disablePackage('flowtune.data-processing');
  console.log('✓ Disabled data processing package');

  // 8. 展示包的详细信息
  console.log('\n8. Package details...');
  await showPackageDetails(packageManager, 'flowtune.data-processing');

  // 9. 模拟包更新
  console.log('\n9. Simulating package update...');
  try {
    const updatedPackage = await packageManager.updatePackage(
      'flowtune.data-processing',
      '1.1.0',
      { autoEnable: true }
    );
    console.log(`✓ Updated to: ${updatedPackage.name} v${updatedPackage.version}`);
  } catch (error) {
    console.log('Update simulation completed (no actual new version)');
  }

  // 10. 清理（卸载包）
  console.log('\n10. Cleaning up...');
  try {
    await packageManager.uninstallPackage('flowtune.ai-integration');
    console.log('✓ Uninstalled AI integration package');
    
    await packageManager.uninstallPackage('flowtune.data-processing');
    console.log('✓ Uninstalled data processing package');
  } catch (error) {
    console.log('Cleanup simulation completed');
  }

  console.log('\n=== Package System Example completed successfully ===');
}

// ============= 辅助函数 =============

function setupPackageEventListeners(eventBus: EventBus) {
  eventBus.on('package:install:start', (data: any) => {
    console.log(`  📦 Starting installation: ${data.packageId}@${data.version}`);
  });

  eventBus.on('package:install:progress', (data: any) => {
    const { packageId, progress } = data;
    console.log(`  📦 Installing ${packageId}: ${progress.stage} ${progress.progress}% - ${progress.message}`);
  });

  eventBus.on('package:install:complete', (data: any) => {
    console.log(`  ✅ Installation complete: ${data.package.name}`);
  });

  eventBus.on('package:install:error', (data: any) => {
    console.log(`  ❌ Installation failed: ${data.packageId} - ${data.error}`);
  });

  eventBus.on('package:enable:complete', (data: any) => {
    console.log(`  🟢 Package enabled: ${data.packageId}`);
  });

  eventBus.on('package:disable:complete', (data: any) => {
    console.log(`  🔴 Package disabled: ${data.packageId}`);
  });

  eventBus.on('package:uninstall:complete', (data: any) => {
    console.log(`  🗑️ Package uninstalled: ${data.packageId}`);
  });
}

async function installPackageWithProgress(
  packageManager: IPackageManager,
  packageId: string,
  version: string
): Promise<IInstalledPackage> {
  return await packageManager.installPackage(packageId, version, {
    autoEnable: true,
    onProgress: (progress) => {
      // 进度会通过事件系统处理
    }
  });
}

async function showPackageDetails(packageManager: IPackageManager, packageId: string) {
  try {
    const installedPackages = await packageManager.getInstalledPackages();
    const pkg = installedPackages.find(p => p.id === packageId);
    
    if (pkg) {
      console.log(`Package: ${pkg.name}`);
      console.log(`  ID: ${pkg.id}`);
      console.log(`  Version: ${pkg.version}`);
      console.log(`  Author: ${pkg.author.name}`);
      console.log(`  Status: ${pkg.status}`);
      console.log(`  Install Path: ${pkg.installPath}`);
      console.log(`  Plugins (${pkg.plugins.length}):`);
      pkg.plugins.forEach(plugin => {
        console.log(`    - ${plugin.name} (${plugin.category})`);
      });
      if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
        console.log(`  Dependencies:`);
        Object.entries(pkg.dependencies).forEach(([dep, ver]) => {
          console.log(`    - ${dep}@${ver}`);
        });
      }
    }
  } catch (error) {
    console.log(`Error getting package details: ${error}`);
  }
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  runPackageSystemExample().catch(console.error);
}
