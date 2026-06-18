export { AdminSidebar } from './components/AdminSidebar';
export { AdminDetailShell } from './components/AdminDetailShell';
export { AdminStatCard } from './components/dashboard/AdminStatCard';

export { AdminPageShell } from './components/layout/AdminPageShell';
export { AdminPageHeader } from './components/layout/AdminPageHeader';
export { AdminListPage } from './components/layout/AdminListPage';
export { AdminDetailPage } from './components/layout/AdminDetailPage';
export { AdminSectionPage } from './components/layout/AdminSectionPage';
export { AdminLoadingState } from './components/layout/AdminLoadingState';

export { AdminButton } from './components/ui/AdminButton';
export { AdminBadge, AdminRoleBadge, AdminStatusBadge, AdminPlanBadge } from './components/ui/AdminBadge';
export { AdminSearchInput } from './components/ui/AdminSearchInput';
export { AdminToolbar } from './components/ui/AdminToolbar';
export { AdminPagination } from './components/ui/AdminPagination';
export { AdminEmptyState } from './components/ui/AdminEmptyState';
export { AdminTabs } from './components/ui/AdminTabs';
export { AdminDetailGrid, AdminDetailItem } from './components/ui/AdminDetailGrid';
export { AdminConfirmDialog } from './components/ui/AdminConfirmDialog';

export { AdminDataTable } from './components/tables/AdminDataTable';
export { AdminProfileListPage, AdminEntityListPage } from './components/templates/AdminResourceListPage';

export { useAdminDashboard, timeAgo, sectorIcon } from './hooks/useAdminDashboard';
export { useAdminSession } from './hooks/useAdminSession';
export { useAdminList } from './hooks/useAdminList';

export { getAdminSession, isAdminRole, canAdmin, assertAdminPermission } from './services/adminAuth.service';
export {
  fetchAdminProfilesPage,
  fetchAdminUsersPage,
  fetchAdminUserStats,
  fetchAdminUserDetail,
  createAdminUser,
  updateAdminUser,
  updateAdminUserRole,
  updateAdminUserStatus,
  bulkUpdateAdminUserStatus,
  bulkUpdateAdminUserRole,
  exportAdminUsersCsv,
  fetchAdminProfileById,
  profileDisplayName,
} from './services/adminUsers.service';
export type { AdminProfileRow } from './services/adminUsers.service';

export { useAdminUserDetail } from './hooks/useAdminUserDetail';
export { fetchAdminEntityPage, fetchAdminEntityById } from './services/adminEntity.service';
export {
  fetchAdminProjectsPage,
  fetchAdminProjectStats,
  fetchAdminProjectById,
  fetchAdminProjectDetail,
  updateAdminProjectStatus,
  deleteAdminProject,
  fetchAdminProjectCounts,
} from './services/adminProjects.service';
export { logAdminAudit } from './services/adminAudit.service';
export {
  fetchAdminExperimentDetail,
  fetchAdminPrototypeDetail,
  fetchAdminVaultDetail,
  deleteAdminExperiment,
  deleteAdminPrototype,
  deleteAdminVaultItem,
} from './services/adminInnovation.service';
export {
  fetchAdminDashboardStats,
  fetchAdminAnalyticsSnapshot,
} from './services/adminAnalytics.service';
export {
  fetchAdminCareersPage,
  fetchAdminCareerStats,
  createAdminCareer,
  updateAdminCareer,
  deleteAdminCareer,
  exportAdminCareersCsv,
} from './services/adminCareers.service';
export {
  fetchAdminFundingPage,
  fetchAdminFundingStats,
  updateAdminFundingStatus,
  deleteAdminFundingPitch,
} from './services/adminFunding.service';
export {
  fetchAdminInvestorStats,
  fetchAdminInvestorAccountsPage,
  fetchAdminInvestorDirectoryPage,
  createAdminInvestorDirectoryEntry,
  updateAdminInvestorDirectoryEntry,
  deleteAdminInvestorDirectoryEntry,
} from './services/adminInvestors.service';

export { useAdminProjects } from './hooks/useAdminProjects';
export { useAdminProjectDetail } from './hooks/useAdminProjectDetail';
export { useAdminInnovationDetail } from './hooks/useAdminInnovationDetail';
export { useAdminPermissions } from './hooks/useAdminPermissions';
export { useAdminUsers } from './hooks/useAdminUsers';
export { useAdminCareers } from './hooks/useAdminCareers';
export { useAdminFunding } from './hooks/useAdminFunding';
export { useAdminInvestors } from './hooks/useAdminInvestors';

export { ADMIN_NAV_ITEMS, ADMIN_NAV_SECTIONS, adminBreadcrumbsFor, getAdminNavItem } from './config/adminNav.config';
export {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
  isSuperAdminRole,
  adminRoleLabel,
  type AdminPermission,
} from './config/adminRbac.config';

export { AdminPermissionDenied } from './components/AdminPermissionDenied';

export * from './utils/adminPage.utils';

export type {
  DashboardStats,
  RecentUser,
  RecentProject,
  SystemActivity,
} from './types/adminDashboard.types';
export type {
  AdminRole,
  AdminSession,
  AdminBreadcrumb,
  AdminPageAction,
  AdminListPageState,
  AdminBadgeVariant,
  AdminStatus,
} from './types/admin.types';
export type {
  AdminProjectRow,
  AdminProjectStats,
  AdminProjectFilters,
  AdminServiceResult,
  AdminListParams,
  AdminProjectDetail,
  AdminProjectDetailBundle,
  AdminProjectDetailTab,
} from './types/projectAdmin.types';
export type {
  AdminUserProfile,
  AdminUserFormValues,
  AdminUserUpdateValues,
  AdminUserDetailBundle,
  AdminUserRole,
  AdminUserPlan,
} from './types/userAdmin.types';
export type {
  AdminExperimentDetailBundle,
  AdminPrototypeDetail,
  AdminPrototypeDetailBundle,
  AdminVaultDetail,
  AdminVaultDetailBundle,
  AdminInnovationOwner,
} from './types/innovationAdmin.types';
export type { AdminAnalyticsSnapshot, AdminGrowthPoint, AdminRevenueMonth } from './types/adminAnalytics.types';

export { default as AdminDashboard } from './pages/AdminDashboard';