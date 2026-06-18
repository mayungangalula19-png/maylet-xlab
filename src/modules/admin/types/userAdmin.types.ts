export const ADMIN_USER_ROLES = [
  'user',
  'innovator',
  'mentor',
  'investor',
  'admin',
  'super_admin',
] as const;

export type AdminUserRole = (typeof ADMIN_USER_ROLES)[number];

export const ADMIN_USER_PLANS = ['free', 'pro', 'enterprise'] as const;

export type AdminUserPlan = (typeof ADMIN_USER_PLANS)[number];

export const ADMIN_USER_STATUSES = ['active', 'inactive', 'pending', 'banned', 'suspended'] as const;

export type AdminUserStatus = (typeof ADMIN_USER_STATUSES)[number];

export interface AdminUserStats {
  total: number;
  active: number;
  pending: number;
  banned: number;
  admins: number;
  innovators: number;
  withTwoFactor: number;
  newThisMonth: number;
}

export interface AdminUserFilters {
  search?: string;
  role?: AdminUserRole | 'all';
  status?: AdminUserStatus | 'all';
  plan?: AdminUserPlan | 'all';
  dateFrom?: string;
  dateTo?: string;
  twoFactor?: 'all' | 'enabled' | 'disabled';
}

export interface AdminUserListParams {
  page: number;
  pageSize: number;
  filters?: AdminUserFilters;
}

export interface AdminUserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AdminUserRole | string | null;
  plan: string | null;
  status?: string | null;
  user_type: string | null;
  organization_name: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  github_handle: string | null;
  twitter_handle: string | null;
  linkedin_url: string | null;
  phone: string | null;
  avatar_url: string | null;
  two_factor_enabled: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  last_active?: string | null;
}

export interface AdminUserFormValues {
  email: string;
  password: string;
  full_name: string;
  role: AdminUserRole;
  plan: AdminUserPlan;
  user_type: string;
  organization_name: string;
  bio: string;
  location: string;
  website: string;
  github_handle: string;
  twitter_handle: string;
  linkedin_url: string;
  phone: string;
}

export type AdminUserUpdateValues = Omit<AdminUserFormValues, 'email' | 'password'>;

export interface AdminUserProjectSummary {
  id: string;
  name: string;
  status: string | null;
  progress: number;
  sector: string | null;
  created_at: string | null;
}

export interface AdminUserActivitySummary {
  id: string;
  action: string;
  target_type: string;
  target_name: string;
  created_at: string;
}

export interface AdminUserDetailBundle {
  profile: AdminUserProfile;
  projects: AdminUserProjectSummary[];
  activities: AdminUserActivitySummary[];
  projectCount: number;
}

export const EMPTY_USER_FORM: AdminUserFormValues = {
  email: '',
  password: '',
  full_name: '',
  role: 'innovator',
  plan: 'free',
  user_type: 'student',
  organization_name: '',
  bio: '',
  location: '',
  website: '',
  github_handle: '',
  twitter_handle: '',
  linkedin_url: '',
  phone: '',
};
