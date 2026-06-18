import { memo } from 'react';
import { AdminStatCard } from '../../components/dashboard/AdminStatCard';
import type { AdminPrototypeOpsStats } from '../types/prototypeOpsAdmin.types';

interface PrototypeOpsKpisProps {
  stats: AdminPrototypeOpsStats;
  department?: string;
}

function trendHint(pct: number): string {
  if (pct > 0) return `↑ ${pct}% vs prior period`;
  if (pct < 0) return `↓ ${Math.abs(pct)}% vs prior period`;
  return 'Stable vs prior period';
}

export const PrototypeOpsKpis = memo(function PrototypeOpsKpis({
  stats,
  department,
}: PrototypeOpsKpisProps) {
  const deptHint = department && department !== 'all' ? department : 'Platform-wide';

  return (
    <div className="admin-stats-grid admin-prototype-ops-kpis">
      <AdminStatCard
        icon="🔬"
        label="Total Prototypes"
        value={stats.total}
        hint={`${trendHint(stats.trendTotalPct)} · ${deptHint}`}
        color="#2fd4ff"
        link="/admin/prototypes"
      />
      <AdminStatCard
        icon="⚡"
        label="Active Prototypes"
        value={stats.active}
        hint={trendHint(stats.trendActivePct)}
        color="#48bb78"
        link="/admin/prototypes"
      />
      <AdminStatCard
        icon="📊"
        label="Success Rate"
        value={stats.successRate}
        suffix="%"
        hint={trendHint(stats.trendSuccessPct)}
        color="#f6c90e"
        link="/admin/prototypes"
      />
      <AdminStatCard
        icon="🧪"
        label="Experiment Ready"
        value={stats.experimentReady}
        color="#7c5fe6"
        link="/admin/prototypes"
      />
      <AdminStatCard
        icon="✅"
        label="Validation Ready"
        value={stats.validationReady}
        color="#9f7aea"
        link="/admin/prototypes"
      />
      <AdminStatCard
        icon="🚀"
        label="Commercialization Ready"
        value={stats.commercializationReady}
        color="#38b2ac"
        link="/admin/prototypes"
      />
      <AdminStatCard
        icon="⚠"
        label="High Risk"
        value={stats.highRisk}
        color="#fc8181"
        link="/admin/prototypes"
      />
      <AdminStatCard
        icon="💰"
        label="Funding Eligible"
        value={stats.fundingEligible}
        color="#4299e1"
        link="/admin/prototypes"
      />
      <AdminStatCard
        icon="⏱"
        label="Avg Dev Time"
        value={stats.avgDevelopmentDays}
        suffix="d"
        color="#718096"
        link="/admin/prototypes"
      />
      <AdminStatCard
        icon="💎"
        label="Portfolio Health"
        value={stats.portfolioHealthScore}
        suffix="/10"
        color="#2fd4ff"
        link="/admin/prototypes"
      />
    </div>
  );
});
