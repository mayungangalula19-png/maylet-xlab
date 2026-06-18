import { useState } from 'react';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { AdminLoadingState } from '../../components/layout/AdminLoadingState';
import { AdminPagination } from '../../components/ui/AdminPagination';
import { ProjectDeleteDialog } from '../../components/projects/ProjectDeleteDialog';
import { ProjectPortfolioFilters } from '../../components/projects/ProjectPortfolioFilters';
import { ProjectPortfolioStats } from '../../components/projects/ProjectPortfolioStats';
import { ProjectPortfolioTable } from '../../components/projects/ProjectPortfolioTable';
import { useAdminProjects } from '../../hooks/useAdminProjects';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';
import type { AdminProjectRow } from '../../types/projectAdmin.types';

export default function AdminProjects() {
  const {
    rows,
    stats,
    loading,
    refreshing,
    error,
    lastUpdated,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sectorFilter,
    setSectorFilter,
    resetFilters,
    pagination,
    refresh,
    deleteProject,
    deletingId,
  } = useAdminProjects(15);
  const { can } = useAdminPermissions();
  const canDelete = can('delete_records');

  const [deleteTarget, setDeleteTarget] = useState<AdminProjectRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteProject(deleteTarget);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Loading projects portfolio…" />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Projects Operations Center"
        subtitle={`Portfolio management · last updated ${lastUpdated.toLocaleTimeString()}`}
        breadcrumbs={adminBreadcrumbsFor('/admin/projects')}
        actions={[
          {
            label: refreshing ? 'Refreshing…' : 'Refresh',
            onClick: refresh,
            variant: 'secondary',
            disabled: refreshing,
          },
        ]}
      />

      <ProjectPortfolioStats stats={stats} />

      <ProjectPortfolioFilters
        search={search}
        statusFilter={statusFilter}
        sectorFilter={sectorFilter}
        total={stats.total}
        filteredTotal={pagination.total}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onSectorChange={setSectorFilter}
        onClear={resetFilters}
      />

      {error || deleteError ? (
        <div className="admin-alert admin-alert--danger">{error || deleteError}</div>
      ) : null}

      <div className="admin-section-card admin-list-card">
        <ProjectPortfolioTable
          rows={rows}
          deletingId={deletingId}
          canDelete={canDelete}
          onDelete={(project) => setDeleteTarget(project)}
        />
      </div>

      <AdminPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        canPrev={pagination.canPrev}
        canNext={pagination.canNext}
        onPrev={pagination.goPrev}
        onNext={pagination.goNext}
        loading={refreshing}
      />

      <ProjectDeleteDialog
        open={!!deleteTarget}
        projectName={deleteTarget?.name}
        deleting={!!deletingId}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </AdminPageShell>
  );
}
