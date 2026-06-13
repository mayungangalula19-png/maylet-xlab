import {
  getPrototypePipelineStage,
  PROTOTYPE_PIPELINE_STAGES,
  type PrototypeRecord,
} from '../types/prototype.types';

interface Props {
  prototype?: PrototypeRecord | null;
  /** Dashboard mode — highlight aggregate stage from list */
  highlightStage?: ReturnType<typeof getPrototypePipelineStage>;
}

export function PrototypeLifecycle({ prototype, highlightStage }: Props) {
  const current = highlightStage ?? (prototype ? getPrototypePipelineStage(prototype) : 'draft');
  const currentIdx = PROTOTYPE_PIPELINE_STAGES.findIndex((s) => s.id === current);

  return (
    <section className="proto-lifecycle-track">
      <h3>Prototype lifecycle</h3>
      <div className="proto-lifecycle-steps">
        {PROTOTYPE_PIPELINE_STAGES.map((stage, idx) => {
          const active = idx === currentIdx;
          const done = idx < currentIdx;
          return (
            <div
              key={stage.id}
              className={`proto-lifecycle-step ${active ? 'proto-lifecycle-step--active' : ''} ${done ? 'proto-lifecycle-step--done' : ''}`}
            >
              <div className="proto-lifecycle-dot">{done ? '✓' : idx + 1}</div>
              <span>{stage.label}</span>
              {idx < PROTOTYPE_PIPELINE_STAGES.length - 1 && (
                <div className={`proto-lifecycle-connector ${done ? 'proto-lifecycle-connector--done' : ''}`} />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
