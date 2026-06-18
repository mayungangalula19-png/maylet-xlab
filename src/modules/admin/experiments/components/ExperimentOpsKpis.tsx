import { memo } from 'react';
import { AdminStatCard } from '../../components/dashboard/AdminStatCard';
import type { AdminExperimentOpsStats } from '../types/experimentOpsAdmin.types';

interface ExperimentOpsKpisProps {
  stats: AdminExperimentOpsStats;
}

export const ExperimentOpsKpis = memo(function ExperimentOpsKpis({ stats }: ExperimentOpsKpisProps) {
  return (
    <div className="admin-stats-grid admin-experiment-ops-kpis">
      <AdminStatCard
        icon="🧪"
        label="Total Experiments"
        value={stats.total}
        hint="Portfolio registry"
        color="#7c5fe6"
        link="/admin/experiments"
      />
      <AdminStatCard
        icon="⚡"
        label="Active Experiments"
        value={stats.active}
        hint="Running now"
        color="#48bb78"
        link="/admin/experiments"
      />
      <AdminStatCard
        icon="✅"
        label="Completed"
        value={stats.completed}
        color="#2fd4ff"
        link="/admin/experiments"
      />
      <AdminStatCard
        icon="❌"
        label="Failed"
        value={stats.failed}
        color="#fc8181"
        link="/admin/experiments"
      />
      <AdminStatCard
        icon="🔬"
        label="Validation Ready"
        value={stats.validationReady}
        color="#9f7aea"
        link="/admin/experiments"
      />
      <AdminStatCard
        icon="💰"
        label="Funding Ready"
        value={stats.fundingReady}
        color="#38b2ac"
        link="/admin/experiments"
      />
      <AdminStatCard
        icon="📊"
        label="Success Rate"
        value={stats.successRate}
        suffix="%"
        color="#f6c90e"
        link="/admin/experiments"
      />
    </div>
  );
});
