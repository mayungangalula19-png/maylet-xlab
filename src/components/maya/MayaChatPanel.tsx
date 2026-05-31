import { useState, FormEvent, useRef, useEffect } from 'react';
import { MayaModelPicker } from './MayaModelPicker';
import { MayaAlertBanner } from './MayaAlertBanner';
import type { MayaChatMessage, MayaModelId, MayaAlert } from '../../lib/maya/types';
import { MAYA_APP_NAME, MAYA_TAGLINE } from '../../lib/maya/constants';

interface Props {
  messages: MayaChatMessage[];
  loading: boolean;
  modelId: MayaModelId;
  onModelChange: (id: MayaModelId) => void;
  onSend: (text: string) => void;
  alerts: MayaAlert[];
}

export function MayaChatPanel({
  messages,
  loading,
  modelId,
  onModelChange,
  onSend,
  alerts,
}: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput('');
  };

  return (
    <section className="maya-chat-panel">
      <header className="maya-chat-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{MAYA_APP_NAME}</h2>
          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.65 }}>{MAYA_TAGLINE}</p>
        </div>
        <MayaModelPicker value={modelId} onChange={onModelChange} disabled={loading} />
      </header>

      <div className="maya-messages">
        <MayaAlertBanner alerts={alerts} />
        {messages.length === 0 && (
          <div className="maya-msg maya-msg--assistant">
            Hello! I am your Innovation Co-Pilot. Select a project for context, or ask me to analyze an idea,
            plan an experiment, or draft a funding pitch.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`maya-msg maya-msg--${m.role === 'user' ? 'user' : 'assistant'}`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="maya-msg maya-msg--assistant" style={{ opacity: 0.7 }}>
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="maya-input-area" onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask MAYA anything…"
          rows={2}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #7c5fe6, #5240c4)',
            color: '#fff',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </section>
  );
}
