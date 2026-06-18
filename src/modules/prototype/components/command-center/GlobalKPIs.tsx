import type { CommandCenterKPIs } from '../../types/commandCenter.types';

const KPI_CONFIG: {
  key: keyof CommandCenterKPIs;
  label: string;
  trend?: boolean;
}[] = [
  { key: 'total', label: 'Total prototypes' },
  { key: 'active', label: 'Active' },
  { key: 'inValidation', label: 'In validation' },
  { key: 'fundingReady', label: 'Funding ready' },
  { key: 'commercialized', label: 'Commercialized' },
  { key: 'revenueGenerating', label: 'Revenue generating' },
  { key: 'highRisk', label: 'High risk' },
  { key: 'archived', label: 'Archived' },
];

interface Props {
  kpis: CommandCenterKPIs;
}

export function GlobalKPIs({ kpis }: Props) {
  return (
    <section className="proto-cc-kpis" aria-label="Global KPIs">
      {KPI_CONFIG.map(({ key, label }) => {
        const value = kpis[key];
        const isHealth = key === 'innovationHealth';
        if (isHealth) return null;
        const warn = key === 'highRisk' && typeof value === 'number' && value > 0;
        const up = key === 'total' && kpis.growthPct > 0;
        return (
          <article key={key} className={`proto-cc-kpi${warn ? ' proto-cc-kpi--warn' : ''}`}>
            <strong>{value}</strong>
            <span>{label}</span>
            {up && key === 'total' ? (
              <em className="proto-cc-kpi__trend proto-cc-kpi__trend--up">+{kpis.growthPct}% 30d</em>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
