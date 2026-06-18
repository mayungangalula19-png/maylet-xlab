import { memo } from 'react';
import { Link } from 'react-router-dom';
import { AdminDataTable } from '../tables/AdminDataTable';
import { AdminPlanBadge, AdminRoleBadge, AdminStatusBadge } from '../ui/AdminBadge';
import type { AdminProfileRow } from '../../services/adminUsers.service';
import { profileDisplayName } from '../../services/adminUsers.service';
import { formatAdminDate, formatAdminDateTime } from '../../utils/adminPage.utils';

export type UserRowAction = 'view' | 'edit' | 'activate' | 'suspend';

interface UserManagementTableProps {
  rows: AdminProfileRow[];
  loading?: boolean;
  selectedIds: string[];
  allSelected: boolean;
  actionLoading: string | null;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onAction: (user: AdminProfileRow, action: UserRowAction) => void;
}

function securityLevel(row: AdminProfileRow): { label: string; variant: 'ok' | 'warn' | 'danger' } {
  if (row.status === 'banned' || row.status === 'suspended') {
    return { label: 'Restricted', variant: 'danger' };
  }
  if (row.role === 'admin' || row.role === 'super_admin') {
    return { label: 'Elevated', variant: 'warn' };
  }
  if (row.two_factor_enabled) {
    return { label: 'Secured', variant: 'ok' };
  }
  return { label: 'Standard', variant: 'ok' };
}

function lastActiveWarning(lastActive: string | null | undefined): boolean {
  if (!lastActive) return true;
  const days = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
  return days > 90;
}

export const UserManagementTable = memo(function UserManagementTable({
  rows,
  loading,
  selectedIds,
  allSelected,
  actionLoading,
  onToggleSelect,
  onToggleSelectAll,
  onAction,
}: UserManagementTableProps) {
  return (
    <AdminDataTable
      empty={!loading && rows.length === 0}
      emptyTitle="No users found"
      emptyMessage="Try adjusting filters or add a user from the header."
      minWidth={1100}
    >
      <thead>
        <tr>
          <th scope="col" className="admin-careers-col-check">
            <input
              type="checkbox"
              aria-label="Select all users on this page"
              checked={allSelected}
              onChange={onToggleSelectAll}
            />
          </th>
          <th scope="col">User</th>
          <th scope="col">Role</th>
          <th scope="col">Plan</th>
          <th scope="col">Status</th>
          <th scope="col">Security</th>
          <th scope="col">Joined</th>
          <th scope="col">Last active</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((user) => {
          const busy = actionLoading === user.id;
          const name = profileDisplayName(user);
          const security = securityLevel(user);
          const stale = lastActiveWarning(user.last_active);

          return (
            <tr key={user.id} className={selectedIds.includes(user.id) ? 'admin-row-selected' : ''}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${name}`}
                  checked={selectedIds.includes(user.id)}
                  onChange={() => onToggleSelect(user.id)}
                />
              </td>
              <td>
                <div className="admin-user-cell">
                  <div className="admin-user-avatar">{name.charAt(0).toUpperCase()}</div>
                  <div>
                    <button
                      type="button"
                      className="admin-link-button"
                      onClick={() => onAction(user, 'view')}
                    >
                      {name}
                    </button>
                    <div className="admin-project-meta">{user.email || '—'}</div>
                    {user.organization_name ? (
                      <div className="admin-project-meta">{user.organization_name}</div>
                    ) : null}
                  </div>
                </div>
              </td>
              <td>
                <AdminRoleBadge role={user.role} />
              </td>
              <td>
                <AdminPlanBadge plan={user.plan} />
              </td>
              <td>
                <AdminStatusBadge status={user.status ?? 'active'} />
              </td>
              <td>
                <span className={`admin-security-pill admin-security-pill--${security.variant}`}>
                  {security.label}
                  {user.two_factor_enabled ? ' · 2FA' : ''}
                </span>
              </td>
              <td>{formatAdminDate(user.created_at)}</td>
              <td className={stale ? 'admin-text-warn' : undefined} title={formatAdminDateTime(user.last_active)}>
                {user.last_active ? formatAdminDate(user.last_active) : 'Never'}
              </td>
              <td>
                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--xs"
                    disabled={busy}
                    onClick={() => onAction(user, 'view')}
                  >
                    View
                  </button>
                  <Link to={`/admin/users/${user.id}/edit`} className="admin-action-link">
                    Edit
                  </Link>
                  {user.status !== 'active' ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--xs"
                      disabled={busy}
                      onClick={() => onAction(user, 'activate')}
                    >
                      Activate
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--xs"
                      disabled={busy}
                      onClick={() => onAction(user, 'suspend')}
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </AdminDataTable>
  );
});
