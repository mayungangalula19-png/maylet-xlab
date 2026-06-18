import type { FlowViewMode, PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import { newBuilderId } from '../../types/prototypeBuilder.types';
import type { UserFlowStep } from '../../types/prototypeCreation.types';

interface Props {
  meta: PrototypeBuilderMeta;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeBuilderMeta>) => void;
}

export function UserFlowDesigner({ meta, disabled, onChange }: Props) {
  const view = meta.flowViewMode;

  const setView = (flowViewMode: FlowViewMode) => onChange({ flowViewMode });

  const updateStep = (id: string, patch: Partial<UserFlowStep>) => {
    onChange({
      userFlow: meta.userFlow.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const addStep = () => {
    onChange({
      userFlow: [
        ...meta.userFlow,
        { id: newBuilderId(), title: '', description: '', order: meta.userFlow.length },
      ],
    });
  };

  const removeStep = (id: string) => {
    onChange({ userFlow: meta.userFlow.filter((s) => s.id !== id) });
  };

  return (
    <section id="proto-builder-flow" className="proto-builder-panel">
      <header className="proto-builder-panel__head">
        <div>
          <h2>User flow designer</h2>
          <p>Map user journeys from registration through validation.</p>
        </div>
        <div className="proto-builder-view-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'timeline'}
            className={view === 'timeline' ? 'proto-builder-view-toggle__btn--active' : ''}
            onClick={() => setView('timeline')}
          >
            Timeline
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'nodes'}
            className={view === 'nodes' ? 'proto-builder-view-toggle__btn--active' : ''}
            onClick={() => setView('nodes')}
          >
            Flow map
          </button>
        </div>
      </header>

      {meta.userFlow.length === 0 ? (
        <p className="proto-muted">No flow steps yet. Document the user journey.</p>
      ) : view === 'timeline' ? (
        <ol className="proto-flow-timeline">
          {meta.userFlow.map((step, idx) => (
            <li key={step.id} className="proto-flow-step">
              <span className="proto-flow-step__num">{idx + 1}</span>
              <div className="proto-flow-step__fields">
                <input
                  value={step.title}
                  disabled={disabled}
                  placeholder="Step title"
                  onChange={(e) => updateStep(step.id, { title: e.target.value })}
                />
                <textarea
                  rows={2}
                  value={step.description}
                  disabled={disabled}
                  placeholder="What happens here?"
                  onChange={(e) => updateStep(step.id, { description: e.target.value })}
                />
              </div>
              <button type="button" className="proto-btn proto-btn--ghost" disabled={disabled} onClick={() => removeStep(step.id)}>
                Remove
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="proto-flow-nodes" role="list">
          {meta.userFlow.map((step, idx) => (
            <div key={step.id} className="proto-flow-node" role="listitem">
              <div className="proto-flow-node__card">
                <strong>{step.title || `Step ${idx + 1}`}</strong>
                <p>{step.description || 'Add description'}</p>
                <input
                  value={step.title}
                  disabled={disabled}
                  placeholder="Title"
                  onChange={(e) => updateStep(step.id, { title: e.target.value })}
                />
                <textarea
                  rows={2}
                  value={step.description}
                  disabled={disabled}
                  onChange={(e) => updateStep(step.id, { description: e.target.value })}
                />
              </div>
              {idx < meta.userFlow.length - 1 ? <span className="proto-flow-node__arrow" aria-hidden>→</span> : null}
            </div>
          ))}
        </div>
      )}

      <button type="button" className="proto-btn proto-btn--secondary" disabled={disabled} onClick={addStep}>
        + Add step
      </button>
    </section>
  );
}
