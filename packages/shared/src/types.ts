// User types
export interface User {
  id: number
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface NewUser {
  email: string
  name: string
}

// Project types
export interface Project {
  id: number
  name: string
  description?: string
  userId: number
  flowgramData?: string
  createdAt: Date
  updatedAt: Date
}

export interface NewProject {
  name: string
  description?: string
  userId: number
  flowgramData?: string
}

// Flowgram.ai specific types
export interface FlowgramNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, any>
}

export interface FlowgramEdge {
  id: string
  source: string
  target: string
  type?: string
}

export interface FlowgramData {
  nodes: FlowgramNode[]
  edges: FlowgramEdge[]
  viewport?: { x: number; y: number; zoom: number }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Common utility types
export type ID = string | number
export type Timestamp = Date | string
