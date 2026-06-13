import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Demo.css';

/* ─── Mock data only — no backend ───────────────────────────────────────── */

const WORKFLOW_STEPS = [
  {
    id: 'idea',
    label: 'Idea',
    icon: '💡',
    summary: 'Capture the problem, target users, and innovation thesis.',
    activities: [
      'Problem statement drafted for hospital workflow delays',
      'Target users: clinicians, triage nurses, admin staff',
      'MAYA suggests 3 comparable solutions in the market',
    ],
    metrics: { progress: 12, readiness: 28, validation: 0, funding: 0 },
  },
  {
    id: 'research',
    label: 'Research',
    icon: '🔬',
    summary: 'Literature review, evidence gathering, and research documents.',
    activities: [
      '14 papers added to Literature Review',
      'Research playbook checklist 60% complete',
      'Evidence model links symptoms → workflow bottlenecks',
    ],
    metrics: { progress: 28, readiness: 42, validation: 0, funding: 0 },
  },
  {
    id: 'prototype',
    label: 'Prototype',
    icon: '📦',
    summary: 'Build and iterate on an MVP with testing hooks.',
    activities: [
      'UI prototype uploaded with 3 core screens',
      'Detection pipeline stub integrated',
      'Internal demo scheduled with pilot hospital',
    ],
    metrics: { progress: 48, readiness: 58, validation: 15, funding: 10 },
  },
  {
    id: 'validation',
    label: 'Validation',
    icon: '✅',
    summary: 'Score market fit, user evidence, and funding readiness gate.',
    activities: [
      'User interviews: 12 sessions, 78% positive signal',
      'Validation decision: PASS with minor hold items',
      'Technical + market scores aggregated by MAYA',
    ],
    metrics: { progress: 65, readiness: 74, validation: 82, funding: 35 },
  },
  {
    id: 'funding',
    label: 'Funding',
    icon: '💰',
    summary: 'Pitch, grants, and investor matching through the funding hub.',
    activities: [
      'Pitch deck generated with financial projections',
      'Matched to 4 grant programs + 2 angel networks',
      'Funding readiness: committed — term sheet in review',
    ],
    metrics: { progress: 78, readiness: 86, validation: 88, funding: 72 },
  },
  {
    id: 'commercialization',
    label: 'Commercialization',
    icon: '🚀',
    summary: 'Package for market — GTM, pricing, revenue model, launch.',
    activities: [
      'Go-to-market plan: regional hospital networks',
      'SaaS pricing tiers drafted with MAYA suggestions',
      'Launch checklist 80% — preparing for marketplace',
    ],
    metrics: { progress: 92, readiness: 94, validation: 91, funding: 88 },
  },
] as const;

const SAMPLE_PROJECT = {
  name: 'MediScan AI',
  sector: 'Health',
  tagline: 'AI-assisted hospital workflow & detection intelligence',
  team: '4 contributors',
};

const FEATURE_CARDS = [
  {
    id: 'research',
    icon: '📚',
    title: 'Research Engine',
    blurb: 'Literature, documents, and evidence pipelines.',
    detail:
      'In the full platform, innovators compile literature reviews, link findings to projects, and feed MAYA with structured evidence — all before prototyping begins.',
  },
  {
    id: 'prototype',
    icon: '🛠️',
    title: 'Prototype Builder',
    blurb: 'Upload, test, and iterate MVPs in one workspace.',
    detail:
      'Prototype Builder connects uploads, testing workflows, and preview modes so teams can ship demos and collect structured feedback without leaving XLab.',
  },
  {
    id: 'validation',
    icon: '📊',
    title: 'Validation System',
    blurb: 'Evidence-based gate before funding.',
    detail:
      'Validation scores technical, user, market, and financial dimensions — producing a clear pass/hold/fail decision that unlocks the funding module.',
  },
  {
    id: 'funding',
    icon: '🏦',
    title: 'Funding Pipeline',
    blurb: 'Pitches, grants, and investor matching.',
    detail:
      'Funding Hub turns validated projects into fundable packages with pitch tools, readiness scores, and curated capital sources.',
  },
  {
    id: 'maya',
    icon: '🤖',
    title: 'MAYA AI',
    blurb: 'Intelligence across every pipeline stage.',
    detail:
      'MAYA recommends next actions, scores readiness, drafts pitches, and advises on commercialization — always grounded in your project context.',
  },
] as const;

type RiskLevel = 'low' | 'medium' | 'high';

function mayaInsightsForStep(stepIndex: number): {
  prediction: string;
  recommendation: string;
  risk: RiskLevel;
  nextAction: string;
} {
  const insights = [
    {
      prediction: 'Strong health-tech demand in emerging markets; workflow AI is a top-3 hospital priority for 2026.',
      recommendation: 'Focus MVP on triage workflow — highest pain point from mock user interviews.',
      risk: 'medium' as RiskLevel,
      nextAction: 'Complete problem statement and run 5 more discovery calls.',
    },
    {
      prediction: 'Literature supports 23% average efficiency gains from similar detection systems.',
      recommendation: 'Prioritize peer-reviewed studies on clinical workflow automation.',
      risk: 'medium' as RiskLevel,
      nextAction: 'Finalize research playbook and link 3 key papers to the project.',
    },
    {
      prediction: 'Prototype feedback loops will determine technical feasibility within 2 sprints.',
      recommendation: 'Ship a clickable demo before investing in model accuracy.',
      risk: 'medium' as RiskLevel,
      nextAction: 'Upload prototype and schedule internal test session.',
    },
    {
      prediction: 'Validation pass probability: 78% based on user signal and market scores.',
      recommendation: 'Address hold items on data privacy compliance before funding pitch.',
      risk: 'low' as RiskLevel,
      nextAction: 'Submit validation review and attach interview summaries.',
    },
    {
      prediction: 'Grant + angel mix optimal for health AI at this stage; avoid dilutive round too early.',
      recommendation: 'Lead with African Innovation Grant narrative in pitch deck.',
      risk: 'low' as RiskLevel,
      nextAction: 'Create pitch in Funding Hub and apply to top 2 matches.',
    },
    {
      prediction: 'Launch window: 4–6 weeks if GTM and pricing finalize this month.',
      recommendation: 'Tiered SaaS at $29 / $79 / enterprise annual contracts.',
      risk: 'low' as RiskLevel,
      nextAction: 'Complete commercialization checklist and prepare marketplace listing.',
    },
  ];
  return insights[stepIndex] ?? insights[0];
}

export default function Demo() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string>(FEATURE_CARDS[0].id);

  const step = WORKFLOW_STEPS[activeStep];
  const maya = useMemo(() => mayaInsightsForStep(activeStep), [activeStep]);
  const feature = FEATURE_CARDS.find((f) => f.id === activeFeature) ?? FEATURE_CARDS[0];

  const progressPct = Math.round(((activeStep + 1) / WORKFLOW_STEPS.length) * 100);

  const goNext = useCallback(() => {
    setActiveStep((s) => Math.min(WORKFLOW_STEPS.length - 1, s + 1));
  }, []);

  const goPrev = useCallback(() => {
    setActiveStep((s) => Math.max(0, s - 1));
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveStep((s) => {
        if (s >= WORKFLOW_STEPS.length - 1) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 2800);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  return (
    <div className="demo-page">
      <Link to="/" className="demo-back">
        ← Back to Home
      </Link>

      <div className="demo-container">
        {/* 1. Hero */}
        <section className="demo-hero">
          <div className="demo-pill">
            <span>▶</span> Interactive product demo
          </div>
          <h1>
            See <span>Maylet XLab</span> in action
          </h1>
          <p>
            Explore the innovation operating system — from first idea to commercial launch. This
            walkthrough uses sample data only. Nothing is saved; no account required to explore.
          </p>
        </section>

        {/* 2. Interactive workflow */}
        <section className="demo-section" id="workflow">
          <div className="demo-section__head">
            <div className="demo-kicker">Live simulation</div>
            <h2>
              Innovation <span>workflow</span>
            </h2>
            <p>
              Click a stage or press Play to watch a sample health-tech project move through the
              pipeline.
            </p>
          </div>

          <div className="demo-workflow">
            <div className="demo-workflow__controls">
              <button
                type="button"
                className="demo-workflow__btn demo-workflow__btn--primary"
                onClick={() => setIsPlaying((p) => !p)}
              >
                {isPlaying ? '⏸ Pause demo' : '▶ Play demo'}
              </button>
              <button
                type="button"
                className="demo-workflow__btn"
                onClick={goPrev}
                disabled={activeStep === 0}
              >
                ← Previous
              </button>
              <button
                type="button"
                className="demo-workflow__btn"
                onClick={goNext}
                disabled={activeStep === WORKFLOW_STEPS.length - 1}
              >
                Next →
              </button>
              <button
                type="button"
                className="demo-workflow__btn"
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep(0);
                }}
              >
                ↺ Reset
              </button>
            </div>

            <div className="demo-progress" aria-hidden>
              <div className="demo-progress__fill" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="demo-pipeline" role="tablist" aria-label="Innovation pipeline stages">
              {WORKFLOW_STEPS.map((s, index) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={index === activeStep}
                  className={`demo-pipeline__step ${
                    index < activeStep ? 'demo-pipeline__step--done' : ''
                  } ${index === activeStep ? 'demo-pipeline__step--active' : ''}`}
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveStep(index);
                  }}
                >
                  <span className="demo-pipeline__icon">{s.icon}</span>
                  <span className="demo-pipeline__label">{s.label}</span>
                </button>
              ))}
            </div>

            {/* 3. Sample project walkthrough */}
            <div className="demo-walkthrough">
              <div className="demo-walkthrough__panel">
                <h3>
                  {SAMPLE_PROJECT.name} — {step.label} stage
                </h3>
                <p>{step.summary}</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.55, marginBottom: '0.75rem' }}>
                  {SAMPLE_PROJECT.sector} · {SAMPLE_PROJECT.tagline}
                </p>
                <div className="demo-metrics">
                  <div className="demo-metric">
                    <span>Progress</span>
                    <strong>{step.metrics.progress}%</strong>
                  </div>
                  <div className="demo-metric">
                    <span>Readiness</span>
                    <strong>{step.metrics.readiness}%</strong>
                  </div>
                  <div className="demo-metric">
                    <span>Validation</span>
                    <strong>{step.metrics.validation}%</strong>
                  </div>
                  <div className="demo-metric">
                    <span>Funding</span>
                    <strong>{step.metrics.funding}%</strong>
                  </div>
                </div>
              </div>
              <div className="demo-walkthrough__panel">
                <h3>What happened in this stage</h3>
                <ul className="demo-activity-list">
                  {step.activities.map((activity) => (
                    <li key={activity}>
                      <span aria-hidden>✓</span>
                      {activity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Feature showcase */}
        <section className="demo-section" id="features">
          <div className="demo-section__head">
            <div className="demo-kicker">Platform modules</div>
            <h2>
              Feature <span>showcase</span>
            </h2>
            <p>Click a module to see how it fits into the XLab innovation journey.</p>
          </div>
          <div className="demo-features">
            {FEATURE_CARDS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`demo-feature ${activeFeature === f.id ? 'demo-feature--active' : ''}`}
                onClick={() => setActiveFeature(f.id)}
              >
                <div className="demo-feature__icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.blurb}</p>
              </button>
            ))}
          </div>
          <p className="demo-feature__detail">{feature.detail}</p>
        </section>

        {/* 5. MAYA AI demo panel */}
        <section className="demo-section" id="maya">
          <div className="demo-section__head">
            <div className="demo-kicker">MAYA intelligence</div>
            <h2>
              AI demo <span>insights</span>
            </h2>
            <p>Sample MAYA recommendations update as you move through the workflow simulation.</p>
          </div>
          <div className="demo-maya">
            <div>
              <div className="demo-maya__badge">
                <span>✨</span> MAYA Advisor · Demo mode
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
                Context: {SAMPLE_PROJECT.name} @ {step.label}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }}>
                Insights below are illustrative mock outputs — not connected to live AI in this
                demo.
              </p>
            </div>
            <div className="demo-maya__insights">
              <div className="demo-maya__insight">
                <label>Market prediction</label>
                <p>{maya.prediction}</p>
              </div>
              <div className="demo-maya__insight">
                <label>Recommendation</label>
                <p>{maya.recommendation}</p>
              </div>
              <div className="demo-maya__insight">
                <label>
                  Risk level{' '}
                  <span className={`demo-maya__risk demo-maya__risk--${maya.risk}`}>
                    {maya.risk}
                  </span>
                </label>
                <p>Suggested next action: {maya.nextAction}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Final CTA */}
        <section className="demo-cta">
          <h2>Ready to build for real?</h2>
          <p>
            This demo used mock data only. Create an account and start your own innovation journey
            on the live platform.
          </p>
          <div className="demo-cta__actions">
            <Link to="/dashboard" className="demo-btn demo-btn--primary">
              Go to Dashboard →
            </Link>
            <Link to="/register" className="demo-btn demo-btn--secondary">
              Create Account
            </Link>
            <Link to="/projects/create" className="demo-btn demo-btn--ghost">
              Start Real Project
            </Link>
          </div>
        </section>

        <p className="demo-disclaimer">
          Demo mode — no data saved · no backend calls · presentation and interaction only
        </p>
      </div>
    </div>
  );
}
