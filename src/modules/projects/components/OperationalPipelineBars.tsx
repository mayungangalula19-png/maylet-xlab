import type { InnovationStage } from '../../../lib/innovation/lifecycle';
import { STAGE_DISPLAY_LABELS } from '../../../lib/innovation/recommendations';
import { formatCount } from '../../../lib/innovation/dashboardData';

interface Props {
  stageCounts: Record<InnovationStage, number>;
  onStageClick?: (stage: InnovationStage) => void;
}

export function OperationalPipelineBars({ stageCounts, onStageClick }: Props) {
  const max = Math.max(1, ...Object.values(stageCounts));

  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Stages</h3>
      </div>
      <div className="icc-analytics-bars">
        {(Object.keys(stageCounts) as InnovationStage[]).map((stage) => (
          <button
            key={stage}
            type="button"
            className="icc-bar-row icc-clickable"
            onClick={() => onStageClick?.(stage)}
          >
            <span className="icc-bar-label">{STAGE_DISPLAY_LABELS[stage]}</span>
            <div className="icc-bar-track">
              <div
                className="icc-bar-fill"
                style={{ width: `${(stageCounts[stage] / max) * 100}%` }}
              />
            </div>
            <span className="icc-bar-value">{stageCounts[stage] > 0 ? stageCounts[stage] : formatCount(0)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
