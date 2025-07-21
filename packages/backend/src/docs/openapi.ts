/**
 * OpenAPI Documentation Generator
 * Converted from Fastify Swagger to Hono OpenAPI
 */

import { FlowGramAPIs, FlowGramAPINames, FlowGramAPIMethod } from '@flowgram.ai/runtime-interface';
import { ServerConfig } from '../config/server.config';

export function generateOpenAPISpec() {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: ServerConfig.title,
      description: ServerConfig.description,
      version: ServerConfig.version,
    },
    servers: [
      {
        url: `http://localhost:${ServerConfig.port}${ServerConfig.basePath}`,
        description: 'Development server',
      },
    ],
    paths: {} as any,
    components: {
      schemas: {} as any,
    },
  };

  // Generate paths from FlowGram APIs
  FlowGramAPINames.forEach((apiName) => {
    const define = FlowGramAPIs[apiName];
    const method = define.method.toLowerCase();
    
    if (!spec.paths[define.path]) {
      spec.paths[define.path] = {};
    }

    spec.paths[define.path][method] = {
      summary: define.name,
      tags: [define.module],
      operationId: apiName,
      ...(define.method === FlowGramAPIMethod.GET
        ? {
            parameters: [
              {
                name: 'query',
                in: 'query',
                schema: { type: 'object' },
              },
            ],
          }
        : {
            requestBody: {
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          }),
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        '500': {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                },
              },
            },
          },
        },
      },
    };
  });

  return spec;
}
