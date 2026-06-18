import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';

interface Props {
  meta: PrototypeBuilderMeta;
}

export function SolutionOverview({ meta }: Props) {
  return (
    <section id="proto-preview-solution" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>Solution overview</h2>
        <p>Product vision, core benefits, and user outcomes.</p>
      </header>
      <div className="proto-preview-solution-grid">
        <article className="proto-preview-solution-card proto-preview-solution-card--primary">
          <h3>Solution description</h3>
          <p>{meta.solutionOverview.trim() || meta.description || 'Solution narrative pending.'}</p>
        </article>
        <article className="proto-preview-solution-card">
          <h3>Product vision</h3>
          <p>{meta.technicalApproach.trim() || 'Long-term product direction to be defined.'}</p>
        </article>
        <article className="proto-preview-solution-card">
          <h3>Core benefits</h3>
          <p>{meta.keyInnovation.trim() || 'Key benefits from builder documentation.'}</p>
        </article>
        <article className="proto-preview-solution-card">
          <h3>User outcomes</h3>
          <p>{meta.competitiveAdvantage.trim() || 'Measurable outcomes for target users.'}</p>
        </article>
      </div>
    </section>
  );
}
