import { useState } from 'react';
import { PageShell } from '../../../../modules/shared/components/common/PageShell';
import { useMayaChat } from '../../../../modules/maya/hooks/useMayaChat';

export default function PatentAssistant() {
  const [query, setQuery] = useState('');
  const { send, messages, loading } = useMayaChat();

  const search = async () => {
    await send(
      `Patent & IP Assistant: For the invention "${query}", outline prior art search strategy, IP documentation checklist, and ownership record best practices. Note: this is guidance only, not legal advice.`
    );
  };

  return (
    <PageShell
      title="Patent & IP Assistant"
      subtitle="Prior art guidance, IP documentation, and vault registration — pair with Innovation Vault."
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Describe your invention…"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '0.75rem',
          marginBottom: '1rem',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.05)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      />
      <button
        type="button"
        onClick={search}
        disabled={!query.trim() || loading}
        style={{ padding: '0.6rem 1.2rem', borderRadius: 8, border: 'none', background: '#7c5fe6', color: '#fff' }}
      >
        Analyze IP strategy
      </button>
      {messages.slice(-1).map((m, i) => (
        <pre key={i} style={{ marginTop: '1.5rem', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 10 }}>
          {m.content}
        </pre>
      ))}
    </PageShell>
  );
}
