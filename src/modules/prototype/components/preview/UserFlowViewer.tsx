import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import { INNOVATION_PIPELINE } from '../../types/prototypeBuilder.types';

interface Props {
  meta: PrototypeBuilderMeta;
}

export function UserFlowViewer({ meta }: Props) {
  const pipelineIdx = INNOVATION_PIPELINE.findIndex((s) => s.id === meta.workspaceStage);

  return (
    <section id="proto-preview-flow" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>User flow</h2>
        <p>Process journey from research through deployment.</p>
      </header>

      <div className="proto-preview-pipeline" aria-label="Innovation position">
        {INNOVATION_PIPELINE.map((stage, idx) => (
          <div
            key={stage.id}
            className={`proto-preview-pipeline__step${idx <= pipelineIdx ? ' proto-preview-pipeline__step--active' : ''}`}
          >
            <span className="proto-preview-pipeline__dot" />
            <span>{stage.label}</span>
          </div>
        ))}
      </div>

      {meta.userFlow.length === 0 ? (
        <p className="proto-muted">User journey steps documented in the builder will appear here.</p>
      ) : (
        <ol className="proto-preview-flow-steps">
          {meta.userFlow.map((step, idx) => (
            <li key={step.id} className="proto-preview-flow-step">
              <span className="proto-preview-flow-step__num">{idx + 1}</span>
              <div>
                <strong>{step.title || `Step ${idx + 1}`}</strong>
                <p>{step.description || '—'}</p>
              </div>
              {idx < meta.userFlow.length - 1 ? <span className="proto-preview-flow-step__arrow" aria-hidden>→</span> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
