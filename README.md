# FlowTune (流韵)

FlowTune 是一个基于 Flowgram.ai 技术栈构建的跨平台桌面端流程编排工具，支持可视化流程设计、AI 集成和插件扩展。

## 🎯 项目概述

FlowTune 将 Flowgram.ai 的强大流程编排能力封装为桌面应用，提供直观的可视化界面来创建、编辑和执行复杂的工作流程。

### 核心特性

- 🎨 **可视化流程设计** - 基于 Flowgram.ai 的自由布局编辑器
- 🤖 **AI 集成支持** - 内置 LangChain 和 OpenAI 集成
- 🔌 **插件系统** - 可扩展的插件架构（规划中）
- 💾 **本地存储** - 支持工作流本地保存和管理（规划中）
- 🖥️ **跨平台支持** - 基于 Electron 的桌面应用
- ⚡ **实时预览** - 工作流执行状态实时监控

## 🏗️ 项目架构

```
FlowTune/
├── packages/
│   ├── backend/          # Fastify + tRPC 后端服务
│   └── frontend/         # React + Flowgram.ai 前端
├── src/                  # Electron 主进程
├── flowgram.ai/          # Flowgram.ai 子模块
├── scripts/              # 构建和维护脚本
└── assets/               # 应用资源文件
```

### 技术栈

**前端**
- **React 18** - UI 框架
- **Flowgram.ai** - 流程编排核心引擎
- **Semi UI** - 组件库
- **Vite** - 构建工具
- **TypeScript** - 类型安全

**后端**
- **Fastify** - Web 框架
- **tRPC** - 类型安全的 API 层
- **Zod** - 数据验证
- **LangChain** - AI 集成框架
- **WebSocket** - 实时通信

**桌面端**
- **Electron** - 桌面应用框架
- **代码签名** - macOS/Windows 应用分发

**开发工具**
- **pnpm** - 包管理器
- **TypeScript** - 静态类型检查
- **ESLint** - 代码规范
- **Rush** - Monorepo 管理（Flowgram.ai 子模块）

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Git with submodules support

### 安装依赖

```bash
# 克隆项目（包含子模块）
git clone --recursive https://github.com/daqi/flowtune.git
cd flowtune

# 安装依赖
pnpm install

# 更新子模块和构建
pnpm update-submodules
```

### 开发模式

```bash
# 启动开发环境（并发启动前后端）
pnpm dev

# 或单独启动
pnpm --filter @flowtune/backend dev
pnpm --filter @flowtune/frontend dev
electron .
```

### 构建应用

```bash
# 构建所有包
pnpm build:all

# 构建 Electron 应用
pnpm make

# 构建未签名版本（开发测试）
pnpm build:electron:unsigned
```

## 📦 当前实现状态

### ✅ 已完成
- [x] 基础项目架构搭建
- [x] Flowgram.ai 子模块集成
- [x] Electron 桌面应用框架
- [x] 前端 React + Flowgram.ai 编辑器
- [x] 后端 Fastify + tRPC API 服务
- [x] AI 集成 (LangChain + OpenAI)
- [x] 构建和打包流程
- [x] 代码签名配置

### 🚧 进行中
- [ ] **存储系统** - 工作流本地存储和管理
  - SQLite 数据库集成
  - 工作流 CRUD 操作
  - 历史版本管理
  - 数据导入导出
  
- [ ] **插件系统** - 可扩展的插件架构
  - 插件 API 设计
  - 插件生命周期管理
  - 插件市场/管理界面
  - 自定义节点支持

### 🔮 规划中
- [ ] 工作流模板库
- [ ] 协作和分享功能
- [ ] 性能监控和调试工具
- [ ] 多语言支持完善
- [ ] 云同步支持

## 🛠️ 开发指南

### 项目结构详解

```
├── packages/backend/src/
│   ├── api/              # tRPC 路由定义
│   ├── server/           # Fastify 服务器配置
│   └── index.ts          # 后端入口
├── packages/frontend/src/
│   ├── components/       # React 组件
│   ├── pages/           # 页面组件
│   └── main.tsx         # 前端入口
├── src/
│   ├── main.ts          # Electron 主进程
│   └── preload.ts       # 预加载脚本
├── scripts/
│   ├── utils.js         # 公共工具函数
│   └── update-submodules.mjs  # 子模块更新脚本
```

### 核心工作流程

1. **子模块更新** - 从 Flowgram.ai 同步最新功能
2. **构建流程** - 前后端并行构建和优化
3. **Electron 打包** - 跨平台应用分发
4. **代码签名** - 安全分发和系统信任

### 开发规范

- 使用 TypeScript 严格模式
- 遵循函数式编程模式
- 实现完整的错误处理
- 使用 async/await 处理异步操作
- 遵循 RESTful API 设计

## 📝 API 文档

后端提供基于 tRPC 的类型安全 API：

```typescript
// 示例：工作流管理 API
const workflowRouter = t.router({
  create: t.procedure
    .input(z.object({ name: z.string(), schema: z.any() }))
    .mutation(async ({ input }) => {
      // 创建工作流逻辑
    }),
  
  execute: t.procedure
    .input(z.object({ id: z.string(), inputs: z.record(z.any()) }))
    .mutation(async ({ input }) => {
      // 执行工作流逻辑
    })
});
```

API 文档可通过 Swagger UI 访问：`http://localhost:3000/docs`

## 🤝 贡献指南

1. Fork 项目并创建特性分支
2. 遵循项目代码规范
3. 添加适当的测试覆盖
4. 更新相关文档
5. 提交 Pull Request

### 代码提交规范

```bash
# 功能开发
git commit -m "feat: 添加工作流存储功能"

# 问题修复
git commit -m "fix: 修复插件加载错误"

# 文档更新
git commit -m "docs: 更新 API 文档"
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Flowgram.ai](https://flowgram.ai/) - 核心流程编排引擎
- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - UI 框架
- [Fastify](https://fastify.io/) - 高性能 Web 框架

---

**FlowTune** - 让流程编排更简单、更强大、更智能 🚀
