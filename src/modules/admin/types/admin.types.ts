import type { AdminPermission } from '../config/adminRbac.config';

export type AdminRole = 'admin' | 'super_admin';

export interface AdminSession {
  userId: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

export interface AdminBreadcrumb {
  label: string;
  to?: string;
}

export interface AdminPageAction {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  icon?: string;
  /** When set, action is hidden unless the current admin has this permission. */
  permission?: AdminPermission;
}

export interface AdminListPageState {
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  search: string;
}

export type AdminBadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple';

export type AdminStatus = 'active' | 'inactive' | 'pending' | 'banned';
