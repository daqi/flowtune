import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { config } from 'dotenv'

// 导入服务层
import { AppService } from './modules/app/app.service'
import { AuthService } from './modules/auth/auth.service'
import { ActionService } from './modules/action/action.service'
import { FlowEngine } from './core/flow-engine'

// 导入路由
import { createAppRoutes } from './routes/app.routes'
import { createAuthRoutes } from './routes/auth.routes'
import { createActionRoutes } from './routes/action.routes'
import { createFlowRoutes } from './routes/flow.routes'

// Load environment variables
config()

const app = new Hono()

// 初始化服务
const appService = new AppService()
const authService = new AuthService()
const actionService = new ActionService(appService, authService)
const flowEngine = new FlowEngine(actionService)

// CORS middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}))

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'FlowTune Backend API - 低代码自动化平台', 
    version: '1.0.0',
    status: 'healthy',
    architecture: 'App -> Auth -> Action',
    features: [
      '应用管理 (App Management)',
      '鉴权管理 (Authentication)',
      '操作执行 (Action Execution)',
      '流程引擎 (Flow Engine)',
      '开放平台集成 (Platform Integration)'
    ]
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
api.route('/flows', createFlowRoutes(flowEngine, actionService))

// Mount API routes
app.route('/api', api)

const port = parseInt(process.env.PORT || '3001')

console.log(`🚀 FlowTune Backend server is running on port ${port}`)
console.log(`📍 Health check: http://localhost:${port}/api/health`)
console.log(`🏗️  Architecture: App -> Auth -> Action`)
console.log(`🔧 Features: Low-code automation platform`)

serve({
  fetch: app.fetch,
  port,
})
