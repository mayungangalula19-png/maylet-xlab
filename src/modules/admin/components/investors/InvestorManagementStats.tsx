import { memo } from 'react';
import { AdminStatCard } from '../dashboard/AdminStatCard';
import type { AdminInvestorStats } from '../../types/investorsAdmin.types';

interface InvestorManagementStatsProps {
  stats: AdminInvestorStats;
}

export const InvestorManagementStats = memo(function InvestorManagementStats({
  stats,
}: InvestorManagementStatsProps) {
  return (
    <div className="admin-stats-grid admin-investors-stats">
      <AdminStatCard
        icon="👤"
        label="Investor Accounts"
        value={stats.accountTotal}
        color="#7c5fe6"
        link="/admin/investors"
      />
      <AdminStatCard
        icon="✅"
        label="Verified"
        value={stats.accountActive}
        color="#48bb78"
        link="/admin/investors"
      />
      <AdminStatCard
        icon="⏳"
        label="Pending Verification"
        value={stats.accountPending}
        color="#f6c90e"
        link="/admin/investors"
      />
      <AdminStatCard
        icon="🏢"
        label="Directory Listings"
        value={stats.directoryTotal}
        color="#2fd4ff"
        link="/admin/investors"
        hint={`${stats.directoryActive} active`}
      />
      <AdminStatCard
        icon="📨"
        label="Pitch Applications"
        value={stats.pitchApplications}
        color="#718096"
        link="/admin/funding"
      />
      <AdminStatCard
        icon="🆕"
        label="New This Month"
        value={stats.newAccountsThisMonth}
        color="#fc8181"
        link="/admin/investors"
        hint="Investor signups"
      />
    </div>
  );
});
