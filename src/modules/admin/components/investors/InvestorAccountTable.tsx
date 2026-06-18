import { memo } from 'react';
import { Link } from 'react-router-dom';
import { AdminDataTable } from '../tables/AdminDataTable';
import { AdminPlanBadge, AdminStatusBadge } from '../ui/AdminBadge';
import { investorAccountDisplayName } from '../../services/adminInvestors.service';
import type { AdminInvestorAccountRow } from '../../types/investorsAdmin.types';
import { formatAdminDate, formatAdminDateTime } from '../../utils/adminPage.utils';

export type InvestorAccountRowAction = 'view' | 'verify' | 'suspend';

interface InvestorAccountTableProps {
  rows: AdminInvestorAccountRow[];
  loading?: boolean;
  actionLoading: string | null;
  onAction: (row: AdminInvestorAccountRow, action: InvestorAccountRowAction) => void;
}

export const InvestorAccountTable = memo(function InvestorAccountTable({
  rows,
  loading,
  actionLoading,
  onAction,
}: InvestorAccountTableProps) {
  return (
    <AdminDataTable
      empty={!loading && rows.length === 0}
      emptyTitle="No investor accounts found"
      emptyMessage="Investor user accounts will appear here once users register with the investor role."
      minWidth={1000}
    >
      <thead>
        <tr>
          <th scope="col">Investor</th>
          <th scope="col">Organization</th>
          <th scope="col">Plan</th>
          <th scope="col">Status</th>
          <th scope="col">2FA</th>
          <th scope="col">Joined</th>
          <th scope="col">Last active</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const busy = actionLoading === row.id;
          const name = investorAccountDisplayName(row);
          const isPending = row.status === 'pending';

          return (
            <tr key={row.id}>
              <td>
                <div className="admin-user-cell">
                  <div className="admin-user-avatar">{name.charAt(0).toUpperCase()}</div>
                  <div>
                    <button
                      type="button"
                      className="admin-link-button"
                      onClick={() => onAction(row, 'view')}
                    >
                      {name}
                    </button>
                    <span className="admin-muted">{row.email ?? '—'}</span>
                  </div>
                </div>
              </td>
              <td>{row.organization_name || '—'}</td>
              <td>
                <AdminPlanBadge plan={row.plan} />
              </td>
              <td>
                <AdminStatusBadge status={row.status} />
              </td>
              <td>{row.two_factor_enabled ? '✓' : '—'}</td>
              <td>{formatAdminDate(row.created_at)}</td>
              <td>{formatAdminDateTime(row.last_active)}</td>
              <td>
                <div className="admin-table-actions">
                  <Link to={`/admin/users/${row.id}`} className="admin-btn admin-btn--ghost admin-btn--xs">
                    Profile
                  </Link>
                  {isPending ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--xs"
                      disabled={busy}
                      onClick={() => onAction(row, 'verify')}
                    >
                      Verify
                    </button>
                  ) : null}
                  {row.status !== 'suspended' && row.status !== 'banned' ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--xs"
                      disabled={busy}
                      onClick={() => onAction(row, 'suspend')}
                    >
                      Suspend
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
