# FlowTune (流韵)

A modern full-stack application for flow-based automation and workflow management.

## 🚀 技术栈

### 后端
- **Hono** - 高性能Web框架
- **Drizzle ORM** - 类型安全的数据库ORM
- **SQLite** - 轻量级数据库
- **TypeScript** - 类型安全

### 前端
- **React** - 用户界面库
- **Vite** - 快速构建工具
- **Flowgram.ai** - 流程图和自动化组件
- **TypeScript** - 类型安全

### 桌面端
- **Electron** - 跨平台桌面应用

## 📁 项目结构

```
flowtune/
├── packages/
│   ├── backend/          # Hono后端服务
│   ├── frontend/         # React前端应用
│   ├── desktop/          # Electron桌面应用
│   └── shared/           # 共享类型和工具
├── package.json          # 根配置文件
└── tsconfig.json         # TypeScript配置
```

## 🛠️ 开发设置

### 前置条件

确保您已安装以下工具：
- Node.js (≥ 18.0.0)
- pnpm (≥ 8.0.0)

如果尚未安装pnpm，可以运行：
```bash
npm install -g pnpm
```

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
# 启动后端和前端
pnpm dev

# 或分别启动
pnpm dev:backend
pnpm dev:frontend
pnpm dev:desktop
```

### 构建项目

```bash
# 构建所有包
pnpm build

# 或分别构建
pnpm build:backend
pnpm build:frontend
pnpm build:desktop
```

### 其他有用命令

```bash
# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 清理构建文件
pnpm clean
```

## 📖 API文档

### 健康检查
- `GET /api/health` - 服务健康状态

### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `GET /api/users/:id` - 获取用户详情
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

### 项目管理
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

## 🎯 功能特性

- ✅ 现代化的前后端分离架构
- ✅ 类型安全的全栈TypeScript开发
- ✅ 高性能的Hono后端服务
- ✅ 响应式的React前端界面
- ✅ 跨平台的Electron桌面应用
- ✅ 集成Flowgram.ai流程自动化
- ✅ 轻量级SQLite数据库
- ✅ Monorepo项目结构

## 🔧 开发工具

- **TypeScript** - 静态类型检查
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Vite** - 快速开发和构建
- **Drizzle Kit** - 数据库迁移工具

## 📄 许可证

MIT License
