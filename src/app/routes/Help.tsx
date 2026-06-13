import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdvancedMarketingPage } from './marketing/AdvancedMarketingPage';

const TOPICS = [
  {
    id: 'getting-started',
    category: 'Start',
    title: 'Getting started',
    answer:
      'Create a free account, start a project from the dashboard, and follow the Idea → Commercialization pipeline. Try the interactive demo at /demo without signing in.',
    links: [
      { label: 'Interactive demo', to: '/demo' },
      { label: 'Create account', to: '/register' },
    ],
  },
  {
    id: 'projects',
    category: 'Projects',
    title: 'Projects & pipeline',
    answer:
      'Each project moves through research, prototypes, experiments, validation, funding, and commercialization. Progress and readiness scores update as you complete work.',
    links: [
      { label: 'Innovation guide', to: '/resources/guide' },
      { label: 'Start project', to: '/projects/create' },
    ],
  },
  {
    id: 'maya',
    category: 'MAYA AI',
    title: 'Using MAYA AI',
    answer:
      'MAYA assists across modules — research summaries, validation scoring, pitch drafts, and launch advice. Open AI Assistant from the sidebar when logged in.',
    links: [
      { label: 'MAYA assistant', to: '/ai-assistant' },
      { label: 'Prompt library', to: '/resources/prompts' },
    ],
  },
  {
    id: 'validation',
    category: 'Validation',
    title: 'Validation gate',
    answer:
      'Validation scores technical, user, market, and financial evidence before funding unlocks. Projects need a pass or strong hold resolution to enter Funding Hub.',
    links: [{ label: 'Validation module', to: '/validation' }],
  },
  {
    id: 'funding',
    category: 'Funding',
    title: 'Funding & pitches',
    answer:
      'Funding Hub helps you build pitches, track readiness, and discover grants and investors. Eligibility improves after validation passes.',
    links: [{ label: 'Funding Hub', to: '/funding' }],
  },
  {
    id: 'billing',
    category: 'Account',
    title: 'Billing & plans',
    answer:
      'Free, Pro, and Enterprise tiers differ in project limits, AI credits, and team size. Manage subscription and invoices under Settings → Billing.',
    links: [
      { label: 'Pricing', to: '/pricing' },
      { label: 'Billing settings', to: '/settings/billing' },
    ],
  },
  {
    id: 'security',
    category: 'Account',
    title: 'Security & privacy',
    answer:
      'We use encrypted transport, Supabase RLS, and secure AI proxies. Review sessions and security events in account settings.',
    links: [
      { label: 'Security overview', to: '/security' },
      { label: 'Privacy policy', to: '/privacy' },
    ],
  },
  {
    id: 'careers',
    category: 'Company',
    title: 'Careers & applications',
    answer:
      'Apply on the public careers page. Upload your resume, portfolio link, and skills — MAYA matches you to open roles and admins review applications.',
    links: [{ label: 'Careers', to: '/careers' }],
  },
];

const CATEGORIES = ['All', 'Start', 'Projects', 'MAYA AI', 'Validation', 'Funding', 'Account', 'Company'];

const QUICK_LINKS = [
  { icon: '❓', label: 'FAQ', to: '/faq' },
  { icon: '🎧', label: 'Contact support', to: '/contact' },
  { icon: '📚', label: 'Resources', to: '/resources' },
  { icon: '●', label: 'System status', to: '/status' },
];

export default function Help() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [active, setActive] = useState(TOPICS[0].id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOPICS.filter((t) => {
      const catOk = category === 'All' || t.category === category;
      const searchOk =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.answer.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      return catOk && searchOk;
    });
  }, [query, category]);

  const topic = TOPICS.find((t) => t.id === active) ?? filtered[0] ?? TOPICS[0];

  return (
    <AdvancedMarketingPage
      pill="❓ Help center"
      title="How can we"
      titleAccent="help?"
      subtitle="Guides, troubleshooting, and quick paths to FAQ, MAYA AI, resources, and support."
      ctaTitle="Still stuck?"
      ctaSubtitle="Contact the team or ask MAYA when you're signed in."
      ctas={[
        { label: 'Contact support', to: '/contact', variant: 'primary' },
        { label: 'Ask MAYA AI', to: '/ai-assistant', variant: 'secondary' },
        { label: 'Full FAQ', to: '/faq', variant: 'ghost' },
      ]}
    >
      <div className="mkt-grid" style={{ marginBottom: '1.5rem' }}>
        {QUICK_LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="mkt-card" style={{ textDecoration: 'none' }}>
            <div className="mkt-card__icon">{link.icon}</div>
            <h3>{link.label}</h3>
          </Link>
        ))}
      </div>

      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">Search</div>
          <h2>
            Find an <span>answer</span>
          </h2>
        </div>
        <input
          className="mkt-input"
          type="search"
          placeholder="Search help topics…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: '100%', marginBottom: '1rem' }}
        />
        <div className="mkt-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`mkt-tab ${category === cat ? 'mkt-tab--active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mkt-panel">No topics match your search. Try FAQ or contact support.</p>
        ) : (
          <>
            <div className="mkt-grid">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`mkt-card mkt-card--clickable ${active === t.id ? 'mkt-card--active' : ''}`}
                  onClick={() => setActive(t.id)}
                >
                  <div className="mkt-card__meta">{t.category}</div>
                  <h3>{t.title}</h3>
                </button>
              ))}
            </div>
            <div className="mkt-panel" style={{ marginTop: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.5rem' }}>{topic.title}</h3>
              <p style={{ margin: '0 0 1rem' }}>{topic.answer}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {topic.links.map((l) => (
                  <Link key={l.to} to={l.to} style={{ color: '#9b7ff0', fontSize: '0.88rem' }}>
                    {l.label} →
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </AdvancedMarketingPage>
  );
}
