# FlowTune Backend - 完整功能版本

FlowTune Backend 现已完成从 `packages/nodejs` 的 FlowGram Runtime 逻辑迁移，并实现了完整的生产级功能。

## 🚀 核心功能

### 原有功能
- ✅ 应用管理 (App Management)
- ✅ 鉴权管理 (Authentication)
- ✅ 操作执行 (Action Execution)
- ✅ 流程引擎 (Flow Engine)
- ✅ 开放平台集成 (Platform Integration)

### 新增功能 (从 nodejs 包迁移)
- ✅ FlowGram Runtime APIs
- ✅ OpenAPI 文档生成
- ✅ 服务器信息端点

### 生产级优化功能
- ✅ **完整的 WebSocket 支持** - 实时通信，客户端管理，主题订阅
- ✅ **Swagger UI 集成** - 交互式 API 文档
- ✅ **详细错误处理** - 统一错误格式，请求追踪
- ✅ **API 速率限制** - 多层级限流策略
- ✅ **日志记录增强** - 结构化日志，性能监控
- ✅ **测试覆盖** - Jest 测试框架

## 📊 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   WebSocket     │
│   (React)       │◄──►│   (Hono)        │◄──►│   Server        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                        ┌─────────────────┐
                        │   Database      │
                        │   (SQLite)      │
                        └─────────────────┘
```

## 🔧 运行说明

### 安装依赖
```bash
cd packages/backend
npm install
```

### 开发模式
```bash
npm run dev
```

### 生产模式
```bash
npm run build
npm start
```

### 测试
```bash
npm test
npm run test:coverage
```

## 🌐 服务端点

| 服务 | 端口 | 描述 |
|------|------|------|
| HTTP API | 4000 | 主要 API 服务 |
| WebSocket | 8080 | 实时通信 |

## 📚 API 文档

- **Swagger UI**: http://localhost:4000/docs
- **简化文档**: http://localhost:4000/simple  
- **OpenAPI 规范**: http://localhost:4000/openapi.json

## 🔍 监控端点

- **健康检查**: http://localhost:4000/
- **API 健康**: http://localhost:4000/api/health
- **系统日志**: http://localhost:4000/system/logs/stats
- **速率限制**: http://localhost:4000/system/rate-limit/status
- **WebSocket 状态**: http://localhost:4000/ws/stats

## ⚙️ 配置说明

### 环境变量
```bash
# 服务器配置
NODE_ENV=development
PORT=4000

# 数据库配置  
DATABASE_URL=./data/flowtune.db

# FlowGram Runtime
FLOWGRAM_API_KEY=your_api_key
FLOWGRAM_SECRET=your_secret

# CORS 配置
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# 日志级别
LOG_LEVEL=info
```

### 速率限制策略
- **一般 API**: 100 请求 / 15 分钟
- **FlowGram API**: 50 请求 / 10 分钟  
- **敏感操作**: 10 请求 / 5 分钟
- **WebSocket**: 30 请求 / 分钟

## 🔌 WebSocket 使用

连接到 `ws://localhost:8080`

### 消息格式
```javascript
// Ping
{ "type": "ping" }

// 订阅主题
{ "type": "subscribe", "topic": "flow-updates" }

// 执行流程
{ "type": "flow-execute", "data": { "flowId": "123" } }
```

## 🧪 测试说明

### 运行测试
```bash
npm test                # 运行所有测试
npm run test:watch      # 监听模式
npm run test:coverage   # 生成覆盖率报告
```

## 📈 性能特性

- **请求日志记录** - 包含响应时间和状态码
- **内存日志存储** - 最近 1000 条日志
- **自动清理** - 过期速率限制记录自动清理
- **WebSocket 心跳** - 30 秒超时自动断开

## 🚧 下一步计划

- [ ] 数据库连接池优化
- [ ] Redis 缓存集成
- [ ] 集群部署支持
- [ ] Prometheus 指标集成
- [ ] Docker 容器化
- [ ] CI/CD 流水线
