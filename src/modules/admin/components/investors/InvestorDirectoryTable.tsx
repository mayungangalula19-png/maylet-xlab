import { memo } from 'react';
import { AdminDataTable } from '../tables/AdminDataTable';
import { AdminBadge } from '../ui/AdminBadge';
import {
  investorDirectoryStatusVariant,
  investorTypeLabel,
  type AdminInvestorDirectoryRow,
} from '../../types/investorsAdmin.types';
import { formatAdminCurrency, formatAdminDate } from '../../utils/adminPage.utils';

export type InvestorDirectoryRowAction = 'edit' | 'toggle' | 'delete';

interface InvestorDirectoryTableProps {
  rows: AdminInvestorDirectoryRow[];
  loading?: boolean;
  actionLoading: string | null;
  deletingId: string | null;
  canDelete: boolean;
  onAction: (row: AdminInvestorDirectoryRow, action: InvestorDirectoryRowAction) => void;
}

export const InvestorDirectoryTable = memo(function InvestorDirectoryTable({
  rows,
  loading,
  actionLoading,
  deletingId,
  canDelete,
  onAction,
}: InvestorDirectoryTableProps) {
  return (
    <AdminDataTable
      empty={!loading && rows.length === 0}
      emptyTitle="No directory listings"
      emptyMessage="Add investors to the funding hub directory for pitch matching."
      minWidth={1100}
    >
      <thead>
        <tr>
          <th scope="col">Investor</th>
          <th scope="col">Type</th>
          <th scope="col">Focus</th>
          <th scope="col">Check size</th>
          <th scope="col">Applications</th>
          <th scope="col">Status</th>
          <th scope="col">Updated</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const busy = actionLoading === row.id || deletingId === row.id;
          const rangeLabel =
            row.investment_range_min === row.investment_range_max
              ? formatAdminCurrency(row.investment_range_min)
              : `${formatAdminCurrency(row.investment_range_min)} – ${formatAdminCurrency(row.investment_range_max)}`;

          return (
            <tr key={row.id}>
              <td>
                <div className="admin-investors-directory-cell">
                  <button
                    type="button"
                    className="admin-link-button"
                    onClick={() => onAction(row, 'edit')}
                  >
                    {row.name}
                  </button>
                  <span className="admin-muted">{row.contact_email || 'No email'}</span>
                </div>
              </td>
              <td>
                <AdminBadge variant="info">{investorTypeLabel(row.type)}</AdminBadge>
              </td>
              <td>
                <span className="admin-investors-industries">
                  {row.focus_industries.slice(0, 3).join(', ') || '—'}
                  {row.focus_industries.length > 3 ? '…' : ''}
                </span>
              </td>
              <td>{rangeLabel}</td>
              <td>{row.application_count}</td>
              <td>
                <AdminBadge variant={investorDirectoryStatusVariant(row.is_active)}>
                  {row.is_active ? 'Active' : 'Inactive'}
                </AdminBadge>
              </td>
              <td>{formatAdminDate(row.updated_at)}</td>
              <td>
                <div className="admin-table-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--xs"
                    disabled={busy}
                    onClick={() => onAction(row, 'edit')}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--xs"
                    disabled={busy}
                    onClick={() => onAction(row, 'toggle')}
                  >
                    {row.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger admin-btn--xs"
                      disabled={busy}
                      onClick={() => onAction(row, 'delete')}
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
