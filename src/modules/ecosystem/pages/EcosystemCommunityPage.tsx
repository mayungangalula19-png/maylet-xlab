import { AdvancedMarketingPage } from '../../marketing/pages/marketing/AdvancedMarketingPage';

const REGIONS = [
  { flag: '🇹🇿', name: 'East Africa', members: '3,200+', focus: 'AgriTech & Health' },
  { flag: '🇳🇬', name: 'West Africa', members: '2,800+', focus: 'FinTech & EdTech' },
  { flag: '🇰🇪', name: 'Pan-African', members: '1,900+', focus: 'Cross-border ventures' },
  { flag: '🌐', name: 'Global diaspora', members: '1,100+', focus: 'Remote teams & capital' },
];

const PROGRAMS = [
  { title: 'Regional demo days', detail: 'Quarterly showcases connecting founders to angels and grants.' },
  { title: 'Mentor circles', detail: 'Sector-specific groups led by operators who have raised and launched.' },
  { title: 'Innovation fellows', detail: 'Bridge academy, incubator, and live builder projects on XLab.' },
];

export default function EcosystemCommunity() {
  return (
    <AdvancedMarketingPage
      pill="🌍 Ecosystem community"
      title="Global innovation"
      titleAccent="network"
      subtitle="Regional chapters, mentor circles, and demo days — the human layer of the Maylet XLab ecosystem."
      ctaTitle="Connect with your region"
      ctaSubtitle="Join the platform to access chapter channels, events, and mentor matching."
      ctas={[
        { label: 'Join Community', to: '/community', variant: 'primary' },
        { label: 'Hackathons', to: '/hackathons', variant: 'secondary' },
        { label: 'Mentorship', to: '/mentorship', variant: 'ghost' },
      ]}
    >
      <div className="mkt-grid">
        {REGIONS.map((r) => (
          <div key={r.name} className="mkt-card">
            <div className="mkt-card__icon">{r.flag}</div>
            <h3>{r.name}</h3>
            <p>
              {r.members} innovators · {r.focus}
            </p>
          </div>
        ))}
      </div>

      <section className="mkt-section" style={{ marginTop: '2rem' }}>
        <div className="mkt-section__head">
          <div className="mkt-kicker">Programs</div>
          <h2>
            Ecosystem <span>initiatives</span>
          </h2>
        </div>
        <div className="mkt-grid">
          {PROGRAMS.map((p) => (
            <div key={p.title} className="mkt-card">
              <h3>{p.title}</h3>
              <p>{p.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </AdvancedMarketingPage>
  );
}
