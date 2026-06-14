import { useState } from 'react';
import { AdvancedMarketingPage } from '../marketing/AdvancedMarketingPage';

const CASES = [
  {
    id: 'agri',
    name: 'GreenHarvest AI',
    sector: 'AgriTech',
    outcome: '$450K grant + angel',
    summary: 'Validation gate proved farmer adoption before a regional grant application.',
    metrics: { validation: 86, funding: 78, time: '8 months' },
  },
  {
    id: 'health',
    name: 'MediScan AI',
    sector: 'Health',
    outcome: 'Committed hospital pilot',
    summary: 'Research → prototype → validation in one workspace with MAYA scoring.',
    metrics: { validation: 91, funding: 72, time: '11 months' },
  },
  {
    id: 'edtech',
    name: 'SkillBridge',
    sector: 'EdTech',
    outcome: 'Marketplace launch',
    summary: 'Commercialization workspace produced GTM plan and SaaS pricing tiers.',
    metrics: { validation: 84, funding: 65, time: '9 months' },
  },
];

export default function ResourceCaseStudies() {
  const [active, setActive] = useState(CASES[0].id);
  const story = CASES.find((c) => c.id === active) ?? CASES[0];

  return (
    <AdvancedMarketingPage
      pill="📊 Success stories"
      title="Funded"
      titleAccent="startups"
      subtitle="Case studies from innovators who advanced through validation, funding, and commercialization on Maylet XLab."
      ctaTitle="Write your success story"
      ctaSubtitle="Start a project and move through the same pipeline these teams used."
      ctas={[
        { label: 'Start Real Project', to: '/projects/create', variant: 'primary' },
        { label: 'Funding Hub', to: '/funding', variant: 'secondary' },
        { label: 'Request Demo', to: '/demo', variant: 'ghost' },
      ]}
    >
      <div className="mkt-grid">
        {CASES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`mkt-card mkt-card--clickable ${active === c.id ? 'mkt-card--active' : ''}`}
            onClick={() => setActive(c.id)}
          >
            <div className="mkt-card__meta">{c.sector}</div>
            <h3>{c.name}</h3>
            <p>{c.outcome}</p>
          </button>
        ))}
      </div>

      <section className="mkt-section" style={{ marginTop: '1.25rem' }}>
        <div className="mkt-panel">
          <h3 style={{ margin: '0 0 0.5rem' }}>{story.name}</h3>
          <p style={{ margin: '0 0 1rem' }}>{story.summary}</p>
          <div className="mkt-stats" style={{ marginBottom: 0 }}>
            <div className="mkt-stat">
              <strong>{story.metrics.validation}%</strong>
              <span>Validation score</span>
            </div>
            <div className="mkt-stat">
              <strong>{story.metrics.funding}%</strong>
              <span>Funding readiness</span>
            </div>
            <div className="mkt-stat">
              <strong>{story.metrics.time}</strong>
              <span>Idea → outcome</span>
            </div>
          </div>
        </div>
      </section>
    </AdvancedMarketingPage>
  );
}
