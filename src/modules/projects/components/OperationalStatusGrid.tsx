import { Link } from 'react-router-dom';
import { EMPTY, formatCount } from '../../../lib/innovation/dashboardData';
import type { RealDashboardSnapshot } from '../../../lib/supabase/commandCenter.queries';

interface Props {
  snapshot: RealDashboardSnapshot;
}

export function OperationalStatusGrid({ snapshot }: Props) {
  const cells = [
    { label: 'Projects', value: formatCount(snapshot.projectCount), route: '/projects', color: '#7c5fe6' },
    {
      label: 'Documents',
      value: formatCount(snapshot.research.totalDocuments),
      route: '/research',
      color: '#2fd4ff',
    },
    {
      label: 'Experiments',
      value: formatCount(snapshot.experiments.total),
      route: '/experiments',
      color: '#f6c90e',
    },
    {
      label: 'Active',
      value: snapshot.experiments.running > 0 ? String(snapshot.experiments.running) : EMPTY.NO_DATA,
      route: '/experiments',
      color: '#ecc30b',
    },
    {
      label: 'Pitches',
      value: formatCount(snapshot.funding.totalPitches),
      route: '/funding',
      color: '#f093fb',
    },
    {
      label: 'Team',
      value: formatCount(snapshot.team.memberCount),
      route: '/teams',
      color: '#4facfe',
    },
    {
      label: 'Entries',
      value: formatCount(snapshot.vault.vaultEntries),
      route: '/vault',
      color: '#9b7ff0',
    },
    {
      label: 'Items',
      value: formatCount(snapshot.vault.vaultItems),
      route: '/vault',
      color: '#667eea',
    },
  ];

  return (
    <div className="icc-kpi-grid">
      {cells.map((cell) => (
        <Link key={cell.label} to={cell.route} className="icc-glass icc-kpi icc-clickable">
          <div className="icc-kpi-value" style={{ color: cell.color, fontSize: cell.value.length > 8 ? '0.75rem' : undefined }}>
            {cell.value}
          </div>
          <div className="icc-kpi-label">{cell.label}</div>
          <div className="icc-kpi-accent" style={{ background: cell.color }} />
        </Link>
      ))}
    </div>
  );
}
