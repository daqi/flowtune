/**
 * Documentation Routes
 * API documentation using @hono/swagger-ui
 */

import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { generateOpenAPISpec } from '../docs/openapi';
import { ServerConfig } from '../config/server.config';

export function createDocsRoutes(): Hono {
  const app = new Hono();

  // OpenAPI spec endpoint
  app.get('/openapi.json', (c) => {
    const spec = generateOpenAPISpec();
    return c.json(spec);
  });

  // Swagger UI using @hono/swagger-ui
  app.get(
    ServerConfig.docsPath,
    swaggerUI({
      url: '/openapi.json',
    })
  );

  return app;
}
