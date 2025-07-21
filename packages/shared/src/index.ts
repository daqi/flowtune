// Re-export all types
export * from './types'

// API endpoints constants
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  USERS: '/api/users',
  PROJECTS: '/api/projects',
} as const

// Application constants
export const APP_CONFIG = {
  NAME: 'FlowTune',
  VERSION: '1.0.0',
  DESCRIPTION: '流韵 - A powerful flow-based automation tool',
} as const
