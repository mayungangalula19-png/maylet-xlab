import Redis from 'ioredis';
import { EventBus } from '../agents/eventBus.js';
import { logger } from '../utils/logger.js';

export function createEventBus(redisUrl?: string): EventBus {
  if (!redisUrl) {
    logger.info('event_bus_mode', { mode: 'in-memory' });
    return new EventBus();
  }

  const pub = new Redis(redisUrl, { maxRetriesPerRequest: 2 });
  const sub = new Redis(redisUrl, { maxRetriesPerRequest: 2 });
  logger.info('event_bus_mode', { mode: 'redis-pubsub' });

  return new EventBus({
    publish: (ch, msg) => pub.publish(ch, msg),
    duplicate: () => {
      const listener = (channel: string, message: string) => {
        for (const handler of messageHandlers) handler(channel, message);
      };
      const messageHandlers: Array<(ch: string, msg: string) => void> = [];
      sub.on('message', listener);
      return {
        on: (_ev: string, cb: (ch: string, msg: string) => void) => {
          messageHandlers.push(cb);
        },
        subscribe: (ch: string) => {
          void sub.subscribe(ch);
        },
      };
    },
  });
}

/** @deprecated Use createEventBus */
export class EventBroker {
  private readonly bus: EventBus;
  constructor(redisUrl?: string) {
    this.bus = createEventBus(redisUrl);
  }
  publish(event: Parameters<EventBus['publishServer']>[0]): void {
    this.bus.publishServer(event);
  }
  onEvent(handler: Parameters<EventBus['onServer']>[0]): () => void {
    return this.bus.onServer(handler);
  }
  async close(): Promise<void> {
    /* ioredis connections closed with process */
  }
}
