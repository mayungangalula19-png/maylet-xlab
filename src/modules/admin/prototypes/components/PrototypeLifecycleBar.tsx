import { memo } from 'react';
import {
  EXECUTIVE_PROTOTYPE_STAGES,
  type AdminPrototypeOpsStats,
  type ExecutivePrototypeStage,
  type PrototypeLifecycleInsight,
} from '../types/prototypeOpsAdmin.types';

interface PrototypeLifecycleBarProps {
  stats: AdminPrototypeOpsStats;
  stageCounts: Record<ExecutivePrototypeStage, number>;
  lifecycleInsights: PrototypeLifecycleInsight[];
  activeStage?: ExecutivePrototypeStage | 'all';
  onStageClick?: (stage: ExecutivePrototypeStage | 'all') => void;
}

export const PrototypeLifecycleBar = memo(function PrototypeLifecycleBar({
  stats,
  stageCounts,
  lifecycleInsights,
  activeStage = 'all',
  onStageClick,
}: PrototypeLifecycleBarProps) {
  const conversion =
    stats.total > 0 ? Math.round((stats.commercializationReady / stats.total) * 100) : 0;
  const bottleneck = lifecycleInsights.find((i) => i.bottleneck);

  return (
    <div className="admin-prototype-pipeline admin-prototype-glass">
      <div className="admin-prototype-pipeline-head">
        <div>
          <h3>Prototype Lifecycle Engine</h3>
          <p className="admin-muted">
            Idea → Research → Design → Development → Testing → Experiment → Validation → Funding →
            Commercialization
          </p>
        </div>
        <div className="admin-prototype-pipeline-summary">
          <span>Commercialization conversion</span>
          <strong>{conversion}%</strong>
          <span className="admin-muted">of {stats.total} prototypes</span>
        </div>
      </div>

      <div className="admin-prototype-pipeline-track admin-prototype-pipeline-track--scroll">
        {EXECUTIVE_PROTOTYPE_STAGES.map((stage, index) => {
          const insight = lifecycleInsights.find((i) => i.stage === stage.id);
          const isBottleneck = insight?.bottleneck ?? false;
          return (
            <div key={stage.id} className="admin-prototype-pipeline-node-wrap">
              {index > 0 ? (
                <div
                  className="admin-prototype-pipeline-connector"
                  style={{
                    background: `linear-gradient(90deg, ${EXECUTIVE_PROTOTYPE_STAGES[index - 1].color}, ${stage.color})`,
                  }}
                />
              ) : null}
              <button
                type="button"
                className={`admin-prototype-pipeline-node ${activeStage === stage.id ? 'admin-prototype-pipeline-node--active' : ''} ${isBottleneck ? 'admin-prototype-pipeline-node--bottleneck' : ''}`}
                style={{ '--stage-color': stage.color } as React.CSSProperties}
                onClick={() => onStageClick?.(stage.id)}
                title={insight?.recommendation}
              >
                <span className="admin-prototype-pipeline-node-dot" />
                <span className="admin-prototype-pipeline-node-label">{stage.label}</span>
                <strong>{stageCounts[stage.id] ?? 0}</strong>
                {isBottleneck ? (
                  <span className="admin-prototype-pipeline-bottleneck">⚠</span>
                ) : null}
              </button>
            </div>
          );
        })}
      </div>

      {bottleneck ? (
        <div className="admin-prototype-pipeline-ai-rec">
          <span>✨ Maya AI</span>
          <p>{bottleneck.recommendation}</p>
        </div>
      ) : null}
    </div>
  );
});
