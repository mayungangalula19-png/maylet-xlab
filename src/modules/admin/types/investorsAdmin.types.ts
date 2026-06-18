import type { AdminServiceResult } from './projectAdmin.types';
import type { AdminUserStatus } from './userAdmin.types';

export type AdminInvestorTab = 'accounts' | 'directory';

export type InvestorDirectoryType = 'angel' | 'vc' | 'grant' | 'accelerator';

export interface AdminInvestorAccountRow {
  id: string;
  full_name: string | null;
  email: string | null;
  plan: string | null;
  status: AdminUserStatus | string | null;
  organization_name: string | null;
  two_factor_enabled: boolean | null;
  created_at: string | null;
  last_active: string | null;
}

export interface AdminInvestorDirectoryRow {
  id: string;
  name: string;
  type: InvestorDirectoryType;
  focus_industries: string[];
  investment_range_min: number;
  investment_range_max: number;
  description: string;
  logo_url: string | null;
  website: string;
  contact_email: string;
  is_active: boolean;
  application_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminInvestorStats {
  accountTotal: number;
  accountActive: number;
  accountPending: number;
  accountSuspended: number;
  directoryTotal: number;
  directoryActive: number;
  pitchApplications: number;
  newAccountsThisMonth: number;
}

export interface AdminInvestorAccountFilters {
  search?: string;
  status?: AdminUserStatus | 'all';
  plan?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminInvestorDirectoryFilters {
  search?: string;
  type?: InvestorDirectoryType | 'all';
  active?: 'all' | 'active' | 'inactive';
  industry?: string;
}

export interface AdminInvestorAccountListParams {
  page: number;
  pageSize: number;
  filters?: AdminInvestorAccountFilters;
}

export interface AdminInvestorDirectoryListParams {
  page: number;
  pageSize: number;
  filters?: AdminInvestorDirectoryFilters;
}

export interface AdminInvestorDirectoryFormValues {
  name: string;
  type: InvestorDirectoryType;
  focus_industries: string;
  investment_range_min: number;
  investment_range_max: number;
  description: string;
  logo_url: string;
  website: string;
  contact_email: string;
  is_active: boolean;
}

export const INVESTOR_DIRECTORY_TYPES: ReadonlyArray<{
  value: InvestorDirectoryType;
  label: string;
}> = [
  { value: 'angel', label: 'Angel' },
  { value: 'vc', label: 'VC' },
  { value: 'grant', label: 'Grant' },
  { value: 'accelerator', label: 'Accelerator' },
];

export const INVESTOR_ACCOUNT_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Verified / Active' },
  { value: 'pending', label: 'Pending verification' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned', label: 'Banned' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export const INVESTOR_DIRECTORY_INDUSTRY_OPTIONS = [
  'All',
  'Technology',
  'Healthcare',
  'Education',
  'FinTech',
  'AgriTech',
  'Environment',
  'Blockchain',
  'AI / ML',
  'IoT',
] as const;

export function investorTypeLabel(type: InvestorDirectoryType) {
  return INVESTOR_DIRECTORY_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function investorDirectoryStatusVariant(isActive: boolean): 'success' | 'default' {
  return isActive ? 'success' : 'default';
}

export const EMPTY_INVESTOR_DIRECTORY_FORM: AdminInvestorDirectoryFormValues = {
  name: '',
  type: 'angel',
  focus_industries: 'Technology',
  investment_range_min: 0,
  investment_range_max: 1000000,
  description: '',
  logo_url: '',
  website: '',
  contact_email: '',
  is_active: true,
};

export type { AdminServiceResult };
