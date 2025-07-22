/**
 * Error Handling Middleware
 * Provides comprehensive error handling and logging
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ContentfulStatusCode } from 'hono/utils/http-status';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
    method: string;
  };
}

export class AppError extends Error {
  public readonly statusCode: ContentfulStatusCode;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode: ContentfulStatusCode = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || `ERROR_${statusCode}`;
    this.details = details;
    this.name = 'AppError';
  }
}

export function errorHandler() {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      console.error('Error occurred:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        path: c.req.path,
        method: c.req.method,
        timestamp: new Date().toISOString(),
      });

      let statusCode: ContentfulStatusCode = 500;
      let errorCode = 'INTERNAL_SERVER_ERROR';
      let message = 'Internal Server Error';
      let details: any = undefined;

      if (error instanceof AppError) {
        statusCode = error.statusCode;
        errorCode = error.code;
        message = error.message;
        details = error.details;
      } else if (error instanceof HTTPException) {
        statusCode = error.status;
        errorCode = `HTTP_${statusCode}`;
        message = error.message;
      } else if (error instanceof Error) {
        message = error.message;
        if (error.name === 'ValidationError') {
          statusCode = 400;
          errorCode = 'VALIDATION_ERROR';
        } else if (error.name === 'ZodError') {
          statusCode = 400;
          errorCode = 'SCHEMA_VALIDATION_ERROR';
          details = error;
        }
      }

      const errorResponse: ErrorResponse = {
        error: {
          code: errorCode,
          message,
          details,
          timestamp: new Date().toISOString(),
          path: c.req.path,
          method: c.req.method,
        },
      };

      return c.json(errorResponse, statusCode);
    }
  };
}

export function notFoundHandler() {
  return (c: any) => {
    const errorResponse: ErrorResponse = {
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
        timestamp: new Date().toISOString(),
        path: c.req.path,
        method: c.req.method,
      },
    };
    return c.json(errorResponse, 404);
  };
}

// Common error types
export const Errors = {
  NotFound: (resource: string) => 
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),
  
  BadRequest: (message: string, details?: any) => 
    new AppError(message, 400, 'BAD_REQUEST', details),
  
  Unauthorized: (message: string = 'Unauthorized') => 
    new AppError(message, 401, 'UNAUTHORIZED'),
  
  Forbidden: (message: string = 'Forbidden') => 
    new AppError(message, 403, 'FORBIDDEN'),
  
  Conflict: (message: string, details?: any) => 
    new AppError(message, 409, 'CONFLICT', details),
  
  ValidationError: (details: any) => 
    new AppError('Validation failed', 400, 'VALIDATION_ERROR', details),
  
  DatabaseError: (message: string, details?: any) => 
    new AppError(message, 500, 'DATABASE_ERROR', details),
  
  ExternalServiceError: (service: string, message: string) => 
    new AppError(`External service error: ${service} - ${message}`, 502, 'EXTERNAL_SERVICE_ERROR'),
};
