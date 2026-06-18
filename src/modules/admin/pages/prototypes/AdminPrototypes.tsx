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
import { PrototypeLifecycleBar } from '../../prototypes/components/PrototypeLifecycleBar';
import { PrototypeOpsKpis } from '../../prototypes/components/PrototypeOpsKpis';
import { PrototypeOpsPanels } from '../../prototypes/components/PrototypeOpsPanels';
import { PrototypeRegistryTable } from '../../prototypes/components/PrototypeRegistryTable';
import { PrototypeRightRail } from '../../prototypes/components/PrototypeRightRail';
import { useAdminPrototypes } from '../../prototypes/hooks/useAdminPrototypes';
import {
  bulkArchivePrototypes,
  requestPrototypeReview,
} from '../../prototypes/services/adminPrototypeOps.service';
import type { AdminPrototypeRow, PrototypeRowAction, SavedPrototypeView } from '../../prototypes/types/prototypeOpsAdmin.types';
import {
  exportPrototypesCsv,
  loadSavedViews,
  persistSavedViews,
} from '../../prototypes/utils/prototypeOpsAdmin.utils';

const RISK_FILTERS = ['all', 'low', 'medium', 'high', 'critical'] as const;
const STATUS_FILTERS = ['all', 'draft', 'building', 'testing', 'success', 'failed', 'archived'] as const;

export default function AdminPrototypes() {
  const navigate = useNavigate();
  const { can, roleLoading } = useAdminPermissions();
  const ops = useAdminPrototypes(10);
  const [success, setSuccess] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [savedViews, setSavedViews] = useState<SavedPrototypeView[]>(() => loadSavedViews());
  const [viewName, setViewName] = useState('');

  const breadcrumbs = useMemo(() => adminBreadcrumbsFor('/admin/prototypes'), []);
  const activeStage = ops.filters.executiveStage ?? 'all';

  const handleSearch = useCallback(
    (value: string) => ops.setFilters((prev) => ({ ...prev, search: value })),
    [ops]
  );

  const handleRowAction = useCallback(
    (row: AdminPrototypeRow, action: PrototypeRowAction) => {
      if (action === 'view') navigate(`/admin/prototypes/${row.id}`);
      else if (action === 'edit') navigate(`/admin/prototypes/${row.id}/edit`);
      else if (action === 'archive') {
        void bulkArchivePrototypes([row.id]).then((r) => {
          if (r.error) setSuccess(r.error.message);
          else {
            setSuccess(`Archived "${row.name}"`);
            void ops.refresh();
          }
        });
      }
    },
    [navigate, ops]
  );

  const handleExport = useCallback(() => {
    const rows = checked.size > 0 ? ops.allRows.filter((r) => checked.has(r.id)) : ops.allRows;
    const csv = exportPrototypesCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `maylet-prototype-registry-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setSuccess(`Exported ${rows.length} prototype(s)`);
    window.setTimeout(() => setSuccess(null), 4000);
  }, [checked, ops.allRows]);

  const handleBulkArchive = useCallback(() => {
    const ids = [...checked];
    if (ids.length === 0) return;
    if (!window.confirm(`Archive ${ids.length} prototype(s)?`)) return;
    void bulkArchivePrototypes(ids).then((r) => {
      if (r.error) setSuccess(r.error.message);
      else {
        setSuccess(`Archived ${ids.length} prototype(s)`);
        setChecked(new Set());
        void ops.refresh();
      }
    });
  }, [checked, ops]);

  const handleBulkReview = useCallback(() => {
    const ids = [...checked];
    if (ids.length === 0) return;
    void Promise.all(ids.map((id) => requestPrototypeReview(id))).then(() => {
      setSuccess(`Review requested for ${ids.length} prototype(s)`);
      void ops.refresh();
    });
  }, [checked, ops]);

  const handleSaveView = useCallback(() => {
    const name = viewName.trim() || `View ${savedViews.length + 1}`;
    const view: SavedPrototypeView = {
      id: `view-${Date.now()}`,
      name,
      filters: { ...ops.filters, department: ops.departmentFilter },
    };
    const next = [...savedViews, view];
    setSavedViews(next);
    persistSavedViews(next);
    setViewName('');
    setSuccess(`Saved view "${name}"`);
    window.setTimeout(() => setSuccess(null), 3000);
  }, [viewName, savedViews, ops.filters, ops.departmentFilter]);

  const applySavedView = useCallback(
    (view: SavedPrototypeView) => {
      ops.setFilters(view.filters);
      if (view.filters.department) ops.setDepartmentFilter(view.filters.department);
    },
    [ops]
  );

  const handleMayaOpen = useCallback(() => {
    setSuccess('Open Messages to chat with Maya AI Engineering Assistant.');
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
      <AdminPermissionDenied message="You need manage_projects permission to access the Prototype Operations Center." />
    );
  }

  return (
    <AdminPageShell className="admin-prototype-ops">
      <AdminPageHeader
        title="Prototype Operations Center"
        subtitle="MAYLET X LAB — Prototype governance, engineering, readiness & commercialization command center"
        breadcrumbs={breadcrumbs}
        actions={[
          {
            label: ops.refreshing ? 'Refreshing…' : 'Refresh',
            onClick: () => void ops.refresh(),
            variant: 'ghost',
          },
          { label: 'Export', onClick: handleExport, variant: 'ghost' },
          {
            label: '+ New Prototype',
            onClick: () => navigate('/prototypes/new'),
            variant: 'primary',
          },
        ]}
      />

      {success ? <p className="admin-banner admin-banner--success">{success}</p> : null}
      {ops.error ? <p className="admin-banner admin-banner--error">{ops.error}</p> : null}
      {ops.scopeWarning ? (
        <p className="admin-banner admin-banner--warning">{ops.scopeWarning}</p>
      ) : null}

      {ops.loading ? (
        <AdminLoadingState label="Loading prototype operations…" />
      ) : (
        <>
          <div className="admin-prototype-dept-filter">
            <label htmlFor="dept-filter">Department</label>
            <select
              id="dept-filter"
              value={ops.departmentFilter}
              onChange={(e) => ops.setDepartmentFilter(e.target.value)}
            >
              <option value="all">All departments</option>
              {ops.departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <PrototypeOpsKpis stats={ops.stats} department={ops.departmentFilter} />

          <PrototypeLifecycleBar
            stats={ops.stats}
            stageCounts={ops.executiveStageCounts}
            lifecycleInsights={ops.lifecycleInsights}
            activeStage={activeStage}
            onStageClick={(stage) =>
              ops.setExecutiveStageFilter(stage === activeStage ? 'all' : stage)
            }
          />

          <div className="admin-prototype-command-layout">
            <div className="admin-prototype-command-main">
              <div className="admin-prototype-ops-filters">
                <AdminToolbar>
                  <AdminSearchInput
                    value={ops.filters.search ?? ''}
                    onChange={handleSearch}
                    placeholder="Search prototypes, projects, owners, departments…"
                  />
                  <select
                    value={ops.filters.riskLevel ?? 'all'}
                    onChange={(e) =>
                      ops.setFilters((prev) => ({
                        ...prev,
                        riskLevel: e.target.value as (typeof RISK_FILTERS)[number],
                      }))
                    }
                    aria-label="Filter by risk level"
                  >
                    {RISK_FILTERS.map((r) => (
                      <option key={r} value={r}>
                        Risk: {r === 'all' ? 'All' : r}
                      </option>
                    ))}
                  </select>
                  <select
                    value={ops.filters.status ?? 'all'}
                    onChange={(e) =>
                      ops.setFilters((prev) => ({ ...prev, status: e.target.value }))
                    }
                    aria-label="Filter by status"
                  >
                    {STATUS_FILTERS.map((s) => (
                      <option key={s} value={s}>
                        Status: {s === 'all' ? 'All' : s}
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
                      aria-label="Load saved view"
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
                    className="admin-prototype-view-name"
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
                <div className="admin-prototype-bulk-bar">
                  <span>{checked.size} selected</span>
                  <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" onClick={handleBulkReview}>
                    Request review
                  </button>
                  <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" onClick={handleBulkArchive}>
                    Archive
                  </button>
                  <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" onClick={handleExport}>
                    Export selected
                  </button>
                </div>
              ) : null}

              <PrototypeRegistryTable
                rows={ops.rows}
                loading={ops.loading}
                selectedId={ops.selectedId}
                onSelect={ops.setSelectedId}
                onAction={handleRowAction}
                checked={checked}
                onCheckedChange={setChecked}
              />

              <div className="admin-prototype-table-footer">
                <p className="admin-prototype-pagination-summary">
                  Showing {ops.rows.length} of {ops.totalFiltered} prototypes (page {ops.pagination.page + 1}/
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

              <PrototypeOpsPanels
                rows={ops.allRows}
                activity={ops.activity}
                selected={ops.selected}
              />
            </div>

            <PrototypeRightRail
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
