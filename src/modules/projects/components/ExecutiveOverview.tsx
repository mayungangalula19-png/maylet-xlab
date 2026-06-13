import { Link } from 'react-router-dom';
import type { ExecutiveSummary } from '../../../lib/innovation/recommendations';

interface Props {
  summary: ExecutiveSummary;
}

export function ExecutiveOverview({ summary }: Props) {
  const items = [
    { label: 'Total Innovation Assets', value: summary.totalInnovationAssets, route: '/projects', color: '#7c5fe6' },
    { label: 'Active Projects', value: summary.activeProjects, route: '/projects', color: '#2fd4ff' },
    { label: 'Research Progress', value: `${summary.researchProgress}%`, route: '/documents', color: '#667eea' },
    { label: 'Funding Opportunities', value: summary.fundingOpportunityCount, route: '/funding', color: '#f093fb' },
    { label: 'Ecosystem Health', value: `${summary.ecosystemHealthScore}%`, route: '/analytics', color: '#48bb78' },
  ];

  return (
    <div className="icc-glass icc-executive">
      <div className="icc-widget-header">
        <h3>Executive Summary</h3>
        <span className="icc-executive-meta">
          {summary.projectCount} projects · {summary.documentCount} documents · {summary.vaultCount} vault assets
        </span>
      </div>
      <div className="icc-executive-grid">
        {items.map((item) => (
          <Link key={item.label} to={item.route} className="icc-executive-item icc-clickable">
            <strong style={{ color: item.color }}>{item.value}</strong>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
