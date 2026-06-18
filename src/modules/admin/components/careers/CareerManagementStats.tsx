import { memo } from 'react';
import { AdminStatCard } from '../dashboard/AdminStatCard';
import type { AdminCareerStats } from '../../types/careersAdmin.types';

interface CareerManagementStatsProps {
  stats: AdminCareerStats;
}

export const CareerManagementStats = memo(function CareerManagementStats({
  stats,
}: CareerManagementStatsProps) {
  return (
    <div className="admin-stats-grid admin-careers-stats">
      <AdminStatCard
        icon="💼"
        label="Total Careers"
        value={stats.total}
        color="#7c5fe6"
        link="/admin/careers"
      />
      <AdminStatCard
        icon="✅"
        label="Published Careers"
        value={stats.published}
        color="#48bb78"
        link="/admin/careers"
        hint="Live on platform"
      />
      <AdminStatCard
        icon="📝"
        label="Draft Careers"
        value={stats.draft}
        color="#f6c90e"
        link="/admin/careers"
      />
      <AdminStatCard
        icon="📦"
        label="Archived Careers"
        value={stats.archived}
        color="#718096"
        link="/admin/careers"
      />
      <AdminStatCard
        icon="📨"
        label="Applications Received"
        value={stats.applicationsReceived}
        color="#2fd4ff"
        link="/admin/careers/applications"
        hint="All applicant submissions"
      />
    </div>
  );
});
