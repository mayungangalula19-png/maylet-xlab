import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';

interface Props {
  meta: PrototypeBuilderMeta;
}

export function ExecutiveSummary({ meta }: Props) {
  const items = [
    { label: 'Problem', value: meta.problemStatement, icon: '🎯' },
    { label: 'Solution', value: meta.solutionOverview, icon: '💡' },
    { label: 'Key innovation', value: meta.keyInnovation, icon: '⚡' },
    { label: 'Competitive advantage', value: meta.competitiveAdvantage, icon: '🏆' },
  ];

  return (
    <section id="proto-preview-summary" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>Executive summary</h2>
        <p>Investor-friendly overview of the innovation narrative.</p>
      </header>
      <div className="proto-preview-exec-grid">
        {items.map((item) => (
          <article key={item.label} className="proto-preview-exec-card">
            <span className="proto-preview-exec-card__icon" aria-hidden>
              {item.icon}
            </span>
            <h3>{item.label}</h3>
            <p>{item.value.trim() || 'Not documented yet.'}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
