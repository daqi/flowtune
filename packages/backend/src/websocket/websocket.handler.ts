/**
 * WebSocket Handler for FlowTune
 * Using @hono/node-ws for complete WebSocket support
 */

import { Hono } from 'hono';
import { createNodeWebSocket } from '@hono/node-ws';
import { v4 as uuidv4 } from 'uuid';

interface WebSocketClient {
  id: string;
  subscriptions: Set<string>;
  lastPing?: Date;
}

interface WebSocketMessage {
  type: 'ping' | 'pong' | 'subscribe' | 'unsubscribe' | 'flow-execute' | 'flow-status' | 'error';
  id?: string;
  topic?: string;
  data?: any;
  timestamp: string;
}

class WebSocketManager {
  private clients = new Map<string, WebSocketClient>();
  private connections = new Map<string, any>(); // WebSocket connections

  constructor() {
    this.setupHeartbeat();
  }

  private setupHeartbeat() {
    setInterval(() => {
      const now = new Date();
      this.clients.forEach((client, clientId) => {
        if (client.lastPing && now.getTime() - client.lastPing.getTime() > 30000) {
          // Client hasn't pinged in 30 seconds, close connection
          const ws = this.connections.get(clientId);
          if (ws) {
            ws.close();
          }
          this.removeClient(clientId);
          console.log(`Removed inactive client: ${clientId}`);
        }
      });
    }, 10000); // Check every 10 seconds
  }

  public addClient(ws: any): string {
    const clientId = uuidv4();
    const client: WebSocketClient = {
      id: clientId,
      subscriptions: new Set(),
      lastPing: new Date(),
    };
    
    this.clients.set(clientId, client);
    this.connections.set(clientId, ws);
    
    console.log(`WebSocket client connected: ${clientId}`);
    
    // Send welcome message
    this.sendToClient(clientId, {
      type: 'pong',
      id: clientId,
      data: { message: 'Connected to FlowTune WebSocket' },
      timestamp: new Date().toISOString(),
    });

    return clientId;
  }

  public removeClient(clientId: string) {
    this.clients.delete(clientId);
    this.connections.delete(clientId);
    console.log(`WebSocket client disconnected: ${clientId}`);
  }

  public handleMessage(clientId: string, data: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message: WebSocketMessage = JSON.parse(data);
      client.lastPing = new Date();

      switch (message.type) {
        case 'ping':
          this.sendToClient(clientId, {
            type: 'pong',
            timestamp: new Date().toISOString(),
          });
          break;

        case 'subscribe':
          if (message.topic) {
            client.subscriptions.add(message.topic);
            this.sendToClient(clientId, {
              type: 'pong',
              data: { subscribed: message.topic },
              timestamp: new Date().toISOString(),
            });
          }
          break;

        case 'unsubscribe':
          if (message.topic) {
            client.subscriptions.delete(message.topic);
            this.sendToClient(clientId, {
              type: 'pong',
              data: { unsubscribed: message.topic },
              timestamp: new Date().toISOString(),
            });
          }
          break;

        case 'flow-execute':
          this.handleFlowExecution(clientId, message);
          break;

        default:
          this.sendToClient(clientId, {
            type: 'error',
            data: { message: 'Unknown message type' },
            timestamp: new Date().toISOString(),
          });
      }
    } catch (error) {
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Invalid JSON message' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handleFlowExecution(clientId: string, message: WebSocketMessage) {
    // Simulate flow execution
    this.sendToClient(clientId, {
      type: 'flow-status',
      data: {
        flowId: message.data?.flowId,
        status: 'started',
        message: 'Flow execution started',
      },
      timestamp: new Date().toISOString(),
    });

    // Simulate some processing time
    setTimeout(() => {
      this.sendToClient(clientId, {
        type: 'flow-status',
        data: {
          flowId: message.data?.flowId,
          status: 'completed',
          message: 'Flow execution completed',
          result: { success: true },
        },
        timestamp: new Date().toISOString(),
      });
    }, 2000);
  }

  private sendToClient(clientId: string, message: Partial<WebSocketMessage>) {
    const ws = this.connections.get(clientId);
    if (ws && ws.readyState === 1) { // OPEN state
      ws.send(JSON.stringify(message));
    }
  }

  public broadcast(message: WebSocketMessage, topic?: string) {
    this.clients.forEach((client, clientId) => {
      if (!topic || client.subscriptions.has(topic)) {
        this.sendToClient(clientId, message);
      }
    });
  }

  public getStats() {
    return {
      totalClients: this.clients.size,
      clients: Array.from(this.clients.values()).map(client => ({
        id: client.id,
        subscriptions: Array.from(client.subscriptions),
        lastPing: client.lastPing,
      })),
    };
  }
}

// Global WebSocket manager instance
export const wsManager = new WebSocketManager();

export function createWebSocketRoutes() {
  const app = new Hono();

  // Initialize WebSocket support
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

  // WebSocket endpoint
  app.get(
    '/connect',
    upgradeWebSocket((c) => {
      return {
        onOpen: (evt, ws) => {
          const clientId = wsManager.addClient(ws);
          // Store client ID in the WebSocket for later reference
          (ws as any).clientId = clientId;
        },
        onMessage: (evt, ws) => {
          const clientId = (ws as any).clientId;
          if (clientId && typeof evt.data === 'string') {
            wsManager.handleMessage(clientId, evt.data);
          }
        },
        onClose: (evt, ws) => {
          const clientId = (ws as any).clientId;
          if (clientId) {
            wsManager.removeClient(clientId);
          }
        },
        onError: (evt, ws) => {
          const clientId = (ws as any).clientId;
          console.error('WebSocket error:', evt);
          if (clientId) {
            wsManager.removeClient(clientId);
          }
        },
      };
    })
  );

  // WebSocket statistics endpoint
  app.get('/stats', (c) => {
    return c.json(wsManager.getStats());
  });

  // WebSocket info endpoint
  app.get('/info', (c) => {
    return c.json({
      message: 'WebSocket server available',
      endpoint: '/ws/connect',
      features: [
        'Real-time flow execution updates',
        'Topic-based subscriptions',
        'Ping/pong heartbeat',
        'Flow status notifications',
        'Client management',
      ],
      messageTypes: [
        'ping/pong - Heartbeat',
        'subscribe/unsubscribe - Topic subscription',
        'flow-execute - Execute flow',
        'flow-status - Flow execution status',
      ],
      usage: {
        connect: 'WebSocket connection to /ws/connect',
        ping: '{"type": "ping"}',
        subscribe: '{"type": "subscribe", "topic": "flow-updates"}',
        execute: '{"type": "flow-execute", "data": {"flowId": "123"}}',
      },
    });
  });

  return { app, injectWebSocket };
}
