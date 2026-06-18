import { Link } from 'react-router-dom';
import { AdminDataTable } from '../tables/AdminDataTable';
import type { AdminProjectRow } from '../../types/projectAdmin.types';
import { formatAdminDate } from '../../utils/adminPage.utils';

function sectorIcon(sector: string | null) {
  const s = sector ?? '';
  if (s.includes('Agri')) return '🌾';
  if (s.includes('Health')) return '🏥';
  if (s.includes('Education')) return '📚';
  if (s.includes('FinTech')) return '💰';
  if (s.includes('Environment')) return '🌍';
  if (s.includes('Blockchain')) return '🔗';
  if (s.includes('AI') || s.includes('ML')) return '🤖';
  if (s.includes('IoT')) return '📡';
  return '💡';
}

function statusColor(status: string) {
  switch (status) {
    case 'Idea':
      return '#f6c90e';
    case 'Experiment':
      return '#2fd4ff';
    case 'Prototype':
      return '#7c5fe6';
    case 'Launched':
      return '#48bb78';
    default:
      return '#888';
  }
}

function progressColor(progress: number) {
  if (progress < 30) return '#fc8181';
  if (progress < 70) return '#f6c90e';
  return '#48bb78';
}

interface ProjectPortfolioTableProps {
  rows: AdminProjectRow[];
  loading?: boolean;
  onDelete: (project: AdminProjectRow) => void;
  deletingId?: string | null;
  canDelete?: boolean;
}

export function ProjectPortfolioTable({
  rows,
  loading,
  onDelete,
  deletingId,
  canDelete = false,
}: ProjectPortfolioTableProps) {
  return (
    <AdminDataTable
      empty={!loading && rows.length === 0}
      emptyTitle="No projects found"
      emptyMessage="Try adjusting search or filters."
      minWidth={900}
    >
      <thead>
        <tr>
          <th>Project</th>
          <th>Owner</th>
          <th>Sector</th>
          <th>Progress</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((project) => {
          const color = statusColor(project.status);
          return (
            <tr key={project.id}>
              <td>
                <div className="admin-projects-cell">
                  <span className="admin-projects-sector-icon">{sectorIcon(project.sector)}</span>
                  <div className="admin-projects-cell-text">
                    <div className="admin-project-title">{project.name}</div>
                    <div className="admin-project-meta">
                      {project.description?.slice(0, 72) || 'No description'}
                      {project.description && project.description.length > 72 ? '…' : ''}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div className="admin-user-cell">
                  <div className="admin-user-avatar">{project.user_name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div>{project.user_name}</div>
                    <div className="admin-project-meta">{project.user_email}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className="admin-badge admin-badge--info">{project.sector || '—'}</span>
              </td>
              <td>
                <div className="admin-projects-progress">
                  <div className="admin-project-progress-bar">
                    <div
                      className="admin-progress-fill"
                      style={{ width: `${project.progress}%`, background: progressColor(project.progress) }}
                    />
                  </div>
                  <span>{project.progress}%</span>
                </div>
              </td>
              <td>
                <span className="admin-badge" style={{ background: `${color}20`, color }}>
                  {project.status}
                </span>
              </td>
              <td>{formatAdminDate(project.created_at)}</td>
              <td>
                <div className="admin-projects-actions">
                  <Link to={`/admin/projects/${project.id}`} className="admin-action-link" title="View">
                    View
                  </Link>
                  <Link to={`/admin/projects/${project.id}/review`} className="admin-action-link" title="Review">
                    Review
                  </Link>
                  {canDelete ? (
                    <button
                      type="button"
                      className="admin-action-link admin-projects-delete"
                      onClick={() => onDelete(project)}
                      disabled={deletingId === project.id}
                    >
                      {deletingId === project.id ? '…' : 'Delete'}
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </AdminDataTable>
  );
}
