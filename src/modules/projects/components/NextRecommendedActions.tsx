import { Link } from 'react-router-dom';
import type { RecommendedAction } from '../../../lib/innovation/recommendations';

interface Props {
  actions: RecommendedAction[];
}

export function NextRecommendedActions({ actions }: Props) {
  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Next Recommended Actions</h3>
        <Link to="/ai-assistant" className="icc-widget-link">Ask MAYA</Link>
      </div>
      <div className="icc-actions-grid">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={action.route}
            className={`icc-action-card icc-clickable icc-action-card--${action.priority}`}
            title={action.description}
          >
            <strong>{action.label}</strong>
            <span>{action.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
