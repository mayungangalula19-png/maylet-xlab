import { fetchAdminAnalyticsSnapshot } from '../services/adminAnalytics.service';
import type { AdminAnalyticsSnapshot } from '../types/adminAnalytics.types';

export interface AdminReportData {
  totalUsers: number;
  totalProjects: number;
  totalExperiments: number;
  totalPrototypes: number;
  totalRevenue: number;
  monthlyRevenue: number;
  newUsersThisMonth: number;
  newProjectsThisMonth: number;
  activeUsers: number;
  projectsByStatus: {
    idea: number;
    experiment: number;
    prototype: number;
    launched: number;
  };
  projectsBySector: Record<string, number>;
  revenueByMonth: { month: string; amount: number }[];
}

function mapStatus(snapshot: AdminAnalyticsSnapshot): AdminReportData['projectsByStatus'] {
  const byStatus = snapshot.projects_by_status;
  return {
    idea: byStatus.idea ?? byStatus.Idea ?? 0,
    experiment: byStatus.experiment ?? byStatus.Experiment ?? 0,
    prototype: byStatus.prototype ?? byStatus.Prototype ?? 0,
    launched: byStatus.launched ?? byStatus.Launched ?? 0,
  };
}

export function mapSnapshotToReportData(snapshot: AdminAnalyticsSnapshot): AdminReportData {
  return {
    totalUsers: snapshot.totals.users,
    totalProjects: snapshot.totals.projects,
    totalExperiments: snapshot.totals.experiments,
    totalPrototypes: snapshot.totals.prototypes,
    totalRevenue: snapshot.totals.total_revenue,
    monthlyRevenue: snapshot.totals.revenue_mtd,
    newUsersThisMonth: snapshot.totals.new_users_mtd,
    newProjectsThisMonth: snapshot.totals.new_projects_mtd,
    activeUsers: snapshot.totals.active_users_7d,
    projectsByStatus: mapStatus(snapshot),
    projectsBySector: snapshot.projects_by_sector,
    revenueByMonth: snapshot.revenue_by_month,
  };
}

export async function fetchAdminReportData() {
  const result = await fetchAdminAnalyticsSnapshot(30);
  if (!result.data) {
    throw new Error(result.error?.message ?? 'Failed to load report data');
  }
  return mapSnapshotToReportData(result.data);
}
