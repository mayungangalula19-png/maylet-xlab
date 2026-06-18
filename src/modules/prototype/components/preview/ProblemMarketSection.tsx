import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';

interface Props {
  meta: PrototypeBuilderMeta;
}

export function ProblemMarketSection({ meta }: Props) {
  const cards = [
    { title: 'Problem statement', body: meta.problemStatement, insight: 'Core pain being addressed' },
    { title: 'Pain points', body: meta.currentLimitations, insight: 'Gaps in existing solutions' },
    { title: 'Target audience', body: meta.targetUsers, insight: 'Who benefits most' },
    { title: 'Market need', body: meta.marketNeed, insight: 'Demand & urgency signals' },
  ];

  return (
    <section id="proto-preview-problem" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>Problem & market</h2>
        <p>Evidence that a real problem exists and a market is ready.</p>
      </header>
      <div className="proto-preview-insight-grid">
        {cards.map((c) => (
          <article key={c.title} className="proto-preview-insight-card">
            <span className="proto-preview-insight-card__label">{c.insight}</span>
            <h3>{c.title}</h3>
            <p>{c.body.trim() || 'Pending research documentation.'}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
