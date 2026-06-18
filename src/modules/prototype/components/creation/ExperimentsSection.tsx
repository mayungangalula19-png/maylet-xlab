import type { ExperimentLink, PrototypeCreationDraft } from '../../types/prototypeCreation.types';
import { newId } from '../../types/prototypeCreation.types';
import { ProtoSectionShell } from './ProtoSectionShell';

interface Props {
  draft: PrototypeCreationDraft;
  completion: number;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeCreationDraft>) => void;
}

export function ExperimentsSection({ draft, completion, disabled, onChange }: Props) {
  const update = (id: string, patch: Partial<ExperimentLink>) => {
    onChange({
      experiments: draft.experiments.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const add = () => {
    onChange({
      experiments: [
        ...draft.experiments,
        { id: newId(), hypothesis: '', methodology: '', metrics: '', expectedOutcome: '' },
      ],
    });
  };

  const remove = (id: string) => {
    onChange({ experiments: draft.experiments.filter((e) => e.id !== id) });
  };

  return (
    <ProtoSectionShell
      id="experiments"
      title="Experiments"
      description="Link hypotheses and metrics you will validate with this prototype."
      completion={completion}
    >
      {draft.experiments.length === 0 ? (
        <p className="proto-muted">No experiment links yet.</p>
      ) : (
        <ul className="proto-experiment-list">
          {draft.experiments.map((exp) => (
            <li key={exp.id} className="proto-experiment-card">
              <div className="proto-field">
                <label>Hypothesis</label>
                <textarea rows={2} value={exp.hypothesis} disabled={disabled} onChange={(e) => update(exp.id, { hypothesis: e.target.value })} />
              </div>
              <div className="proto-form-grid proto-form-grid--2">
                <div className="proto-field">
                  <label>Methodology</label>
                  <input value={exp.methodology} disabled={disabled} onChange={(e) => update(exp.id, { methodology: e.target.value })} />
                </div>
                <div className="proto-field">
                  <label>Metrics</label>
                  <input value={exp.metrics} disabled={disabled} onChange={(e) => update(exp.id, { metrics: e.target.value })} />
                </div>
              </div>
              <div className="proto-field">
                <label>Expected outcome</label>
                <input value={exp.expectedOutcome} disabled={disabled} onChange={(e) => update(exp.id, { expectedOutcome: e.target.value })} />
              </div>
              <button type="button" className="proto-btn proto-btn--ghost proto-btn--sm" disabled={disabled} onClick={() => remove(exp.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="proto-btn proto-btn--secondary" disabled={disabled} onClick={add}>
        + Link experiment
      </button>
    </ProtoSectionShell>
  );
}
