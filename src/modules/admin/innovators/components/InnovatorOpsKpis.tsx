import { memo } from 'react';
import { AdminStatCard } from '../../components/dashboard/AdminStatCard';
import type { InnovatorOpsStats } from '../types/innovatorOps.types';

interface InnovatorOpsKpisProps {
  stats: InnovatorOpsStats;
}

export const InnovatorOpsKpis = memo(function InnovatorOpsKpis({ stats }: InnovatorOpsKpisProps) {
  return (
    <div className="admin-stats-grid admin-innovator-ops-kpis">
      <AdminStatCard icon="💡" label="Total Innovators" value={stats.total} color="#7c5fe6" link="/admin/innovators" />
      <AdminStatCard icon="🚀" label="Active Innovations" value={stats.activeInnovations} color="#2fd4ff" link="/admin/innovators" />
      <AdminStatCard icon="🔍" label="Under Review" value={stats.underReview} color="#f6c90e" link="/admin/innovators" />
      <AdminStatCard icon="✅" label="Approved / Fundable" value={stats.approvedFundable} color="#48bb78" link="/admin/innovators" />
      <AdminStatCard icon="⏰" label="Overdue Follow-ups" value={stats.overdueFollowUps} color="#fc8181" link="/admin/innovators" />
    </div>
  );
});
