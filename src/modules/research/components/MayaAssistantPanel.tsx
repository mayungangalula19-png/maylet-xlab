import type { FormEvent } from 'react';
import type { ResearchPromptKey } from '../ai/prompts';

interface Props {
  prompts: Record<ResearchPromptKey, string>;
  messages: { role: string; content: string }[];
  gaps: string[];
  insights: string[];
  questions: string[];
  loading: boolean;
  onRunPrompt: (key: ResearchPromptKey) => void;
  onSend: (text: string) => void;
  onRunLocalAnalysis: () => void;
}

export function MayaAssistantPanel({
  prompts,
  messages,
  gaps,
  insights,
  questions,
  loading,
  onRunPrompt,
  onSend,
  onRunLocalAnalysis,
}: Props) {
  return (
    <>
      <div className="research-panel-header">
        <h2>MAYA Research Assistant</h2>
        <button type="button" className="research-btn research-btn--secondary" onClick={onRunLocalAnalysis}>
          Run local analysis
        </button>
      </div>

      <div className="research-maya-prompts">
        {(Object.keys(prompts) as ResearchPromptKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className="research-maya-prompt"
            disabled={loading}
            onClick={() => onRunPrompt(key)}
          >
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}
      </div>

      {gaps.length > 0 && (
        <div className="research-impact-panel">
          <strong>Knowledge gaps</strong>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', fontSize: '0.8rem' }}>
            {gaps.map((g) => <li key={g}>{g}</li>)}
          </ul>
        </div>
      )}

      {insights.length > 0 && (
        <div className="research-impact-panel">
          <strong>Insights</strong>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', fontSize: '0.8rem' }}>
            {insights.map((i) => <li key={i}>{i}</li>)}
          </ul>
        </div>
      )}

      <div className="research-maya-chat">
        {messages.length === 0 ? (
          <p className="research-empty">Use prompts above or ask MAYA directly.</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`research-maya-msg research-maya-msg--${m.role}`}>
              <strong>{m.role === 'user' ? 'You' : 'MAYA'}:</strong> {m.content}
            </div>
          ))
        )}
      </div>

      <MayaInput onSend={onSend} loading={loading} />

      {questions.length > 0 && (
        <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>
          <strong>Suggested questions:</strong>
          <ul>{questions.map((q) => <li key={q}>{q}</li>)}</ul>
        </div>
      )}
    </>
  );
}

function MayaInput({ onSend, loading }: { onSend: (t: string) => void; loading: boolean }) {
  const handle = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('maya') as HTMLInputElement;
    if (input.value.trim()) {
      onSend(input.value);
      input.value = '';
    }
  };

  return (
    <form className="research-maya-input-row" onSubmit={handle}>
      <input name="maya" placeholder="Ask MAYA about this research…" disabled={loading} />
      <button type="submit" className="research-btn research-btn--primary" disabled={loading}>Send</button>
    </form>
  );
}
