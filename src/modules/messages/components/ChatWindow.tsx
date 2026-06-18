import { useState, useMemo, type RefObject } from 'react';
import { Card, Loader } from '../../../design-system';
import { Button } from '../../../modules/shared';
import { MessagesEmptyState } from './MessagesEmptyState';
import { MessagesSkeleton } from './MessagesSkeleton';
import { TypingIndicator } from './TypingIndicator';
import { dedupeById } from '../lib/messageUtils';
import type { AsyncState, Conversation, Message } from '../types/messages.types';

// ============================================================================
// TYPES
// ============================================================================

export type MessageType =
  | 'standard'
  | 'system'
  | 'project'
  | 'research'
  | 'prototype'
  | 'experiment'
  | 'validation'
  | 'funding'
  | 'commercialization'
  | 'ai_assistant';

export interface ExtendedMessage extends Message {
  messageType?: MessageType;
  attachedObject?: AttachedObject;
  thread?: Thread;
  reactions?: Reaction[];
  isPinned?: boolean;
  isSaved?: boolean;
  readBy?: string[];
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface AttachedObject {
  type: 'project' | 'research' | 'prototype' | 'experiment' | 'validation' | 'funding' | 'document' | 'post';
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  progress?: number;
  stage?: string;
  metadata?: Record<string, any>;
  thumbnailUrl?: string;
}

export interface Thread {
  id: string;
  replyCount: number;
  lastReplyAt: Date;
  participants: string[];
}

export interface Reaction {
  emoji: string;
  users: string[];
  count: number;
}

interface Props {
  conversation: Conversation | null;
  messages: AsyncState<Message[]>;
  userId: string | undefined;
  draft: string;
  sending: boolean;
  typingNames: string[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onTyping: (typing: boolean) => void;
  onRetry: () => void;
  onCreateWorkspace?: () => void;
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatMessageTime(createdAt: Date | string): string {
  const date = new Date(createdAt);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(createdAt: Date | string): string {
  const date = new Date(createdAt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  return date.toLocaleDateString([], { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
}

function shouldShowDateSeparator(
  current: Message,
  previous: Message | undefined
): boolean {
  if (!previous) return true;
  
  const currentDate = new Date(current.createdAt).toDateString();
  const previousDate = new Date(previous.createdAt).toDateString();
  
  return currentDate !== previousDate;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface MessageActionsProps {
  message: ExtendedMessage;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onPin: () => void;
  onSave: () => void;
  onConvertToNote: () => void;
  onAssignTask: () => void;
  onMore: () => void;
}

function MessageActions({
  message,
  onReact,
  onReply,
  onPin,
  onSave,
  onConvertToNote,
  onAssignTask,
  onMore,
}: MessageActionsProps) {
  const [showReactions, setShowReactions] = useState(false);
  const reactions = ['👍', '❤️', '😊', '🎉', '🚀', '💡'];

  return (
    <div className="chat-msg-actions">
      <div className="chat-msg-actions__group">
        <button
          type="button"
          className="chat-msg-action"
          onClick={() => setShowReactions(!showReactions)}
          title="Add reaction"
        >
          😊
        </button>
        
        {showReactions && (
          <div className="chat-reactions-picker">
            {reactions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="chat-reaction-option"
                onClick={() => {
                  onReact(emoji);
                  setShowReactions(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          className="chat-msg-action"
          onClick={onReply}
          title="Reply in thread"
        >
          💬
        </button>

        <button
          type="button"
          className="chat-msg-action"
          onClick={onPin}
          title={message.isPinned ? 'Unpin' : 'Pin message'}
        >
          📌
        </button>

        <button
          type="button"
          className="chat-msg-action"
          onClick={onSave}
          title={message.isSaved ? 'Unsave' : 'Save message'}
        >
          🔖
        </button>

        <button
          type="button"
          className="chat-msg-action"
          onClick={onConvertToNote}
          title="Convert to project note"
        >
          📝
        </button>

        <button
          type="button"
          className="chat-msg-action"
          onClick={onAssignTask}
          title="Create task from message"
        >
          ✓
        </button>

        <button
          type="button"
          className="chat-msg-action"
          onClick={onMore}
          title="More actions"
        >
          ⋯
        </button>
      </div>
    </div>
  );
}

interface RichObjectCardProps {
  object: AttachedObject;
  onClick: () => void;
}

function RichObjectCard({ object, onClick }: RichObjectCardProps) {
  const getObjectIcon = () => {
    switch (object.type) {
      case 'project': return '📁';
      case 'research': return '🔬';
      case 'prototype': return '🛠️';
      case 'experiment': return '🧪';
      case 'validation': return '✓';
      case 'funding': return '💰';
      case 'document': return '📄';
      case 'post': return '📢';
      default: return '📎';
    }
  };

  return (
    <div className="chat-object-card" onClick={onClick}>
      <div className="chat-object-card__icon">{getObjectIcon()}</div>
      <div className="chat-object-card__content">
        <div className="chat-object-card__header">
          <span className="chat-object-card__type">{object.type.toUpperCase()}</span>
          {object.status && (
            <span className="chat-object-card__status">{object.status}</span>
          )}
        </div>
        <h4 className="chat-object-card__title">{object.title}</h4>
        {object.subtitle && (
          <p className="chat-object-card__subtitle">{object.subtitle}</p>
        )}
        {object.stage && (
          <div className="chat-object-card__meta">
            <span>Stage:</span> <strong>{object.stage}</strong>
          </div>
        )}
        {object.progress !== undefined && (
          <div className="chat-object-card__progress">
            <div className="chat-object-card__progress-bar">
              <div
                className="chat-object-card__progress-fill"
                style={{ width: `${object.progress}%` }}
              />
            </div>
            <span className="chat-object-card__progress-text">{object.progress}%</span>
          </div>
        )}
        <button type="button" className="chat-object-card__button">
          Open {object.type}
        </button>
      </div>
    </div>
  );
}

interface MessageReactionsProps {
  reactions: Reaction[];
  userId: string;
  onReact: (emoji: string) => void;
}

function MessageReactions({ reactions, userId, onReact }: MessageReactionsProps) {
  if (!reactions?.length) return null;

  return (
    <div className="chat-msg-reactions">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          className={`chat-msg-reaction ${
            reaction.users.includes(userId) ? 'chat-msg-reaction--active' : ''
          }`}
          onClick={() => onReact(reaction.emoji)}
          title={reaction.users.join(', ')}
        >
          <span className="chat-msg-reaction__emoji">{reaction.emoji}</span>
          <span className="chat-msg-reaction__count">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}

interface MessageThreadProps {
  thread: Thread;
  onOpen: () => void;
}

function MessageThread({ thread, onOpen }: MessageThreadProps) {
  return (
    <button type="button" className="chat-msg-thread" onClick={onOpen}>
      <span className="chat-msg-thread__icon">💬</span>
      <span className="chat-msg-thread__text">
        {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
      </span>
      <span className="chat-msg-thread__time">
        Last reply {formatMessageTime(thread.lastReplyAt)}
      </span>
    </button>
  );
}

interface MessageBubbleProps {
  message: ExtendedMessage;
  isOwn: boolean;
  userId: string;
  senderName: string;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onSave: (messageId: string) => void;
  onConvertToNote: (messageId: string) => void;
  onAssignTask: (messageId: string) => void;
  onOpenObject: (object: AttachedObject) => void;
  onOpenThread: (threadId: string) => void;
}

function EnhancedMessageBubble({
  message,
  isOwn,
  userId,
  senderName,
  onReact,
  onReply,
  onPin,
  onSave,
  onConvertToNote,
  onAssignTask,
  onOpenObject,
  onOpenThread,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  const getMessageClass = () => {
    const base = 'chat-msg';
    const classes = [base];
    
    if (isOwn) classes.push(`${base}--own`);
    if (message.isPinned) classes.push(`${base}--pinned`);
    if (message.messageType) classes.push(`${base}--${message.messageType}`);
    
    return classes.join(' ');
  };

  return (
    <div
      className={getMessageClass()}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwn && (
        <div className="chat-msg__avatar">
          <div className="chat-msg__avatar-circle">
            {senderName?.[0] || '?'}
          </div>
        </div>
      )}

      <div className="chat-msg__content">
        {!isOwn && (
          <div className="chat-msg__header">
            <span className="chat-msg__sender">{senderName}</span>
            <span className="chat-msg__time">{formatMessageTime(message.createdAt)}</span>
            {message.deliveryStatus && (
              <span className={`chat-msg__status chat-msg__status--${message.deliveryStatus}`}>
                {message.deliveryStatus === 'read' && '✓✓'}
                {message.deliveryStatus === 'delivered' && '✓'}
                {message.deliveryStatus === 'sent' && '•'}
                {message.deliveryStatus === 'failed' && '!'}
              </span>
            )}
          </div>
        )}

        <div className="chat-msg__body">
          <div className="chat-msg__text">{message.content}</div>

          {message.attachedObject && (
            <RichObjectCard
              object={message.attachedObject}
              onClick={() => onOpenObject(message.attachedObject!)}
            />
          )}

          {message.reactions && message.reactions.length > 0 && (
            <MessageReactions
              reactions={message.reactions}
              userId={userId}
              onReact={(emoji) => onReact(message.id, emoji)}
            />
          )}

          {message.thread && (
            <MessageThread
              thread={message.thread}
              onOpen={() => onOpenThread(message.thread!.id)}
            />
          )}
        </div>

        {showActions && (
          <MessageActions
            message={message}
            onReact={(emoji) => onReact(message.id, emoji)}
            onReply={() => onReply(message.id)}
            onPin={() => onPin(message.id)}
            onSave={() => onSave(message.id)}
            onConvertToNote={() => onConvertToNote(message.id)}
            onAssignTask={() => onAssignTask(message.id)}
            onMore={() => console.log('More actions')}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ChatWindow({
  conversation,
  messages,
  userId,
  draft: _draft,
  sending: _sending,
  typingNames,
  messagesEndRef,
  onDraftChange: _onDraftChange,
  onSend: _onSend,
  onTyping: _onTyping,
  onRetry,
  onCreateWorkspace,
}: Props) {
  const memberNames = useMemo(
    () => conversation?.members.map((m) => m.name) ?? [],
    [conversation?.members]
  );

  const memberMap = useMemo(
    () => new Map(conversation?.members.map(m => [m.id, m.name]) ?? []),
    [conversation?.members]
  );

  const visibleMessages = useMemo(
    () => dedupeById(messages.data ?? []),
    [messages.data]
  );

  // Handlers (TODO: Connect to real services)
  const handleReact = (messageId: string, emoji: string) => {
    console.log('React:', messageId, emoji);
    // TODO: Call messages service to add reaction
  };

  const handleReply = (messageId: string) => {
    console.log('Reply:', messageId);
    // TODO: Open thread panel
  };

  const handlePin = (messageId: string) => {
    console.log('Pin:', messageId);
    // TODO: Pin/unpin message
  };

  const handleSave = (messageId: string) => {
    console.log('Save:', messageId);
    // TODO: Save/unsave message
  };

  const handleConvertToNote = (messageId: string) => {
    console.log('Convert to note:', messageId);
    // TODO: Create project note from message
  };

  const handleAssignTask = (messageId: string) => {
    console.log('Assign task:', messageId);
    // TODO: Create task from message
  };

  const handleOpenObject = (object: AttachedObject) => {
    console.log('Open object:', object);
    // TODO: Navigate to object detail page
  };

  const handleOpenThread = (threadId: string) => {
    console.log('Open thread:', threadId);
    // TODO: Open thread panel
  };

  if (!conversation) {
    return (
      <Card className="msg-panel msg-panel--center">
        <MessagesEmptyState
          title="Select a conversation"
          description="Choose a conversation or create a workspace to start collaborating."
          actionLabel="Create Workspace"
          onCreateWorkspace={onCreateWorkspace}
          onAction={onCreateWorkspace}
        />
      </Card>
    );
  }

  return (
    <Card className="chat-window">
      {/* HEADER */}
      <header className="chat-window__header">
        <div className="chat-window__header-info">
          <h2 className="chat-window__title">{conversation.title}</h2>
          <p className="chat-window__subtitle">
            <span className="chat-window__type">{conversation.type.toUpperCase()}</span>
            {memberNames.length > 0 && (
              <>
                <span className="chat-window__divider">·</span>
                <span className="chat-window__members">{memberNames.join(', ')}</span>
              </>
            )}
          </p>
        </div>
        
        <div className="chat-window__header-actions">
          <button type="button" className="chat-window__action" title="Search messages">
            🔍
          </button>
          <button type="button" className="chat-window__action" title="Pinned messages">
            📌
          </button>
          <button type="button" className="chat-window__action" title="Conversation settings">
            ⚙️
          </button>
        </div>
      </header>

      {/* MESSAGES */}
      <div className="chat-window__body">
        {messages.loading && !messages.data ? (
          <MessagesSkeleton rows={4} />
        ) : null}

        {messages.error ? (
          <div className="chat-window__error">
            <p>{messages.error}</p>
            <Button onClick={onRetry}>Retry</Button>
          </div>
        ) : null}

        {visibleMessages.length > 0 && visibleMessages.map((msg, index) => {
          const prev = index > 0 ? visibleMessages[index - 1] : undefined;
          const showDate = shouldShowDateSeparator(msg, prev);
          const senderName = msg.senderId === userId ? 'You' : (memberMap.get(msg.senderId) || 'Unknown');

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="chat-date-separator">
                  <span className="chat-date-separator__text">
                    {formatDateSeparator(msg.createdAt)}
                  </span>
                </div>
              )}

              <EnhancedMessageBubble
                message={msg as ExtendedMessage}
                isOwn={msg.senderId === userId}
                userId={userId || ''}
                senderName={senderName}
                onReact={handleReact}
                onReply={handleReply}
                onPin={handlePin}
                onSave={handleSave}
                onConvertToNote={handleConvertToNote}
                onAssignTask={handleAssignTask}
                onOpenObject={handleOpenObject}
                onOpenThread={handleOpenThread}
              />
            </div>
          );
        })}

        <TypingIndicator names={typingNames} />
        <div ref={messagesEndRef} />
      </div>

      {/* LOADING INDICATOR */}
      {messages.loading && messages.data ? (
        <div className="chat-window__syncing">
          <Loader label="Syncing…" />
        </div>
      ) : null}

      <style>{`
        .chat-window {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1a1a2e;
          border-radius: 12px;
          overflow: hidden;
        }

        /* HEADER */
        .chat-window__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #16172a;
          border-bottom: 1px solid #2d2d3f;
        }

        .chat-window__title {
          margin: 0 0 0.25rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #fff;
        }

        .chat-window__subtitle {
          margin: 0;
          font-size: 0.875rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .chat-window__type {
          font-weight: 500;
          color: #7c5fe6;
        }

        .chat-window__divider {
          color: #475569;
        }

        .chat-window__header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .chat-window__action {
          background: none;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.125rem;
          transition: background 0.2s;
        }

        .chat-window__action:hover {
          background: #252538;
        }

        /* BODY */
        .chat-window__body {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          min-height: 0;
        }

        .chat-window__error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
        }

        .chat-window__syncing {
          padding: 0.5rem;
          text-align: center;
        }

        /* DATE SEPARATOR */
        .chat-date-separator {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
          text-align: center;
        }

        .chat-date-separator::before,
        .chat-date-separator::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #2d2d3f;
        }

        .chat-date-separator__text {
          padding: 0 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* MESSAGE */
        .chat-msg {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          position: relative;
        }

        .chat-msg--own {
          flex-direction: row-reverse;
        }

        .chat-msg--pinned::before {
          content: '📌';
          position: absolute;
          left: -1.5rem;
          top: 0;
        }

        .chat-msg--system .chat-msg__body {
          background: rgba(124, 95, 230, 0.1);
          border-left: 3px solid #7c5fe6;
        }

        .chat-msg--ai_assistant .chat-msg__body {
          background: rgba(16, 185, 129, 0.1);
          border-left: 3px solid #10b981;
        }

        .chat-msg__avatar {
          flex-shrink: 0;
        }

        .chat-msg__avatar-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #7c5fe6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #fff;
          font-size: 0.875rem;
        }

        .chat-msg__content {
          flex: 1;
          min-width: 0;
        }

        .chat-msg__header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .chat-msg__sender {
          font-weight: 600;
          color: #e2e8f0;
          font-size: 0.875rem;
        }

        .chat-msg__time {
          font-size: 0.75rem;
          color: #64748b;
        }

        .chat-msg__status {
          font-size: 0.75rem;
        }

        .chat-msg__status--read {
          color: #10b981;
        }

        .chat-msg__status--delivered {
          color: #94a3b8;
        }

        .chat-msg__status--failed {
          color: #ef4444;
        }

        .chat-msg__body {
          background: #252538;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          color: #e2e8f0;
          line-height: 1.5;
          max-width: 600px;
        }

        .chat-msg--own .chat-msg__body {
          background: #7c5fe6;
          color: #fff;
          margin-left: auto;
        }

        .chat-msg__text {
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        /* MESSAGE ACTIONS */
        .chat-msg-actions {
          position: absolute;
          top: -12px;
          right: 0;
          background: #16172a;
          border: 1px solid #2d2d3f;
          border-radius: 8px;
          padding: 0.25rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .chat-msg--own .chat-msg-actions {
          right: auto;
          left: 0;
        }

        .chat-msg-actions__group {
          display: flex;
          gap: 0.25rem;
        }

        .chat-msg-action {
          background: none;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.2s;
        }

        .chat-msg-action:hover {
          background: #252538;
        }

        .chat-reactions-picker {
          position: absolute;
          bottom: 100%;
          left: 0;
          background: #16172a;
          border: 1px solid #2d2d3f;
          border-radius: 8px;
          padding: 0.5rem;
          display: flex;
          gap: 0.25rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          margin-bottom: 0.25rem;
        }

        .chat-reaction-option {
          background: none;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          font-size: 1.25rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .chat-reaction-option:hover {
          background: #252538;
        }

        /* REACTIONS */
        .chat-msg-reactions {
          display: flex;
          gap: 0.25rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }

        .chat-msg-reaction {
          background: #1a1a2e;
          border: 1px solid #2d2d3f;
          border-radius: 12px;
          padding: 0.25rem 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .chat-msg-reaction:hover {
          background: #252538;
          border-color: #7c5fe6;
        }

        .chat-msg-reaction--active {
          background: rgba(124, 95, 230, 0.2);
          border-color: #7c5fe6;
        }

        .chat-msg-reaction__emoji {
          font-size: 0.875rem;
        }

        .chat-msg-reaction__count {
          font-size: 0.75rem;
          font-weight: 500;
          color: #e2e8f0;
        }

        /* THREAD */
        .chat-msg-thread {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #1a1a2e;
          border: 1px solid #2d2d3f;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .chat-msg-thread:hover {
          background: #252538;
          border-color: #7c5fe6;
        }

        .chat-msg-thread__icon {
          font-size: 1rem;
        }

        .chat-msg-thread__text {
          font-weight: 500;
          color: #7c5fe6;
        }

        .chat-msg-thread__time {
          margin-left: auto;
          font-size: 0.75rem;
        }

        /* RICH OBJECT CARD */
        .chat-object-card {
          display: flex;
          gap: 1rem;
          margin-top: 0.75rem;
          padding: 1rem;
          background: #1a1a2e;
          border: 1px solid #2d2d3f;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .chat-object-card:hover {
          background: #252538;
          border-color: #7c5fe6;
          transform: translateY(-1px);
        }

        .chat-object-card__icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: rgba(124, 95, 230, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .chat-object-card__content {
          flex: 1;
          min-width: 0;
        }

        .chat-object-card__header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .chat-object-card__type {
          font-size: 0.625rem;
          font-weight: 600;
          color: #7c5fe6;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .chat-object-card__status {
          padding: 0.125rem 0.5rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 12px;
          font-size: 0.625rem;
          font-weight: 500;
          color: #10b981;
          text-transform: uppercase;
        }

        .chat-object-card__title {
          margin: 0 0 0.25rem 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #fff;
        }

        .chat-object-card__subtitle {
          margin: 0 0 0.5rem 0;
          font-size: 0.8125rem;
          color: #94a3b8;
        }

        .chat-object-card__meta {
          margin-bottom: 0.5rem;
          font-size: 0.8125rem;
          color: #94a3b8;
        }

        .chat-object-card__progress {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .chat-object-card__progress-bar {
          flex: 1;
          height: 6px;
          background: #2d2d3f;
          border-radius: 3px;
          overflow: hidden;
        }

        .chat-object-card__progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c5fe6, #6b4fd6);
          border-radius: 3px;
          transition: width 0.3s;
        }

        .chat-object-card__progress-text {
          font-size: 0.75rem;
          font-weight: 500;
          color: #7c5fe6;
          white-space: nowrap;
        }

        .chat-object-card__button {
          padding: 0.5rem 1rem;
          background: #7c5fe6;
          border: none;
          border-radius: 6px;
          color: #fff;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .chat-object-card__button:hover {
          background: #6b4fd6;
        }
      `}</style>
    </Card>
  );
}
