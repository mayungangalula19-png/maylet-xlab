import {
  INNOVATION_STAGES,
  type InnovationStage,
} from '../../../lib/innovation/lifecycle';

interface Props {
  currentStage: InnovationStage;
  compact?: boolean;
}

export function InnovationLifecycleBar({ currentStage, compact = false }: Props) {
  const idx = INNOVATION_STAGES.indexOf(currentStage);

  return (
    <div className="icc-lifecycle-bar">
      <div className="icc-lifecycle-track">
        {INNOVATION_STAGES.map((stage, i) => {
          let cls = 'icc-lifecycle-seg';
          if (i < idx) cls += ' icc-lifecycle-seg--done';
          else if (i === idx) cls += ' icc-lifecycle-seg--active';
          return <div key={stage} className={cls} title={stage} />;
        })}
      </div>
      {!compact && (
        <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
          {INNOVATION_STAGES.map((stage, i) => (
            <span
              key={stage}
              style={{
                flex: 1,
                fontSize: '0.5rem',
                textAlign: 'center',
                color: i <= idx ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
              }}
            >
              {stage}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
