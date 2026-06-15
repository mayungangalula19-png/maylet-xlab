import { useState } from 'react';
import { Loader, PageContainer } from '../../../design-system';
import { AiAssistantPanel } from '../components/AiAssistantPanel';
import { ChatWindow } from '../components/ChatWindow';
import { ConversationList } from '../components/ConversationList';
import { MessageInput } from '../components/MessageInput';
import { NewConversationModal } from '../components/NewConversationModal';
import { useMessages } from '../hooks/useMessages';
import '../messages.css';

export default function MessagesPage() {
  const {
    authLoading,
    userId,
    conversations,
    messages,
    activeConversationId,
    activeConversation,
    setActiveConversationId,
    sending,
    typingUserIds,
    realtimeConnected,
    seedMode,
    messagesEndRef,
    sendMessage,
    handleTyping,
    startDm,
    searchUsers,
    retry,
    newConversationModal,
  } = useMessages();

  const [draft, setDraft] = useState('');

  const typingNames =
    activeConversation?.members
      .filter((m) => typingUserIds.includes(m.id))
      .map((m) => m.name) ?? [];

  const handleSend = () => {
    if (!draft.trim()) return;
    void sendMessage(draft);
    setDraft('');
  };

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
            {seedMode ? ' · Demo mode (run migration 20240612000028_messaging_schema.sql)' : ''}
          </p>
        </div>
      </header>

      <div className="msg-layout">
        <ConversationList
          state={conversations}
          activeId={activeConversationId}
          onSelect={setActiveConversationId}
          onNewMessage={() => newConversationModal.open({ id: '', name: '', avatar: null })}
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
          />
          {activeConversation && (
            <MessageInput
              value={draft}
              sending={sending}
              onChange={setDraft}
              onSend={handleSend}
              onTyping={handleTyping}
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
        />
      </div>

      <NewConversationModal
        open={newConversationModal.isOpen}
        onClose={newConversationModal.close}
        onSelectUser={startDm}
        searchUsers={searchUsers}
      />
    </PageContainer>
  );
}
