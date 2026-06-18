import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';

interface Props {
  meta: PrototypeBuilderMeta;
}

export function EvidenceCenter({ meta }: Props) {
  if (meta.experiments.length === 0) {
    return (
      <section id="proto-preview-evidence" className="proto-preview-section">
        <header className="proto-preview-section__head">
          <h2>Experiments & evidence</h2>
          <p>Hypotheses, methodology, and measured outcomes.</p>
        </header>
        <p className="proto-muted">No experiment evidence linked yet.</p>
      </section>
    );
  }

  return (
    <section id="proto-preview-evidence" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>Experiments & evidence</h2>
        <p>{meta.experiments.length} experiment{meta.experiments.length === 1 ? '' : 's'} documented</p>
      </header>
      <div className="proto-preview-evidence-grid">
        {meta.experiments.map((exp) => (
          <article key={exp.id} className="proto-preview-evidence-card">
            <h3>Hypothesis</h3>
            <p className="proto-preview-evidence-card__hypothesis">{exp.hypothesis || '—'}</p>
            {exp.assumptions ? (
              <>
                <h4>Assumptions</h4>
                <p>{exp.assumptions}</p>
              </>
            ) : null}
            <div className="proto-preview-evidence-card__metrics">
              <div>
                <span>Methodology</span>
                <strong>{exp.methodology || '—'}</strong>
              </div>
              <div>
                <span>Metrics</span>
                <strong>{exp.metrics || '—'}</strong>
              </div>
              <div>
                <span>Expected outcome</span>
                <strong>{exp.expectedOutcome || '—'}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
