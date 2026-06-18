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
import { ExperimentOpsKpis } from '../components/ExperimentOpsKpis';
import { ExperimentOpsPanels } from '../components/ExperimentOpsPanels';
import { ExperimentPipelineBar } from '../components/ExperimentPipelineBar';
import { ExperimentRegistryTable } from '../components/ExperimentRegistryTable';
import { ExperimentRightRail } from '../components/ExperimentRightRail';
import { useAdminExperiments } from '../hooks/useAdminExperiments';
import type { AdminExperimentRow, ExperimentRowAction } from '../types/experimentOpsAdmin.types';

const RISK_FILTERS = ['all', 'low', 'medium', 'high', 'critical'] as const;
const STATUS_FILTERS = ['all', 'draft', 'active', 'running', 'completed', 'failed'] as const;

export default function AdminExperimentsPage() {
  const navigate = useNavigate();
  const { can, roleLoading } = useAdminPermissions();
  const ops = useAdminExperiments(8);
  const [success, setSuccess] = useState<string | null>(null);

  const breadcrumbs = useMemo(() => adminBreadcrumbsFor('/admin/experiments'), []);
  const activeStage = ops.filters.executiveStage ?? 'all';

  const handleSearch = useCallback(
    (value: string) => ops.setFilters((prev) => ({ ...prev, search: value })),
    [ops]
  );

  const handleRowAction = useCallback(
    (row: AdminExperimentRow, action: ExperimentRowAction) => {
      if (action === 'view') navigate(`/admin/experiments/${row.id}`);
      else if (action === 'edit') navigate(`/admin/experiments/${row.id}/edit`);
    },
    [navigate]
  );

  const handleMayaOpen = useCallback(() => {
    setSuccess('Open Messages to chat with Maya AI Assistant.');
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
      <AdminPermissionDenied message="You need manage_projects permission to access the Experiment Command Center." />
    );
  }

  return (
    <AdminPageShell className="admin-experiment-ops">
      <AdminPageHeader
        title="Experiment Command Center"
        subtitle="MAYLET X LAB — Admin innovation laboratory control center"
        breadcrumbs={breadcrumbs}
        actions={[
          {
            label: ops.refreshing ? 'Refreshing…' : 'Refresh',
            onClick: () => void ops.refresh(),
            variant: 'ghost',
          },
          { label: 'Export', onClick: () => {}, variant: 'ghost' },
          {
            label: '+ New Experiment',
            onClick: () => navigate('/experiments/create'),
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
        <AdminLoadingState label="Loading experiment operations…" />
      ) : (
        <>
          <ExperimentOpsKpis stats={ops.stats} />

          <ExperimentPipelineBar
            stats={ops.stats}
            stageCounts={ops.executiveStageCounts}
            activeStage={activeStage}
            onStageClick={(stage) =>
              ops.setExecutiveStageFilter(stage === activeStage ? 'all' : stage)
            }
          />

          <div className="admin-experiment-command-layout">
            <div className="admin-experiment-command-main">
              <div className="admin-experiment-ops-filters">
                <AdminToolbar>
                  <AdminSearchInput
                    value={ops.filters.search ?? ''}
                    onChange={handleSearch}
                    placeholder="Search experiments, projects, researchers…"
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
                </AdminToolbar>
              </div>

              <ExperimentRegistryTable
                rows={ops.rows}
                loading={ops.loading}
                selectedId={ops.selectedId}
                onSelect={ops.setSelectedId}
                onAction={handleRowAction}
              />

              <div className="admin-experiment-table-footer">
                <p className="admin-experiment-pagination-summary">
                  Showing {ops.rows.length} of {ops.totalFiltered} experiments
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

              <ExperimentOpsPanels rows={ops.allRows} activity={ops.activity} />
            </div>

            <ExperimentRightRail
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
