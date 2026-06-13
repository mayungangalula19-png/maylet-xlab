import type { PrototypeDashboardStats } from '../types/prototype.types';

const ITEMS: { key: keyof PrototypeDashboardStats; label: string }[] = [
  { key: 'total', label: 'Total prototypes' },
  { key: 'activeBuilds', label: 'Active builds' },
  { key: 'inTesting', label: 'In testing' },
  { key: 'successful', label: 'Successful' },
  { key: 'failed', label: 'Failed' },
  { key: 'linkedToResearch', label: 'Research-linked' },
];

interface Props {
  stats: PrototypeDashboardStats;
}

export function PrototypeStats({ stats }: Props) {
  return (
    <div className="proto-stats">
      {ITEMS.map(({ key, label }) => (
        <div key={key} className="proto-stat">
          <strong>{stats[key]}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
