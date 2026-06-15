import type { Conversation, Message, MessageStatus, PresenceStatus } from './messages.types';

/** Client → Server */
export type ClientEventMap = {
  'message:send': { conversationId: string; content: string; clientId?: string };
  'message:edit': { messageId: string; content: string };
  'message:delete': { messageId: string };
  'typing:start': { conversationId: string };
  'typing:stop': { conversationId: string };
  'message:read': { conversationId: string; messageIds: string[] };
  'conversation:join': { conversationId: string };
  'conversation:leave': { conversationId: string };
  'presence:ping': Record<string, never>;
  'ai:summary_request': { conversationId: string };
};

/** Server → Client */
export type ServerEventMap = {
  'message:new': { message: Message };
  'message:update': { message: Message };
  'message:status': { messageId: string; status: MessageStatus; conversationId: string };
  'typing:update': { conversationId: string; userId: string; isTyping: boolean };
  'user:online': { userId: string; status: PresenceStatus };
  'user:offline': { userId: string; status: PresenceStatus };
  'conversation:update': { conversation: Conversation };
  'ai:reply_suggestions': { conversationId: string; suggestions: string[] };
  'ai:action_extract': { conversationId: string; items: string[] };
};

export type ClientEventName = keyof ClientEventMap;
export type ServerEventName = keyof ServerEventMap;

export interface RealtimeEnvelope<T extends string, P> {
  event: T;
  payload: P;
  ts: number;
}

export type ClientEnvelope<E extends ClientEventName = ClientEventName> = RealtimeEnvelope<
  E,
  ClientEventMap[E]
>;

export type ServerEnvelope<E extends ServerEventName = ServerEventName> = RealtimeEnvelope<
  E,
  ServerEventMap[E]
>;

export interface RealtimeTransport {
  connect(userId: string, token: string): Promise<void>;
  disconnect(): void;
  emit<E extends ClientEventName>(event: E, payload: ClientEventMap[E]): void;
  on<E extends ServerEventName>(event: E, handler: (payload: ServerEventMap[E]) => void): () => void;
  isConnected(): boolean;
}
