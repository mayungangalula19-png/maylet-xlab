import { Link } from 'react-router-dom';
import {
  INNOVATION_STAGES,
  type InnovationStage,
} from '../../../lib/innovation/lifecycle';

interface Props {
  stageCounts: Record<InnovationStage, number>;
  successRate: number;
  experimentRate: number;
  teamMemberCount: number;
  onStageClick?: (stage: InnovationStage) => void;
}

export function PipelineAnalytics({
  stageCounts,
  successRate,
  experimentRate,
  teamMemberCount,
  onStageClick,
}: Props) {
  const max = Math.max(1, ...INNOVATION_STAGES.map((s) => stageCounts[s]));

  return (
    <>
      <div className="icc-analytics-row">
        <Link to="/analytics" className="icc-glass icc-analytics-card icc-clickable" title="Portfolio success rate">
          <strong>{successRate}%</strong>
          <span>Innovation Success Rate</span>
        </Link>
        <Link to="/experiments" className="icc-glass icc-analytics-card icc-clickable" title="Experiment task completion">
          <strong>{experimentRate}%</strong>
          <span>Experiment Progress</span>
        </Link>
        {teamMemberCount > 0 && (
          <Link to="/teams" className="icc-glass icc-analytics-card icc-clickable" title="Active team members">
            <strong>{teamMemberCount}</strong>
            <span>Team Members</span>
          </Link>
        )}
      </div>

      <div className="icc-glass icc-widget">
        <div className="icc-widget-header">
          <h3>Pipeline Distribution</h3>
          <Link to="/analytics" className="icc-widget-link">Analytics</Link>
        </div>
        <div className="icc-analytics-bars">
          {INNOVATION_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              className="icc-bar-row icc-clickable"
              onClick={() => onStageClick?.(stage)}
              title={`Filter by ${stage}`}
            >
              <span className="icc-bar-label">{stage}</span>
              <div className="icc-bar-track">
                <div
                  className="icc-bar-fill"
                  style={{ width: `${(stageCounts[stage] / max) * 100}%` }}
                />
              </div>
              <span className="icc-bar-value">{stageCounts[stage]}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
