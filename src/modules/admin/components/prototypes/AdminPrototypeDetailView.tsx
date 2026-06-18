import { Link } from 'react-router-dom';
import { AdminBadge } from '../ui/AdminBadge';
import { AdminDetailGrid, AdminDetailItem } from '../ui/AdminDetailGrid';
import { formatAdminDate, formatAdminDateTime } from '../../utils/adminPage.utils';
import type { AdminPrototypeDetailBundle } from '../../types/innovationAdmin.types';

interface AdminPrototypeDetailViewProps {
  bundle: AdminPrototypeDetailBundle;
}

export function AdminPrototypeDetailView({ bundle }: AdminPrototypeDetailViewProps) {
  const { prototype, owner, fileCount } = bundle;

  return (
    <div className="admin-innovation-detail">
      <section className="admin-section-card">
        <div className="admin-innovation-header">
          <div className="admin-innovation-badges">
            <AdminBadge variant="info">{prototype.status}</AdminBadge>
            <AdminBadge variant="default">v{prototype.version}</AdminBadge>
          </div>
          <div className="admin-innovation-scores">
            <Score label="Views" value={String(prototype.views)} />
            <Score label="Downloads" value={String(prototype.downloads)} />
            <Score label="Files" value={String(fileCount)} />
          </div>
        </div>

        <AdminDetailGrid>
          <AdminDetailItem label="Prototype ID" value={prototype.id} mono />
          <AdminDetailItem label="Created" value={formatAdminDate(prototype.created_at)} />
          <AdminDetailItem label="Updated" value={formatAdminDateTime(prototype.updated_at)} />
          <AdminDetailItem label="Project" value={prototype.project_name ?? '—'} />
        </AdminDetailGrid>
      </section>

      <div className="admin-two-columns">
        <section className="admin-section-card">
          <h3>Description</h3>
          <p className="admin-innovation-text">
            {prototype.description || 'No description provided.'}
          </p>

          {prototype.thumbnail_url ? (
            <div className="admin-prototype-preview">
              <img src={prototype.thumbnail_url} alt="" className="admin-prototype-thumb" />
            </div>
          ) : null}

          {prototype.file_url ? (
            <p>
              <a href={prototype.file_url} target="_blank" rel="noreferrer" className="admin-action-link">
                Open prototype file →
              </a>
            </p>
          ) : null}
        </section>

        <div className="admin-project-detail-col">
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

          {prototype.project_id ? (
            <section className="admin-section-card">
              <h3>Linked project</h3>
              <p>{prototype.project_name}</p>
              <Link to={`/admin/projects/${prototype.project_id}`} className="admin-card-link">
                Open project →
              </Link>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-innovation-score">
      <div className="admin-innovation-score-value">{value}</div>
      <div className="admin-quick-stat-label">{label}</div>
    </div>
  );
}
