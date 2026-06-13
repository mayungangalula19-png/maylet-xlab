import { type FormEvent, useState } from 'react';
import { AdvancedMarketingPage } from '../marketing/AdvancedMarketingPage';

const ISSUES = [
  { title: 'Validation trends in health-tech', date: 'Jun 12, 2025' },
  { title: '5 MAYA prompts every founder should use', date: 'Jun 5, 2025' },
  { title: 'Funding Hub: grant vs angel playbook', date: 'May 29, 2025' },
];

export default function ResourceNewsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  };

  return (
    <AdvancedMarketingPage
      pill="📧 Weekly newsletter"
      title="Innovation"
      titleAccent="insights"
      subtitle="Pipeline tips, MAYA prompts, funding opportunities, and ecosystem news — delivered weekly. Subscribe form is demo only."
      disclaimer="No email is sent from this page — wire to Mailchimp, Resend, or your CRM in production."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <section>
          <div className="mkt-section__head">
            <h2>
              Subscribe <span>(demo)</span>
            </h2>
          </div>
          {subscribed ? (
            <p className="mkt-panel" style={{ color: '#68d391' }}>
              Thanks! You&apos;re on the list (preview only — {email} not stored).
            </p>
          ) : (
            <form className="mkt-form" onSubmit={handleSubmit}>
              <input
                className="mkt-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="mkt-btn mkt-btn--primary">
                Subscribe
              </button>
            </form>
          )}
        </section>

        <section>
          <div className="mkt-section__head">
            <h2>
              Recent <span>issues</span>
            </h2>
          </div>
          <ul className="mkt-list">
            {ISSUES.map((i) => (
              <li key={i.title}>
                <span>{i.title}</span>
                <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>{i.date}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdvancedMarketingPage>
  );
}
