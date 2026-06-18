import { memo } from 'react';
import {
  EXECUTIVE_PIPELINE_STAGES,
  type AdminExperimentOpsStats,
  type ExecutivePipelineStage,
} from '../types/experimentOpsAdmin.types';

interface ExperimentPipelineBarProps {
  stats: AdminExperimentOpsStats;
  stageCounts: Record<ExecutivePipelineStage, number>;
  activeStage?: ExecutivePipelineStage | 'all';
  onStageClick?: (stage: ExecutivePipelineStage | 'all') => void;
}

export const ExperimentPipelineBar = memo(function ExperimentPipelineBar({
  stats,
  stageCounts,
  activeStage = 'all',
  onStageClick,
}: ExperimentPipelineBarProps) {
  const conversion =
    stats.total > 0 ? Math.round((stats.validationReady / stats.total) * 100) : 0;

  return (
    <div className="admin-experiment-pipeline admin-experiment-glass">
      <div className="admin-experiment-pipeline-head">
        <div>
          <h3>Experiment Pipeline</h3>
          <p className="admin-muted">Innovation lifecycle from draft to funding readiness</p>
        </div>
        <div className="admin-experiment-pipeline-summary">
          <span>Validation conversion</span>
          <strong>{conversion}%</strong>
          <span className="admin-muted">of {stats.total} experiments</span>
        </div>
      </div>
      <div className="admin-experiment-pipeline-track">
        {EXECUTIVE_PIPELINE_STAGES.map((stage, index) => (
          <div key={stage.id} className="admin-experiment-pipeline-node-wrap">
            {index > 0 ? (
              <div
                className="admin-experiment-pipeline-connector"
                style={{ background: `linear-gradient(90deg, ${EXECUTIVE_PIPELINE_STAGES[index - 1].color}, ${stage.color})` }}
              />
            ) : null}
            <button
              type="button"
              className={`admin-experiment-pipeline-node ${activeStage === stage.id ? 'admin-experiment-pipeline-node--active' : ''}`}
              style={{ '--stage-color': stage.color } as React.CSSProperties}
              onClick={() => onStageClick?.(stage.id)}
            >
              <span className="admin-experiment-pipeline-node-dot" />
              <span className="admin-experiment-pipeline-node-label">{stage.label}</span>
              <strong>{stageCounts[stage.id] ?? 0}</strong>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});
