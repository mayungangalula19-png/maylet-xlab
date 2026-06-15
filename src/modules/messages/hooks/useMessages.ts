import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { usePageLoad } from '../../../core/hooks/usePageLoad';
import { useModalState } from '../../../core/hooks/useModalState';
import { makeClientId } from '../lib/messageUtils';
import { messagesService } from '../services/messages.service';
import { useAIMessagingAssistant } from './useAIMessagingAssistant';
import { useRealtimeMessages } from './useRealtimeMessages';
import type { AsyncState, Conversation, Message, MessageUser } from '../types/messages.types';

export function useMessages() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;

  const [conversations, setConversations] = useState<AsyncState<Conversation[]>>({
    loading: true,
    error: null,
    data: null,
  });
  const [messages, setMessages] = useState<AsyncState<Message[]>>({
    loading: false,
    error: null,
    data: null,
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<MessageUser | null>(null);

  const newConversationModal = useModalState<MessageUser>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const realtime = useRealtimeMessages(userId);
  const messageList = messages.data ?? [];
  const { aiPanel, refreshAi } = useAIMessagingAssistant(activeConversationId, messageList);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  const refreshConversations = useCallback(async () => {
    if (!userId) return;
    setConversations((s) => ({ ...s, loading: true, error: null }));
    try {
      const page = await messagesService.getPageData(userId, user?.user_metadata?.full_name ?? 'You');
      setCurrentUser(page.currentUser);
      setConversations({ loading: false, error: null, data: page.conversations });
      if (!activeConversationId && page.conversations.length) {
        setActiveConversationId(page.conversations[0].id);
      }
    } catch (e) {
      setConversations({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load conversations',
        data: null,
      });
    }
  }, [userId, user?.user_metadata?.full_name, activeConversationId]);

  usePageLoad(async ({ cancelled }) => {
    if (!userId) return;
    await refreshConversations();
    if (cancelled()) return;
  }, [userId, refreshConversations]);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!userId) return;
      setMessages({ loading: true, error: null, data: null });
      try {
        const list = await messagesService.fetchMessages(conversationId, userId);
        setMessages({ loading: false, error: null, data: list });
      } catch (e) {
        setMessages({
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load messages',
          data: null,
        });
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!activeConversationId) return;
    void loadMessages(activeConversationId);
    realtime.subscribeConversation(activeConversationId);
    return () => realtime.unsubscribeConversation(activeConversationId);
  }, [activeConversationId, loadMessages, realtime]);

  useEffect(() => {
    if (!realtime.connected) return;

    const offNew = realtime.on('message:new', ({ message }) => {
      if (message.conversationId !== activeConversationId) {
        void refreshConversations();
        return;
      }
      setMessages((s) => {
        const existing = s.data ?? [];
        if (existing.some((m) => m.id === message.id)) return s;
        return { ...s, data: [...existing, message] };
      });
      void refreshConversations();
    });

    const offStatus = realtime.on('message:status', ({ messageId, status }) => {
      setMessages((s) => {
        if (!s.data) return s;
        return {
          ...s,
          data: s.data.map((m) => (m.id === messageId ? { ...m, status } : m)),
        };
      });
    });

    const offTyping = realtime.on('typing:update', ({ conversationId, userId: typerId, isTyping }) => {
      if (conversationId !== activeConversationId || typerId === userId) return;
      setTypingUserIds((prev) => {
        if (isTyping) return prev.includes(typerId) ? prev : [...prev, typerId];
        return prev.filter((id) => id !== typerId);
      });
    });

    const offConversation = realtime.on('conversation:update', () => {
      void refreshConversations();
    });

    return () => {
      offNew?.();
      offStatus?.();
      offTyping?.();
      offConversation?.();
    };
  }, [activeConversationId, realtime, realtime.connected, refreshConversations, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.data]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!userId || !activeConversationId || !content.trim()) return;
      const clientId = makeClientId();
      const optimistic: Message = {
        id: clientId,
        conversationId: activeConversationId,
        senderId: userId,
        content: content.trim(),
        status: 'sending',
        type: 'text',
        createdAt: new Date().toISOString(),
        clientId,
      };

      setSending(true);
      setMessages((s) => ({ ...s, data: [...(s.data ?? []), optimistic] }));

      try {
        const saved = await messagesService.sendMessage({
          conversationId: activeConversationId,
          senderId: userId,
          content,
          clientId,
        });
        realtime.emit('message:send', {
          conversationId: activeConversationId,
          content: saved.content,
          clientId,
        });
        setMessages((s) => ({
          ...s,
          data: (s.data ?? []).map((m) =>
            m.clientId === clientId ? { ...saved, status: 'sent' as const, clientId } : m
          ),
        }));
        void refreshConversations();
        refreshAi();
      } catch (e) {
        setMessages((s) => ({
          ...s,
          data: (s.data ?? []).filter((m) => m.clientId !== clientId),
          error: e instanceof Error ? e.message : 'Failed to send message',
        }));
      } finally {
        setSending(false);
        realtime.notifyTyping(activeConversationId, false);
      }
    },
    [activeConversationId, realtime, refreshAi, refreshConversations, userId]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConversationId) return;
      realtime.notifyTyping(activeConversationId, isTyping);
    },
    [activeConversationId, realtime]
  );

  const startDm = useCallback(
    async (other: MessageUser) => {
      if (!userId) return;
      try {
        const convId = await messagesService.createDm({ userId, otherUserId: other.id });
        await refreshConversations();
        setActiveConversationId(convId);
        newConversationModal.close();
      } catch (e) {
        setConversations((s) => ({
          ...s,
          error: e instanceof Error ? e.message : 'Failed to start conversation',
        }));
      }
    },
    [userId, refreshConversations, newConversationModal]
  );

  const searchUsers = useCallback(
    async (query: string): Promise<MessageUser[]> => {
      if (!userId) return [];
      return messagesService.searchUsers(query, userId);
    },
    [userId]
  );

  const activeConversation = useMemo(
    () => conversations.data?.find((c) => c.id === activeConversationId) ?? null,
    [conversations.data, activeConversationId]
  );

  const retry = useCallback(() => {
    void refreshConversations();
    if (activeConversationId) void loadMessages(activeConversationId);
    refreshAi();
  }, [activeConversationId, loadMessages, refreshAi, refreshConversations]);

  return {
    authLoading,
    userId,
    currentUser,
    conversations,
    messages,
    aiPanel,
    activeConversationId,
    activeConversation,
    setActiveConversationId,
    sending,
    typingUserIds,
    realtimeConnected: realtime.connected,
    seedMode: messagesService.isSeedMode(),
    messagesEndRef,
    sendMessage,
    handleTyping,
    startDm,
    searchUsers,
    retry,
    newConversationModal,
  };
}
