import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import { INNOVATION_PIPELINE } from '../../types/prototypeBuilder.types';
import type { PrototypeWorkspaceStage } from '../../types/prototypeCreation.types';

interface Props {
  meta: PrototypeBuilderMeta;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeBuilderMeta>) => void;
}

function stageIndex(stage: PrototypeWorkspaceStage): number {
  const idx = INNOVATION_PIPELINE.findIndex((s) => s.id === stage);
  return idx >= 0 ? idx : 2;
}

export function BuilderLifecycle({ meta, disabled, onChange }: Props) {
  const currentIdx = stageIndex(meta.workspaceStage);

  return (
    <section id="proto-builder-lifecycle" className="proto-builder-panel">
      <header className="proto-builder-panel__head">
        <h2>Innovation lifecycle</h2>
        <p>Track position across the MAYLET X LAB innovation operating system.</p>
      </header>

      <div className="proto-innovation-pipeline" role="list">
        {INNOVATION_PIPELINE.map((stage, idx) => {
          const done = idx < currentIdx;
          const active = stage.id === meta.workspaceStage || (stage.id === 'prototype' && meta.workspaceStage === 'prototype');
          const isClickable = stage.id !== 'idea' && stage.id !== 'research';
          return (
            <button
              key={stage.id}
              type="button"
              role="listitem"
              disabled={disabled || !isClickable}
              className={`proto-innovation-pipeline__step${done ? ' proto-innovation-pipeline__step--done' : ''}${active ? ' proto-innovation-pipeline__step--active' : ''}`}
              onClick={() => {
                if (isClickable && stage.id !== 'idea' && stage.id !== 'research') {
                  onChange({ workspaceStage: stage.id as PrototypeWorkspaceStage });
                }
              }}
            >
              <span className="proto-innovation-pipeline__num">{done ? '✓' : idx + 1}</span>
              <span>{stage.label}</span>
            </button>
          );
        })}
      </div>

      <p className="proto-muted">
        Current stage: <strong>{INNOVATION_PIPELINE[currentIdx]?.label ?? meta.workspaceStage}</strong>
      </p>
    </section>
  );
}
