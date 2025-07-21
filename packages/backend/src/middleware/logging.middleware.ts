/**
 * Logging System
 * Provides structured logging with different levels and formats
 */

import { Hono } from 'hono';
import { envConfig } from '../config/env.config';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  metadata?: any;
  requestId?: string;
  userId?: string;
  ip?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
}

class Logger {
  private level: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor(level: string = 'info') {
    this.level = this.getLogLevel(level);
  }

  private getLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, metadata, ...rest } = entry;
    const contextStr = context ? ` [${context}]` : '';
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    const restStr = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
    
    return `${timestamp} ${level}${contextStr}: ${message}${metadataStr}${restStr}`;
  }

  private addLog(entry: LogEntry) {
    // Add to memory store
    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    console.log(this.formatLog(entry));
  }

  public error(message: string, context?: string, metadata?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message,
        context,
        metadata,
      });
    }
  }

  public warn(message: string, context?: string, metadata?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message,
        context,
        metadata,
      });
    }
  }

  public info(message: string, context?: string, metadata?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message,
        context,
        metadata,
      });
    }
  }

  public debug(message: string, context?: string, metadata?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog({
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        message,
        context,
        metadata,
      });
    }
  }

  public getLogs(level?: string, limit: number = 100): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level.toLowerCase() === level.toLowerCase());
    }
    
    return filteredLogs.slice(-limit);
  }

  public getStats() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > oneHourAgo
    );

    const levelCounts = recentLogs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLogs: this.logs.length,
      recentLogs: recentLogs.length,
      levelCounts,
      currentLevel: LogLevel[this.level],
      timestamp: new Date().toISOString(),
    };
  }
}

// Global logger instance
export const logger = new Logger(envConfig.LOG_LEVEL);

// Request logging middleware
export function requestLogger() {
  return async (c: any, next: any) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    // Add request ID to context
    c.set('requestId', requestId);

    // Log incoming request
    logger.info('Incoming request', 'HTTP', {
      requestId,
      method: c.req.method,
      path: c.req.path,
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
      userAgent: c.req.header('user-agent'),
    });

    await next();

    // Log response
    const responseTime = Date.now() - start;
    const statusCode = c.res.status;
    
    const logLevel = statusCode >= 500 ? 'error' : 
                     statusCode >= 400 ? 'warn' : 'info';
    
    const logEntry = {
      requestId,
      method: c.req.method,
      path: c.req.path,
      statusCode,
      responseTime,
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    };

    if (logLevel === 'error') {
      logger.error('Request completed with error', 'HTTP', logEntry);
    } else if (logLevel === 'warn') {
      logger.warn('Request completed with warning', 'HTTP', logEntry);
    } else {
      logger.info('Request completed', 'HTTP', logEntry);
    }
  };
}

// Logging routes
export function createLoggingRoutes(): Hono {
  const app = new Hono();

  // Get logs
  app.get('/logs', (c) => {
    const level = c.req.query('level');
    const limit = parseInt(c.req.query('limit') || '100');
    
    return c.json({
      logs: logger.getLogs(level, limit),
      stats: logger.getStats(),
    });
  });

  // Get log statistics
  app.get('/stats', (c) => {
    return c.json(logger.getStats());
  });

  // Clear logs (debug only)
  app.delete('/logs', (c) => {
    if (envConfig.isDevelopment) {
      logger.info('Logs cleared manually', 'SYSTEM');
      return c.json({ message: 'Logs cleared' });
    } else {
      return c.json({ error: 'Not allowed in production' }, 403);
    }
  });

  return app;
}
