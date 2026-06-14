import { useState } from 'react';
import { AdvancedMarketingPage } from '../marketing/AdvancedMarketingPage';

const WEBINARS = [
  {
    id: 'validation',
    date: 'Thu, Jun 19 · 14:00 UTC',
    title: 'Validation gate deep dive',
    host: 'Sarah Okonkwo',
    seats: 120,
    registered: 89,
  },
  {
    id: 'funding',
    date: 'Tue, Jun 24 · 16:00 UTC',
    title: 'Grant writing for African startups',
    host: 'Amina Kimaro',
    seats: 200,
    registered: 156,
  },
  {
    id: 'maya',
    date: 'Wed, Jul 2 · 11:00 UTC',
    title: 'MAYA AI for research & experiments',
    host: 'David Mwangi',
    seats: 150,
    registered: 42,
  },
];

export default function ResourceWebinars() {
  const [registered, setRegistered] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState('');

  const handleRegister = (id: string, title: string) => {
    setRegistered((r) => ({ ...r, [id]: true }));
    setToast(`Registered for "${title}" (demo only).`);
    window.setTimeout(() => setToast(''), 3000);
  };

  return (
    <AdvancedMarketingPage
      pill="🎤 Live webinars"
      title="Weekly expert"
      titleAccent="sessions"
      subtitle="Live sessions with founders, researchers, and MAYA engineers. Registration below is a mock preview — no emails sent."
      ctaTitle="Never miss a session"
      ctaSubtitle="Subscribe to the newsletter for weekly schedules and replay links."
      ctas={[
        { label: 'Newsletter', to: '/resources/newsletter', variant: 'primary' },
        { label: 'Academy Courses', to: '/ecosystem/academy', variant: 'secondary' },
      ]}
      disclaimer="Webinar registration is illustrative — connect Calendly or your events API in production."
    >
      <div className="mkt-grid">
        {WEBINARS.map((w) => (
          <div key={w.id} className="mkt-card">
            <div className="mkt-card__meta">{w.date}</div>
            <h3>{w.title}</h3>
            <p>
              Host: {w.host} · {w.registered}/{w.seats} registered
            </p>
            <button
              type="button"
              className="mkt-btn mkt-btn--secondary"
              style={{ marginTop: '0.75rem' }}
              disabled={registered[w.id]}
              onClick={() => handleRegister(w.id, w.title)}
            >
              {registered[w.id] ? 'Registered ✓' : 'Register (demo)'}
            </button>
          </div>
        ))}
      </div>
      {toast && <p className="mkt-toast">{toast}</p>}
    </AdvancedMarketingPage>
  );
}
