import type { AdminRole } from '../types/admin.types';

/** Permission keys aligned with AdminRoles settings matrix. */
export type AdminPermission =
  | 'manage_users'
  | 'manage_projects'
  | 'delete_records'
  | 'view_analytics'
  | 'manage_settings'
  | 'moderate_content'
  | 'view_logs'
  | 'manage_commerce'
  | 'broadcast';

export const ADMIN_PERMISSIONS: ReadonlyArray<{
  id: AdminPermission;
  label: string;
  description: string;
  superAdminOnly?: boolean;
}> = [
  {
    id: 'manage_users',
    label: 'Manage users',
    description: 'Create and edit user accounts',
  },
  {
    id: 'manage_projects',
    label: 'Manage projects',
    description: 'Review and update projects and innovation assets',
  },
  {
    id: 'delete_records',
    label: 'Delete records',
    description: 'Permanently delete projects, experiments, and other records',
    superAdminOnly: true,
  },
  {
    id: 'view_analytics',
    label: 'View analytics',
    description: 'Access analytics, reports, and AI monitor',
  },
  {
    id: 'manage_settings',
    label: 'Manage settings',
    description: 'Change system settings and configurations',
  },
  {
    id: 'moderate_content',
    label: 'Moderate content',
    description: 'Review and moderate user content',
  },
  {
    id: 'view_logs',
    label: 'View logs',
    description: 'Access security and system monitor views',
  },
  {
    id: 'manage_commerce',
    label: 'Manage commerce',
    description: 'Manage subscriptions and payments',
    superAdminOnly: true,
  },
  {
    id: 'broadcast',
    label: 'Broadcast',
    description: 'Send platform-wide notifications',
    superAdminOnly: true,
  },
];

const ADMIN_PERMISSION_SET: Record<AdminRole, ReadonlySet<AdminPermission> | 'all'> = {
  super_admin: 'all',
  admin: new Set<AdminPermission>([
    'manage_users',
    'manage_projects',
    'view_analytics',
    'manage_settings',
    'moderate_content',
    'view_logs',
  ]),
};

export function hasAdminPermission(
  role: string | null | undefined,
  permission: AdminPermission
): boolean {
  if (!role || (role !== 'admin' && role !== 'super_admin')) return false;

  const grants = ADMIN_PERMISSION_SET[role as AdminRole];
  if (grants === 'all') return true;
  return grants.has(permission);
}

export function isSuperAdminRole(role: string | null | undefined): role is 'super_admin' {
  return role === 'super_admin';
}

export function adminRoleLabel(role: string | null | undefined) {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  return role ?? 'Unknown';
}
