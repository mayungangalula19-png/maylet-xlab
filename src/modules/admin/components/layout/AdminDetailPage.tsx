import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminPageShell } from './AdminPageShell';
import { AdminLoadingState } from './AdminLoadingState';
import type { AdminBreadcrumb, AdminPageAction } from '../../types/admin.types';

interface AdminDetailPageProps {
  title: string;
  subtitle?: string;
  backTo: string;
  backLabel?: string;
  breadcrumbs?: AdminBreadcrumb[];
  actions?: AdminPageAction[];
  loading?: boolean;
  error?: string | null;
  children?: ReactNode;
  /** Shown when no children and not loading — extend this page with full CRUD. */
  placeholder?: string;
}

export function AdminDetailPage({
  title,
  subtitle,
  backTo,
  backLabel = 'Back',
  breadcrumbs,
  actions,
  loading,
  error,
  children,
  placeholder,
}: AdminDetailPageProps) {
  const crumbs: AdminBreadcrumb[] = breadcrumbs ?? [
    { label: backLabel, to: backTo },
    { label: title },
  ];

  return (
    <AdminPageShell>
      <Link to={backTo} className="admin-back-link">
        ← {backLabel}
      </Link>

      <AdminPageHeader title={title} subtitle={subtitle} breadcrumbs={crumbs} actions={actions} />

      {error ? <div className="admin-alert admin-alert--danger">{error}</div> : null}

      {loading ? (
        <AdminLoadingState label={`Loading ${title.toLowerCase()}…`} />
      ) : children ? (
        <div className="admin-detail-body">{children}</div>
      ) : (
        <div className="admin-section-card admin-detail-placeholder">
          <p>{placeholder ?? 'This admin screen is ready for full CRUD — connect services and forms here.'}</p>
        </div>
      )}
    </AdminPageShell>
  );
}
