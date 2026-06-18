import { memo } from 'react';
import { AdminStatCard } from '../dashboard/AdminStatCard';
import type { AdminUserStats } from '../../types/userAdmin.types';

interface UserManagementStatsProps {
  stats: AdminUserStats;
}

export const UserManagementStats = memo(function UserManagementStats({ stats }: UserManagementStatsProps) {
  return (
    <div className="admin-stats-grid admin-users-stats">
      <AdminStatCard icon="👥" label="Total Users" value={stats.total} color="#7c5fe6" link="/admin/users" />
      <AdminStatCard icon="✅" label="Active Users" value={stats.active} color="#48bb78" link="/admin/users" />
      <AdminStatCard icon="⏳" label="Pending" value={stats.pending} color="#f6c90e" link="/admin/users" />
      <AdminStatCard icon="🚫" label="Banned / Suspended" value={stats.banned} color="#fc8181" link="/admin/users" />
      <AdminStatCard icon="🛡️" label="Admins" value={stats.admins} color="#2fd4ff" link="/admin/users" />
      <AdminStatCard icon="💡" label="Innovators" value={stats.innovators} color="#9b7ff0" link="/admin/users" />
      <AdminStatCard
        icon="🔐"
        label="2FA Enabled"
        value={stats.withTwoFactor}
        color="#48bb78"
        link="/admin/users"
        hint="Security posture"
      />
      <AdminStatCard
        icon="📈"
        label="New This Month"
        value={stats.newThisMonth}
        color="#2fd4ff"
        link="/admin/users"
      />
    </div>
  );
});
