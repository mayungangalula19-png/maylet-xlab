import { WebSocketServer, type WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import { authenticateHandshake } from '../auth/jwtAuth.js';
import { createEventBus } from '../redis/broker.js';
import { RoomManager } from '../rooms/roomManager.js';
import { EventRouter } from '../router/eventRouter.js';
import { PresenceService } from '../services/presenceService.js';
import { EventBus } from '../agents/eventBus.js';
import { WorkspaceAgent } from '../agents/workspaceAgent.js';
import { EventListener } from '../agents/eventListener.js';
import { clientEventSchema } from '../types/events.js';
import { envelope } from '../types/events.js';
import { logger } from '../utils/logger.js';

export interface GatewayHandle {
  wss: WebSocketServer;
  bus: EventBus;
  close: () => Promise<void>;
}

export function createGateway(port: number, redisUrl?: string): GatewayHandle {
  const wss = new WebSocketServer({ port });
  const bus = createEventBus(redisUrl);
  const rooms = new RoomManager();
  const presence = new PresenceService();
  const workspaceAgent = new WorkspaceAgent(bus);
  workspaceAgent.start();
  const agentListener = new EventListener(bus, workspaceAgent);
  agentListener.start();
  const router = new EventRouter(rooms, bus, presence, agentListener);

  wss.on('connection', async (socket: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const token = url.searchParams.get('token') ?? '';
    const auth = await authenticateHandshake(token);
    if (!auth) {
      socket.close(4401, 'Unauthorized');
      return;
    }

    router.attach(socket, auth.userId);

    socket.on('message', (buf) => {
      try {
        const parsed = JSON.parse(String(buf));
        const frame = clientEventSchema.parse(parsed);
        void router.handle(socket, frame);
      } catch {
        socket.send(JSON.stringify(envelope('error', { message: 'Invalid event payload' })));
      }
    });

    socket.on('close', () => router.detach(socket));
    socket.on('error', (err) => {
      logger.error('socket_error', { error: err.message });
    });
  });

  logger.info('gateway_listening', { port, redis: Boolean(redisUrl) });

  return {
    wss,
    bus,
    close: async () => {
      wss.close();
    },
  };
}
