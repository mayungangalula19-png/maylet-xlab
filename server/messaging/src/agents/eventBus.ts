import { EventEmitter } from 'node:events';
import type { ServerEvent } from '../types/events.js';
import type { WorkspaceEvent } from '../types/workspace.types.js';
import { logger } from '../utils/logger.js';

const WS_CHANNEL = 'maylet:messaging:events';
const AGENT_CHANNEL = 'maylet:workspace:events';

export type BusHandler<T> = (event: T) => void;

export class EventBus {
  private readonly local = new EventEmitter();
  private readonly redisPub: { publish: (ch: string, msg: string) => void } | null;
  private readonly redisSub: { on: (ev: string, cb: (ch: string, msg: string) => void) => void } | null;

  constructor(redisClient?: {
    publish: (ch: string, msg: string) => void | Promise<number>;
    duplicate: () => { on: (ev: string, cb: (ch: string, msg: string) => void) => void; subscribe: (ch: string) => void };
  }) {
    if (redisClient) {
      this.redisPub = { publish: (ch, msg) => void redisClient.publish(ch, msg) };
      const sub = redisClient.duplicate();
      void sub.subscribe(WS_CHANNEL);
      void sub.subscribe(AGENT_CHANNEL);
      this.redisSub = sub;
      sub.on('message', (channel, raw) => {
        try {
          if (channel === WS_CHANNEL) {
            this.local.emit('server', JSON.parse(raw) as ServerEvent);
          } else if (channel === AGENT_CHANNEL) {
            this.local.emit('workspace', JSON.parse(raw) as WorkspaceEvent);
          }
        } catch {
          logger.warn('event_bus_parse_failed', { channel });
        }
      });
    } else {
      this.redisPub = null;
      this.redisSub = null;
    }
  }

  publishServer(event: ServerEvent): void {
    const raw = JSON.stringify(event);
    this.local.emit('server', event);
    if (this.redisPub) this.redisPub.publish(WS_CHANNEL, raw);
  }

  publishWorkspace(event: WorkspaceEvent): void {
    const raw = JSON.stringify(event);
    this.local.emit('workspace', event);
    if (this.redisPub) this.redisPub.publish(AGENT_CHANNEL, raw);
  }

  onServer(handler: BusHandler<ServerEvent>): () => void {
    this.local.on('server', handler);
    return () => this.local.off('server', handler);
  }

  onWorkspace(handler: BusHandler<WorkspaceEvent>): () => void {
    this.local.on('workspace', handler);
    return () => this.local.off('workspace', handler);
  }
}
