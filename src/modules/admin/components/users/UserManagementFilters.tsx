import { memo } from 'react';
import {
  ADMIN_USER_PLANS,
  ADMIN_USER_ROLES,
  ADMIN_USER_STATUSES,
  type AdminUserFilters,
} from '../../types/userAdmin.types';

interface UserManagementFiltersProps {
  search: string;
  roleFilter: AdminUserFilters['role'];
  statusFilter: AdminUserFilters['status'];
  planFilter: AdminUserFilters['plan'];
  twoFactorFilter: AdminUserFilters['twoFactor'];
  dateFrom: string;
  dateTo: string;
  total: number;
  filteredTotal: number;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: AdminUserFilters['role']) => void;
  onStatusChange: (value: AdminUserFilters['status']) => void;
  onPlanChange: (value: AdminUserFilters['plan']) => void;
  onTwoFactorChange: (value: AdminUserFilters['twoFactor']) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClear: () => void;
}

export const UserManagementFilters = memo(function UserManagementFilters({
  search,
  roleFilter,
  statusFilter,
  planFilter,
  twoFactorFilter,
  dateFrom,
  dateTo,
  total,
  filteredTotal,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onPlanChange,
  onTwoFactorChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: UserManagementFiltersProps) {
  const hasFilters =
    search ||
    roleFilter !== 'all' ||
    statusFilter !== 'all' ||
    planFilter !== 'all' ||
    twoFactorFilter !== 'all' ||
    dateFrom ||
    dateTo;

  return (
    <>
      <div className="admin-projects-filters admin-users-filters">
        <div className="admin-search admin-projects-search">
          <span className="admin-search-icon" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search name, email, organization…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search users"
          />
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-user-role">Role</label>
          <select
            id="admin-user-role"
            className="admin-projects-select"
            value={roleFilter}
            onChange={(e) => onRoleChange(e.target.value as AdminUserFilters['role'])}
          >
            <option value="all">All roles</option>
            {ADMIN_USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-user-status">Status</label>
          <select
            id="admin-user-status"
            className="admin-projects-select"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as AdminUserFilters['status'])}
          >
            <option value="all">All statuses</option>
            {ADMIN_USER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-user-plan">Plan</label>
          <select
            id="admin-user-plan"
            className="admin-projects-select"
            value={planFilter}
            onChange={(e) => onPlanChange(e.target.value as AdminUserFilters['plan'])}
          >
            <option value="all">All plans</option>
            {ADMIN_USER_PLANS.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-user-2fa">2FA</label>
          <select
            id="admin-user-2fa"
            className="admin-projects-select"
            value={twoFactorFilter}
            onChange={(e) => onTwoFactorChange(e.target.value as AdminUserFilters['twoFactor'])}
          >
            <option value="all">All</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-user-from">Joined from</label>
          <input
            id="admin-user-from"
            type="date"
            className="admin-projects-select admin-careers-date-input"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-user-to">Joined to</label>
          <input
            id="admin-user-to"
            type="date"
            className="admin-projects-select admin-careers-date-input"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-projects-results">
        <span>
          Showing {filteredTotal.toLocaleString()} of {total.toLocaleString()} users
        </span>
        {hasFilters ? (
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onClear}>
            Clear filters
          </button>
        ) : null}
      </div>
    </>
  );
});
