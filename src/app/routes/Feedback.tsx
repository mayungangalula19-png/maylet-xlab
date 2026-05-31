import { useState, FormEvent } from 'react';
import { PageShell } from '../../components/common/PageShell';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase/client';

export default function Feedback() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    await supabase.from('support_tickets').insert({
      user_id: user.id,
      subject: 'Product feedback',
      message,
      priority: 'low',
    });
    setSent(true);
    setMessage('');
  };

  return (
    <PageShell title="Feedback" subtitle="Help us improve Maylet XLab and MAYA AI.">
      {sent ? (
        <p style={{ color: '#48bb78' }}>Thank you — your feedback was recorded.</p>
      ) : (
        <form onSubmit={submit} style={{ maxWidth: 520 }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            placeholder="Share your experience, bugs, or feature ideas…"
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            }}
          />
          <button
            type="submit"
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #7c5fe6, #5240c4)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Submit feedback
          </button>
        </form>
      )}
    </PageShell>
  );
}
