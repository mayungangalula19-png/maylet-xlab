import { useState } from 'react';
import { AdvancedMarketingPage } from '../marketing/AdvancedMarketingPage';

const MILESTONES = [
  { week: 'Week 1–2', title: 'Problem & market discovery', detail: 'Define ICP, interview users, link research to project.' },
  { week: 'Week 3–6', title: 'Prototype sprint', detail: 'Ship MVP, run experiments, collect structured feedback.' },
  { week: 'Week 7–10', title: 'Validation gate', detail: 'Evidence review, MAYA scoring, funding readiness check.' },
  { week: 'Week 11–14', title: 'Pitch & incorporate', detail: 'Funding Hub pitch, mentor office hours, launch prep.' },
];

const COHORT_STATS = [
  { label: 'Startups accelerated', value: '50+' },
  { label: 'Avg funding raised', value: '$120K' },
  { label: 'Mentor hours', value: '2,400+' },
  { label: 'Completion rate', value: '78%' },
];

export default function EcosystemIncubator() {
  const [active, setActive] = useState(0);

  return (
    <AdvancedMarketingPage
      pill="🌱 Startup incubator"
      title="Idea to"
      titleAccent="incorporation"
      subtitle="Structured support for early-stage founders — milestones, mentor matching, and pitch readiness inside Maylet XLab."
      ctaTitle="Apply for the next cohort"
      ctaSubtitle="Cohort applications open quarterly. Start your innovation journey on the platform first."
      ctas={[
        { label: 'Start a Project', to: '/projects/create', variant: 'primary' },
        { label: 'Talk to Us', to: '/contact', variant: 'secondary' },
        { label: 'View Ecosystem', to: '/ecosystem', variant: 'ghost' },
      ]}
    >
      <div className="mkt-stats">
        {COHORT_STATS.map((s) => (
          <div key={s.label} className="mkt-stat">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">Program</div>
          <h2>
            14-week <span>milestones</span>
          </h2>
        </div>
        <div className="mkt-grid">
          {MILESTONES.map((m, i) => (
            <button
              key={m.title}
              type="button"
              className={`mkt-card mkt-card--clickable ${active === i ? 'mkt-card--active' : ''}`}
              onClick={() => setActive(i)}
            >
              <div className="mkt-card__meta">{m.week}</div>
              <h3>{m.title}</h3>
              <p>{m.detail}</p>
            </button>
          ))}
        </div>
      </section>
    </AdvancedMarketingPage>
  );
}
