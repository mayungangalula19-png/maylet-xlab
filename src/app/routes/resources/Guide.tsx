import { useState } from 'react';
import { AdvancedMarketingPage } from '../marketing/AdvancedMarketingPage';

const CHAPTERS = [
  {
    id: 'discover',
    num: '01',
    title: 'Discover & frame the problem',
    bullets: ['Define ICP and pain points', 'Run 10+ discovery interviews', 'Map competitors and whitespace'],
  },
  {
    id: 'research',
    num: '02',
    title: 'Research & evidence',
    bullets: ['Literature review linked to project', 'Hypothesis → experiment design', 'Document findings in Research Center'],
  },
  {
    id: 'build',
    num: '03',
    title: 'Prototype & experiment',
    bullets: ['Ship MVP with testing hooks', 'Measure pass rate and feedback', 'Iterate before validation gate'],
  },
  {
    id: 'validate',
    num: '04',
    title: 'Validate readiness',
    bullets: ['Score technical, user, market fit', 'MAYA aggregates evidence', 'Pass/hold decision unlocks funding'],
  },
  {
    id: 'fund',
    num: '05',
    title: 'Fund & launch',
    bullets: ['Pitch via Funding Hub', 'Secure committed capital', 'Commercialization command center'],
  },
];

export default function ResourceGuide() {
  const [active, setActive] = useState(CHAPTERS[0].id);
  const chapter = CHAPTERS.find((c) => c.id === active) ?? CHAPTERS[0];

  return (
    <AdvancedMarketingPage
      pill="📘 Innovation guide"
      title="Idea to"
      titleAccent="market"
      subtitle="A practical framework for taking ideas through the Maylet XLab pipeline — problem validation, experiments, prototypes, and launch."
      ctaTitle="Apply the framework"
      ctaSubtitle="Create a project and walk through each gate on the live platform."
      ctas={[
        { label: 'Start Real Project', to: '/projects/create', variant: 'primary' },
        { label: 'Interactive Demo', to: '/demo', variant: 'secondary' },
        { label: 'All Resources', to: '/resources', variant: 'ghost' },
      ]}
    >
      <div className="mkt-grid">
        {CHAPTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`mkt-card mkt-card--clickable ${active === c.id ? 'mkt-card--active' : ''}`}
            onClick={() => setActive(c.id)}
          >
            <div className="mkt-card__meta">Chapter {c.num}</div>
            <h3>{c.title}</h3>
          </button>
        ))}
      </div>

      <section className="mkt-section" style={{ marginTop: '1.25rem' }}>
        <div className="mkt-panel">
          <h3 style={{ margin: '0 0 0.75rem' }}>{chapter.title}</h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
            {chapter.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      </section>
    </AdvancedMarketingPage>
  );
}
