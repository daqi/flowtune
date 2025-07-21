/**
 * FlowTune Server Configuration
 * Converted from nodejs package to Hono framework
 */

import { envConfig } from './env.config';

export interface ServerParams {
  name: string;
  title: string;
  description: string;
  runtime: string;
  version: string;
  dev: boolean;
  port: number;
  basePath: string;
  docsPath: string;
}

export const ServerConfig: ServerParams = {
  name: 'flowtune-backend',
  title: 'FlowTune Backend',
  description: 'FlowTune Backend API - 低代码自动化平台',
  runtime: 'nodejs',
  version: '1.0.0',
  dev: envConfig.isDevelopment,
  port: envConfig.PORT,
  basePath: '/api',
  docsPath: '/docs',
};
