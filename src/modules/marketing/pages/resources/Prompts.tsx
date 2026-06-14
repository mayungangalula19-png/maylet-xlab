import { useState } from 'react';
import { AdvancedMarketingPage } from '../marketing/AdvancedMarketingPage';

const PROMPTS = [
  {
    id: 'problem',
    category: 'Discovery',
    title: 'Problem validation',
    prompt:
      'Given my target users [ICP], list the top 5 workflow pain points, evidence sources to verify each, and interview questions for 30-minute discovery calls.',
  },
  {
    id: 'literature',
    category: 'Research',
    title: 'Literature synthesis',
    prompt:
      'Summarize these papers [paste titles] into: key findings, gaps, and how they support or challenge my hypothesis for [project name].',
  },
  {
    id: 'experiment',
    category: 'Experiments',
    title: 'Experiment design',
    prompt:
      'Design a 2-week experiment to test [hypothesis] with measurable success criteria, sample size guidance, and risks to monitor.',
  },
  {
    id: 'validation',
    category: 'Validation',
    title: 'Validation review',
    prompt:
      'Score this project on technical, user, market, and financial dimensions. Recommend pass, hold, or fail with specific evidence gaps.',
  },
  {
    id: 'pitch',
    category: 'Funding',
    title: 'Pitch narrative',
    prompt:
      'Draft a 10-slide pitch outline for [sector] startup [name]: problem, solution, traction, business model, ask, and use of funds.',
  },
  {
    id: 'gtm',
    category: 'Launch',
    title: 'Go-to-market',
    prompt:
      'Propose GTM for [product]: target segments, pricing model options, distribution channels, and 90-day launch milestones.',
  },
];

const CATEGORIES = ['All', 'Discovery', 'Research', 'Experiments', 'Validation', 'Funding', 'Launch'];

export default function ResourcePrompts() {
  const [category, setCategory] = useState('All');
  const [active, setActive] = useState(PROMPTS[0].id);
  const [copied, setCopied] = useState(false);

  const filtered =
    category === 'All' ? PROMPTS : PROMPTS.filter((p) => p.category === category);
  const prompt = PROMPTS.find((p) => p.id === active) ?? PROMPTS[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AdvancedMarketingPage
      pill="💡 AI prompt library"
      title="MAYA-ready"
      titleAccent="templates"
      subtitle="Copy prompts for idea validation, research, experiments, funding, and launch — use with MAYA AI on the live platform."
      ctaTitle="Use prompts with MAYA"
      ctaSubtitle="Open the AI assistant inside your project workspace for context-aware responses."
      ctas={[
        { label: 'MAYA AI Assistant', to: '/ai-assistant', variant: 'primary' },
        { label: 'Create Account', to: '/register', variant: 'secondary' },
      ]}
    >
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

      <div className="mkt-grid">
        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`mkt-card mkt-card--clickable ${active === p.id ? 'mkt-card--active' : ''}`}
            onClick={() => setActive(p.id)}
          >
            <div className="mkt-card__meta">{p.category}</div>
            <h3>{p.title}</h3>
          </button>
        ))}
      </div>

      <section className="mkt-section" style={{ marginTop: '1.25rem' }}>
        <div className="mkt-panel">
          <h3 style={{ margin: '0 0 0.75rem' }}>{prompt.title}</h3>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.88rem' }}>{prompt.prompt}</p>
        </div>
        <button type="button" className="mkt-btn mkt-btn--primary" style={{ marginTop: '1rem' }} onClick={handleCopy}>
          Copy prompt
        </button>
        {copied && <p className="mkt-toast">Copied to clipboard.</p>}
      </section>
    </AdvancedMarketingPage>
  );
}
