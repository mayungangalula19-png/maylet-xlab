export interface AdminRevenueMonth {
  month: string;
  amount: number;
}

export interface AdminGrowthPoint {
  date: string;
  signups: number;
  projects: number;
}

export interface AdminAnalyticsSnapshot {
  generated_at: string;
  range_days: number;
  totals: {
    users: number;
    projects: number;
    experiments: number;
    prototypes: number;
    vault_items: number;
    funding_pitches: number;
    total_revenue: number;
    revenue_30d: number;
    revenue_mtd: number;
    active_users_7d: number;
    new_users_mtd: number;
    new_projects_mtd: number;
    avg_project_progress: number;
  };
  projects_by_status: Record<string, number>;
  projects_by_sector: Record<string, number>;
  users_by_role: Record<string, number>;
  users_by_plan: Record<string, number>;
  revenue_by_month: AdminRevenueMonth[];
  growth_series: AdminGrowthPoint[];
}
