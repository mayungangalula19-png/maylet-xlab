import { memo } from 'react';
import { INNOVATOR_STAGES, type InnovatorOpsStats } from '../types/innovatorOps.types';

interface InnovatorPipelineBarProps {
  stats: InnovatorOpsStats;
  stageCounts: Record<string, number>;
  onStageClick?: (stage: string) => void;
  activeStage?: string;
}

export const InnovatorPipelineBar = memo(function InnovatorPipelineBar({
  stats,
  stageCounts,
  onStageClick,
  activeStage,
}: InnovatorPipelineBarProps) {
  const conversion =
    stats.total > 0 ? Math.round((stats.approvedFundable / stats.total) * 100) : 0;

  return (
    <div className="admin-innovator-pipeline-bar">
      <div className="admin-innovator-pipeline-summary">
        <span>Pipeline conversion</span>
        <strong>{conversion}%</strong>
        <span className="admin-muted">approved of {stats.total}</span>
      </div>
      <div className="admin-innovator-pipeline-stages">
        {INNOVATOR_STAGES.map((stage) => (
          <button
            key={stage.id}
            type="button"
            className={`admin-innovator-pipeline-chip ${activeStage === stage.id ? 'admin-innovator-pipeline-chip--active' : ''}`}
            style={{ '--stage-color': stage.color } as React.CSSProperties}
            onClick={() => onStageClick?.(stage.id)}
          >
            <span>{stage.label}</span>
            <strong>{stageCounts[stage.id] ?? 0}</strong>
          </button>
        ))}
      </div>
    </div>
  );
});
