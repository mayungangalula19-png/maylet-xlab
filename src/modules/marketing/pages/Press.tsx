import { useState } from 'react';
import { AdvancedMarketingPage } from './marketing/AdvancedMarketingPage';

const RELEASES = [
  {
    id: 'launch',
    date: 'May 2025',
    title: 'Maylet XLab launches Innovation Operating System',
    excerpt: 'Platform unifies Idea → Commercialization pipeline with MAYA AI intelligence.',
  },
  {
    id: 'funding',
    date: 'Mar 2025',
    title: '$5M+ capital connected through Funding Hub',
    excerpt: 'Early cohort of African health-tech and agri-tech startups secure grants and angels.',
  },
  {
    id: 'academy',
    date: 'Jan 2025',
    title: 'Innovation Academy reaches 10,000 learners',
    excerpt: 'Free masterclasses on validation, prototyping, and go-to-market now available globally.',
  },
];

const MEDIA_KIT = [
  { icon: '📷', title: 'Brand assets', detail: 'Logos, colors, and product screenshots (ZIP).' },
  { icon: '📝', title: 'Boilerplate', detail: 'Company description, leadership bios, and key stats.' },
  { icon: '🎤', title: 'Executive quotes', detail: 'Approved statements on innovation and MAYA AI.' },
];

export default function Press() {
  const [active, setActive] = useState(RELEASES[0].id);
  const release = RELEASES.find((r) => r.id === active) ?? RELEASES[0];

  return (
    <AdvancedMarketingPage
      pill="📰 Press & media"
      title="News &"
      titleAccent="Media Kit"
      subtitle="Press releases, brand assets, and partnership inquiries for journalists and ecosystem partners."
      ctaTitle="Press inquiries"
      ctaSubtitle="For interviews, data requests, or partnership announcements."
      ctas={[
        { label: 'press@mayletxlab.com', to: '/contact', variant: 'primary' },
        { label: 'About Maylet XLab', to: '/about', variant: 'secondary' },
      ]}
    >
      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">Announcements</div>
          <h2>
            Press <span>releases</span>
          </h2>
        </div>
        <div className="mkt-grid">
          {RELEASES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`mkt-card mkt-card--clickable ${active === r.id ? 'mkt-card--active' : ''}`}
              onClick={() => setActive(r.id)}
            >
              <div className="mkt-card__meta">{r.date}</div>
              <h3>{r.title}</h3>
              <p>{r.excerpt}</p>
            </button>
          ))}
        </div>
        <p className="mkt-panel" style={{ marginTop: '1rem' }}>{release.excerpt}</p>
      </section>

      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">Resources</div>
          <h2>
            Media <span>kit</span>
          </h2>
        </div>
        <div className="mkt-grid">
          {MEDIA_KIT.map((item) => (
            <div key={item.title} className="mkt-card">
              <div className="mkt-card__icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </AdvancedMarketingPage>
  );
}
