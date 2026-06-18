import { memo } from 'react';
import { AdminStatCard } from '../../components/dashboard/AdminStatCard';
import type { MentorOpsStats } from '../types/mentorOps.types';

interface MentorDashboardProps {
  stats: MentorOpsStats;
}

export const MentorDashboard = memo(function MentorDashboard({ stats }: MentorDashboardProps) {
  return (
    <div className="admin-stats-grid admin-mentor-ops-kpis">
      <AdminStatCard icon="👥" label="Total Mentors" value={stats.totalMentors} color="#7c5fe6" link="/admin/mentors" />
      <AdminStatCard icon="✅" label="Active Mentors" value={stats.activeMentors} color="#48bb78" link="/admin/mentors" />
      <AdminStatCard icon="📅" label="Total Sessions" value={stats.totalSessions} color="#2fd4ff" link="/admin/mentors" />
      <AdminStatCard icon="🔗" label="Pending Match Requests" value={stats.pendingMatchRequests} color="#f6c90e" link="/admin/mentors" />
      <AdminStatCard icon="⭐" label="Avg Mentor Rating" value={stats.averageRating} color="#fc8181" link="/admin/mentors" suffix="/5" />
      <AdminStatCard icon="📈" label="Monthly Engagement" value={stats.monthlyEngagementRate} color="#9f7aea" link="/admin/mentors" suffix="%" />
    </div>
  );
});
