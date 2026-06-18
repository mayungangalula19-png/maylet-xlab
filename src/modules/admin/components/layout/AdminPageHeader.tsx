import { Link } from 'react-router-dom';
import { AdminButton } from '../ui/AdminButton';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import type { AdminBreadcrumb, AdminPageAction } from '../../types/admin.types';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: AdminBreadcrumb[];
  actions?: AdminPageAction[];
}

export function AdminPageHeader({ title, subtitle, breadcrumbs, actions }: AdminPageHeaderProps) {
  const { filterActions } = useAdminPermissions();
  const visibleActions = filterActions(actions);

  return (
    <header className="admin-page-header">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="admin-breadcrumb-item">
              {index > 0 ? <span className="admin-breadcrumb-sep">/</span> : null}
              {crumb.to ? (
                <Link to={crumb.to} className="admin-breadcrumb-link">
                  {crumb.label}
                </Link>
              ) : (
                <span className="admin-breadcrumb-current">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="admin-page-header-row">
        <div>
          <h1 className="admin-page-title">{title}</h1>
          {subtitle ? <p className="admin-page-subtitle">{subtitle}</p> : null}
        </div>

        {visibleActions && visibleActions.length > 0 ? (
          <div className="admin-page-actions">
            {visibleActions.map((action) => (
              <AdminButton
                key={action.label}
                variant={action.variant ?? 'secondary'}
                to={action.to}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon ? `${action.icon} ` : ''}
                {action.label}
              </AdminButton>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
