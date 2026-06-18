import { useCallback, useMemo, useState } from 'react';
import { AdminPermissionDenied } from '../../components/AdminPermissionDenied';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { AdminLoadingState } from '../../components/layout/AdminLoadingState';
import { AdminSearchInput } from '../../components/ui/AdminSearchInput';
import { AdminToolbar } from '../../components/ui/AdminToolbar';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { useAdminSession } from '../../hooks/useAdminSession';
import { FollowUpPanel } from '../components/FollowUpPanel';
import { InnovatorDirectoryPanel } from '../components/InnovatorDirectoryPanel';
import { InnovatorKanban } from '../components/InnovatorKanban';
import { InnovatorLiveFeed } from '../components/InnovatorLiveFeed';
import { InnovatorOpsKpis } from '../components/InnovatorOpsKpis';
import { InnovatorPipelineBar } from '../components/InnovatorPipelineBar';
import { InnovatorProfileDrawer } from '../components/InnovatorProfileDrawer';
import { useInnovators } from '../hooks/useInnovators';
import {
  INNOVATOR_CATEGORIES,
  INNOVATOR_STAGES,
  type InnovatorStage,
} from '../types/innovatorOps.types';

export default function AdminInnovatorsPage() {
  const { can, roleLoading } = useAdminPermissions();
  const { session } = useAdminSession(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    innovators,
    recentActivity,
    stats,
    followUps,
    byStage,
    stageCounts,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    selected,
    selectedId,
    setSelectedId,
    actionLoading,
    live,
    refresh,
    moveStage,
    submitReview,
    logContact,
  } = useInnovators();

  const breadcrumbs = useMemo(() => adminBreadcrumbsFor('/admin/innovators'), []);

  const handleSearch = useCallback(
    (value: string) => setFilters((prev) => ({ ...prev, search: value })),
    [setFilters]
  );

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      setDrawerOpen(true);
    },
    [setSelectedId]
  );

  const handleStageFilter = useCallback(
    (stage: string) => {
      setFilters((prev) => ({
        ...prev,
        stage: prev.stage === stage ? 'all' : (stage as InnovatorStage),
      }));
    },
    [setFilters]
  );

  if (roleLoading) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Checking permissions…" />
      </AdminPageShell>
    );
  }

  if (!can('manage_users')) {
    return <AdminPermissionDenied message="You need manage_users permission to access Innovators Ops." />;
  }

  return (
    <AdminPageShell className="admin-innovator-ops">
      <AdminPageHeader
        title="Innovators Operations Center"
        subtitle="Innovation pipeline · live evaluations · funding readiness · follow-up intelligence"
        breadcrumbs={breadcrumbs}
        actions={[
          {
            label: live ? '● Live' : '○ Connecting',
            onClick: () => {},
            variant: 'ghost',
            disabled: true,
          },
          {
            label: refreshing ? 'Refreshing…' : 'Refresh',
            onClick: () => void refresh(),
            variant: 'secondary',
            disabled: refreshing,
          },
        ]}
      />

      <InnovatorOpsKpis stats={stats} />

      <InnovatorPipelineBar
        stats={stats}
        stageCounts={stageCounts}
        activeStage={filters.stage !== 'all' ? filters.stage : undefined}
        onStageClick={handleStageFilter}
      />

      <div className="admin-innovator-ops-filters">
        <AdminToolbar>
          <AdminSearchInput
            placeholder="Search innovators, ideas, categories…"
            value={filters.search ?? ''}
            onChange={handleSearch}
          />
          <select
            value={filters.category ?? 'All'}
            onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            aria-label="Filter by category"
          >
            {INNOVATOR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={filters.stage ?? 'all'}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                stage: e.target.value as InnovatorStage | 'all',
              }))
            }
            aria-label="Filter by stage"
          >
            <option value="all">All stages</option>
            {INNOVATOR_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filters.priority ?? 'all'}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                priority: e.target.value as typeof filters.priority,
              }))
            }
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {(filters.search || filters.category !== 'All' || filters.stage !== 'all' || filters.priority !== 'all') ? (
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--xs"
              onClick={() => setFilters({})}
            >
              Clear filters
            </button>
          ) : null}
        </AdminToolbar>
      </div>

      {error ? (
        <div className="admin-alert admin-alert--danger" role="alert">
          {error}
          {error?.includes('innovator_pipeline') || error?.includes('does not exist') ? (
            <p className="admin-muted">
              Run <code>scripts/create-innovator-ops-tables.sql</code> in Supabase SQL Editor.
            </p>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <AdminLoadingState label="Loading innovators pipeline…" />
      ) : (
        <div className="admin-innovator-ops-grid">
          <InnovatorDirectoryPanel
            innovators={innovators}
            selectedId={selectedId}
            onSelect={handleSelect}
          />

          <div className="admin-innovator-ops-main">
            <div className="admin-innovator-ops-panel-head">
              <h3>Innovation Pipeline</h3>
              {selected ? (
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--xs"
                  onClick={() => setSelectedId(null)}
                >
                  Clear focus · {selected.fullName}
                </button>
              ) : (
                <span className="admin-muted">{innovators.length} innovators · drag cards to move stages</span>
              )}
            </div>
            <InnovatorKanban
              byStage={byStage}
              selectedId={selectedId}
              actionLoading={actionLoading}
              onMoveStage={moveStage}
              onSelect={handleSelect}
            />
          </div>

          <div className="admin-innovator-ops-right">
            <FollowUpPanel followUps={followUps} onSelect={handleSelect} />
            <InnovatorLiveFeed
              events={recentActivity}
              live={live}
              onSelect={handleSelect}
            />
          </div>
        </div>
      )}

      <InnovatorProfileDrawer
        innovator={selected}
        open={drawerOpen && Boolean(selected)}
        saving={Boolean(selectedId && actionLoading === selectedId)}
        onClose={() => setDrawerOpen(false)}
        onSubmitReview={(values) =>
          submitReview(selected!.id, values, session?.userId ?? '', session?.fullName ?? 'Admin')
        }
        onLogContact={(nextFollowUp) => logContact(selected!.id, nextFollowUp)}
      />
    </AdminPageShell>
  );
}
