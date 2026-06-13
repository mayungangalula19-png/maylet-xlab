import { Link } from 'react-router-dom';
import type { ProjectPriority } from '../../../lib/innovation/recommendations';

interface Props {
  highPriority: ProjectPriority[];
  atRisk: ProjectPriority[];
  readyForFunding: ProjectPriority[];
  readyForValidation?: ProjectPriority[];
  readyForCommercialization?: ProjectPriority[];
}

function PriorityList({
  title,
  items,
  emptyText,
  color,
}: {
  title: string;
  items: ProjectPriority[];
  emptyText: string;
  color: string;
}) {
  return (
    <div className="icc-priority-col">
      <h4 style={{ color, margin: '0 0 0.5rem', fontSize: '0.72rem' }}>{title}</h4>
      {items.length === 0 ? (
        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{emptyText}</p>
      ) : (
        items.map((p) => (
          <Link key={p.id} to={p.route} className="icc-priority-item icc-clickable">
            <span>{p.name}</span>
            <span className="icc-priority-score">{p.score}%</span>
          </Link>
        ))
      )}
    </div>
  );
}

export function DashboardPrioritiesPanel({
  highPriority,
  atRisk,
  readyForFunding,
  readyForValidation = [],
}: Props) {
  return (
    <div className="icc-glass icc-widget icc-priorities">
      <div className="icc-widget-header">
        <h3>Dashboard Priorities</h3>
        <Link to="/projects" className="icc-widget-link">Portfolio</Link>
      </div>
      <div className="icc-priorities-grid">
        <PriorityList title="High Priority Projects" items={highPriority} emptyText="All projects on track" color="#f6c90e" />
        <PriorityList title="Projects At Risk" items={atRisk} emptyText="No risk flags detected" color="#fc8181" />
        <PriorityList title="Ready For Funding" items={readyForFunding} emptyText="Build validation to unlock funding" color="#48bb78" />
        <PriorityList title="Ready For Validation" items={readyForValidation} emptyText="Complete experiments first" color="#9b7ff0" />
      </div>
    </div>
  );
}
