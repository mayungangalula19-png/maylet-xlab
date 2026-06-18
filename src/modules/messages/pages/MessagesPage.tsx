import { useCallback, useRef, useState } from 'react';
import { Loader, PageContainer } from '../../../design-system';
import { invokeMayaChat } from '../../../lib/maya/mayaChat.service';
import { AiAssistantPanel } from '../components/AiAssistantPanel';
import { ChatWindow } from '../components/ChatWindow';
import { ConversationList } from '../components/ConversationList';
import { MessageInput, type ComposerPayload } from '../components/MessageInput';
import { NewConversationModal } from '../components/NewConversationModal';
import { useMessages } from '../hooks/useMessages';
import '../messages.css';

const AI_ASSIST_PROMPTS: Record<string, string> = {
  rewrite: 'Rewrite the following message for clarity and professionalism. Return only the rewritten message.',
  improve: 'Improve the grammar and tone of this message. Return only the improved message.',
  summarize: 'Summarize this draft into key bullet points. Return only the summary.',
  gen_questions: 'Generate 3 research questions based on this draft. Return only the questions.',
  gen_validation: 'Generate validation criteria from this draft. Return only the criteria.',
  gen_funding: 'Structure this draft as a concise funding request. Return only the request.',
  gen_commercialization: 'Add commercialization recommendations to this draft. Return the full revised message.',
  gen_ideas: 'Expand this draft with 3 related innovation ideas. Return only the ideas.',
};

export default function MessagesPage() {
  const {
    authLoading,
    userId,
    conversations,
    messages,
    aiPanel,
    activeConversationId,
    activeConversation,
    setActiveConversationId,
    sending,
    typingUserIds,
    realtimeConnected,
    messagesEndRef,
    sendComposer,
    handleTyping,
    startDm,
    createWorkspace,
    searchUsers,
    retry,
    newConversationModal,
    openNewConversationModal,
  } = useMessages();

  const [draft, setDraft] = useState('');
  const pendingPayloadRef = useRef<ComposerPayload | null>(null);

  const typingNames =
    activeConversation?.members
      .filter((m) => typingUserIds.includes(m.id))
      .map((m) => m.name) ?? [];

  const handleSubmitPayload = useCallback((payload: ComposerPayload) => {
    pendingPayloadRef.current = payload;
  }, []);

  const handleSend = useCallback(() => {
    const payload =
      pendingPayloadRef.current ??
      (draft.trim()
        ? {
            content: draft,
            messageType: 'standard' as const,
            priority: 'normal' as const,
            attachments: [],
            mentionedIds: [],
            metadata: {},
          }
        : null);

    pendingPayloadRef.current = null;
    if (!payload?.content.trim()) return;

    void sendComposer(payload);
    setDraft('');
  }, [draft, sendComposer]);

  const handleSearchMentions = useCallback(
    async (query: string) => {
      const users = await searchUsers(query);
      return users.map((u) => ({
        id: u.id,
        name: u.name,
        avatarUrl: u.avatar ?? undefined,
      }));
    },
    [searchUsers]
  );

  const openCreateWorkspace = useCallback(() => {
    openNewConversationModal({ id: '', name: '', avatar: null });
  }, [openNewConversationModal]);

  const handleAiAssist = useCallback(async (action: string, content: string) => {
    const instruction = AI_ASSIST_PROMPTS[action] ?? `Assist with: ${action}`;
    return invokeMayaChat([
      { role: 'system', content: 'You are MAYA, the Maylet XLab messaging assistant.' },
      { role: 'user', content: `${instruction}\n\n---\n${content}` },
    ]);
  }, []);

  if (authLoading) {
    return (
      <PageContainer>
        <Loader label="Loading messages…" />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="msg-page">
      <header className="msg-page__header">
        <div>
          <h1>Messages</h1>
          <p className="msg-page__sub">
            WhatsApp-style DMs + Slack-style channels ·{' '}
            <span className={realtimeConnected ? 'msg-live msg-live--on' : 'msg-live'}>
              {realtimeConnected ? 'Live' : 'Connecting…'}
            </span>
          </p>
        </div>
      </header>

      <div className="msg-layout">
        <ConversationList
          state={conversations}
          activeId={activeConversationId}
          onSelect={setActiveConversationId}
          onNewMessage={openCreateWorkspace}
          onRetry={retry}
        />

        <div className="msg-workspace">
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            userId={userId}
            draft={draft}
            sending={sending}
            typingNames={typingNames}
            messagesEndRef={messagesEndRef}
            onDraftChange={setDraft}
            onSend={handleSend}
            onTyping={handleTyping}
            onRetry={retry}
            onCreateWorkspace={openCreateWorkspace}
          />
          {activeConversation && (
            <MessageInput
              value={draft}
              sending={sending}
              onChange={setDraft}
              onSend={handleSend}
              onTyping={handleTyping}
              onSubmitPayload={handleSubmitPayload}
              searchMentions={handleSearchMentions}
              onAiAssist={handleAiAssist}
              conversationId={activeConversationId ?? undefined}
              conversationType={activeConversation.type}
            />
          )}
        </div>

        <AiAssistantPanel
          context={{
            conversationId: activeConversationId || undefined,
            userId: userId || undefined,
            pageContext: 'messages',
          }}
          insights={aiPanel.data}
          insightsLoading={aiPanel.loading}
        />
      </div>

      <NewConversationModal
        open={newConversationModal.isOpen}
        onClose={newConversationModal.close}
        onSelectUser={startDm}
        searchUsers={searchUsers}
        onCreateWorkspace={createWorkspace}
      />
    </PageContainer>
  );
}
