import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminDataTable } from '../../components/tables/AdminDataTable';
import { AdminBadge } from '../../components/ui/AdminBadge';
import { formatAdminCurrency } from '../../utils/adminPage.utils';
import type { AdminExperimentRow, ExperimentRowAction } from '../types/experimentOpsAdmin.types';
import {
  experimentStatusVariant,
  riskLevelLabel,
} from '../utils/experimentOpsAdmin.utils';

interface ExperimentRegistryTableProps {
  rows: AdminExperimentRow[];
  loading?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onAction?: (row: AdminExperimentRow, action: ExperimentRowAction) => void;
}

export const ExperimentRegistryTable = memo(function ExperimentRegistryTable({
  rows,
  loading,
  selectedId,
  onSelect,
  onAction,
}: ExperimentRegistryTableProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleAll = () => {
    if (checked.size === rows.length) setChecked(new Set());
    else setChecked(new Set(rows.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="admin-experiment-registry admin-experiment-glass">
      <div className="admin-experiment-registry-head">
        <div>
          <h3>Enterprise Experiment Registry</h3>
          <p className="admin-muted">Full portfolio · risk · validation · budget tracking</p>
        </div>
      </div>
      <AdminDataTable
        empty={!loading && rows.length === 0}
        emptyTitle="No experiments found"
        emptyMessage="Experiments will appear here once researchers create them."
        minWidth={1050}
      >
        <thead>
          <tr>
            <th scope="col" className="admin-experiment-check-col">
              <input
                type="checkbox"
                aria-label="Select all experiments"
                checked={rows.length > 0 && checked.size === rows.length}
                onChange={toggleAll}
              />
            </th>
            <th scope="col">Experiment ID</th>
            <th scope="col">Title</th>
            <th scope="col">Project</th>
            <th scope="col">Lead Researcher</th>
            <th scope="col">Risk Level</th>
            <th scope="col">Val. Score</th>
            <th scope="col">Budget</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={selectedId === row.id ? 'admin-table-row--selected' : undefined}
              onClick={() => onSelect?.(row.id)}
            >
              <td className="admin-experiment-check-col" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  aria-label={`Select ${row.title}`}
                  checked={checked.has(row.id)}
                  onChange={() => toggleOne(row.id)}
                />
              </td>
              <td>
                <span className="admin-experiment-id">{row.displayId}</span>
              </td>
              <td>
                <div className="admin-experiment-title-cell">
                  <Link
                    to={`/admin/experiments/${row.id}`}
                    className="admin-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {row.title}
                  </Link>
                </div>
              </td>
              <td>
                {row.projectId ? (
                  <Link
                    to={`/admin/projects/${row.projectId}`}
                    className="admin-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {row.projectName ?? 'Project'}
                  </Link>
                ) : (
                  '—'
                )}
              </td>
              <td>
                <div className="admin-experiment-researcher-cell">
                  <span>{row.leadResearcher}</span>
                </div>
              </td>
              <td>
                <span className={`admin-experiment-risk-pill admin-experiment-risk-pill--${row.riskLevel}`}>
                  {riskLevelLabel(row.riskLevel)}
                </span>
              </td>
              <td>
                <span
                  className={`admin-experiment-val-score ${row.validationScore >= 70 ? 'admin-experiment-val-score--good' : ''}`}
                >
                  {(row.validationScore / 10).toFixed(1)}
                </span>
              </td>
              <td>{formatAdminCurrency(row.budget)}</td>
              <td>
                <AdminBadge variant={experimentStatusVariant(row.status)}>{row.status}</AdminBadge>
              </td>
              <td>
                <div className="admin-table-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--sm"
                    onClick={() => onAction?.(row, 'view')}
                  >
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminDataTable>
    </div>
  );
});
