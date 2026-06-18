import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import { newBuilderId } from '../../types/prototypeBuilder.types';
import type { ExperimentLink } from '../../types/prototypeCreation.types';

interface Props {
  meta: PrototypeBuilderMeta;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeBuilderMeta>) => void;
}

export function ExperimentDesigner({ meta, disabled, onChange }: Props) {
  const update = (id: string, patch: Partial<ExperimentLink & { assumptions?: string }>) => {
    onChange({
      experiments: meta.experiments.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const add = () => {
    onChange({
      experiments: [
        ...meta.experiments,
        { id: newBuilderId(), hypothesis: '', methodology: '', metrics: '', expectedOutcome: '' },
      ],
    });
  };

  const remove = (id: string) => {
    onChange({ experiments: meta.experiments.filter((e) => e.id !== id) });
  };

  return (
    <section id="proto-builder-experiments" className="proto-builder-panel">
      <header className="proto-builder-panel__head">
        <h2>Experiment design</h2>
        <p>Hypotheses, assumptions, methodology, and success metrics for this prototype.</p>
      </header>

      {meta.experiments.length === 0 ? (
        <p className="proto-muted">No experiments linked yet.</p>
      ) : (
        <ul className="proto-experiment-list">
          {meta.experiments.map((exp) => (
            <li key={exp.id} className="proto-experiment-card">
              <div className="proto-field">
                <label>Hypothesis</label>
                <textarea rows={2} value={exp.hypothesis} disabled={disabled} onChange={(e) => update(exp.id, { hypothesis: e.target.value })} />
              </div>
              <div className="proto-field">
                <label>Assumptions</label>
                <input
                  value={exp.assumptions ?? ''}
                  disabled={disabled}
                  placeholder="What must be true for this to work?"
                  onChange={(e) => update(exp.id, { assumptions: e.target.value })}
                />
              </div>
              <div className="proto-form-grid proto-form-grid--2">
                <div className="proto-field">
                  <label>Methodology</label>
                  <input value={exp.methodology} disabled={disabled} onChange={(e) => update(exp.id, { methodology: e.target.value })} />
                </div>
                <div className="proto-field">
                  <label>Success metrics</label>
                  <input value={exp.metrics} disabled={disabled} onChange={(e) => update(exp.id, { metrics: e.target.value })} />
                </div>
              </div>
              <div className="proto-field">
                <label>Expected outcome</label>
                <input value={exp.expectedOutcome} disabled={disabled} onChange={(e) => update(exp.id, { expectedOutcome: e.target.value })} />
              </div>
              <button type="button" className="proto-btn proto-btn--ghost" disabled={disabled} onClick={() => remove(exp.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="proto-btn proto-btn--secondary" disabled={disabled} onClick={add}>
        + Add experiment
      </button>
    </section>
  );
}
