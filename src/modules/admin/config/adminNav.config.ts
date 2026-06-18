import type { AdminBreadcrumb } from '../types/admin.types';
import type { AdminPermission } from './adminRbac.config';

export interface AdminNavItem {
  icon: string;
  label: string;
  route: string;
  section?: AdminNavSection;
  description?: string;
  /** Hide from sidebar unless the admin has this permission. */
  permission?: AdminPermission;
}

export type AdminNavSection =
  | 'overview'
  | 'people'
  | 'innovation'
  | 'commerce'
  | 'insights'
  | 'operations'
  | 'system';

export const ADMIN_NAV_SECTIONS: Record<AdminNavSection, string> = {
  overview: 'Overview',
  people: 'People',
  innovation: 'Innovation',
  commerce: 'Commerce',
  insights: 'Insights',
  operations: 'Operations',
  system: 'System',
};

/** Single source of truth for admin sidebar navigation. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { icon: '🏠', label: 'Home', route: '/', section: 'overview' },
  { icon: '📊', label: 'Dashboard', route: '/admin', section: 'overview', description: 'KPIs and activity' },
  { icon: '👥', label: 'Users', route: '/admin/users', section: 'people', permission: 'manage_users' },
  { icon: '💼', label: 'Careers', route: '/admin/careers', section: 'people', permission: 'manage_users' },
  { icon: '💡', label: 'Innovators', route: '/admin/innovators', section: 'people', permission: 'manage_users' },
  { icon: '🎓', label: 'Mentors', route: '/admin/mentors', section: 'people', permission: 'manage_users' },
  { icon: '💰', label: 'Investors', route: '/admin/investors', section: 'people', permission: 'manage_users' },
  { icon: '📁', label: 'Projects', route: '/admin/projects', section: 'innovation', permission: 'manage_projects' },
  { icon: '🧪', label: 'Experiments', route: '/admin/experiments', section: 'innovation', permission: 'manage_projects' },
  { icon: '📦', label: 'Prototypes', route: '/admin/prototypes', section: 'innovation', permission: 'manage_projects' },
  { icon: '💰', label: 'Funding', route: '/admin/funding', section: 'innovation', permission: 'manage_projects' },
  { icon: '🔐', label: 'Innovation Vault', route: '/admin/vault', section: 'innovation', permission: 'manage_projects' },
  { icon: '📊', label: 'Subscriptions', route: '/admin/subscriptions', section: 'commerce', permission: 'manage_commerce' },
  { icon: '💵', label: 'Payments', route: '/admin/payments', section: 'commerce', permission: 'manage_commerce' },
  { icon: '📈', label: 'Analytics', route: '/admin/analytics', section: 'insights', permission: 'view_analytics' },
  { icon: '📄', label: 'Reports', route: '/admin/reports', section: 'insights', permission: 'view_analytics' },
  { icon: '🤖', label: 'AI Monitor', route: '/admin/ai-monitor', section: 'insights', permission: 'view_analytics' },
  { icon: '🔔', label: 'Notifications', route: '/admin/notifications', section: 'operations', permission: 'broadcast' },
  { icon: '🛡️', label: 'Security', route: '/admin/security', section: 'operations', permission: 'view_logs' },
  { icon: '⚖️', label: 'Moderation', route: '/admin/moderation', section: 'operations', permission: 'moderate_content' },
  { icon: '📡', label: 'System Monitor', route: '/admin/system-monitor', section: 'system', permission: 'view_logs' },
  { icon: '⚙️', label: 'Settings', route: '/admin/settings', section: 'system', permission: 'manage_settings' },
];

export function getAdminNavItem(route: string) {
  return ADMIN_NAV_ITEMS.find((item) => item.route === route);
}

export function adminBreadcrumbsFor(route: string, currentLabel?: string) {
  const item = getAdminNavItem(route);
  const crumbs: AdminBreadcrumb[] = [{ label: 'Admin', to: '/admin' }];
  if (item && item.route !== '/admin') {
    crumbs.push({ label: item.label, to: item.route });
  }
  if (currentLabel) {
    crumbs.push({ label: currentLabel });
  }
  return crumbs;
}
