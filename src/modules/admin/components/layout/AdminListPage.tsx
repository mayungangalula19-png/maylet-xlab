import type { ReactNode } from 'react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminPageShell } from './AdminPageShell';
import { AdminLoadingState } from './AdminLoadingState';
import { AdminPagination } from '../ui/AdminPagination';
import { AdminSearchInput } from '../ui/AdminSearchInput';
import { AdminToolbar } from '../ui/AdminToolbar';
import type { AdminBreadcrumb, AdminPageAction } from '../../types/admin.types';

interface AdminListPageProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: AdminBreadcrumb[];
  actions?: AdminPageAction[];
  loading?: boolean;
  error?: string | null;
  total?: number;
  range?: { showingFrom: number; showingTo: number };
  page?: number;
  totalPages?: number;
  canPrev?: boolean;
  canNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  toolbarExtra?: ReactNode;
  children: ReactNode;
}

export function AdminListPage({
  title,
  subtitle,
  breadcrumbs,
  actions,
  loading,
  error,
  total = 0,
  range,
  page = 0,
  totalPages = 1,
  canPrev,
  canNext,
  onPrev,
  onNext,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  toolbarExtra,
  children,
}: AdminListPageProps) {
  const meta =
    total > 0 && range
      ? `${total.toLocaleString()} records · showing ${range.showingFrom}–${range.showingTo}`
      : `${total.toLocaleString()} records`;

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={title}
        subtitle={subtitle ?? meta}
        breadcrumbs={breadcrumbs}
        actions={actions}
      />

      {(onSearchChange || toolbarExtra) && (
        <AdminToolbar>
          {onSearchChange ? (
            <AdminSearchInput
              value={search ?? ''}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
            />
          ) : null}
          {toolbarExtra}
        </AdminToolbar>
      )}

      {error ? <div className="admin-alert admin-alert--danger">{error}</div> : null}

      {loading ? (
        <AdminLoadingState label={`Loading ${title.toLowerCase()}…`} />
      ) : (
        <>
          <div className="admin-section-card admin-list-card">{children}</div>
          {onPrev && onNext ? (
            <AdminPagination
              page={page}
              totalPages={totalPages}
              canPrev={!!canPrev}
              canNext={!!canNext}
              onPrev={onPrev}
              onNext={onNext}
              loading={loading}
            />
          ) : null}
        </>
      )}
    </AdminPageShell>
  );
}
