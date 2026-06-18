import { AdminStatCard } from '../dashboard/AdminStatCard';
import type { AdminProjectStats } from '../../types/projectAdmin.types';

interface ProjectPortfolioStatsProps {
  stats: AdminProjectStats;
}

export function ProjectPortfolioStats({ stats }: ProjectPortfolioStatsProps) {
  return (
    <div className="admin-stats-grid admin-projects-stats">
      <AdminStatCard icon="📁" label="Total Projects" value={stats.total} color="#7c5fe6" link="/admin/projects" />
      <AdminStatCard icon="💡" label="Idea Stage" value={stats.byStatus.idea} color="#f6c90e" link="/admin/projects" hint="Portfolio filter coming" />
      <AdminStatCard icon="🧪" label="Experiment" value={stats.byStatus.experiment} color="#2fd4ff" link="/admin/projects" />
      <AdminStatCard icon="📦" label="Prototype" value={stats.byStatus.prototype} color="#7c5fe6" link="/admin/projects" />
      <AdminStatCard icon="🚀" label="Launched" value={stats.byStatus.launched} color="#48bb78" link="/admin/projects" />
      <AdminStatCard icon="📊" label="Avg Progress" value={`${stats.avgProgress}%`} color="#2fd4ff" link="/admin/projects" />
      <AdminStatCard icon="👥" label="Team Members" value={stats.totalTeamMembers} color="#48bb78" link="/admin/users" />
      <AdminStatCard icon="✅" label="Total Tasks" value={stats.totalTasks} color="#f6c90e" link="/admin/projects" />
    </div>
  );
}
