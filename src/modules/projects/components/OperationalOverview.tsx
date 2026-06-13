import { Link } from 'react-router-dom';
import { formatCount } from '../../../lib/innovation/dashboardData';
import type { RealDashboardSnapshot } from '../../../lib/supabase/commandCenter.queries';

interface Props {
  snapshot: RealDashboardSnapshot;
}

export function OperationalOverview({ snapshot }: Props) {
  const items = [
    { label: 'Projects', value: formatCount(snapshot.projectCount), route: '/projects' },
    { label: 'Documents', value: formatCount(snapshot.research.totalDocuments), route: '/research' },
    { label: 'Experiments', value: formatCount(snapshot.experiments.total), route: '/experiments' },
    { label: 'Pitches', value: formatCount(snapshot.funding.totalPitches), route: '/funding' },
    { label: 'Vault', value: formatCount(snapshot.vault.vaultEntries), route: '/vault' },
  ];

  return (
    <div className="icc-glass icc-executive">
      <div className="icc-widget-header">
        <h3>Overview</h3>
      </div>
      <div className="icc-executive-grid">
        {items.map((item) => (
          <Link key={item.label} to={item.route} className="icc-executive-item icc-clickable">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
