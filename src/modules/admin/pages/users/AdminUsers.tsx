import { useCallback, useState } from 'react';
import { AdminPermissionDenied } from '../../components/AdminPermissionDenied';
import { UserManagementFilters } from '../../components/users/UserManagementFilters';
import { UserManagementStats } from '../../components/users/UserManagementStats';
import { UserManagementTable, type UserRowAction } from '../../components/users/UserManagementTable';
import { UserProfileDrawer } from '../../components/users/UserProfileDrawer';
import { AdminConfirmDialog } from '../../components/ui/AdminConfirmDialog';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { AdminLoadingState } from '../../components/layout/AdminLoadingState';
import { AdminPagination } from '../../components/ui/AdminPagination';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { isSuperAdminRole } from '../../config/adminRbac.config';
import type { AdminProfileRow } from '../../services/adminUsers.service';
import { profileDisplayName } from '../../services/adminUsers.service';
import type { AdminUserRole } from '../../types/userAdmin.types';
import type { AdminPageAction } from '../../types/admin.types';
import { ADMIN_USER_ROLES } from '../../types/userAdmin.types';

export default function AdminUsers() {
  const users = useAdminUsers(20);
  const { can, filterActions, roleLoading, role: actorRole } = useAdminPermissions();
  const canManage = can('manage_users');

  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [drawerUser, setDrawerUser] = useState<AdminProfileRow | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState<'activate' | 'suspend' | 'role' | null>(null);
  const [bulkRole, setBulkRole] = useState<AdminUserRole>('innovator');

  const notifySuccess = useCallback((message: string) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(null), 4000);
  }, []);

  const handleError = useCallback((err: unknown) => {
    setActionError(err instanceof Error ? err.message : 'Action failed');
  }, []);

  const handleRowAction = async (user: AdminProfileRow, action: UserRowAction) => {
    setActionError(null);
    try {
      switch (action) {
        case 'view':
          setDrawerUser(user);
          break;
        case 'activate':
          await users.updateStatus(user.id, 'active');
          notifySuccess(`${profileDisplayName(user)} activated.`);
          break;
        case 'suspend':
          await users.updateStatus(user.id, 'suspended');
          notifySuccess(`${profileDisplayName(user)} suspended.`);
          break;
        default:
          break;
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleBulkConfirm = async () => {
    if (!bulkConfirm) return;
    try {
      if (bulkConfirm === 'activate') {
        await users.bulkActivate();
        notifySuccess(`${users.selectedIds.length} user(s) activated.`);
      } else if (bulkConfirm === 'suspend') {
        await users.bulkSuspend();
        notifySuccess(`${users.selectedIds.length} user(s) suspended.`);
      } else {
        await users.bulkSetRole(bulkRole);
        notifySuccess(`${users.selectedIds.length} user(s) updated to ${bulkRole}.`);
      }
      setBulkConfirm(null);
    } catch (err) {
      handleError(err);
      setBulkConfirm(null);
    }
  };

  const handleExport = async () => {
    setActionError(null);
    try {
      await users.exportUsers();
      notifySuccess('Users exported to CSV.');
    } catch (err) {
      handleError(err);
    }
  };

  if (roleLoading) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Verifying admin permissions…" />
      </AdminPageShell>
    );
  }

  if (!canManage) {
    return (
      <AdminPageShell>
        <AdminPermissionDenied permission="manage_users" />
      </AdminPageShell>
    );
  }

  if (users.loading) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Loading user management center…" />
      </AdminPageShell>
    );
  }

  const hasSelection = users.selectedIds.length > 0;
  const assignableRoles = isSuperAdminRole(actorRole)
    ? ADMIN_USER_ROLES
    : ADMIN_USER_ROLES.filter((r) => r !== 'admin' && r !== 'super_admin');

  const headerActions: AdminPageAction[] = [
    {
      label: 'Add user',
      to: '/admin/users/create',
      variant: 'primary',
      icon: '＋',
      permission: 'manage_users',
    },
    {
      label: users.exporting ? 'Exporting…' : 'Export users',
      onClick: handleExport,
      variant: 'secondary',
      disabled: users.exporting,
      permission: 'manage_users',
    },
    {
      label: users.refreshing ? 'Refreshing…' : 'Refresh',
      onClick: users.refresh,
      variant: 'secondary',
      disabled: users.refreshing,
    },
  ];

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="User Management"
        subtitle="Enterprise user operations — roles, status, security posture, and audit visibility."
        breadcrumbs={adminBreadcrumbsFor('/admin/users')}
        actions={filterActions(headerActions)}
      />

      <div className="admin-careers-toolbar-links">
        <span className="admin-last-updated">Updated {users.lastUpdated.toLocaleTimeString()}</span>
      </div>

      <UserManagementStats stats={users.stats} />

      <UserManagementFilters
        search={users.search}
        roleFilter={users.roleFilter}
        statusFilter={users.statusFilter}
        planFilter={users.planFilter}
        twoFactorFilter={users.twoFactorFilter}
        dateFrom={users.dateFrom}
        dateTo={users.dateTo}
        total={users.stats.total}
        filteredTotal={users.pagination.total}
        onSearchChange={users.setSearch}
        onRoleChange={users.setRoleFilter}
        onStatusChange={users.setStatusFilter}
        onPlanChange={users.setPlanFilter}
        onTwoFactorChange={users.setTwoFactorFilter}
        onDateFromChange={users.setDateFrom}
        onDateToChange={users.setDateTo}
        onClear={users.resetFilters}
      />

      {success ? <div className="admin-alert admin-alert--success">{success}</div> : null}
      {users.error || actionError ? (
        <div className="admin-alert admin-alert--danger">{users.error || actionError}</div>
      ) : null}

      {hasSelection ? (
        <div className="admin-bulk-bar">
          <span>{users.selectedIds.length} selected</span>
          <button
            type="button"
            className="admin-btn admin-btn--secondary admin-btn--xs"
            disabled={users.bulkLoading}
            onClick={() => setBulkConfirm('activate')}
          >
            Bulk Activate
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-btn--xs"
            disabled={users.bulkLoading}
            onClick={() => setBulkConfirm('suspend')}
          >
            Bulk Suspend
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-btn--xs"
            disabled={users.bulkLoading}
            onClick={() => setBulkConfirm('role')}
          >
            Bulk Change Role
          </button>
        </div>
      ) : null}

      <div className="admin-section-card admin-list-card">
        <UserManagementTable
          rows={users.rows}
          loading={users.refreshing}
          selectedIds={users.selectedIds}
          allSelected={users.allSelected}
          actionLoading={users.actionLoading}
          onToggleSelect={users.toggleSelected}
          onToggleSelectAll={users.toggleSelectAll}
          onAction={handleRowAction}
        />
      </div>

      <AdminPagination
        page={users.pagination.page}
        totalPages={users.pagination.totalPages}
        canPrev={users.pagination.canPrev}
        canNext={users.pagination.canNext}
        onPrev={users.pagination.goPrev}
        onNext={users.pagination.goNext}
        loading={users.refreshing}
      />

      <UserProfileDrawer
        open={!!drawerUser}
        user={drawerUser}
        saving={!!users.actionLoading}
        onClose={() => setDrawerUser(null)}
        onUpdateRole={users.updateRole}
        onUpdateStatus={users.updateStatus}
      />

      <AdminConfirmDialog
        open={bulkConfirm === 'activate'}
        title="Activate selected users?"
        message={`Set ${users.selectedIds.length} user(s) to active status.`}
        confirmLabel="Activate all"
        confirming={users.bulkLoading}
        onCancel={() => setBulkConfirm(null)}
        onConfirm={handleBulkConfirm}
      />

      <AdminConfirmDialog
        open={bulkConfirm === 'suspend'}
        title="Suspend selected users?"
        message={`Suspend ${users.selectedIds.length} user(s). They may lose platform access.`}
        confirmLabel="Suspend all"
        confirming={users.bulkLoading}
        onCancel={() => setBulkConfirm(null)}
        onConfirm={handleBulkConfirm}
      />

      {bulkConfirm === 'role' ? (
        <div className="admin-dialog-overlay" role="dialog" aria-modal="true">
          <div className="admin-dialog">
            <h3>Bulk change role</h3>
            <p>Apply role to {users.selectedIds.length} selected user(s).</p>
            <label className="admin-form-field">
              <span>New role</span>
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value as AdminUserRole)}
                className="admin-projects-select"
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-dialog-actions">
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setBulkConfirm(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={users.bulkLoading}
                onClick={handleBulkConfirm}
              >
                {users.bulkLoading ? 'Updating…' : 'Apply role'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
