import { useState } from 'react';
import { PageShell } from '../../../../modules/shared/components/common/PageShell';
import { useAuth } from '../../../../hooks/useAuth';
import { useMayaChat } from '../../../../modules/maya/hooks/useMayaChat';

const steps = ['Vision', 'Business model', 'Marketing', 'Financials', 'Pitch deck'];

export default function CoFounderWizard() {
  const { user } = useAuth();
  const [idea, setIdea] = useState('');
  const [step, setStep] = useState(0);
  const { send, messages, loading } = useMayaChat();

  const runStep = async () => {
    const prompt = `As my AI Co-Founder, for the startup idea "${idea}", produce a detailed ${steps[step]} section. Be specific and actionable.`;
    await send(prompt);
    if (step < steps.length - 1) setStep(step + 1);
  };

  return (
    <PageShell
      title="AI Co-Founder"
      subtitle="Digital co-founder: business plan, marketing, forecast, and pitch — powered by MAYA."
    >
      {!user ? (
        <p>Please sign in.</p>
      ) : (
        <>
          <input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. Solar micro-grid for rural Tanzania"
            style={{
              width: '100%',
              maxWidth: 480,
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            }}
          />
          <p>
            Step {step + 1}/{steps.length}: <strong>{steps[step]}</strong>
          </p>
          <button
            type="button"
            onClick={runStep}
            disabled={!idea.trim() || loading}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: 8,
              border: 'none',
              background: '#7c5fe6',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Generating…' : `Generate ${steps[step]}`}
          </button>
          {messages.slice(-1).map((m, i) => (
            <pre
              key={i}
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 10,
                whiteSpace: 'pre-wrap',
                fontSize: '0.9rem',
              }}
            >
              {m.content}
            </pre>
          ))}
        </>
      )}
    </PageShell>
  );
}
