export interface DashboardStats {
  totalUsers: number;
  totalProjects: number;
  totalExperiments: number;
  totalPrototypes: number;
  totalVaultItems: number;
  totalFundingPitches: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeUsers: number;
  newUsersThisMonth: number;
  projectsThisMonth: number;
  fundingPitchesThisMonth: number;
  avgProjectProgress: number;
  totalMentors: number;
  totalInvestors: number;
  totalInnovators: number;
}

export interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  plan: string;
  role: string;
  created_at: string;
  last_active: string;
  status: string;
  projects_count: number;
}

export interface RecentProject {
  id: string;
  name: string;
  description: string;
  sector: string;
  progress: number;
  status: string;
  user_email: string;
  user_name: string;
  created_at: string;
}

export interface SystemActivity {
  id: string;
  user_name: string;
  user_email?: string;
  action: string;
  target_type: string;
  target_name: string;
  created_at: string;
}
