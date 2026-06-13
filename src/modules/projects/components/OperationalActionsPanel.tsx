import { Link } from 'react-router-dom';
import type { OperationalAction } from '../../../lib/innovation/operational';

interface Props {
  actions: OperationalAction[];
}

export function OperationalActionsPanel({ actions }: Props) {
  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Actions</h3>
        <Link to="/projects" className="icc-widget-link">Portfolio</Link>
      </div>
      {actions.length === 0 ? (
        <p className="icc-widget-empty-text">No Data Yet</p>
      ) : (
        <div className="icc-actions-grid">
          {actions.map((action) => (
            <Link
              key={action.id}
              to={action.route}
              className={`icc-action-card icc-clickable icc-action-card--${action.status}`}
            >
              <strong>{action.title}</strong>
              <span>{action.detail}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
