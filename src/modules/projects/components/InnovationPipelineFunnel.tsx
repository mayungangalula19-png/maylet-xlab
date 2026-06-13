import {
  INNOVATION_STAGES,
  type InnovationStage,
} from '../../../lib/innovation/lifecycle';
import { STAGE_DISPLAY_LABELS } from '../../../lib/innovation/recommendations';
import type { PipelineAnalyticsDetail } from '../../../lib/innovation/dashboardAnalytics';

interface Props {
  stageCounts: Record<InnovationStage, number>;
  analytics: PipelineAnalyticsDetail;
  onStageClick?: (stage: InnovationStage) => void;
}

const STAGE_COLORS: Record<InnovationStage, string> = {
  Idea: '#f6c90e',
  Research: '#667eea',
  Prototype: '#7c5fe6',
  Experiment: '#2fd4ff',
  Validation: '#48bb78',
  Funding: '#f093fb',
  Commercialization: '#38a169',
};

export function InnovationPipelineFunnel({ stageCounts, analytics, onStageClick }: Props) {
  const max = Math.max(1, ...INNOVATION_STAGES.map((s) => stageCounts[s]));

  return (
    <div className="icc-glass icc-pipeline-funnel">
      <div className="icc-funnel-layout">
        <div className="icc-funnel-visual">
          {INNOVATION_STAGES.map((stage, i) => {
            const width = 100 - i * 8;
            const isBottleneck = analytics.bottlenecks.includes(stage);
            return (
              <button
                key={stage}
                type="button"
                className={`icc-funnel-stage icc-clickable${isBottleneck ? ' icc-funnel-bottleneck' : ''}`}
                style={{ width: `${width}%`, background: `${STAGE_COLORS[stage]}22`, borderColor: STAGE_COLORS[stage] }}
                onClick={() => onStageClick?.(stage)}
                title={`Filter by ${stage}`}
              >
                <span className="icc-funnel-stage-name">{stage}</span>
                <span className="icc-funnel-stage-count">{stageCounts[stage]}</span>
                {i < INNOVATION_STAGES.length - 1 && <span className="icc-funnel-arrow">↓</span>}
              </button>
            );
          })}
        </div>
        <div className="icc-funnel-stats">
          <h4>Pipeline Intelligence</h4>
          {INNOVATION_STAGES.map((stage) => (
            <div key={stage} className="icc-funnel-stat-row">
              <button
                type="button"
                className="icc-funnel-stat-label icc-clickable"
                onClick={() => onStageClick?.(stage)}
              >
                {STAGE_DISPLAY_LABELS[stage]}
              </button>
              <div className="icc-funnel-stat-bars">
                <div className="icc-funnel-mini-bar">
                  <span>Completion</span>
                  <div className="icc-bar-track">
                    <div
                      className="icc-bar-fill"
                      style={{
                        width: `${analytics.stageCompletionRates[stage]}%`,
                        background: STAGE_COLORS[stage],
                      }}
                    />
                  </div>
                  <span>{analytics.stageCompletionRates[stage]}%</span>
                </div>
                <div className="icc-funnel-mini-bar">
                  <span>Success</span>
                  <div className="icc-bar-track">
                    <div
                      className="icc-bar-fill"
                      style={{
                        width: `${analytics.successRates[stage]}%`,
                        background: STAGE_COLORS[stage],
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <span>{analytics.successRates[stage]}%</span>
                </div>
              </div>
              <span className="icc-funnel-count">{stageCounts[stage]}</span>
            </div>
          ))}
          {analytics.bottlenecks.length > 0 && (
            <div className="icc-bottleneck-alert">
              <strong>Bottleneck:</strong> {analytics.bottlenecks.join(', ')} stage
              {analytics.bottlenecks.length > 1 ? 's' : ''} — {stageCounts[analytics.bottlenecks[0]]} of{' '}
              {analytics.totalProjects} projects
            </div>
          )}
        </div>
      </div>
      <div className="icc-pipeline-stages icc-pipeline-stages--compact">
        {INNOVATION_STAGES.map((stage) => (
          <button
            key={`bar-${stage}`}
            type="button"
            className="icc-pipeline-stage icc-clickable"
            onClick={() => onStageClick?.(stage)}
          >
            <div className="icc-pipeline-count">{stageCounts[stage]}</div>
            <div className="icc-pipeline-name">{STAGE_DISPLAY_LABELS[stage]}</div>
            <div className="icc-bar-track" style={{ marginTop: '0.4rem' }}>
              <div
                className="icc-bar-fill"
                style={{
                  width: `${(stageCounts[stage] / max) * 100}%`,
                  background: STAGE_COLORS[stage],
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
