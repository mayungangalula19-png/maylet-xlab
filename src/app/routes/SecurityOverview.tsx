import { Link } from 'react-router-dom';
import { AdvancedMarketingPage } from './marketing/AdvancedMarketingPage';

const PILLARS = [
  {
    icon: '🔐',
    title: 'Encryption in transit',
    detail: 'TLS 1.3 for all client connections. API keys and AI provider secrets never reach the browser.',
  },
  {
    icon: '🛡️',
    title: 'Row-level security',
    detail: 'Supabase RLS isolates projects, documents, vault entries, and admin data per user and role.',
  },
  {
    icon: '🤖',
    title: 'Secure AI proxy',
    detail: 'MAYA requests route through edge functions so model keys stay server-side.',
  },
  {
    icon: '👤',
    title: 'Auth & sessions',
    detail: 'JWT sessions with email verification, password reset, and optional SSO on Enterprise.',
  },
  {
    icon: '📋',
    title: 'Audit & compliance',
    detail: 'Admin security logs, moderation workflows, and data export controls for organizations.',
  },
  {
    icon: '🔒',
    title: 'Innovation Vault',
    detail: 'IP-sensitive entries with access controls separate from public marketplace listings.',
  },
];

export default function SecurityOverview() {
  return (
    <AdvancedMarketingPage
      pill="🛡️ Security overview"
      title="Protecting your"
      titleAccent="innovation"
      subtitle="How Maylet XLab secures ideas, project data, vault entries, and AI interactions across the platform."
      ctaTitle="Review your account security"
      ctaSubtitle="Signed-in users can view sessions and security events in settings."
      ctas={[
        { label: 'Security Settings', to: '/settings/security', variant: 'primary' },
        { label: 'Privacy Policy', to: '/privacy', variant: 'secondary' },
        { label: 'Contact Security', to: '/contact', variant: 'ghost' },
      ]}
    >
      <div className="mkt-grid">
        {PILLARS.map((p) => (
          <div key={p.title} className="mkt-card">
            <div className="mkt-card__icon">{p.icon}</div>
            <h3>{p.title}</h3>
            <p>{p.detail}</p>
          </div>
        ))}
      </div>

      <section className="mkt-section" style={{ marginTop: '2rem' }}>
        <p className="mkt-panel">
          Enterprise plans add <strong>SSO</strong>, dedicated account management, and SLA-backed
          support. Learn more on the{' '}
          <Link to="/enterprise" style={{ color: '#9b7ff0' }}>
            Enterprise page
          </Link>
          .
        </p>
      </section>
    </AdvancedMarketingPage>
  );
}
