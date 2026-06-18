import { memo } from 'react';
import { AdminStatCard } from '../dashboard/AdminStatCard';
import { formatAdminCurrency } from '../../utils/adminPage.utils';
import type { AdminFundingStats } from '../../types/fundingAdmin.types';

interface FundingManagementStatsProps {
  stats: AdminFundingStats;
}

export const FundingManagementStats = memo(function FundingManagementStats({
  stats,
}: FundingManagementStatsProps) {
  return (
    <div className="admin-stats-grid admin-funding-stats">
      <AdminStatCard
        icon="💰"
        label="Total Pitches"
        value={stats.total}
        color="#7c5fe6"
        link="/admin/funding"
      />
      <AdminStatCard
        icon="📤"
        label="Submitted"
        value={stats.submitted}
        color="#2fd4ff"
        link="/admin/funding"
      />
      <AdminStatCard
        icon="🔍"
        label="Under Review"
        value={stats.underReview}
        color="#f6c90e"
        link="/admin/funding"
      />
      <AdminStatCard
        icon="✅"
        label="Funded"
        value={stats.funded}
        color="#48bb78"
        link="/admin/funding"
      />
      <AdminStatCard
        icon="📊"
        label="Capital Sought"
        value={formatAdminCurrency(stats.totalAmountSought)}
        color="#fc8181"
        link="/admin/funding"
        hint="Aggregate ask across all pitches"
      />
      <AdminStatCard
        icon="📨"
        label="Investor Applications"
        value={stats.applicationsReceived}
        color="#718096"
        link="/admin/funding"
        hint="Pitch ↔ investor matches"
      />
    </div>
  );
});
