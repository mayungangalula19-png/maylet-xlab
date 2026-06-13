import {
  INNOVATION_STAGES,
  type InnovationStage,
} from '../../../lib/innovation/lifecycle';
import { STAGE_DISPLAY_LABELS } from '../../../lib/innovation/recommendations';

interface Props {
  stageCounts: Record<InnovationStage, number>;
  onStageClick?: (stage: InnovationStage) => void;
}

export function InnovationPipelineOverview({ stageCounts, onStageClick }: Props) {
  const max = Math.max(1, ...INNOVATION_STAGES.map((s) => stageCounts[s]));

  return (
    <div className="icc-glass icc-pipeline-overview">
      <h3>Pipeline</h3>
      <div className="icc-pipeline-stages">
        {INNOVATION_STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            className="icc-pipeline-stage icc-clickable"
            onClick={() => onStageClick?.(stage)}
            title={`Filter by ${stage}`}
          >
            <div className="icc-pipeline-count">{stageCounts[stage]}</div>
            <div className="icc-pipeline-name">{STAGE_DISPLAY_LABELS[stage]}</div>
            <div className="icc-bar-track" style={{ marginTop: '0.4rem' }}>
              <div
                className="icc-bar-fill"
                style={{ width: `${(stageCounts[stage] / max) * 100}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
