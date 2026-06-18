import { supabase } from '../../../lib/supabase/client';
import { getAdminSession } from './adminAuth.service';
import type { AdminAnalyticsSnapshot } from '../types/adminAnalytics.types';
import type { DashboardStats } from '../types/adminDashboard.types';
import type { AdminServiceResult } from '../types/projectAdmin.types';

function rpcMissing(error: { message?: string } | null) {
  return !!error?.message && /Could not find the function/i.test(error.message);
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapDashboardStats(row: Record<string, unknown>): DashboardStats {
  return {
    totalUsers: toNumber(row.total_users),
    totalProjects: toNumber(row.total_projects),
    totalExperiments: toNumber(row.total_experiments),
    totalPrototypes: toNumber(row.total_prototypes),
    totalVaultItems: toNumber(row.total_vault_items),
    totalFundingPitches: toNumber(row.total_funding_pitches),
    totalRevenue: toNumber(row.total_revenue),
    monthlyRevenue: toNumber(row.monthly_revenue),
    activeUsers: toNumber(row.active_users),
    newUsersThisMonth: toNumber(row.new_users_this_month),
    projectsThisMonth: toNumber(row.projects_this_month),
    fundingPitchesThisMonth: toNumber(row.funding_pitches_this_month),
    avgProjectProgress: toNumber(row.avg_project_progress),
    totalMentors: toNumber(row.total_mentors),
    totalInvestors: toNumber(row.total_investors),
    totalInnovators: toNumber(row.total_innovators),
  };
}

function mapRecordCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, count]) => [key, toNumber(count)])
  );
}

function mapAnalyticsSnapshot(row: Record<string, unknown>): AdminAnalyticsSnapshot {
  const totals = (row.totals as Record<string, unknown>) ?? {};
  const revenueByMonth = Array.isArray(row.revenue_by_month)
    ? row.revenue_by_month.map((item) => {
        const r = item as Record<string, unknown>;
        return { month: String(r.month ?? ''), amount: toNumber(r.amount) };
      })
    : [];
  const growthSeries = Array.isArray(row.growth_series)
    ? row.growth_series.map((item) => {
        const g = item as Record<string, unknown>;
        return {
          date: String(g.date ?? ''),
          signups: toNumber(g.signups),
          projects: toNumber(g.projects),
        };
      })
    : [];

  return {
    generated_at: String(row.generated_at ?? new Date().toISOString()),
    range_days: toNumber(row.range_days, 30),
    totals: {
      users: toNumber(totals.users),
      projects: toNumber(totals.projects),
      experiments: toNumber(totals.experiments),
      prototypes: toNumber(totals.prototypes),
      vault_items: toNumber(totals.vault_items),
      funding_pitches: toNumber(totals.funding_pitches),
      total_revenue: toNumber(totals.total_revenue),
      revenue_30d: toNumber(totals.revenue_30d),
      revenue_mtd: toNumber(totals.revenue_mtd),
      active_users_7d: toNumber(totals.active_users_7d),
      new_users_mtd: toNumber(totals.new_users_mtd),
      new_projects_mtd: toNumber(totals.new_projects_mtd),
      avg_project_progress: toNumber(totals.avg_project_progress),
    },
    projects_by_status: mapRecordCounts(row.projects_by_status),
    projects_by_sector: mapRecordCounts(row.projects_by_sector),
    users_by_role: mapRecordCounts(row.users_by_role),
    users_by_plan: mapRecordCounts(row.users_by_plan),
    revenue_by_month: revenueByMonth,
    growth_series: growthSeries,
  };
}

/** Client-side fallback when RPC migration is not applied yet. */
async function fetchDashboardStatsFallback(): Promise<AdminServiceResult<DashboardStats>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      throw new Error('Admin session required');
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      users,
      projects,
      experiments,
      prototypes,
      vault,
      pitches,
      payments,
      monthlyPayments,
      activeUsers,
      newUsers,
      newProjects,
      newPitches,
      progressRows,
      mentors,
      investors,
      innovators,
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('experiments').select('*', { count: 'exact', head: true }),
      supabase.from('prototypes').select('*', { count: 'exact', head: true }),
      supabase.from('vault_items').select('*', { count: 'exact', head: true }),
      supabase.from('funding_pitches').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('amount, status'),
      supabase
        .from('payments')
        .select('amount, status')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', sevenDaysAgo.toISOString()),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString()),
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString()),
      supabase
        .from('funding_pitches')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString()),
      supabase.from('projects').select('progress'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mentor'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'investor'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'innovator'),
    ]);

    const isPaid = (status: string | null | undefined) =>
      !status || !['failed', 'cancelled', 'refunded', 'pending'].includes(status);

    const totalRevenue =
      payments.data?.reduce(
        (sum, p) => sum + (isPaid(p.status as string) ? Number(p.amount) || 0 : 0),
        0
      ) ?? 0;
    const monthlyRevenue =
      monthlyPayments.data?.reduce(
        (sum, p) => sum + (isPaid(p.status as string) ? Number(p.amount) || 0 : 0),
        0
      ) ?? 0;
    const rows = progressRows.data ?? [];
    const avgProjectProgress =
      rows.length > 0
        ? Math.round(rows.reduce((sum, p) => sum + (Number(p.progress) || 0), 0) / rows.length)
        : 0;

    return {
      data: {
        totalUsers: users.count ?? 0,
        totalProjects: projects.count ?? 0,
        totalExperiments: experiments.count ?? 0,
        totalPrototypes: prototypes.count ?? 0,
        totalVaultItems: vault.count ?? 0,
        totalFundingPitches: pitches.count ?? 0,
        totalRevenue,
        monthlyRevenue,
        activeUsers: activeUsers.count ?? 0,
        newUsersThisMonth: newUsers.count ?? 0,
        projectsThisMonth: newProjects.count ?? 0,
        fundingPitchesThisMonth: newPitches.count ?? 0,
        avgProjectProgress,
        totalMentors: mentors.count ?? 0,
        totalInvestors: investors.count ?? 0,
        totalInnovators: innovators.count ?? 0,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'FETCH_DASHBOARD_STATS_FAILED',
        message: err instanceof Error ? err.message : 'Failed to load dashboard stats',
      },
    };
  }
}

export async function fetchAdminDashboardStats(): Promise<AdminServiceResult<DashboardStats>> {
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

  if (rpcMissing(error)) {
    return fetchDashboardStatsFallback();
  }

  if (error) {
    return {
      data: null,
      error: { code: 'RPC_DASHBOARD_STATS', message: error.message },
    };
  }

  return {
    data: mapDashboardStats((data ?? {}) as Record<string, unknown>),
    error: null,
  };
}

export async function fetchAdminAnalyticsSnapshot(
  days = 30
): Promise<AdminServiceResult<AdminAnalyticsSnapshot>> {
  const { data, error } = await supabase.rpc('get_admin_analytics_snapshot', { p_days: days });

  if (rpcMissing(error)) {
    const statsResult = await fetchDashboardStatsFallback();
    if (!statsResult.data) {
      return { data: null, error: statsResult.error };
    }
    const s = statsResult.data;
    return {
      data: {
        generated_at: new Date().toISOString(),
        range_days: days,
        totals: {
          users: s.totalUsers,
          projects: s.totalProjects,
          experiments: s.totalExperiments,
          prototypes: s.totalPrototypes,
          vault_items: s.totalVaultItems,
          funding_pitches: s.totalFundingPitches,
          total_revenue: s.totalRevenue,
          revenue_30d: s.monthlyRevenue,
          revenue_mtd: s.monthlyRevenue,
          active_users_7d: s.activeUsers,
          new_users_mtd: s.newUsersThisMonth,
          new_projects_mtd: s.projectsThisMonth,
          avg_project_progress: s.avgProjectProgress,
        },
        projects_by_status: {},
        projects_by_sector: {},
        users_by_role: {
          mentor: s.totalMentors,
          investor: s.totalInvestors,
          innovator: s.totalInnovators,
        },
        users_by_plan: {},
        revenue_by_month: [],
        growth_series: [],
      },
      error: null,
    };
  }

  if (error) {
    return {
      data: null,
      error: { code: 'RPC_ANALYTICS_SNAPSHOT', message: error.message },
    };
  }

  return {
    data: mapAnalyticsSnapshot((data ?? {}) as Record<string, unknown>),
    error: null,
  };
}
