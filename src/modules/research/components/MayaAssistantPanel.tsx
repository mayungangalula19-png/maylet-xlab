import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { MayaResearchOutput } from '../ai/mayaResearchAI';
import type { ResearchPromptKey } from '../ai/prompts';

const PROMPT_META: Record<
  ResearchPromptKey,
  { label: string; icon: string; description: string }
> = {
  summarize: {
    label: 'Summarize research',
    icon: '📝',
    description: 'Concise snapshot of current research state',
  },
  literature: {
    label: 'Literature outline',
    icon: '📚',
    description: 'Structured review from recorded sources',
  },
  gaps: {
    label: 'Knowledge gaps',
    icon: '🔍',
    description: 'Missing evidence before prototype',
  },
  questions: {
    label: 'Research questions',
    icon: '❓',
    description: 'Specific questions to explore next',
  },
  insights: {
    label: 'Synthesize insights',
    icon: '💡',
    description: 'Patterns from findings and notes',
  },
  nextSteps: {
    label: 'Next steps',
    icon: '➡️',
    description: 'Operational path to Prototype',
  },
};

interface Props {
  prompts: Record<ResearchPromptKey, string>;
  messages: { role: string; content: string }[];
  gaps: string[];
  insights: string[];
  questions: string[];
  loading: boolean;
  error?: string | null;
  localAnalysis?: MayaResearchOutput | null;
  completionRate?: number;
  onRunPrompt: (key: ResearchPromptKey) => void;
  onSend: (text: string) => void;
  onRunLocalAnalysis: () => void;
  onClear?: () => void;
}

export function MayaAssistantPanel({
  prompts,
  messages,
  gaps,
  insights,
  questions,
  loading,
  error,
  localAnalysis,
  completionRate,
  onRunPrompt,
  onSend,
  onRunLocalAnalysis,
  onClear,
}: Props) {
  const [showIntel, setShowIntel] = useState(true);
  const [dismissedError, setDismissedError] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDismissedError(false);
  }, [error]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const visibleError = error && !dismissedError ? error : null;

  const summaryParts = useMemo(
    () =>
      [
        completionRate != null ? `${completionRate}% research complete` : null,
        `${messages.length} message${messages.length === 1 ? '' : 's'}`,
        gaps.length > 0 ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'}` : null,
        insights.length > 0 ? `${insights.length} insight${insights.length === 1 ? '' : 's'}` : null,
      ].filter(Boolean),
    [completionRate, messages.length, gaps.length, insights.length]
  );

  return (
    <div className="research-maya">
      <div className="research-panel-header">
        <div>
          <h2>MAYA Research Assistant</h2>
          <p className="research-maya__summary">{summaryParts.join(' · ') || 'AI-guided literature, gaps, and next steps'}</p>
        </div>
        <div className="research-maya__header-actions">
          <button
            type="button"
            className="research-btn research-btn--secondary"
            disabled={loading}
            onClick={onRunLocalAnalysis}
          >
            Run local analysis
          </button>
          {onClear && messages.length > 0 ? (
            <button type="button" className="research-btn research-btn--secondary" disabled={loading} onClick={onClear}>
              Clear chat
            </button>
          ) : null}
        </div>
      </div>

      {visibleError ? (
        <p className="research-maya__error" role="alert">
          {visibleError}
          <button type="button" className="research-maya__error-dismiss" onClick={() => setDismissedError(true)}>
            Dismiss
          </button>
        </p>
      ) : null}

      <div className="research-maya-prompts" role="group" aria-label="Research prompt shortcuts">
        {(Object.keys(prompts) as ResearchPromptKey[]).map((key) => {
          const meta = PROMPT_META[key];
          return (
            <button
              key={key}
              type="button"
              className="research-maya-prompt"
              disabled={loading}
              title={prompts[key]}
              onClick={() => onRunPrompt(key)}
            >
              <span className="research-maya-prompt__icon" aria-hidden>
                {meta.icon}
              </span>
              <span className="research-maya-prompt__body">
                <strong>{meta.label}</strong>
                <span className="research-maya-prompt__desc">{meta.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {(gaps.length > 0 || insights.length > 0 || localAnalysis) ? (
        <div className={`research-maya-intel${showIntel ? ' research-maya-intel--open' : ''}`}>
          <button
            type="button"
            className="research-maya-intel__toggle"
            onClick={() => setShowIntel((v) => !v)}
            aria-expanded={showIntel}
          >
            <span>Local intelligence</span>
            <span className="research-maya-intel__badge">
              {gaps.length + insights.length + (localAnalysis ? 1 : 0)} items
            </span>
            <span aria-hidden>{showIntel ? '▾' : '▸'}</span>
          </button>
          {showIntel ? (
            <div className="research-maya-intel__body">
              {localAnalysis ? (
                <div className="research-maya-intel__card research-maya-intel__card--summary">
                  <strong>Research summary</strong>
                  <p>{localAnalysis.summary}</p>
                </div>
              ) : null}
              {gaps.length > 0 ? (
                <div className="research-maya-intel__card research-maya-intel__card--gaps">
                  <strong>Knowledge gaps</strong>
                  <ul>
                    {gaps.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {insights.length > 0 ? (
                <div className="research-maya-intel__card research-maya-intel__card--insights">
                  <strong>Insights</strong>
                  <ul>
                    {insights.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="research-maya-chat" aria-live="polite" aria-label="MAYA conversation">
        {messages.length === 0 ? (
          <div className="research-maya-chat__empty">
            <span className="research-maya-chat__empty-icon" aria-hidden>
              ✨
            </span>
            <p>Use a prompt above or ask MAYA directly about this project&apos;s research.</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`research-maya-msg research-maya-msg--${m.role}${
                m.content.startsWith('Error:') ? ' research-maya-msg--error' : ''
              }`}
            >
              <div className="research-maya-msg__avatar" aria-hidden>
                {m.role === 'user' ? 'You' : 'M'}
              </div>
              <div className="research-maya-msg__bubble">
                <span className="research-maya-msg__role">{m.role === 'user' ? 'You' : 'MAYA'}</span>
                <p>{m.content}</p>
              </div>
            </div>
          ))
        )}
        {loading ? (
          <div className="research-maya-msg research-maya-msg--assistant research-maya-msg--typing">
            <div className="research-maya-msg__avatar" aria-hidden>
              M
            </div>
            <div className="research-maya-msg__bubble">
              <span className="research-maya-msg__role">MAYA</span>
              <p className="research-maya-typing">
                <span />
                <span />
                <span />
              </p>
            </div>
          </div>
        ) : null}
        <div ref={chatEndRef} />
      </div>

      <MayaInput onSend={onSend} loading={loading} />

      {questions.length > 0 ? (
        <div className="research-maya-questions">
          <span className="research-maya-questions__label">Suggested questions</span>
          <div className="research-maya-questions__chips">
            {questions.map((q) => (
              <button
                key={q}
                type="button"
                className="research-maya-questions__chip"
                disabled={loading}
                onClick={() => onSend(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MayaInput({ onSend, loading }: { onSend: (t: string) => void; loading: boolean }) {
  const [text, setText] = useState('');

  const handle = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText('');
  };

  return (
    <form className="research-maya-input-row" onSubmit={handle}>
      <input
        name="maya"
        value={text}
        placeholder="Ask MAYA about this research…"
        disabled={loading}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="research-btn research-btn--primary" disabled={loading || !text.trim()}>
        {loading ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}
