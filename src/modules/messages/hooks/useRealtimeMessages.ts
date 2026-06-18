import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { debounce } from '../../../core/utils/debounce';
import type {
  ClientEventMap,
  ClientEventName,
  RealtimeTransport,
  ServerEventMap,
  ServerEventName,
} from '../types/realtime.events';
import type { Message, MessageStatus } from '../types/messages.types';

const WS_URL = import.meta.env.VITE_MESSAGING_WS_URL?.replace(/\/$/, '') ?? '';
const WS_CONNECT_TIMEOUT_MS = 1_500;

type HandlerMap = Map<ServerEventName, Set<(payload: unknown) => void>>;

export type MessagesRealtimeApi = RealtimeTransport & {
  subscribeConversation(conversationId: string): void;
  unsubscribeConversation(conversationId: string): void;
  notifyTyping(conversationId: string, isTyping: boolean): void;
};

function createSupabaseTransport(): MessagesRealtimeApi {
  const handlers: HandlerMap = new Map();
  const channels = new Map<string, ReturnType<typeof supabase.channel>>();
  let userId = '';
  let connected = false;

  const emitLocal = <E extends ServerEventName>(event: E, payload: ServerEventMap[E]) => {
    handlers.get(event)?.forEach((fn) => fn(payload));
  };

  return {
    async connect(uid: string, _token?: string) {
      userId = uid;
      connected = true;
      emitLocal('user:online', { userId: uid, status: 'online' });
    },
    disconnect() {
      for (const ch of channels.values()) void ch.unsubscribe();
      channels.clear();
      if (userId) emitLocal('user:offline', { userId, status: 'offline' });
      connected = false;
    },
    emit<E extends ClientEventName>(_event: E, _payload: ClientEventMap[E]) {
      // Supabase transport uses DB writes from messages.service; typing is ephemeral via broadcast
    },
    on<E extends ServerEventName>(event: E, handler: (payload: ServerEventMap[E]) => void) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      const wrapped = handler as (payload: unknown) => void;
      handlers.get(event)!.add(wrapped);
      return () => handlers.get(event)?.delete(wrapped);
    },
    isConnected: () => connected,
    subscribeConversation(conversationId: string) {
      if (channels.has(conversationId)) return;
      const channel = supabase
        .channel(`msg_conv_${conversationId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          (payload) => {
            const row = payload.new as Record<string, unknown>;
            const message: Message = {
              id: String(row.id),
              conversationId: String(row.conversation_id),
              senderId: String(row.sender_id),
              content: String(row.content),
              status: row.read ? 'read' : ((row.status as MessageStatus) ?? 'sent'),
              type: (row.message_type as Message['type']) ?? 'text',
              createdAt: String(row.created_at),
            };
            emitLocal('message:new', { message });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          (payload) => {
            const row = payload.new as Record<string, unknown>;
            const message: Message = {
              id: String(row.id),
              conversationId: String(row.conversation_id),
              senderId: String(row.sender_id),
              content: String(row.content),
              status: row.read ? 'read' : ((row.status as MessageStatus) ?? 'sent'),
              type: (row.message_type as Message['type']) ?? 'text',
              createdAt: String(row.created_at),
            };
            emitLocal('message:update', { message });
            emitLocal('message:status', {
              messageId: message.id,
              status: message.status,
              conversationId: message.conversationId,
            });
          }
        )
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          const p = payload as { userId: string; isTyping: boolean };
          emitLocal('typing:update', {
            conversationId,
            userId: p.userId,
            isTyping: p.isTyping,
          });
        })
        .subscribe();
      channels.set(conversationId, channel);
    },
    unsubscribeConversation(conversationId: string) {
      const ch = channels.get(conversationId);
      if (ch) {
        void ch.unsubscribe();
        channels.delete(conversationId);
      }
    },
    notifyTyping: debounce((conversationId: string, isTyping: boolean) => {
      const ch = channels.get(conversationId);
      if (!ch || !userId) return;
      void ch.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping },
      });
    }, 300),
  };
}

function createWebSocketTransport(): MessagesRealtimeApi {
  let socket: WebSocket | null = null;
  let userId = '';
  const handlers: HandlerMap = new Map();
  let connected = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const emitLocal = <E extends ServerEventName>(event: E, payload: ServerEventMap[E]) => {
    handlers.get(event)?.forEach((fn) => fn(payload));
  };

  const scheduleReconnect = (token: string) => {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (userId) void connectInternal(userId, token);
    }, 2500);
  };

  const connectInternal = (uid: string, token: string) =>
    new Promise<void>((resolve, reject) => {
      userId = uid;
      socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
      socket.onopen = () => {
        connected = true;
        emitLocal('user:online', { userId: uid, status: 'online' });
        resolve();
      };
      socket.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(String(ev.data)) as { event: ServerEventName; payload: unknown };
          const set = handlers.get(parsed.event);
          set?.forEach((fn) => fn(parsed.payload));
        } catch {
          /* ignore malformed frames */
        }
      };
      socket.onclose = () => {
        connected = false;
        emitLocal('user:offline', { userId: uid, status: 'offline' });
        scheduleReconnect(token);
      };
      socket.onerror = () => reject(new Error('WebSocket connection failed'));
    });

  return {
    connect: connectInternal,
    disconnect() {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
      socket = null;
      connected = false;
    },
    emit<E extends ClientEventName>(event: E, payload: ClientEventMap[E]) {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ event, payload, ts: Date.now() }));
    },
    on<E extends ServerEventName>(event: E, handler: (payload: ServerEventMap[E]) => void) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      const wrapped = handler as (payload: unknown) => void;
      handlers.get(event)!.add(wrapped);
      return () => handlers.get(event)?.delete(wrapped);
    },
    isConnected: () => connected,
    subscribeConversation(conversationId: string) {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ event: 'conversation:join', payload: { conversationId }, ts: Date.now() }));
      }
    },
    unsubscribeConversation(conversationId: string) {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ event: 'conversation:leave', payload: { conversationId }, ts: Date.now() }));
      }
    },
    notifyTyping: debounce((conversationId: string, isTyping: boolean) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            event: isTyping ? 'typing:start' : 'typing:stop',
            payload: { conversationId },
            ts: Date.now(),
          })
        );
      }
    }, 300),
  };
}

export function useRealtimeMessages(userId: string | undefined) {
  const transportRef = useRef<MessagesRealtimeApi | null>(null);
  const pendingHandlersRef = useRef<
    Array<{ event: ServerEventName; handler: (payload: unknown) => void; off?: () => void }>
  >([]);
  const [connected, setConnected] = useState(false);

  const bindPendingHandlers = useCallback((transport: MessagesRealtimeApi) => {
    for (const entry of pendingHandlersRef.current) {
      if (!entry.off) {
        entry.off = transport.on(entry.event, entry.handler as (payload: ServerEventMap[typeof entry.event]) => void);
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    const useWs = Boolean(WS_URL);

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? '';

      if (useWs && token) {
        const wsTransport = createWebSocketTransport();
        try {
          await Promise.race([
            wsTransport.connect(userId, token),
            new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error('WebSocket connect timeout')), WS_CONNECT_TIMEOUT_MS)
            ),
          ]);
          if (!cancelled) {
            transportRef.current = wsTransport;
            bindPendingHandlers(wsTransport);
            setConnected(wsTransport.isConnected());
          }
          return;
        } catch (err) {
          console.warn(
            '[messages] Custom WebSocket unavailable (check VITE_MESSAGING_WS_URL). Falling back to Supabase Realtime.',
            err
          );
          wsTransport.disconnect();
        }
      }

      const base = createSupabaseTransport();
      try {
        await base.connect(userId, token);
        if (!cancelled) {
          transportRef.current = base;
          bindPendingHandlers(base);
          setConnected(base.isConnected());
        }
      } catch {
        if (!cancelled) setConnected(false);
      }
    };

    void init();

    const heartbeat = setInterval(() => {
      transportRef.current?.emit('presence:ping', {});
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      transportRef.current?.disconnect();
      transportRef.current = null;
      setConnected(false);
    };
  }, [userId, bindPendingHandlers]);

  const on = useCallback(
    <E extends ServerEventName>(event: E, handler: (payload: ServerEventMap[E]) => void) => {
      const transport = transportRef.current;
      if (transport) {
        return transport.on(event, handler);
      }
      const entry: { event: ServerEventName; handler: (payload: unknown) => void; off?: () => void } = {
        event,
        handler: handler as (payload: unknown) => void,
      };
      pendingHandlersRef.current.push(entry);
      return () => {
        entry.off?.();
        pendingHandlersRef.current = pendingHandlersRef.current.filter((h) => h !== entry);
      };
    },
    []
  );

  const emit = useCallback(
    <E extends ClientEventName>(event: E, payload: ClientEventMap[E]) => {
      transportRef.current?.emit(event, payload);
    },
    []
  );

  const subscribeConversation = useCallback((conversationId: string) => {
    transportRef.current?.subscribeConversation(conversationId);
  }, []);

  const unsubscribeConversation = useCallback((conversationId: string) => {
    transportRef.current?.unsubscribeConversation(conversationId);
  }, []);

  const notifyTyping = useCallback((conversationId: string, isTyping: boolean) => {
    transportRef.current?.notifyTyping(conversationId, isTyping);
  }, []);

  return useMemo(
    () => ({
      connected,
      on,
      emit,
      subscribeConversation,
      unsubscribeConversation,
      notifyTyping,
    }),
    [connected, on, emit, subscribeConversation, unsubscribeConversation, notifyTyping]
  );
}
