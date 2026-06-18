import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPermissionDenied } from '../../components/AdminPermissionDenied';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { AdminLoadingState } from '../../components/layout/AdminLoadingState';
import { AdminSearchInput } from '../../components/ui/AdminSearchInput';
import { AdminToolbar } from '../../components/ui/AdminToolbar';
import { AdminPagination } from '../../components/ui/AdminPagination';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { VaultAssetRegistry } from '../../vault/components/VaultAssetRegistry';
import { VaultExplorer } from '../../vault/components/VaultExplorer';
import { VaultOpsKpis } from '../../vault/components/VaultOpsKpis';
import { VaultOpsPanels } from '../../vault/components/VaultOpsPanels';
import { VaultRightRail } from '../../vault/components/VaultRightRail';
import { useAdminVault } from '../../vault/hooks/useAdminVault';
import {
  buildKnowledgeGraph,
  extractApprovalItems,
  bulkArchiveVaultAssets,
  requestVaultReview,
} from '../../vault/services/adminVaultOps.service';
import type { AdminVaultAssetRow, SavedVaultView, VaultRowAction } from '../../vault/types/vaultOpsAdmin.types';
import {
  ASSET_TYPE_OPTIONS,
  CLASSIFICATION_OPTIONS,
  exportVaultCsv,
  loadSavedVaultViews,
  persistSavedVaultViews,
} from '../../vault/utils/vaultOpsAdmin.utils';

const STAGE_FILTERS = [
  'all',
  'idea',
  'research',
  'prototype',
  'experiment',
  'validation',
  'funding',
  'commercialization',
] as const;

export default function AdminVault() {
  const navigate = useNavigate();
  const { can, roleLoading } = useAdminPermissions();
  const ops = useAdminVault(12);
  const [success, setSuccess] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [savedViews, setSavedViews] = useState<SavedVaultView[]>(() => loadSavedVaultViews());
  const [viewName, setViewName] = useState('');
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const breadcrumbs = useMemo(() => adminBreadcrumbsFor('/admin/vault'), []);

  const selectedForPanels = useMemo(() => {
    if (previewKey) return ops.allRows.find((r) => r.sourceKey === previewKey) ?? ops.selected;
    return ops.selected;
  }, [previewKey, ops.allRows, ops.selected]);

  const graph = useMemo(
    () => buildKnowledgeGraph(selectedForPanels, ops.allRows),
    [selectedForPanels, ops.allRows]
  );

  const approvals = useMemo(() => extractApprovalItems(ops.allRows), [ops.allRows]);

  const handleSearch = useCallback(
    (value: string) => ops.setFilters((prev) => ({ ...prev, search: value })),
    [ops]
  );

  const handleRowAction = useCallback(
    (row: AdminVaultAssetRow, action: VaultRowAction) => {
      if (action === 'preview') {
        setPreviewKey(row.sourceKey);
        ops.setSelectedKey(row.sourceKey);
      } else if (action === 'view') {
        if (row.source === 'vault_entry' || row.source === 'vault_item') {
          navigate(`/admin/vault/${row.id}`);
        } else if (row.projectId) {
          navigate(`/admin/projects/${row.projectId}`);
        }
      } else if (action === 'archive') {
        void bulkArchiveVaultAssets([row.sourceKey]).then((r) => {
          setSuccess(r.error ? r.error.message : `Archived "${row.title}"`);
          void ops.refresh();
        });
      }
    },
    [navigate, ops]
  );

  const handleExport = useCallback(() => {
    const rows =
      checked.size > 0 ? ops.allRows.filter((r) => checked.has(r.sourceKey)) : ops.allRows;
    const csv = exportVaultCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `maylet-vault-registry-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setSuccess(`Exported ${rows.length} asset(s)`);
    window.setTimeout(() => setSuccess(null), 4000);
  }, [checked, ops.allRows]);

  const handleBulkReview = useCallback(() => {
    const keys = [...checked];
    if (keys.length === 0) return;
    void Promise.all(keys.map((k) => requestVaultReview(k))).then(() => {
      setSuccess(`Review requested for ${keys.length} asset(s)`);
      void ops.refresh();
    });
  }, [checked, ops]);

  const handleSaveView = useCallback(() => {
    const name = viewName.trim() || `View ${savedViews.length + 1}`;
    const view: SavedVaultView = {
      id: `view-${Date.now()}`,
      name,
      filters: { ...ops.filters, folder: ops.explorerFolder },
    };
    const next = [...savedViews, view];
    setSavedViews(next);
    persistSavedVaultViews(next);
    setViewName('');
    setSuccess(`Saved view "${name}"`);
    window.setTimeout(() => setSuccess(null), 3000);
  }, [viewName, savedViews, ops.filters, ops.explorerFolder]);

  const applySavedView = useCallback(
    (view: SavedVaultView) => {
      ops.setFilters(view.filters);
      if (view.filters.folder) ops.setExplorerFolder(view.filters.folder);
    },
    [ops]
  );

  const handleMayaOpen = useCallback(() => {
    setSuccess('Open Messages to chat with Maya AI Knowledge Engine.');
    window.setTimeout(() => setSuccess(null), 4000);
  }, []);

  if (roleLoading) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Checking permissions…" />
      </AdminPageShell>
    );
  }

  if (!can('manage_projects')) {
    return (
      <AdminPermissionDenied message="You need manage_projects permission to access the Innovation Vault Command Center." />
    );
  }

  return (
    <AdminPageShell className="admin-vault-ops">
      <AdminPageHeader
        title="Innovation Vault Command Center"
        subtitle="MAYLET X LAB — Secure knowledge repository for ideas, research, IP, and innovation assets"
        breadcrumbs={breadcrumbs}
        actions={[
          {
            label: ops.refreshing ? 'Refreshing…' : 'Refresh',
            onClick: () => void ops.refresh(),
            variant: 'ghost',
          },
          { label: 'Export', onClick: handleExport, variant: 'ghost' },
          {
            label: '+ New Vault Entry',
            onClick: () => navigate('/vault'),
            variant: 'primary',
          },
        ]}
      />

      {success ? <p className="admin-banner admin-banner--success">{success}</p> : null}
      {ops.error ? <p className="admin-banner admin-banner--error">{ops.error}</p> : null}

      {ops.loading ? (
        <AdminLoadingState label="Loading innovation vault…" />
      ) : (
        <>
          <VaultOpsKpis stats={ops.stats} />

          <div className="admin-vault-command-layout">
            <VaultExplorer
              folders={ops.folders}
              collections={ops.collections}
              domains={ops.domains}
              activeFolder={ops.explorerFolder}
              onFolderSelect={ops.setExplorerFolder}
              onCollectionSelect={(c) =>
                ops.setFilters((prev) => ({ ...prev, collection: c === prev.collection ? 'all' : c }))
              }
              onDomainSelect={(d) =>
                ops.setFilters((prev) => ({ ...prev, domain: d === prev.domain ? 'all' : d }))
              }
            />

            <div className="admin-vault-command-main">
              <div className="admin-vault-search-bar">
                <AdminToolbar>
                  <AdminSearchInput
                    value={ops.filters.search ?? ''}
                    onChange={handleSearch}
                    placeholder="Full-text search — titles, tags, authors, content…"
                  />
                  <select
                    value={ops.filters.assetType ?? 'all'}
                    onChange={(e) =>
                      ops.setFilters((prev) => ({
                        ...prev,
                        assetType: e.target.value as (typeof ASSET_TYPE_OPTIONS)[number]['id'],
                      }))
                    }
                    aria-label="Asset type"
                  >
                    {ASSET_TYPE_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={ops.filters.classification ?? 'all'}
                    onChange={(e) =>
                      ops.setFilters((prev) => ({
                        ...prev,
                        classification: e.target.value as (typeof CLASSIFICATION_OPTIONS)[number]['id'],
                      }))
                    }
                    aria-label="Classification"
                  >
                    {CLASSIFICATION_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={ops.filters.innovationStage ?? 'all'}
                    onChange={(e) =>
                      ops.setFilters((prev) => ({
                        ...prev,
                        innovationStage: e.target.value as (typeof STAGE_FILTERS)[number],
                      }))
                    }
                    aria-label="Innovation stage"
                  >
                    {STAGE_FILTERS.map((s) => (
                      <option key={s} value={s}>
                        Stage: {s === 'all' ? 'All' : s}
                      </option>
                    ))}
                  </select>
                  <select
                    value={ops.filters.department ?? 'all'}
                    onChange={(e) =>
                      ops.setFilters((prev) => ({ ...prev, department: e.target.value }))
                    }
                    aria-label="Department"
                  >
                    <option value="all">All departments</option>
                    {ops.departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    value={ops.filters.author ?? 'all'}
                    onChange={(e) =>
                      ops.setFilters((prev) => ({ ...prev, author: e.target.value }))
                    }
                    aria-label="Author"
                  >
                    <option value="all">All authors</option>
                    {ops.authors.slice(0, 30).map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  {savedViews.length > 0 ? (
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const view = savedViews.find((v) => v.id === e.target.value);
                        if (view) applySavedView(view);
                        e.target.value = '';
                      }}
                      aria-label="Saved views"
                    >
                      <option value="" disabled>
                        Saved views…
                      </option>
                      {savedViews.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <input
                    type="text"
                    className="admin-vault-view-name"
                    placeholder="View name"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                    aria-label="Saved view name"
                  />
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={handleSaveView}>
                    Save view
                  </button>
                </AdminToolbar>
              </div>

              {checked.size > 0 ? (
                <div className="admin-vault-bulk-bar">
                  <span>{checked.size} selected</span>
                  <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" onClick={handleBulkReview}>
                    Request review
                  </button>
                  <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" onClick={handleExport}>
                    Export selected
                  </button>
                </div>
              ) : null}

              <VaultAssetRegistry
                rows={ops.rows}
                loading={ops.loading}
                selectedKey={ops.selectedKey}
                onSelect={ops.setSelectedKey}
                onAction={handleRowAction}
                checked={checked}
                onCheckedChange={setChecked}
              />

              <div className="admin-vault-table-footer">
                <p className="admin-vault-pagination-summary">
                  Showing {ops.rows.length} of {ops.totalFiltered} assets (page {ops.pagination.page + 1}/
                  {ops.pagination.totalPages})
                </p>
                <AdminPagination
                  page={ops.pagination.page}
                  totalPages={ops.pagination.totalPages}
                  canPrev={ops.pagination.canPrev}
                  canNext={ops.pagination.canNext}
                  onPrev={ops.pagination.goPrev}
                  onNext={ops.pagination.goNext}
                  loading={ops.refreshing}
                />
              </div>

              <VaultOpsPanels
                selected={selectedForPanels}
                activity={ops.activity}
                approvals={approvals}
                graphNodes={graph.nodes}
                graphEdges={graph.edges}
              />
            </div>

            <VaultRightRail
              maya={ops.maya}
              analytics={ops.analytics}
              activity={ops.activity}
              onOpenAssistant={handleMayaOpen}
            />
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
