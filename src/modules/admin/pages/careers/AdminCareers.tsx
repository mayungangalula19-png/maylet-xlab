import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminPermissionDenied } from '../../components/AdminPermissionDenied';
import { CareerApplicationsDrawer } from '../../components/careers/CareerApplicationsDrawer';
import { CareerFormDialog, type CareerFormMode } from '../../components/careers/CareerFormDialog';
import {
  CareerManagementFilters,
} from '../../components/careers/CareerManagementFilters';
import {
  CareerManagementStats,
} from '../../components/careers/CareerManagementStats';
import {
  CareerManagementTable,
  type CareerRowAction,
} from '../../components/careers/CareerManagementTable';
import { AdminConfirmDialog } from '../../components/ui/AdminConfirmDialog';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { AdminLoadingState } from '../../components/layout/AdminLoadingState';
import { AdminPagination } from '../../components/ui/AdminPagination';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';
import { useAdminCareers } from '../../hooks/useAdminCareers';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import type { AdminCareerFormValues, AdminCareerRow } from '../../types/careersAdmin.types';
import type { AdminPageAction } from '../../types/admin.types';

export default function AdminCareers() {
  const careers = useAdminCareers(15);
  const { can, filterActions, roleLoading } = useAdminPermissions();
  const canManage = can('manage_users');
  const canDelete = can('delete_records');

  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<CareerFormMode>('create');
  const [activeCareer, setActiveCareer] = useState<AdminCareerRow | null>(null);
  const [applicationsCareer, setApplicationsCareer] = useState<AdminCareerRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCareerRow | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState<'publish' | 'archive' | 'delete' | null>(null);

  const notifySuccess = useCallback((message: string) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(null), 4000);
  }, []);

  const handleError = useCallback((err: unknown) => {
    setActionError(err instanceof Error ? err.message : 'Action failed');
  }, []);

  const openForm = (mode: CareerFormMode, career?: AdminCareerRow) => {
    setFormMode(mode);
    setActiveCareer(career ?? null);
    setFormOpen(true);
    setActionError(null);
  };

  const handleRowAction = async (career: AdminCareerRow, action: CareerRowAction) => {
    setActionError(null);
    try {
      switch (action) {
        case 'view':
          openForm('view', career);
          break;
        case 'edit':
          openForm('edit', career);
          break;
        case 'applications':
          setApplicationsCareer(career);
          break;
        case 'publish':
          await careers.publishCareer(career.id);
          notifySuccess(`"${career.title}" published.`);
          break;
        case 'unpublish':
          await careers.unpublishCareer(career.id);
          notifySuccess(`"${career.title}" moved to draft.`);
          break;
        case 'archive':
          await careers.archiveCareer(career.id);
          notifySuccess(`"${career.title}" archived.`);
          break;
        case 'delete':
          setDeleteTarget(career);
          break;
        default:
          break;
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleSave = async (values: AdminCareerFormValues) => {
    await careers.saveCareer(values, activeCareer?.id);
    notifySuccess(
      formMode === 'create'
        ? `Career "${values.title}" created.`
        : `Career "${values.title}" updated.`
    );
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await careers.deleteCareer(deleteTarget.id);
      setDeleteTarget(null);
      notifySuccess(`"${deleteTarget.title}" deleted.`);
    } catch (err) {
      handleError(err);
    }
  };

  const handleBulkConfirm = async () => {
    if (!bulkConfirm) return;
    try {
      if (bulkConfirm === 'publish') {
        await careers.bulkPublish();
        notifySuccess(`${careers.selectedIds.length} career(s) published.`);
      } else if (bulkConfirm === 'archive') {
        await careers.bulkArchive();
        notifySuccess(`${careers.selectedIds.length} career(s) archived.`);
      } else {
        await careers.bulkDelete();
        notifySuccess(`${careers.selectedIds.length} career(s) deleted.`);
      }
      setBulkConfirm(null);
    } catch (err) {
      handleError(err);
      setBulkConfirm(null);
    }
  };

  const handleExport = async () => {
    setActionError(null);
    try {
      await careers.exportCareers();
      notifySuccess('Careers exported to CSV.');
    } catch (err) {
      handleError(err);
    }
  };

  if (roleLoading) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Verifying admin permissions…" />
      </AdminPageShell>
    );
  }

  if (!canManage) {
    return (
      <AdminPageShell>
        <AdminPermissionDenied permission="manage_users" />
      </AdminPageShell>
    );
  }

  if (careers.loading) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Loading career management center…" />
      </AdminPageShell>
    );
  }

  const hasSelection = careers.selectedIds.length > 0;

  const headerActions: AdminPageAction[] = [
    {
      label: 'Create Career',
      onClick: () => openForm('create'),
      variant: 'primary',
      icon: '＋',
      permission: 'manage_users',
    },
    {
      label: careers.exporting ? 'Exporting…' : 'Export Careers',
      onClick: handleExport,
      variant: 'secondary',
      disabled: careers.exporting,
      permission: 'manage_users',
    },
    {
      label: careers.refreshing ? 'Refreshing…' : 'Refresh',
      onClick: careers.refresh,
      variant: 'secondary',
      disabled: careers.refreshing,
    },
  ];

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Career Management"
        subtitle="Manage jobs, internships, fellowships, opportunities and recruitment campaigns."
        breadcrumbs={adminBreadcrumbsFor('/admin/careers')}
        actions={filterActions(headerActions)}
      />

      <div className="admin-careers-toolbar-links">
        <Link to="/admin/careers/applications" className="admin-action-link">
          View applicant queue →
        </Link>
        <span className="admin-last-updated">
          Updated {careers.lastUpdated.toLocaleTimeString()}
        </span>
      </div>

      <CareerManagementStats stats={careers.stats} />

      <CareerManagementFilters
        search={careers.search}
        statusFilter={careers.statusFilter}
        typeFilter={careers.typeFilter}
        departmentFilter={careers.departmentFilter}
        locationFilter={careers.locationFilter}
        remoteFilter={careers.remoteFilter}
        dateFrom={careers.dateFrom}
        dateTo={careers.dateTo}
        total={careers.stats.total}
        filteredTotal={careers.pagination.total}
        onSearchChange={careers.setSearch}
        onStatusChange={careers.setStatusFilter}
        onTypeChange={careers.setTypeFilter}
        onDepartmentChange={careers.setDepartmentFilter}
        onLocationChange={careers.setLocationFilter}
        onRemoteChange={careers.setRemoteFilter}
        onDateFromChange={careers.setDateFrom}
        onDateToChange={careers.setDateTo}
        onClear={careers.resetFilters}
      />

      {success ? <div className="admin-alert admin-alert--success">{success}</div> : null}
      {careers.error || actionError ? (
        <div className="admin-alert admin-alert--danger">
          {careers.error?.includes('career_opportunities')
            ? 'Run scripts/create-career-opportunities-table.sql in Supabase SQL Editor, then refresh.'
            : careers.error || actionError}
        </div>
      ) : null}

      {hasSelection ? (
        <div className="admin-bulk-bar">
          <span>{careers.selectedIds.length} selected</span>
          <button
            type="button"
            className="admin-btn admin-btn--secondary admin-btn--xs"
            disabled={careers.bulkLoading}
            onClick={() => setBulkConfirm('publish')}
          >
            Bulk Publish
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-btn--xs"
            disabled={careers.bulkLoading}
            onClick={() => setBulkConfirm('archive')}
          >
            Bulk Archive
          </button>
          {canDelete ? (
            <button
              type="button"
              className="admin-btn admin-btn--danger admin-btn--xs"
              disabled={careers.bulkLoading}
              onClick={() => setBulkConfirm('delete')}
            >
              Bulk Delete
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="admin-section-card admin-list-card">
        <CareerManagementTable
          rows={careers.rows}
          loading={careers.refreshing}
          selectedIds={careers.selectedIds}
          allSelected={careers.allSelected}
          actionLoading={careers.actionLoading}
          canDelete={canDelete}
          onToggleSelect={careers.toggleSelected}
          onToggleSelectAll={careers.toggleSelectAll}
          onAction={handleRowAction}
        />
      </div>

      <AdminPagination
        page={careers.pagination.page}
        totalPages={careers.pagination.totalPages}
        canPrev={careers.pagination.canPrev}
        canNext={careers.pagination.canNext}
        onPrev={careers.pagination.goPrev}
        onNext={careers.pagination.goNext}
        loading={careers.refreshing}
      />

      <CareerFormDialog
        open={formOpen}
        mode={formMode}
        career={activeCareer}
        saving={careers.actionLoading === (activeCareer?.id ?? 'create')}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSave}
      />

      <CareerApplicationsDrawer
        open={!!applicationsCareer}
        career={applicationsCareer}
        onClose={() => setApplicationsCareer(null)}
      />

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete career?"
        message={
          deleteTarget ? (
            <>
              Permanently delete <strong>{deleteTarget.title}</strong>? Applications will be unlinked, not
              deleted.
            </>
          ) : null
        }
        confirmLabel="Delete career"
        confirming={careers.actionLoading === deleteTarget?.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <AdminConfirmDialog
        open={!!bulkConfirm}
        title={
          bulkConfirm === 'publish'
            ? 'Publish selected careers?'
            : bulkConfirm === 'archive'
              ? 'Archive selected careers?'
              : 'Delete selected careers?'
        }
        message={`This will affect ${careers.selectedIds.length} career(s).`}
        confirmLabel={
          bulkConfirm === 'publish'
            ? 'Publish all'
            : bulkConfirm === 'archive'
              ? 'Archive all'
              : 'Delete all'
        }
        confirming={careers.bulkLoading}
        onCancel={() => setBulkConfirm(null)}
        onConfirm={handleBulkConfirm}
      />
    </AdminPageShell>
  );
}
