import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { usePageLoad } from '../../../core/hooks/usePageLoad';
import { useModalState } from '../../../core/hooks/useModalState';
import type { ComposerPayload } from '../components/MessageInput';
import { dedupeById, makeClientId } from '../lib/messageUtils';
import { messagesService } from '../services/messages.service';
import { workspaceService } from '../services/workspace.service';
import type { WorkspaceCreationPayload } from '../types/workspaceCreation.types';
import { useAIMessagingAssistant } from './useAIMessagingAssistant';
import { useRealtimeMessages } from './useRealtimeMessages';
import type { AsyncState, Conversation, Message, MessageUser, SendMessagePayload } from '../types/messages.types';
import { MessagingSchemaError } from '../types/messages.types';

const EMPTY_MESSAGE_LIST: Message[] = [];

function patchConversationPreview(
  conversations: Conversation[],
  message: Message,
  options?: { incrementUnread?: boolean }
): Conversation[] {
  return conversations.map((c) => {
    if (c.id !== message.conversationId) return c;
    return {
      ...c,
      lastMessage: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        createdAt: message.createdAt,
        status: message.status,
      },
      unreadCount: options?.incrementUnread ? c.unreadCount + 1 : c.unreadCount,
    };
  });
}

function composerToSendPayload(
  composer: ComposerPayload,
  conversationId: string,
  senderId: string,
  clientId: string,
  workspaceId?: string | null,
  conversationType?: string
): SendMessagePayload {
  return {
    conversationId,
    senderId,
    content: composer.content,
    clientId,
    messageType: composer.messageType,
    priority: composer.priority,
    mentionedIds: composer.mentionedIds,
    workspaceId,
    conversationType,
    attachmentMeta: composer.attachments.map((a) => ({
      name: a.name,
      size: a.size,
      mimeType: a.mimeType,
    })),
  };
}

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
  const openNewConversationModal = newConversationModal.open;
  const closeNewConversationModal = newConversationModal.close;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const shouldSmoothScrollRef = useRef(false);

  activeConversationIdRef.current = activeConversationId;

  const realtime = useRealtimeMessages(userId);
  const messageList = messages.data ?? EMPTY_MESSAGE_LIST;
  const { aiPanel, refreshAi } = useAIMessagingAssistant(activeConversationId, messageList);

  const activeConversation = useMemo(
    () => conversations.data?.find((c) => c.id === activeConversationId) ?? null,
    [conversations.data, activeConversationId]
  );

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  const refreshConversations = useCallback(async () => {
    if (!userId) return;
    setConversations((s) => ({ ...s, loading: s.data === null, error: null }));
    try {
      const page = await messagesService.getPageData(userId, user?.user_metadata?.full_name ?? 'You');
      setCurrentUser(page.currentUser);
      setConversations({
        loading: false,
        error: null,
        data: dedupeById(page.conversations),
      });
      setActiveConversationId((prev) => prev ?? page.conversations[0]?.id ?? null);
    } catch (e) {
      const message =
        e instanceof MessagingSchemaError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Failed to load conversations';
      setConversations({
        loading: false,
        error: message,
        data: null,
      });
    }
  }, [userId, user?.user_metadata?.full_name]);

  usePageLoad(async ({ cancelled }) => {
    if (!userId) return;
    await refreshConversations();
    if (cancelled()) return;
  }, [userId, refreshConversations]);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!userId) return;
      setMessages((s) => ({
        ...s,
        loading: true,
        error: null,
      }));
      try {
        const list = await messagesService.fetchMessages(conversationId, userId);
        shouldSmoothScrollRef.current = false;
        setMessages({ loading: false, error: null, data: list });
        setConversations((s) => {
          if (!s.data) return s;
          return {
            ...s,
            data: s.data.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
          };
        });
      } catch (e) {
        const message =
          e instanceof MessagingSchemaError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Failed to load messages';
        setMessages((s) => ({
          ...s,
          loading: false,
          error: message,
        }));
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!activeConversationId) return;
    void loadMessages(activeConversationId);
    realtime.subscribeConversation(activeConversationId);
    return () => realtime.unsubscribeConversation(activeConversationId);
  }, [activeConversationId, loadMessages, realtime.subscribeConversation, realtime.unsubscribeConversation]);

  useEffect(() => {
    if (!realtime.connected) return;

    const offNew = realtime.on('message:new', ({ message }) => {
      const activeId = activeConversationIdRef.current;
      if (message.conversationId !== activeId) {
        setConversations((s) => {
          if (!s.data) return s;
          return {
            ...s,
            data: patchConversationPreview(s.data, message, { incrementUnread: true }),
          };
        });
        return;
      }

      shouldSmoothScrollRef.current = true;
      setMessages((s) => {
        const existing = s.data ?? [];
        if (existing.some((m) => m.id === message.id || (message.clientId && m.clientId === message.clientId))) {
          return s;
        }
        return { ...s, data: dedupeById([...existing, message]) };
      });
      setConversations((s) => {
        if (!s.data) return s;
        return { ...s, data: patchConversationPreview(s.data, message) };
      });
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
      if (conversationId !== activeConversationIdRef.current || typerId === userId) return;
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
  }, [realtime.connected, realtime.on, refreshConversations, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: shouldSmoothScrollRef.current ? 'smooth' : 'auto',
    });
  }, [messages.data]);

  const sendComposer = useCallback(
    async (composer: ComposerPayload) => {
      if (!userId || !activeConversationId || !composer.content.trim()) return;

      const clientId = makeClientId();
      const sendPayload = composerToSendPayload(
        composer,
        activeConversationId,
        userId,
        clientId,
        activeConversation?.workspaceId,
        activeConversation?.type
      );

      const optimistic: Message = {
        id: clientId,
        conversationId: activeConversationId,
        senderId: userId,
        content: composer.content.trim(),
        status: 'sending',
        type: 'text',
        createdAt: new Date().toISOString(),
        clientId,
        metadata: {
          priority: composer.priority,
          composerType: composer.messageType,
          mentionedIds: composer.mentionedIds,
          attachmentMeta: sendPayload.attachmentMeta,
        },
      };

      setSending(true);
      shouldSmoothScrollRef.current = true;
      setMessages((s) => ({ ...s, data: [...(s.data ?? []), optimistic] }));

      try {
        const saved = await messagesService.sendMessage(sendPayload);
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
        setConversations((s) => {
          if (!s.data) return s;
          return { ...s, data: patchConversationPreview(s.data, saved) };
        });
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
    [activeConversation, activeConversationId, realtime, refreshAi, userId]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConversationId) return;
      realtime.notifyTyping(activeConversationId, isTyping);
    },
    [activeConversationId, realtime.notifyTyping]
  );

  const startDm = useCallback(
    async (other: MessageUser) => {
      if (!userId) return;
      try {
        const convId = await messagesService.createDm({ userId, otherUserId: other.id });
        await refreshConversations();
        setActiveConversationId(convId);
        closeNewConversationModal();
      } catch (e) {
        setConversations((s) => ({
          ...s,
          error: e instanceof Error ? e.message : 'Failed to start conversation',
        }));
      }
    },
    [userId, refreshConversations, closeNewConversationModal]
  );

  const createWorkspace = useCallback(
    async (payload: WorkspaceCreationPayload) => {
      if (!userId) return;

      try {
        if (payload.workspaceType === 'direct') {
          const other = payload.participants[0];
          if (other) {
            await startDm(other);
          }
          return;
        }

        const result = await workspaceService.createWorkspace(userId, payload);
        await refreshConversations();
        setActiveConversationId(result.conversationId);
        closeNewConversationModal();
      } catch (e) {
        setConversations((s) => ({
          ...s,
          error: e instanceof Error ? e.message : 'Failed to create workspace',
        }));
      }
    },
    [userId, refreshConversations, closeNewConversationModal, startDm]
  );

  const searchUsers = useCallback(
    async (query: string): Promise<MessageUser[]> => {
      if (!userId) return [];
      return messagesService.searchUsers(query, userId);
    },
    [userId]
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
    messagesEndRef,
    sendComposer,
    handleTyping,
    startDm,
    createWorkspace,
    searchUsers,
    retry,
    newConversationModal,
    openNewConversationModal,
  };
}
