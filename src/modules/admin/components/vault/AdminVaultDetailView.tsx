import { Link } from 'react-router-dom';
import { AdminDetailGrid, AdminDetailItem } from '../ui/AdminDetailGrid';
import { formatAdminDate, formatAdminDateTime } from '../../utils/adminPage.utils';
import type { AdminVaultDetailBundle } from '../../types/innovationAdmin.types';

interface AdminVaultDetailViewProps {
  bundle: AdminVaultDetailBundle;
}

export function AdminVaultDetailView({ bundle }: AdminVaultDetailViewProps) {
  const { item, owner } = bundle;

  return (
    <div className="admin-innovation-detail">
      <section className="admin-section-card">
        <AdminDetailGrid>
          <AdminDetailItem label="Vault item ID" value={item.id} mono />
          <AdminDetailItem label="Created" value={formatAdminDate(item.created_at)} />
          <AdminDetailItem label="Created at" value={formatAdminDateTime(item.created_at)} />
        </AdminDetailGrid>
      </section>

      <div className="admin-two-columns">
        <section className="admin-section-card">
          <h3>Content</h3>
          <p className="admin-innovation-text admin-innovation-text--pre">
            {item.content?.trim() || 'No content stored for this vault item.'}
          </p>
        </section>

        <section className="admin-section-card">
          <h3>Owner</h3>
          <div className="admin-user-cell">
            <div className="admin-user-avatar">{owner.name.charAt(0).toUpperCase()}</div>
            <div>
              <div>{owner.name}</div>
              <div className="admin-project-meta">{owner.email}</div>
              <Link to={`/admin/users/${owner.id}`} className="admin-card-link">
                View profile →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
