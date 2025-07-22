import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { timeout } from 'hono/timeout'
import { config } from 'dotenv'

// 导入服务层
import { AppService } from './modules/app/app.service'
import { AuthService } from './modules/auth/auth.service'
import { ActionService } from './modules/action/action.service'

// 导入路由
import { createAppRoutes } from './routes/app.routes'
import { createAuthRoutes } from './routes/auth.routes'
import { createActionRoutes } from './routes/action.routes'
import { createFlowGramRoutes } from './routes/flowgram.routes'
import { createDocsRoutes } from './routes/docs.routes'
import { createWebSocketRoutes } from './websocket/websocket.handler'

// 导入中间件
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import { rateLimiters, createRateLimitRoutes } from './middleware/rate-limit.middleware'

// 导入配置
import { ServerConfig } from './config/server.config'
import { envConfig } from './config/env.config'

// Load environment variables
config()

const app = new Hono()

// 初始化服务
const appService = new AppService()
const authService = new AuthService()
const actionService = new ActionService(appService, authService)

// Global middleware
app.use(logger())
app.use(requestId())
app.use(timeout(10000))
app.use(errorHandler())

// CORS middleware
app.use(cors({
  origin: envConfig.CORS_ORIGINS,
  credentials: true,
}))

// Rate limiting for different routes
app.use('/api/*', rateLimiters.general.middleware())
app.use('/api/flowgram/*', rateLimiters.flowgram.middleware())
app.use('/ws/*', rateLimiters.websocket.middleware())

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'FlowTune Backend API - 低代码自动化平台', 
    version: ServerConfig.version,
    status: 'healthy',
    architecture: 'App -> Auth -> Action',
    features: [
      '应用管理 (App Management)',
      '鉴权管理 (Authentication)',
      '操作执行 (Action Execution)',
      '流程引擎 (Flow Engine)',
      '开放平台集成 (Platform Integration)',
      'FlowGram Runtime APIs',
      'WebSocket Support',
      'Rate Limiting',
      'Structured Logging',
      'Error Handling'
    ],
    endpoints: {
      docs: ServerConfig.docsPath,
      api: ServerConfig.basePath,
      health: '/',
      websocket: 'ws://localhost:8080',
      logs: '/system/logs',
      rateLimit: '/system/rate-limit',
    }
  })
})

// API routes
const api = new Hono()

api.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      app: 'running',
      auth: 'running', 
      action: 'running',
      flow: 'running'
    }
  })
})

// 注册各模块路由
api.route('/apps', createAppRoutes(appService))
api.route('/auth', createAuthRoutes(authService))
api.route('/actions', createActionRoutes(actionService))
api.route('/flowgram', createFlowGramRoutes())

// Mount API routes
app.route('/api', api)

// Mount WebSocket routes
const { app: wsApp, injectWebSocket } = createWebSocketRoutes()
app.route('/ws', wsApp)

// Mount system routes
app.route('/system/rate-limit', createRateLimitRoutes())

// Mount documentation routes
app.route('/', createDocsRoutes())

// 404 handler
app.notFound(notFoundHandler())

const port = ServerConfig.port

console.log(`🚀 FlowTune Backend server is running on port ${port}`)
console.log(`📍 Health check: http://localhost:${port}/api/health`)
console.log(`📚 API Docs: http://localhost:${port}${ServerConfig.docsPath}`)
console.log(`🔗 FlowGram APIs: http://localhost:${port}${ServerConfig.basePath}`)
console.log(`🔌 WebSocket endpoint: ws://localhost:${port}/ws/connect`)
console.log(`⚡ Rate limiting: http://localhost:${port}/system/rate-limit/status`)
console.log(`🔧 Features: Low-code automation platform with FlowGram Runtime`)

const server = serve({
  fetch: app.fetch,
  port,
})

// Inject WebSocket support into the server
injectWebSocket(server)
