/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for API rate limiting
 */

import { Hono, Context, Next } from "hono";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      message: "Too many requests, please try again later.",
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(c: Context): string {
    // Use IP address as key, fallback to a default
    return (
      c.req.header("x-forwarded-for") ||
      c.req.header("x-real-ip") ||
      c.env?.ip ||
      "anonymous"
    );
  }

  public middleware() {
    return async (c: Context, next: Next) => {
      const key = this.getKey(c);
      const now = Date.now();

      // Initialize or get existing record
      if (!this.store[key] || this.store[key].resetTime < now) {
        this.store[key] = {
          count: 0,
          resetTime: now + this.config.windowMs,
        };
      }

      const record = this.store[key];

      // Check if limit exceeded
      if (record.count >= this.config.maxRequests) {
        const resetTime = new Date(record.resetTime);
        return c.json(
          {
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: this.config.message,
              timestamp: new Date().toISOString(),
              path: c.req.path,
              method: c.req.method,
              retryAfter: Math.ceil((record.resetTime - now) / 1000),
            },
          },
          429,
          {
            "X-RateLimit-Limit": this.config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetTime.toISOString(),
            "Retry-After": Math.ceil(
              (record.resetTime - now) / 1000
            ).toString(),
          }
        );
      }

      // Increment counter
      record.count++;

      // Add rate limit headers
      const remaining = this.config.maxRequests - record.count;
      const resetTime = new Date(record.resetTime);

      c.res.headers.set(
        "X-RateLimit-Limit",
        this.config.maxRequests.toString()
      );
      c.res.headers.set("X-RateLimit-Remaining", remaining.toString());
      c.res.headers.set("X-RateLimit-Reset", resetTime.toISOString());

      await next();

      // Optionally skip counting based on response status
      const statusCode = c.res.status;
      if (
        (this.config.skipSuccessfulRequests && statusCode < 400) ||
        (this.config.skipFailedRequests && statusCode >= 400)
      ) {
        record.count--;
      }
    };
  }

  public getStats() {
    const now = Date.now();
    return {
      activeKeys: Object.keys(this.store).length,
      entries: Object.entries(this.store)
        .filter(([_, record]) => record.resetTime > now)
        .map(([key, record]) => ({
          key: key.substring(0, 10) + "...", // Hide full IP for privacy
          count: record.count,
          remaining: this.config.maxRequests - record.count,
          resetTime: new Date(record.resetTime).toISOString(),
        })),
    };
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // General API rate limiter - 100 requests per 15 minutes
  general: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: "Too many requests from this IP, please try again later.",
  }),

  // Strict rate limiter for sensitive operations - 10 requests per 5 minutes
  strict: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    message: "Too many sensitive requests, please try again later.",
  }),

  // WebSocket rate limiter - 30 requests per minute
  websocket: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: "Too many WebSocket requests, please try again later.",
  }),

  // FlowGram API rate limiter - 50 requests per 10 minutes
  flowgram: new RateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 50,
    message: "Too many FlowGram API requests, please try again later.",
  }),
};

// Rate limit status endpoint
export function createRateLimitRoutes(): Hono {
  const app = new Hono();

  app.get("/status", (c) => {
    return c.json({
      rateLimiters: {
        general: rateLimiters.general.getStats(),
        strict: rateLimiters.strict.getStats(),
        websocket: rateLimiters.websocket.getStats(),
        flowgram: rateLimiters.flowgram.getStats(),
      },
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
