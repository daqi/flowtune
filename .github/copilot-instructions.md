<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# FlowTune Project Copilot Instructions

FlowTune 是一个基于 Flowgram.ai 构建的跨平台桌面端流程编排工具，集成了 AI 能力和可扩展插件系统。

## 项目架构

### 核心组件
- **Desktop**: Electron 桌面应用，作为前后端的容器
- **Frontend**: React + Flowgram.ai 前端，提供可视化流程编辑界面
- **Backend**: Fastify + tRPC 后端服务，处理 API 和 AI 集成
- **Flowgram.ai**: 作为 Git 子模块集成的核心流程编排引擎

### 当前实现状态
- ✅ 基础架构：Electron + React + Fastify 完整搭建
- ✅ Flowgram.ai 集成：通过子模块方式集成核心引擎
- ✅ AI 集成：LangChain + OpenAI 支持
- ✅ 构建系统：Vite + TypeScript + 代码签名
- 🚧 存储系统：计划使用 Drizzle ORM + SQLite
- 🚧 插件系统：可扩展插件架构设计中

## 代码规范

### TypeScript 规范
- 使用 TypeScript 严格模式
- 为所有函数和变量实现正确的 TypeScript 类型
- 优先使用函数式编程模式
- 使用 async/await 而不是 .then() 处理 Promise

### 错误处理
- 使用 try/catch 块进行适当的错误处理
- 实现完整的错误边界和日志记录
- API 使用正确的 HTTP 状态码

### 架构模式
- 前端：React 函数组件 + Hooks
- 后端：Fastify 框架模式 + tRPC 类型安全 API
- 桌面：Electron 安全默认配置（禁用 node 集成，启用上下文隔离）

## 开发流程

### 子模块管理
- Flowgram.ai 作为 Git 子模块管理
- 使用 `pnpm update-submodules` 更新和构建
- 通过 patch 文件应用自定义修改

### 构建流程
- 使用 pnpm workspace 管理 monorepo
- 并发运行开发服务器
- TypeScript 项目引用配置
- Vite 用于现代化构建优化

### 存储设计指导（待实现）
- 使用 Drizzle ORM 进行所有数据库操作
- 在 `packages/backend/src/db/schema.ts` 定义 schema
- 使用正确的外键关系
- 实现正确的迁移脚本
- 支持工作流的 CRUD 操作、版本管理、导入导出

### 插件系统指导（待实现）
- 设计类型安全的插件 API
- 实现插件生命周期管理（加载、启用、禁用、卸载）
- 支持自定义节点类型
- 提供插件开发 SDK 和文档
- 实现插件管理界面

## API 设计规范

### tRPC + Fastify 模式
- 使用 tRPC 实现类型安全的 API
- 配置正确的 CORS
- 使用 Zod schemas 验证请求体
- 遵循 RESTful API 约定
- 实现 WebSocket 支持实时通信

### 数据验证
- 所有输入使用 Zod 进行验证
- 实现适当的数据转换和清理
- 处理边界情况和验证错误

## 前端开发指南

### React 最佳实践
- 使用 React 函数组件和 Hooks
- 实现适当的状态管理
- 使用 TypeScript 接口（从 shared 包导入）
- 遵循响应式设计原则

### Flowgram.ai 集成
- 集成 Flowgram.ai 组件进行工作流可视化
- 使用自由布局编辑器进行流程设计
- 支持节点拖拽、连接、属性编辑
- 实现工作流执行状态监控

### UI 组件
- 使用 Semi UI 组件库
- 实现一致的设计语言
- 支持主题和国际化

## 安全和性能

### Electron 安全
- 禁用 Node.js 集成
- 启用上下文隔离
- 需要时实现适当的 IPC 通信
- 正确处理窗口管理

### 性能优化
- 使用代码分割和懒加载
- 实现适当的缓存策略
- 优化大型工作流的渲染性能
- 监控内存使用和性能指标

## 构建和分发

### 开发环境
- 使用 `pnpm dev` 启动完整开发环境
- 支持热重载和实时预览
- 配置开发者工具和调试

### 生产构建
- 多平台构建支持（macOS, Windows, Linux）
- 代码签名和公证（macOS）
- 自动更新机制
- 安装包优化和压缩

## 特殊注意事项

### 子模块更新流程
1. 更新 Git 子模块到最新版本
2. 同步前后端源代码文件
3. 应用必要的补丁修改
4. 重新构建所有包
5. 测试功能完整性

### 插件开发准备
- 插件应支持热插拔
- 提供插件开发模板和脚手架
- 实现插件市场和分发机制
- 支持插件权限和沙箱隔离

这是一个活跃开发中的项目，重点是稳定性、可扩展性和用户体验。在实现新功能时，请考虑这些架构原则和未来的扩展需求。
