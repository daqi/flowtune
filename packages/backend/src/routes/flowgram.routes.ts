/**
 * FlowGram API Routes
 * Converted from nodejs package to Hono framework
 */

import { Hono } from 'hono';
import { FlowGramAPIHandler } from '../api/flowgram-api.handler';

export function createFlowGramRoutes(): Hono {
  const flowgramHandler = new FlowGramAPIHandler();
  return flowgramHandler.getApp();
}
