import { z } from 'zod';

export const messageStatusSchema = z.enum(['sending', 'sent', 'delivered', 'read']);

export const clientEventSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.literal('message:send'),
    payload: z.object({
      conversationId: z.string().uuid(),
      content: z.string().min(1).max(4000),
      clientId: z.string().optional(),
      workspaceId: z.string().uuid().optional(),
    }),
    ts: z.number().optional(),
  }),
  z.object({
    event: z.literal('message:edit'),
    payload: z.object({ messageId: z.string().uuid(), content: z.string().min(1).max(4000) }),
    ts: z.number().optional(),
  }),
  z.object({
    event: z.literal('message:delete'),
    payload: z.object({ messageId: z.string().uuid() }),
    ts: z.number().optional(),
  }),
  z.object({
    event: z.literal('typing:start'),
    payload: z.object({ conversationId: z.string().uuid() }),
    ts: z.number().optional(),
  }),
  z.object({
    event: z.literal('typing:stop'),
    payload: z.object({ conversationId: z.string().uuid() }),
    ts: z.number().optional(),
  }),
  z.object({
    event: z.literal('message:read'),
    payload: z.object({
      conversationId: z.string().uuid(),
      messageIds: z.array(z.string().uuid()),
    }),
    ts: z.number().optional(),
  }),
  z.object({
    event: z.literal('conversation:join'),
    payload: z.object({
      conversationId: z.string().uuid(),
      workspaceId: z.string().uuid().optional(),
    }),
    ts: z.number().optional(),
  }),
  z.object({
    event: z.literal('conversation:leave'),
    payload: z.object({ conversationId: z.string().uuid() }),
    ts: z.number().optional(),
  }),
  z.object({
    event: z.literal('presence:ping'),
    payload: z.object({}).optional(),
    ts: z.number().optional(),
  }),
]);

export type ClientEvent = z.infer<typeof clientEventSchema>;

export type ServerEvent =
  | { event: 'message:new'; payload: { message: Record<string, unknown> }; ts: number }
  | { event: 'message:update'; payload: { message: Record<string, unknown> }; ts: number }
  | { event: 'message:deleted'; payload: { messageId: string; conversationId: string }; ts: number }
  | { event: 'message:status'; payload: { messageId: string; status: string; conversationId: string }; ts: number }
  | { event: 'typing:update'; payload: { conversationId: string; userId: string; isTyping: boolean }; ts: number }
  | { event: 'user:online'; payload: { userId: string; status: string }; ts: number }
  | { event: 'user:offline'; payload: { userId: string; status: string }; ts: number }
  | { event: 'conversation:update'; payload: { conversationId: string }; ts: number }
  | { event: 'agent:insight'; payload: AgentInsightPayload; ts: number }
  | { event: 'agent:task_created'; payload: AgentInsightPayload; ts: number }
  | { event: 'agent:risk_detected'; payload: AgentInsightPayload; ts: number }
  | { event: 'agent:recommendation'; payload: AgentInsightPayload; ts: number }
  | { event: 'agent:summary'; payload: AgentInsightPayload; ts: number }
  | { event: 'agent:warning'; payload: AgentInsightPayload; ts: number }
  | { event: 'error'; payload: { message: string }; ts: number };

export interface AgentInsightPayload {
  agentId: string;
  workspaceId: string;
  conversationId?: string;
  event: string;
  content: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export function envelope<E extends ServerEvent['event']>(
  event: E,
  payload: Extract<ServerEvent, { event: E }>['payload']
): ServerEvent {
  return { event, payload, ts: Date.now() } as ServerEvent;
}
