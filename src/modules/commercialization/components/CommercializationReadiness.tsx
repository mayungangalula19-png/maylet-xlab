import { Link } from 'react-router-dom';
import type { CommercializationBreakdown } from '../../../lib/innovation/recommendations';

interface Props {
  breakdown: CommercializationBreakdown;
}

export function CommercializationReadiness({ breakdown }: Props) {
  const metrics = [
    { label: 'Market Validation', value: breakdown.marketValidation, route: breakdown.projectId ? `/projects/${breakdown.projectId}` : '/projects' },
    { label: 'Prototype Status', value: breakdown.prototypeStatus, route: '/prototypes' },
    { label: 'Business Model', value: breakdown.businessModelReadiness, route: '/funding/create' },
    { label: 'Go-To-Market', value: breakdown.goToMarketReadiness, route: breakdown.projectId ? `/projects/${breakdown.projectId}` : '/enterprise' },
  ];

  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Commercialization Readiness</h3>
        {breakdown.projectName ? (
          <Link to={`/projects/${breakdown.projectId}`} className="icc-widget-link">
            {breakdown.projectName}
          </Link>
        ) : (
          <Link to="/projects" className="icc-widget-link">Portfolio</Link>
        )}
      </div>
      <div className="icc-comm-score">
        <span>Commercialization Score</span>
        <strong>{breakdown.commercializationScore}%</strong>
      </div>
      <div className="icc-comm-grid">
        {metrics.map((m) => (
          <Link key={m.label} to={m.route} className="icc-comm-item icc-clickable">
            <div className="icc-comm-bar-track">
              <div className="icc-comm-bar-fill" style={{ width: `${m.value}%` }} />
            </div>
            <div className="icc-comm-label">
              <span>{m.label}</span>
              <strong>{m.value}%</strong>
            </div>
          </Link>
        ))}
        <Link to={breakdown.projectId ? `/projects/${breakdown.projectId}` : '/projects'} className="icc-comm-item icc-clickable">
          <div className="icc-comm-bar-track">
            <div className="icc-comm-bar-fill" style={{ width: `${breakdown.customerValidation}%`, background: '#2fd4ff' }} />
          </div>
          <div className="icc-comm-label">
            <span>Customer Validation</span>
            <strong>{breakdown.customerValidation}%</strong>
          </div>
        </Link>
        <Link to="/funding" className="icc-comm-item icc-clickable">
          <div className="icc-comm-bar-track">
            <div className="icc-comm-bar-fill" style={{ width: `${breakdown.revenuePotential}%`, background: '#f093fb' }} />
          </div>
          <div className="icc-comm-label">
            <span>Revenue Potential</span>
            <strong>{breakdown.revenuePotential}%</strong>
          </div>
        </Link>
      </div>
    </div>
  );
}
