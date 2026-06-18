import { memo } from 'react';
import { AdminDataTable } from '../tables/AdminDataTable';
import { AdminBadge } from '../ui/AdminBadge';
import {
  careerStatusVariant,
  careerTypeLabel,
  type AdminCareerRow,
} from '../../types/careersAdmin.types';
import { formatAdminDate, formatAdminDateTime } from '../../utils/adminPage.utils';

export type CareerRowAction =
  | 'view'
  | 'edit'
  | 'publish'
  | 'unpublish'
  | 'archive'
  | 'delete'
  | 'applications';

interface CareerManagementTableProps {
  rows: AdminCareerRow[];
  loading?: boolean;
  selectedIds: string[];
  allSelected: boolean;
  actionLoading: string | null;
  canDelete: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onAction: (career: AdminCareerRow, action: CareerRowAction) => void;
}

export const CareerManagementTable = memo(function CareerManagementTable({
  rows,
  loading,
  selectedIds,
  allSelected,
  actionLoading,
  canDelete,
  onToggleSelect,
  onToggleSelectAll,
  onAction,
}: CareerManagementTableProps) {
  return (
    <AdminDataTable
      empty={!loading && rows.length === 0}
      emptyTitle="No careers found"
      emptyMessage="Create a career opportunity or adjust your filters."
      minWidth={1100}
    >
      <thead>
        <tr>
          <th scope="col" className="admin-careers-col-check">
            <input
              type="checkbox"
              aria-label="Select all careers on this page"
              checked={allSelected}
              onChange={onToggleSelectAll}
            />
          </th>
          <th scope="col">Title</th>
          <th scope="col">Type</th>
          <th scope="col">Department</th>
          <th scope="col">Location</th>
          <th scope="col">Status</th>
          <th scope="col">Applications</th>
          <th scope="col">Created By</th>
          <th scope="col">Created</th>
          <th scope="col">Updated</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((career) => {
          const busy = actionLoading === career.id;
          return (
            <tr key={career.id} className={selectedIds.includes(career.id) ? 'admin-row-selected' : ''}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${career.title}`}
                  checked={selectedIds.includes(career.id)}
                  onChange={() => onToggleSelect(career.id)}
                />
              </td>
              <td>
                <div className="admin-careers-title-cell">
                  <button
                    type="button"
                    className="admin-link-button"
                    onClick={() => onAction(career, 'view')}
                  >
                    {career.title}
                  </button>
                  {career.is_remote ? (
                    <span className="admin-careers-remote-tag">Remote</span>
                  ) : null}
                </div>
              </td>
              <td>
                <AdminBadge variant="info">{careerTypeLabel(career.type)}</AdminBadge>
              </td>
              <td>{career.department}</td>
              <td>{career.location}</td>
              <td>
                <AdminBadge variant={careerStatusVariant(career.status)}>{career.status}</AdminBadge>
              </td>
              <td>
                <button
                  type="button"
                  className="admin-link-button"
                  onClick={() => onAction(career, 'applications')}
                >
                  {career.application_count.toLocaleString()}
                </button>
              </td>
              <td>{career.created_by_name}</td>
              <td>{formatAdminDate(career.created_at)}</td>
              <td title={formatAdminDateTime(career.updated_at)}>{formatAdminDate(career.updated_at)}</td>
              <td>
                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--xs"
                    disabled={busy}
                    onClick={() => onAction(career, 'view')}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--xs"
                    disabled={busy}
                    onClick={() => onAction(career, 'edit')}
                  >
                    Edit
                  </button>
                  {career.status !== 'published' ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--xs"
                      disabled={busy}
                      onClick={() => onAction(career, 'publish')}
                    >
                      Publish
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--xs"
                      disabled={busy}
                      onClick={() => onAction(career, 'unpublish')}
                    >
                      Unpublish
                    </button>
                  )}
                  {career.status !== 'archived' ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--xs"
                      disabled={busy}
                      onClick={() => onAction(career, 'archive')}
                    >
                      Archive
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger admin-btn--xs"
                      disabled={busy}
                      onClick={() => onAction(career, 'delete')}
                    >
                      Delete
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
});
