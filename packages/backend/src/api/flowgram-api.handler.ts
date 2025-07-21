/**
 * FlowGram API Handler for Hono
 * Converted from tRPC to RESTful API with Hono
 */

import { Hono } from 'hono';
import { WorkflowRuntimeAPIs } from '@flowgram.ai/runtime-js';
import { 
  FlowGramAPIMethod, 
  FlowGramAPIName, 
  FlowGramAPIs,
  FlowGramAPINames,
  ServerInfoDefine,
  type ServerInfoOutput
} from '@flowgram.ai/runtime-interface';
import { ServerConfig } from '../config/server.config';

export class FlowGramAPIHandler {
  private app: Hono;

  constructor() {
    this.app = new Hono();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Setup server info endpoint
    this.app.get(ServerInfoDefine.path, async (c) => {
      const serverTime = new Date();
      const output: ServerInfoOutput = {
        name: ServerConfig.name,
        title: ServerConfig.title,
        description: ServerConfig.description,
        runtime: ServerConfig.runtime,
        version: ServerConfig.version,
        time: serverTime.toISOString(),
      };
      return c.json(output);
    });

    // Setup FlowGram APIs
    FlowGramAPINames.forEach((apiName) => {
      this.createAPIRoute(apiName);
    });
  }

  private createAPIRoute(apiName: FlowGramAPIName) {
    const define = FlowGramAPIs[apiName];
    const caller = WorkflowRuntimeAPIs[apiName];
    
    if (define.method === FlowGramAPIMethod.GET) {
      this.app.get(define.path, async (c) => {
        try {
          // Parse query parameters according to the schema
          const queryParams = c.req.query();
          const parsedInput = define.schema.input.parse(queryParams);
          const output = await caller(parsedInput);
          return c.json(output);
        } catch (error) {
          console.error(`Error in ${apiName}:`, error);
          return c.json({ error: 'Internal server error' }, 500);
        }
      });
    } else {
      // POST, PUT, DELETE methods
      this.app.on(
        define.method.toLowerCase() as any,
        define.path,
        async (c) => {
          try {
            const body = await c.req.json();
            const parsedInput = define.schema.input.parse(body);
            const output = await caller(parsedInput);
            return c.json(output);
          } catch (error) {
            console.error(`Error in ${apiName}:`, error);
            return c.json({ error: 'Internal server error' }, 500);
          }
        }
      );
    }
  }

  public getApp(): Hono {
    return this.app;
  }
}
