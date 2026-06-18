import { useState, useRef, useEffect, FormEvent } from 'react';
import { Card, Loader } from '../../../design-system';
import { invokeMayaChat } from '../../../lib/maya/mayaChat.service';
import type { AiAssistantPayload } from '../types/messages.types';

// ============================================================================
// TYPES
// ============================================================================

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AssistantContext {
  conversationId?: string;
  projectId?: string;
  userId?: string;
  pageContext?: 'messages' | 'projects' | 'research' | 'community';
}

interface Props {
  context?: AssistantContext;
  insights?: AiAssistantPayload | null;
  insightsLoading?: boolean;
  onClose?: () => void;
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

const QUICK_ACTIONS = [
  { id: 'explain', label: 'Explain this page', icon: '💡' },
  { id: 'summarize', label: 'Summarize conversation', icon: '📝' },
  { id: 'ideas', label: 'Generate ideas', icon: '✨' },
  { id: 'research', label: 'Research assistance', icon: '🔍' },
  { id: 'draft', label: 'Draft content', icon: '✍️' },
  { id: 'ask', label: 'Ask a question', icon: '❓' },
] as const;

type QuickActionId = typeof QUICK_ACTIONS[number]['id'];

// ============================================================================
// SUGGESTED QUESTIONS (Context-aware)
// ============================================================================

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  messages: [
    'How do I start a new conversation?',
    'Can you summarize this discussion?',
    'What are the action items from this chat?',
  ],
  projects: [
    'How do I create a new project?',
    'What makes a good project description?',
    'How do I track project progress?',
  ],
  research: [
    'How does the research center work?',
    'Can you help me find relevant papers?',
    'How do I document findings?',
  ],
  community: [
    'How do I connect with mentors?',
    'What are the best practices for community posts?',
    'How do I join a hackathon?',
  ],
  default: [
    'What can you help me with?',
    'How does Maylet XLab work?',
    'Show me quick start tips',
  ],
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AiAssistantPanel({ context, insights, insightsLoading, onClose }: Props) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Get context-specific suggested questions
  const suggestedQuestions =
    SUGGESTED_QUESTIONS[context?.pageContext || 'default'] || SUGGESTED_QUESTIONS.default;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: AiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const systemLines = [
        'You are MAYA, the Maylet XLab collaboration assistant. Be concise and actionable.',
        context?.pageContext ? `Current page: ${context.pageContext}` : '',
        context?.conversationId ? `Conversation ID: ${context.conversationId}` : '',
        insights?.summary ? `Thread summary: ${insights.summary}` : '',
        insights?.actionItems?.length
          ? `Action items: ${insights.actionItems.join('; ')}`
          : '',
        insights?.risks?.length ? `Risks: ${insights.risks.join('; ')}` : '',
      ].filter(Boolean);

      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await invokeMayaChat([
        { role: 'system', content: systemLines.join('\n') },
        ...history,
        { role: 'user', content: content.trim() },
      ]);

      const assistantMessage: AiMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsOnline(true);
    } catch (error) {
      setIsOnline(false);
      const errorMessage: AiMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleQuickAction = (actionId: QuickActionId) => {
    const prompts: Record<QuickActionId, string> = {
      explain: 'Can you explain what this page does and how I can use it?',
      summarize: 'Please summarize the current conversation and highlight key points.',
      ideas: 'Can you help me brainstorm ideas related to what we\'re discussing?',
      research: 'I need help researching this topic. Where should I start?',
      draft: 'Can you help me draft content based on our discussion?',
      ask: 'I have a question about the platform. Can you help?',
    };

    handleSendMessage(prompts[actionId]);
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card className="ai-assistant-panel">
      {/* HEADER */}
      <header className="ai-assistant-header">
        <div className="ai-assistant-header__info">
          <h2 className="ai-assistant-title">AI Assistant</h2>
          <div className="ai-assistant-status">
            <span className={`ai-assistant-status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span className="ai-assistant-status-text">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="ai-assistant-close"
            onClick={onClose}
            aria-label="Close assistant"
          >
            ✕
          </button>
        )}
      </header>

      {/* THREAD INSIGHTS (from messages AI service) */}
      {insights && (insights.summary || insights.insights.length > 0) ? (
        <div className="ai-assistant-insights" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #2d2d3f', fontSize: '0.8rem' }}>
          {insightsLoading ? <Loader label="Analyzing thread…" /> : null}
          {insights.summary ? <p style={{ margin: '0 0 0.5rem' }}><strong>Summary:</strong> {insights.summary}</p> : null}
          {insights.insights.slice(0, 2).map((line, i) => (
            <p key={i} style={{ margin: '0.25rem 0', opacity: 0.85 }}>• {line}</p>
          ))}
        </div>
      ) : null}

      {/* QUICK ACTIONS */}
      {messages.length === 0 && (
        <div className="ai-assistant-quick-actions">
          <p className="ai-assistant-quick-actions__label">Quick Actions</p>
          <div className="ai-assistant-quick-actions__grid">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className="ai-assistant-quick-action"
                onClick={() => handleQuickAction(action.id)}
                disabled={isLoading}
              >
                <span className="ai-assistant-quick-action__icon">{action.icon}</span>
                <span className="ai-assistant-quick-action__label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div className="ai-assistant-messages">
        {messages.length === 0 ? (
          <div className="ai-assistant-empty">
            <div className="ai-assistant-empty__icon">💬</div>
            <h3 className="ai-assistant-empty__title">How can I help you today?</h3>
            <p className="ai-assistant-empty__subtitle">
              Ask me anything about Maylet XLab, your projects, or research.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`ai-assistant-message ai-assistant-message--${message.role}`}>
              <div className="ai-assistant-message__avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="ai-assistant-message__content">
                <div className="ai-assistant-message__text">{message.content}</div>
                <div className="ai-assistant-message__time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="ai-assistant-message ai-assistant-message--assistant">
            <div className="ai-assistant-message__avatar">🤖</div>
            <div className="ai-assistant-message__content">
              <Loader label="Thinking..." />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SUGGESTED QUESTIONS */}
      {messages.length === 0 && (
        <div className="ai-assistant-suggestions">
          <p className="ai-assistant-suggestions__label">Suggested Questions</p>
          <div className="ai-assistant-suggestions__list">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                type="button"
                className="ai-assistant-suggestion"
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER / INPUT */}
      <footer className="ai-assistant-footer">
        <form onSubmit={handleSubmit} className="ai-assistant-input-form">
          <textarea
            ref={inputRef}
            className="ai-assistant-input"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !isOnline}
            rows={1}
          />
          <button
            type="submit"
            className="ai-assistant-send"
            disabled={!input.trim() || isLoading || !isOnline}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
        <p className="ai-assistant-footer__hint">
          Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line
        </p>
      </footer>

      <style>{`
        .ai-assistant-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 100vh;
          background: #1a1a2e;
          border-radius: 12px;
          overflow: hidden;
        }

        /* HEADER */
        .ai-assistant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          background: #16172a;
          border-bottom: 1px solid #2d2d3f;
        }

        .ai-assistant-header__info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .ai-assistant-title {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #fff;
        }

        .ai-assistant-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ai-assistant-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #64748b;
        }

        .ai-assistant-status-dot.online {
          background: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        .ai-assistant-status-text {
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .ai-assistant-close {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
          transition: color 0.2s;
        }

        .ai-assistant-close:hover {
          color: #fff;
        }

        /* QUICK ACTIONS */
        .ai-assistant-quick-actions {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #2d2d3f;
        }

        .ai-assistant-quick-actions__label {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ai-assistant-quick-actions__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .ai-assistant-quick-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #252538;
          border: 1px solid #2d2d3f;
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-assistant-quick-action:hover:not(:disabled) {
          background: #2d2d46;
          border-color: #7c5fe6;
          transform: translateY(-1px);
        }

        .ai-assistant-quick-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ai-assistant-quick-action__icon {
          font-size: 1.5rem;
        }

        .ai-assistant-quick-action__label {
          text-align: center;
        }

        /* MESSAGES */
        .ai-assistant-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.25rem;
          min-height: 0;
        }

        .ai-assistant-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 2rem;
        }

        .ai-assistant-empty__icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .ai-assistant-empty__title {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #fff;
        }

        .ai-assistant-empty__subtitle {
          margin: 0;
          color: #94a3b8;
          font-size: 0.9375rem;
        }

        .ai-assistant-message {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .ai-assistant-message--user {
          flex-direction: row-reverse;
        }

        .ai-assistant-message__avatar {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #252538;
          font-size: 1.125rem;
        }

        .ai-assistant-message__content {
          flex: 1;
          min-width: 0;
        }

        .ai-assistant-message__text {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          background: #252538;
          color: #e2e8f0;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .ai-assistant-message--user .ai-assistant-message__text {
          background: #7c5fe6;
          color: #fff;
          margin-left: auto;
          max-width: 80%;
        }

        .ai-assistant-message__time {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: #64748b;
          padding: 0 0.25rem;
        }

        .ai-assistant-message--user .ai-assistant-message__time {
          text-align: right;
        }

        /* SUGGESTIONS */
        .ai-assistant-suggestions {
          padding: 1rem 1.25rem;
          border-top: 1px solid #2d2d3f;
        }

        .ai-assistant-suggestions__label {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: #94a3b8;
        }

        .ai-assistant-suggestions__list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .ai-assistant-suggestion {
          padding: 0.75rem 1rem;
          background: #252538;
          border: 1px solid #2d2d3f;
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 0.875rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-assistant-suggestion:hover:not(:disabled) {
          background: #2d2d46;
          border-color: #7c5fe6;
          transform: translateX(4px);
        }

        .ai-assistant-suggestion:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* FOOTER */
        .ai-assistant-footer {
          padding: 1rem 1.25rem;
          border-top: 1px solid #2d2d3f;
          background: #16172a;
        }

        .ai-assistant-input-form {
          display: flex;
          gap: 0.75rem;
          align-items: flex-end;
        }

        .ai-assistant-input {
          flex: 1;
          padding: 0.75rem 1rem;
          background: #252538;
          border: 1px solid #2d2d3f;
          border-radius: 8px;
          color: #fff;
          font-size: 0.9375rem;
          font-family: inherit;
          resize: none;
          max-height: 120px;
          transition: border-color 0.2s;
        }

        .ai-assistant-input:focus {
          outline: none;
          border-color: #7c5fe6;
        }

        .ai-assistant-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ai-assistant-send {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #7c5fe6;
          border: none;
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-assistant-send:hover:not(:disabled) {
          background: #6b4fd6;
          transform: translateY(-1px);
        }

        .ai-assistant-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ai-assistant-footer__hint {
          margin: 0.5rem 0 0 0;
          font-size: 0.75rem;
          color: #64748b;
          text-align: center;
        }

        kbd {
          padding: 0.125rem 0.375rem;
          background: #252538;
          border: 1px solid #2d2d3f;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.6875rem;
        }
      `}</style>
    </Card>
  );
}
