import { memo } from 'react';
import { Link } from 'react-router-dom';
import { AdminDataTable } from '../tables/AdminDataTable';
import { AdminBadge } from '../ui/AdminBadge';
import {
  fundingStageLabel,
  fundingStatusLabel,
  fundingStatusVariant,
  type AdminFundingRow,
} from '../../types/fundingAdmin.types';
import { formatAdminCurrency, formatAdminDate } from '../../utils/adminPage.utils';

export type FundingRowAction =
  | 'view'
  | 'edit'
  | 'review'
  | 'fund'
  | 'decline'
  | 'delete';

interface FundingManagementTableProps {
  rows: AdminFundingRow[];
  loading?: boolean;
  actionLoading: string | null;
  deletingId: string | null;
  canDelete: boolean;
  onAction: (pitch: AdminFundingRow, action: FundingRowAction) => void;
}

export const FundingManagementTable = memo(function FundingManagementTable({
  rows,
  loading,
  actionLoading,
  deletingId,
  canDelete,
  onAction,
}: FundingManagementTableProps) {
  return (
    <AdminDataTable
      empty={!loading && rows.length === 0}
      emptyTitle="No funding pitches found"
      emptyMessage="Pitches will appear here once innovators submit them."
      minWidth={1100}
    >
      <thead>
        <tr>
          <th scope="col">Pitch</th>
          <th scope="col">Founder</th>
          <th scope="col">Project</th>
          <th scope="col">Amount</th>
          <th scope="col">Equity</th>
          <th scope="col">Stage</th>
          <th scope="col">Status</th>
          <th scope="col">Applications</th>
          <th scope="col">Created</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((pitch) => {
          const busy = actionLoading === pitch.id || deletingId === pitch.id;
          return (
            <tr key={pitch.id}>
              <td>
                <div className="admin-funding-title-cell">
                  <Link to={`/funding/${pitch.id}`} className="admin-link">
                    {pitch.title}
                  </Link>
                  <span className="admin-funding-industry-tag">{pitch.industry}</span>
                </div>
              </td>
              <td>
                <div className="admin-funding-founder-cell">
                  <span>{pitch.founder_name}</span>
                  <span className="admin-muted">{pitch.founder_email}</span>
                </div>
              </td>
              <td>
                {pitch.project_id ? (
                  <Link to={`/admin/projects/${pitch.project_id}`} className="admin-link">
                    {pitch.project_name ?? 'Project'}
                  </Link>
                ) : (
                  '—'
                )}
              </td>
              <td>{formatAdminCurrency(pitch.amount)}</td>
              <td>{pitch.equity_offered > 0 ? `${pitch.equity_offered}%` : 'Grant'}</td>
              <td>
                <AdminBadge variant="info">{fundingStageLabel(pitch.stage)}</AdminBadge>
              </td>
              <td>
                <AdminBadge variant={fundingStatusVariant(pitch.status)}>
                  {fundingStatusLabel(pitch.status)}
                </AdminBadge>
              </td>
              <td>{pitch.application_count}</td>
              <td>{formatAdminDate(pitch.created_at)}</td>
              <td>
                <div className="admin-table-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--xs"
                    disabled={busy}
                    onClick={() => onAction(pitch, 'view')}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--xs"
                    disabled={busy}
                    onClick={() => onAction(pitch, 'edit')}
                  >
                    Edit
                  </button>
                  {pitch.status === 'submitted' ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--xs"
                      disabled={busy}
                      onClick={() => onAction(pitch, 'review')}
                    >
                      Review
                    </button>
                  ) : null}
                  {pitch.status === 'under_review' ? (
                    <>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost admin-btn--xs"
                        disabled={busy}
                        onClick={() => onAction(pitch, 'fund')}
                      >
                        Fund
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost admin-btn--xs"
                        disabled={busy}
                        onClick={() => onAction(pitch, 'decline')}
                      >
                        Decline
                      </button>
                    </>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger admin-btn--xs"
                      disabled={busy}
                      onClick={() => onAction(pitch, 'delete')}
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
