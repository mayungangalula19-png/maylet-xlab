import { Link } from 'react-router-dom';
import type { CommandCenterMetrics } from '../../../lib/supabase/commandCenter.queries';

interface Props {
  metrics: CommandCenterMetrics;
  totalProjects: number;
}

const KPI_CONFIG: {
  key: keyof CommandCenterMetrics | 'total';
  label: string;
  color: string;
  route: string;
  getValue: (m: CommandCenterMetrics, total: number) => number;
}[] = [
  { key: 'total', label: 'Total Projects', color: '#7c5fe6', route: '/projects', getValue: (_, t) => t },
  { key: 'activeResearch', label: 'Active Research', color: '#2fd4ff', route: '/documents', getValue: (m) => m.activeResearch },
  { key: 'runningExperiments', label: 'Running Experiments', color: '#f6c90e', route: '/experiments', getValue: (m) => m.runningExperiments },
  { key: 'validatedInnovations', label: 'Validated Innovations', color: '#48bb78', route: '/projects', getValue: (m) => m.validatedInnovations },
  { key: 'fundingOpportunities', label: 'Funding Opportunities', color: '#f093fb', route: '/funding', getValue: (m) => m.fundingOpportunities },
  { key: 'teamMembers', label: 'Team Members', color: '#4facfe', route: '/teams', getValue: (m) => m.teamMembers },
  { key: 'documentsUploaded', label: 'Documents Uploaded', color: '#ecc30b', route: '/documents', getValue: (m) => m.documentsUploaded },
];

export function CommandCenterKPIs({ metrics, totalProjects }: Props) {
  return (
    <div className="icc-kpi-grid">
      {KPI_CONFIG.map((kpi) => (
        <Link key={kpi.label} to={kpi.route} className="icc-glass icc-kpi icc-clickable">
          <div className="icc-kpi-value" style={{ color: kpi.color }}>
            {kpi.getValue(metrics, totalProjects)}
          </div>
          <div className="icc-kpi-label">{kpi.label}</div>
          <div className="icc-kpi-accent" style={{ background: kpi.color }} />
        </Link>
      ))}
    </div>
  );
}
