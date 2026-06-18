import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageHeader } from '../layout/AdminPageHeader';
import { AdminPageShell } from '../layout/AdminPageShell';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';
import type { AdminPageAction } from '../../types/admin.types';

interface AdminSectionPageProps {
  title: string;
  route: string;
  description: string;
  actions?: AdminPageAction[];
  children?: ReactNode;
  links?: Array<{ label: string; to: string; icon?: string }>;
}

/** Standard scaffold for admin hub / settings screens not yet fully built. */
export function AdminSectionPage({
  title,
  route,
  description,
  actions,
  children,
  links,
}: AdminSectionPageProps) {
  return (
    <AdminPageShell>
      <AdminPageHeader
        title={title}
        subtitle={description}
        breadcrumbs={adminBreadcrumbsFor(route)}
        actions={actions}
      />

      {children}

      {links && links.length > 0 ? (
        <div className="admin-quick-nav-section">
          <h3>Related</h3>
          <div className="admin-quick-nav-grid">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="admin-quick-nav-card">
                {link.icon ? <span className="admin-quick-nav-icon">{link.icon}</span> : null}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
