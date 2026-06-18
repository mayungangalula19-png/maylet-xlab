import type { PrototypeCreationDraft, UserFlowStep } from '../../types/prototypeCreation.types';
import { newId } from '../../types/prototypeCreation.types';
import { ProtoSectionShell } from './ProtoSectionShell';

interface Props {
  draft: PrototypeCreationDraft;
  completion: number;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeCreationDraft>) => void;
}

export function UserFlowSection({ draft, completion, disabled, onChange }: Props) {
  const updateStep = (id: string, patch: Partial<UserFlowStep>) => {
    onChange({
      userFlow: draft.userFlow.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const addStep = () => {
    const order = draft.userFlow.length;
    onChange({
      userFlow: [
        ...draft.userFlow,
        { id: newId(), title: '', description: '', order },
      ],
    });
  };

  const removeStep = (id: string) => {
    onChange({ userFlow: draft.userFlow.filter((s) => s.id !== id) });
  };

  return (
    <ProtoSectionShell
      id="flow"
      title="User flow"
      description="Map workflow steps and user journey for the prototype."
      completion={completion}
    >
      {draft.userFlow.length === 0 ? (
        <p className="proto-muted">No flow steps yet. Add steps to document the user journey.</p>
      ) : (
        <ol className="proto-flow-timeline">
          {draft.userFlow.map((step, idx) => (
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
                  placeholder="What happens in this step?"
                  onChange={(e) => updateStep(step.id, { description: e.target.value })}
                />
              </div>
              <button type="button" className="proto-btn proto-btn--ghost proto-btn--sm" disabled={disabled} onClick={() => removeStep(step.id)}>
                Remove
              </button>
            </li>
          ))}
        </ol>
      )}
      <button type="button" className="proto-btn proto-btn--secondary" disabled={disabled} onClick={addStep}>
        + Add flow step
      </button>
    </ProtoSectionShell>
  );
}
