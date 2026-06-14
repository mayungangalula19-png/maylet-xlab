import { Link } from 'react-router-dom';
import type { ExperimentSummary } from '../../../lib/innovation/dashboardAnalytics';

interface Props {
  summary: ExperimentSummary;
}

export function ExperimentCenter({ summary }: Props) {
  return (
    <div className="icc-glass icc-widget icc-experiment-center">
      <div className="icc-widget-header">
        <h3>Experiment Center</h3>
        <Link to="/experiments" className="icc-widget-link">View All</Link>
      </div>

      <div className="icc-experiment-stats">
        <Link to="/experiments" className="icc-experiment-stat icc-clickable">
          <strong>{summary.running}</strong>
          <span>Running</span>
        </Link>
        <Link to="/experiments" className="icc-experiment-stat icc-clickable">
          <strong>{summary.completed}</strong>
          <span>Completed</span>
        </Link>
        <div className="icc-experiment-stat">
          <strong>{summary.successRate}%</strong>
          <span>Success Rate</span>
        </div>
        <div className="icc-experiment-stat">
          <strong>{summary.validationResults}</strong>
          <span>Validations</span>
        </div>
      </div>

      <h4 className="icc-widget-subtitle">Experiment Categories</h4>
      <div className="icc-experiment-categories">
        {summary.categories.map((cat) => (
          <Link
            key={cat.key}
            to={`/experiments?category=${cat.key}`}
            className="icc-experiment-cat icc-clickable"
          >
            <span>{cat.name}</span>
            <strong>{cat.count}</strong>
          </Link>
        ))}
      </div>

      <Link to="/experiments/create" className="icc-widget-cta">
        + Create Experiment
      </Link>
    </div>
  );
}
