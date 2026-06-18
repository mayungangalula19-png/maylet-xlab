import { memo, useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminDataTable } from '../../components/tables/AdminDataTable';
import { AdminBadge } from '../../components/ui/AdminBadge';
import { formatAdminDate, formatAdminDateTime } from '../../utils/adminPage.utils';
import type { AdminPrototypeRow, PrototypeRowAction } from '../types/prototypeOpsAdmin.types';
import { prototypeStatusVariant } from '../utils/prototypeOpsAdmin.utils';

const ROW_HEIGHT = 52;
const VISIBLE_ROWS = 12;

interface PrototypeRegistryTableProps {
  rows: AdminPrototypeRow[];
  loading?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onAction?: (row: AdminPrototypeRow, action: PrototypeRowAction) => void;
  checked?: Set<string>;
  onCheckedChange?: (checked: Set<string>) => void;
}

export const PrototypeRegistryTable = memo(function PrototypeRegistryTable({
  rows,
  loading,
  selectedId,
  onSelect,
  onAction,
  checked: controlledChecked,
  onCheckedChange,
}: PrototypeRegistryTableProps) {
  const [internalChecked, setInternalChecked] = useState<Set<string>>(new Set());
  const checked = controlledChecked ?? internalChecked;
  const setChecked = onCheckedChange ?? setInternalChecked;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const toggleAll = () => {
    if (checked.size === rows.length) setChecked(new Set());
    else setChecked(new Set(rows.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  };

  const onScroll = useCallback(() => {
    if (scrollRef.current) setScrollTop(scrollRef.current.scrollTop);
  }, []);

  const virtualEnabled = rows.length > VISIBLE_ROWS;
  const totalHeight = rows.length * ROW_HEIGHT;
  const startIndex = virtualEnabled ? Math.floor(scrollTop / ROW_HEIGHT) : 0;
  const endIndex = virtualEnabled
    ? Math.min(rows.length, startIndex + VISIBLE_ROWS + 2)
    : rows.length;
  const visibleRows = rows.slice(startIndex, endIndex);
  const paddingTop = virtualEnabled ? startIndex * ROW_HEIGHT : 0;
  const paddingBottom = virtualEnabled ? totalHeight - endIndex * ROW_HEIGHT : 0;

  return (
    <div className="admin-prototype-registry admin-prototype-glass">
      <div className="admin-prototype-registry-head">
        <div>
          <h3>Enterprise Prototype Registry</h3>
          <p className="admin-muted">
            Full portfolio · readiness · risk · validation · funding · commercialization
          </p>
        </div>
      </div>

      <AdminDataTable
        empty={!loading && rows.length === 0}
        emptyTitle="No prototypes found"
        emptyMessage="Prototypes will appear here once innovators create them."
        minWidth={1400}
      >
        <thead>
          <tr>
            <th scope="col" className="admin-prototype-check-col">
              <input
                type="checkbox"
                aria-label="Select all prototypes"
                checked={rows.length > 0 && checked.size === rows.length}
                onChange={toggleAll}
              />
            </th>
            <th scope="col">Prototype ID</th>
            <th scope="col">Name</th>
            <th scope="col">Parent Project</th>
            <th scope="col">Research Program</th>
            <th scope="col">Department</th>
            <th scope="col">Owner</th>
            <th scope="col">Tech Lead</th>
            <th scope="col">Ver.</th>
            <th scope="col">Stage</th>
            <th scope="col">Status</th>
            <th scope="col">Ready</th>
            <th scope="col">Risk</th>
            <th scope="col">Val.</th>
            <th scope="col">Fund</th>
            <th scope="col">Comm.</th>
            <th scope="col">Last Activity</th>
            <th scope="col">Created</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
      </AdminDataTable>

      {!loading && rows.length > 0 ? (
        <div
          ref={scrollRef}
          className="admin-prototype-virtual-scroll"
          style={{ maxHeight: virtualEnabled ? ROW_HEIGHT * VISIBLE_ROWS : undefined }}
          onScroll={virtualEnabled ? onScroll : undefined}
        >
          <table className="admin-data-table admin-prototype-virtual-table" style={{ minWidth: 1400 }}>
            <tbody>
              {paddingTop > 0 ? (
                <tr aria-hidden="true">
                  <td colSpan={19} style={{ height: paddingTop, padding: 0, border: 'none' }} />
                </tr>
              ) : null}
              {visibleRows.map((row) => (
                <tr
                  key={row.id}
                  className={selectedId === row.id ? 'admin-table-row--selected' : undefined}
                  onClick={() => onSelect?.(row.id)}
                  style={{ height: ROW_HEIGHT }}
                >
                  <td className="admin-prototype-check-col" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.name}`}
                      checked={checked.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                    />
                  </td>
                  <td>
                    <span className="admin-prototype-id">{row.displayId}</span>
                  </td>
                  <td>
                    <Link
                      to={`/admin/prototypes/${row.id}`}
                      className="admin-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td>
                    {row.parentProjectId ? (
                      <Link
                        to={`/admin/projects/${row.parentProjectId}`}
                        className="admin-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {row.parentProjectName ?? 'Project'}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{row.researchProgram ?? '—'}</td>
                  <td>{row.department}</td>
                  <td>{row.ownerName}</td>
                  <td>{row.technicalLead}</td>
                  <td>v{row.version}</td>
                  <td>
                    <span className="admin-prototype-stage-pill">
                      {row.executiveStage.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <AdminBadge variant={prototypeStatusVariant(row.status)}>{row.status}</AdminBadge>
                  </td>
                  <td>
                    <ScoreCell value={row.readinessScore} good={70} />
                  </td>
                  <td>
                    <span className={`admin-prototype-risk-pill admin-prototype-risk-pill--${row.riskLevel}`}>
                      {row.riskScore}
                    </span>
                  </td>
                  <td>
                    <ScoreCell value={row.validationScore} good={65} />
                  </td>
                  <td>
                    <ScoreCell value={row.fundingScore} good={60} />
                  </td>
                  <td>
                    <ScoreCell value={row.commercializationScore} good={70} />
                  </td>
                  <td>{formatAdminDateTime(row.lastActivity)}</td>
                  <td>{formatAdminDate(row.createdAt)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="admin-table-actions">
                      <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" onClick={() => onAction?.(row, 'view')}>
                        View
                      </button>
                      <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" onClick={() => onAction?.(row, 'edit')}>
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paddingBottom > 0 ? (
                <tr aria-hidden="true">
                  <td colSpan={19} style={{ height: paddingBottom, padding: 0, border: 'none' }} />
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
});

function ScoreCell({ value, good }: { value: number; good: number }) {
  return (
    <span className={`admin-prototype-score ${value >= good ? 'admin-prototype-score--good' : ''}`}>
      {value}
    </span>
  );
}