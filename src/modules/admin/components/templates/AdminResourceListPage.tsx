import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AdminListPage } from '../layout/AdminListPage';
import { AdminDataTable } from '../tables/AdminDataTable';
import { AdminRoleBadge, AdminStatusBadge } from '../ui/AdminBadge';
import { useAdminList } from '../../hooks/useAdminList';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';
import { formatAdminDate, displayName } from '../../utils/adminPage.utils';
import type { AdminProfileRow } from '../../services/adminUsers.service';

const PROFILE_LIST_SEARCH_FIELDS = ['full_name', 'email'] as const;

interface AdminProfileListPageProps {
  title: string;
  listRoute: string;
  detailRoute: (id: string) => string;
  role?: string;
  createRoute?: string;
  createLabel?: string;
}

export function AdminProfileListPage({
  title,
  listRoute,
  detailRoute,
  role,
  createRoute,
  createLabel = 'Create',
}: AdminProfileListPageProps) {
  const { rows, loading, error, search, onSearchChange, pagination } = useAdminList<AdminProfileRow>({
    table: 'profiles',
    select: 'id, full_name, email, role, plan, status, created_at',
    filters: role ? { role } : undefined,
    searchFields: PROFILE_LIST_SEARCH_FIELDS,
  });

  const { can } = useAdminPermissions();
  const actions =
    createRoute && can('manage_users')
      ? [{ label: createLabel, to: createRoute, variant: 'primary' as const, icon: '＋' }]
      : undefined;

  return (
    <AdminListPage
      title={title}
      breadcrumbs={adminBreadcrumbsFor(listRoute)}
      actions={actions}
      loading={loading}
      error={error}
      total={pagination.total}
      range={{
        showingFrom: pagination.range.showingFrom,
        showingTo: pagination.range.showingTo,
      }}
      page={pagination.page}
      totalPages={pagination.totalPages}
      canPrev={pagination.canPrev}
      canNext={pagination.canNext}
      onPrev={pagination.goPrev}
      onNext={pagination.goNext}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={`Search ${title.toLowerCase()}…`}
    >
      <AdminDataTable empty={!loading && rows.length === 0} emptyTitle={`No ${title.toLowerCase()} yet`}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="admin-user-cell">
                <ProfileAvatar name={displayName(row.full_name, row.email)} />
                <span>{displayName(row.full_name, row.email)}</span>
              </td>
              <td>{row.email || '—'}</td>
              <td>
                <AdminRoleBadge role={row.role} />
              </td>
              <td>
                <AdminStatusBadge status={row.status} />
              </td>
              <td>{formatAdminDate(row.created_at)}</td>
              <td>
                <Link to={detailRoute(row.id)} className="admin-action-link">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminDataTable>
    </AdminListPage>
  );
}

function ProfileAvatar({ name }: { name: string }) {
  return <div className="admin-user-avatar">{name.charAt(0).toUpperCase()}</div>;
}

interface AdminEntityListPageProps<T extends { id: string }> {
  title: string;
  listRoute: string;
  table: string;
  select: string;
  detailRoute: (id: string) => string;
  columns: Array<{
    header: string;
    render: (row: T) => ReactNode;
  }>;
  searchFields?: (keyof T & string)[];
  filters?: Record<string, string | number | boolean>;
}

export function AdminEntityListPage<T extends { id: string }>({
  title,
  listRoute,
  table,
  select,
  detailRoute,
  columns,
  searchFields,
  filters,
}: AdminEntityListPageProps<T>) {
  const { rows, loading, error, search, onSearchChange, pagination } = useAdminList<T>({
    table,
    select,
    filters,
    searchFields,
  });

  return (
    <AdminListPage
      title={title}
      breadcrumbs={adminBreadcrumbsFor(listRoute)}
      loading={loading}
      error={error}
      total={pagination.total}
      range={{
        showingFrom: pagination.range.showingFrom,
        showingTo: pagination.range.showingTo,
      }}
      page={pagination.page}
      totalPages={pagination.totalPages}
      canPrev={pagination.canPrev}
      canNext={pagination.canNext}
      onPrev={pagination.goPrev}
      onNext={pagination.goNext}
      search={searchFields ? search : undefined}
      onSearchChange={searchFields ? onSearchChange : undefined}
      searchPlaceholder={`Search ${title.toLowerCase()}…`}
    >
      <AdminDataTable empty={!loading && rows.length === 0}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.header}>{col.header}</th>
            ))}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.header}>{col.render(row)}</td>
              ))}
              <td>
                <Link to={detailRoute(row.id)} className="admin-action-link">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminDataTable>
    </AdminListPage>
  );
}
