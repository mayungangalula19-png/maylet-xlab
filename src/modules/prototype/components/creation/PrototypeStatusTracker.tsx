import type { PrototypeWorkspaceStage } from '../../types/prototypeCreation.types';
import { WORKSPACE_STAGES } from '../../types/prototypeCreation.types';
import { ProtoSectionShell } from './ProtoSectionShell';

interface Props {
  stage: PrototypeWorkspaceStage;
  completion: number;
  disabled?: boolean;
  onChange: (stage: PrototypeWorkspaceStage) => void;
}

function stageIndex(id: PrototypeWorkspaceStage): number {
  return WORKSPACE_STAGES.findIndex((s) => s.id === id);
}

export function PrototypeStatusTracker({ stage, completion, disabled, onChange }: Props) {
  const currentIdx = stageIndex(stage);

  return (
    <ProtoSectionShell
      id="status"
      title="Prototype status"
      description="Lifecycle position across the MAYLET X LAB innovation pipeline."
      completion={completion}
    >
      <div className="proto-pipeline" role="list" aria-label="Prototype lifecycle">
        {WORKSPACE_STAGES.map((s, idx) => {
          const done = idx < currentIdx;
          const active = s.id === stage;
          return (
            <button
              key={s.id}
              type="button"
              role="listitem"
              disabled={disabled}
              className={`proto-pipeline__step${done ? ' proto-pipeline__step--done' : ''}${active ? ' proto-pipeline__step--active' : ''}`}
              onClick={() => onChange(s.id)}
            >
              <span className="proto-pipeline__dot" aria-hidden />
              <span className="proto-pipeline__label">{s.label}</span>
            </button>
          );
        })}
      </div>
      <p className="proto-muted">
        Current stage: <strong>{WORKSPACE_STAGES[currentIdx]?.label ?? stage}</strong>. Publishing moves the record into the Prototype build phase.
      </p>
    </ProtoSectionShell>
  );
}

/** Compact horizontal tracker for page header area */
export function PrototypeStatusTrackerBar({ stage }: { stage: PrototypeWorkspaceStage }) {
  const currentIdx = stageIndex(stage);
  return (
    <div className="proto-pipeline proto-pipeline--compact" aria-label="Lifecycle progress">
      {WORKSPACE_STAGES.map((s, idx) => (
        <div
          key={s.id}
          className={`proto-pipeline__step proto-pipeline__step--static${idx <= currentIdx ? ' proto-pipeline__step--done' : ''}${s.id === stage ? ' proto-pipeline__step--active' : ''}`}
        >
          <span className="proto-pipeline__dot" aria-hidden />
          <span className="proto-pipeline__label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
