import type WebSocket from 'ws';
import type { ClientEvent, ServerEvent } from '../types/events.js';
import { envelope } from '../types/events.js';
import type { EventBus } from '../agents/eventBus.js';
import type { RoomManager } from '../rooms/roomManager.js';
import type { EventListener } from '../agents/eventListener.js';
import { MessageService } from '../services/messageService.js';
import { PresenceService } from '../services/presenceService.js';
import { AiMemoryService } from '../services/aiMemoryService.js';
import { triggerMemoryHook } from '../services/aiMemoryHook.js';
import { RateLimiter } from '../utils/rateLimiter.js';
import { logger } from '../utils/logger.js';
import type { WorkspaceEvent } from '../agents/types/workspace.types.js';

const DEFAULT_WORKSPACE = '00000000-0000-0000-0000-000000000001';

export class EventRouter {
  private readonly messages = new MessageService();
  private readonly memory = new AiMemoryService();
  private readonly presence: PresenceService;
  private readonly rateLimiter = new RateLimiter(30, 10_000);
  private readonly typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly rooms: RoomManager,
    private readonly bus: EventBus,
    presence: PresenceService,
    private readonly agentListener: EventListener
  ) {
    this.presence = presence;
    this.bus.onServer((event) => this.fanout(event));
  }

  attach(socket: WebSocket, userId: string): string {
    const socketId = this.rooms.register(socket, userId);
    this.presence.registerConnection(userId, socketId);
    void this.presence.setStatus(userId, 'online');
    this.publish(envelope('user:online', { userId, status: 'online' }));
    logger.info('socket_connected', { userId, socketId });
    return socketId;
  }

  detach(socket: WebSocket): void {
    const record = this.rooms.getRecord(socket);
    if (!record) return;
    this.rooms.leaveAll(socket);
    const wentOffline = this.presence.unregisterConnection(record.userId, record.socketId);
    if (wentOffline) {
      void this.presence.setStatus(record.userId, 'offline');
      this.publish(envelope('user:offline', { userId: record.userId, status: 'offline' }));
    }
    this.rateLimiter.clear(record.userId);
    logger.info('socket_disconnected', { userId: record.userId, socketId: record.socketId });
  }

  async handle(socket: WebSocket, frame: ClientEvent): Promise<void> {
    const record = this.rooms.getRecord(socket);
    if (!record) return;

    if (!this.rateLimiter.allow(`${record.userId}:${frame.event}`)) {
      logger.warn('rate_limited', { userId: record.userId, event: frame.event });
      return;
    }

    switch (frame.event) {
      case 'conversation:join': {
        const allowed = await this.messages.canAccessConversation(record.userId, frame.payload.conversationId);
        if (!allowed) return;
        this.rooms.join(socket, this.rooms.conversationRoom(frame.payload.conversationId));
        if (frame.payload.workspaceId) {
          this.rooms.join(socket, this.rooms.workspaceRoom(frame.payload.workspaceId));
        }
        break;
      }
      case 'conversation:leave':
        this.rooms.leave(socket, this.rooms.conversationRoom(frame.payload.conversationId));
        break;
      case 'message:send':
        await this.handleSend(record.userId, frame.payload.conversationId, frame.payload.content, frame.payload.workspaceId);
        break;
      case 'message:edit': {
        const updated = await this.messages.editMessage({
          messageId: frame.payload.messageId,
          userId: record.userId,
          content: frame.payload.content,
        });
        if (!updated) return;
        this.publish(envelope('message:update', { message: this.memory.toWireMessage(updated) }));
        this.emitWorkspaceEvent('message:edited', updated.conversation_id, record.userId, { messageId: updated.id });
        break;
      }
      case 'message:delete': {
        const deleted = await this.messages.deleteMessage(frame.payload.messageId, record.userId);
        if (!deleted) return;
        this.publish(
          envelope('message:deleted', {
            messageId: deleted.id,
            conversationId: deleted.conversation_id,
          })
        );
        this.emitWorkspaceEvent('message:deleted', deleted.conversation_id, record.userId, { messageId: deleted.id });
        break;
      }
      case 'message:read':
        await this.messages.markRead(record.userId, frame.payload.conversationId, frame.payload.messageIds);
        for (const id of frame.payload.messageIds) {
          this.publish(
            envelope('message:status', {
              messageId: id,
              status: 'read',
              conversationId: frame.payload.conversationId,
            })
          );
        }
        break;
      case 'typing:start':
        this.handleTyping(frame.payload.conversationId, record.userId, true);
        break;
      case 'typing:stop':
        this.handleTyping(frame.payload.conversationId, record.userId, false);
        break;
      case 'presence:ping':
        this.presence.touch(record.userId);
        break;
      default:
        break;
    }
  }

  private async handleSend(
    userId: string,
    conversationId: string,
    content: string,
    workspaceId?: string
  ): Promise<void> {
    const saved = await this.messages.sendMessage({ conversationId, senderId: userId, content });
    if (!saved) return;

    this.publish(envelope('message:new', { message: this.memory.toWireMessage(saved) }));
    this.publish(
      envelope('message:status', {
        messageId: saved.id,
        status: 'delivered',
        conversationId: saved.conversation_id,
      })
    );
    this.publish(envelope('conversation:update', { conversationId: saved.conversation_id }));

    const recent = await this.messages.recentMessages(saved.conversation_id, 20);
    const wireMessages = recent.map((r) => ({
      id: r.id,
      content: r.content,
      sender_id: r.sender_id,
      created_at: r.created_at,
    }));

    triggerMemoryHook({
      conversationId: saved.conversation_id,
      workspaceId: workspaceId ?? DEFAULT_WORKSPACE,
      sourceEventId: saved.id,
      messages: wireMessages,
    });

    this.emitWorkspaceEvent('message:new', saved.conversation_id, userId, { messageId: saved.id }, workspaceId);

    this.agentListener.ingestWithMessages(
      this.buildWorkspaceEvent('message:new', saved.conversation_id, userId, { messageId: saved.id }, workspaceId),
      recent.map((r) => ({
        id: r.id,
        content: r.content,
        senderId: r.sender_id,
        createdAt: r.created_at,
      }))
    );
  }

  private emitWorkspaceEvent(
    type: WorkspaceEvent['type'],
    conversationId: string,
    userId: string,
    payload: Record<string, unknown>,
    workspaceId = DEFAULT_WORKSPACE
  ): void {
    this.agentListener.emit(this.buildWorkspaceEvent(type, conversationId, userId, payload, workspaceId));
  }

  private buildWorkspaceEvent(
    type: WorkspaceEvent['type'],
    conversationId: string,
    userId: string,
    payload: Record<string, unknown>,
    workspaceId = DEFAULT_WORKSPACE
  ): WorkspaceEvent {
    return {
      id: crypto.randomUUID(),
      type,
      workspaceId,
      conversationId,
      userId,
      payload,
      timestamp: new Date().toISOString(),
    };
  }

  private handleTyping(conversationId: string, userId: string, isTyping: boolean): void {
    const key = `${conversationId}:${userId}`;
    if (this.typingTimers.has(key)) clearTimeout(this.typingTimers.get(key)!);
    this.publish(envelope('typing:update', { conversationId, userId, isTyping }));
    if (isTyping) {
      this.typingTimers.set(
        key,
        setTimeout(() => {
          this.publish(envelope('typing:update', { conversationId, userId, isTyping: false }));
          this.typingTimers.delete(key);
        }, 2800)
      );
    }
  }

  private publish(event: ServerEvent): void {
    this.bus.publishServer(event);
  }

  private fanout(event: ServerEvent): void {
    const raw = JSON.stringify(event);
    if (event.event === 'message:new' || event.event === 'message:update') {
      const convId = String((event.payload.message as { conversationId?: string }).conversationId ?? '');
      if (convId) this.rooms.broadcast(this.rooms.conversationRoom(convId), raw);
      return;
    }
    if (event.event === 'message:deleted' || event.event === 'message:status' || event.event === 'conversation:update') {
      const convId = String((event.payload as { conversationId: string }).conversationId);
      this.rooms.broadcast(this.rooms.conversationRoom(convId), raw);
      return;
    }
    if (event.event === 'typing:update') {
      this.rooms.broadcast(this.rooms.conversationRoom(event.payload.conversationId), raw);
      return;
    }
    if (event.event.startsWith('agent:')) {
      const wsId = event.payload.workspaceId;
      this.rooms.broadcast(this.rooms.workspaceRoom(wsId), raw);
      if (event.payload.conversationId) {
        this.rooms.broadcast(this.rooms.conversationRoom(event.payload.conversationId), raw);
      }
      return;
    }
    if (event.event === 'user:online' || event.event === 'user:offline') {
      this.rooms.broadcast(this.rooms.userRoom(event.payload.userId), raw);
    }
  }
}
