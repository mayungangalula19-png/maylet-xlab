import { memo, useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminBadge } from '../../components/ui/AdminBadge';
import { formatAdminDateTime } from '../../utils/adminPage.utils';
import type { AdminVaultAssetRow, VaultRowAction } from '../types/vaultOpsAdmin.types';
import { classificationVariant } from '../utils/vaultOpsAdmin.utils';

const ROW_HEIGHT = 48;
const VISIBLE_ROWS = 14;

interface VaultAssetRegistryProps {
  rows: AdminVaultAssetRow[];
  loading?: boolean;
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
  onAction?: (row: AdminVaultAssetRow, action: VaultRowAction) => void;
  checked?: Set<string>;
  onCheckedChange?: (checked: Set<string>) => void;
}

export const VaultAssetRegistry = memo(function VaultAssetRegistry({
  rows,
  loading,
  selectedKey,
  onSelect,
  onAction,
  checked: controlledChecked,
  onCheckedChange,
}: VaultAssetRegistryProps) {
  const [internalChecked, setInternalChecked] = useState<Set<string>>(new Set());
  const checked = controlledChecked ?? internalChecked;
  const setChecked = onCheckedChange ?? setInternalChecked;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const toggleAll = () => {
    if (checked.size === rows.length) setChecked(new Set());
    else setChecked(new Set(rows.map((r) => r.sourceKey)));
  };

  const toggleOne = (key: string) => {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setChecked(next);
  };

  const onScroll = useCallback(() => {
    if (scrollRef.current) setScrollTop(scrollRef.current.scrollTop);
  }, []);

  const virtualEnabled = rows.length > VISIBLE_ROWS;
  const startIndex = virtualEnabled ? Math.floor(scrollTop / ROW_HEIGHT) : 0;
  const endIndex = virtualEnabled
    ? Math.min(rows.length, startIndex + VISIBLE_ROWS + 2)
    : rows.length;
  const visibleRows = rows.slice(startIndex, endIndex);
  const paddingTop = virtualEnabled ? startIndex * ROW_HEIGHT : 0;
  const paddingBottom = virtualEnabled ? rows.length * ROW_HEIGHT - endIndex * ROW_HEIGHT : 0;

  if (!loading && rows.length === 0) {
    return (
      <div className="admin-vault-registry admin-vault-glass">
        <p className="admin-muted">No assets match your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="admin-vault-registry admin-vault-glass">
      <div className="admin-vault-registry-head">
        <h3>Enterprise Asset Registry</h3>
        <p className="admin-muted">Unified knowledge repository across the innovation ecosystem</p>
      </div>

      <div
        ref={scrollRef}
        className="admin-vault-virtual-scroll"
        style={{ maxHeight: virtualEnabled ? ROW_HEIGHT * VISIBLE_ROWS + 40 : undefined }}
        onScroll={virtualEnabled ? onScroll : undefined}
      >
        <table className="admin-data-table admin-vault-table" style={{ minWidth: 1280 }}>
          <thead>
            <tr>
              <th className="admin-vault-check-col">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={rows.length > 0 && checked.size === rows.length}
                  onChange={toggleAll}
                />
              </th>
              <th>Asset ID</th>
              <th>Title</th>
              <th>Type</th>
              <th>Classification</th>
              <th>Author</th>
              <th>Department</th>
              <th>Project</th>
              <th>Stage</th>
              <th>Domain</th>
              <th>Folder</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paddingTop > 0 ? (
              <tr aria-hidden="true">
                <td colSpan={14} style={{ height: paddingTop, padding: 0, border: 'none' }} />
              </tr>
            ) : null}
            {visibleRows.map((row) => (
              <tr
                key={row.sourceKey}
                className={selectedKey === row.sourceKey ? 'admin-table-row--selected' : undefined}
                onClick={() => onSelect?.(row.sourceKey)}
                style={{ height: ROW_HEIGHT }}
              >
                <td className="admin-vault-check-col" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={checked.has(row.sourceKey)}
                    onChange={() => toggleOne(row.sourceKey)}
                    aria-label={`Select ${row.title}`}
                  />
                </td>
                <td>
                  <span className="admin-vault-id">{row.displayId}</span>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-link admin-vault-title-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction?.(row, 'preview');
                    }}
                  >
                    {row.title}
                  </button>
                </td>
                <td>
                  <span className="admin-vault-type-pill">{row.assetType.replace(/_/g, ' ')}</span>
                </td>
                <td>
                  <AdminBadge variant={classificationVariant(row.classification)}>
                    {row.classification.replace(/_/g, ' ')}
                  </AdminBadge>
                </td>
                <td>{row.authorName}</td>
                <td>{row.department}</td>
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
                <td>{row.innovationStage}</td>
                <td>{row.knowledgeDomain}</td>
                <td>{row.folder}</td>
                <td>{row.status}</td>
                <td>{formatAdminDateTime(row.updatedAt)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="admin-table-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--xs"
                      onClick={() => onAction?.(row, 'preview')}
                    >
                      Preview
                    </button>
                    {row.source === 'vault_item' || row.source === 'vault_entry' ? (
                      <Link
                        to={`/admin/vault/${row.id}`}
                        className="admin-btn admin-btn--ghost admin-btn--xs"
                      >
                        View
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {paddingBottom > 0 ? (
              <tr aria-hidden="true">
                <td colSpan={14} style={{ height: paddingBottom, padding: 0, border: 'none' }} />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
});
