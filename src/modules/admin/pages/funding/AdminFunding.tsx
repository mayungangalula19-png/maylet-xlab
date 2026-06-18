import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPermissionDenied } from '../../components/AdminPermissionDenied';
import { FundingManagementFilters } from '../../components/funding/FundingManagementFilters';
import { FundingManagementStats } from '../../components/funding/FundingManagementStats';
import {
  FundingManagementTable,
  type FundingRowAction,
} from '../../components/funding/FundingManagementTable';
import { AdminConfirmDialog } from '../../components/ui/AdminConfirmDialog';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { AdminLoadingState } from '../../components/layout/AdminLoadingState';
import { AdminPagination } from '../../components/ui/AdminPagination';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';
import { useAdminFunding } from '../../hooks/useAdminFunding';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import type { AdminFundingRow } from '../../types/fundingAdmin.types';

export default function AdminFunding() {
  const funding = useAdminFunding(15);
  const navigate = useNavigate();
  const { can, roleLoading } = useAdminPermissions();
  const canManage = can('manage_projects');
  const canDelete = can('delete_records');

  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminFundingRow | null>(null);

  const notifySuccess = useCallback((message: string) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(null), 4000);
  }, []);

  const handleError = useCallback((err: unknown) => {
    setActionError(err instanceof Error ? err.message : 'Action failed');
  }, []);

  const handleRowAction = async (pitch: AdminFundingRow, action: FundingRowAction) => {
    setActionError(null);
    try {
      switch (action) {
        case 'view':
          navigate(`/funding/${pitch.id}`);
          break;
        case 'edit':
          navigate(`/admin/funding/${pitch.id}/edit`);
          break;
        case 'review':
          await funding.updateStatus(pitch.id, 'under_review');
          notifySuccess(`"${pitch.title}" moved to under review.`);
          break;
        case 'fund':
          await funding.updateStatus(pitch.id, 'funded');
          notifySuccess(`"${pitch.title}" marked as funded.`);
          break;
        case 'decline':
          await funding.updateStatus(pitch.id, 'declined');
          notifySuccess(`"${pitch.title}" declined.`);
          break;
        case 'delete':
          setDeleteTarget(pitch);
          break;
        default:
          break;
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setActionError(null);
    try {
      await funding.deletePitch(deleteTarget);
      notifySuccess(`"${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      handleError(err);
    }
  };

  if (roleLoading) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Checking permissions…" />
      </AdminPageShell>
    );
  }

  if (!canManage) {
    return (
      <AdminPageShell>
        <AdminPermissionDenied permission="manage_projects" />
      </AdminPageShell>
    );
  }

  if (funding.loading) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Loading funding operations…" />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Funding Operations Center"
        subtitle={`Pitch pipeline · last updated ${funding.lastUpdated.toLocaleTimeString()}`}
        breadcrumbs={adminBreadcrumbsFor('/admin/funding')}
        actions={[
          {
            label: funding.refreshing ? 'Refreshing…' : 'Refresh',
            onClick: funding.refresh,
            variant: 'secondary',
            disabled: funding.refreshing,
          },
        ]}
      />

      <FundingManagementStats stats={funding.stats} />

      <FundingManagementFilters
        search={funding.search}
        statusFilter={funding.statusFilter}
        stageFilter={funding.stageFilter}
        industryFilter={funding.industryFilter}
        dateFrom={funding.dateFrom}
        dateTo={funding.dateTo}
        total={funding.stats.total}
        filteredTotal={funding.pagination.total}
        onSearchChange={funding.setSearch}
        onStatusChange={funding.setStatusFilter}
        onStageChange={funding.setStageFilter}
        onIndustryChange={funding.setIndustryFilter}
        onDateFromChange={funding.setDateFrom}
        onDateToChange={funding.setDateTo}
        onClear={funding.resetFilters}
      />

      {success ? <div className="admin-alert admin-alert--success">{success}</div> : null}
      {funding.error || actionError ? (
        <div className="admin-alert admin-alert--danger">{funding.error || actionError}</div>
      ) : null}

      <div className="admin-section-card admin-list-card">
        <FundingManagementTable
          rows={funding.rows}
          loading={funding.refreshing}
          actionLoading={funding.actionLoading}
          deletingId={funding.deletingId}
          canDelete={canDelete}
          onAction={handleRowAction}
        />
      </div>

      <AdminPagination
        page={funding.pagination.page}
        totalPages={funding.pagination.totalPages}
        canPrev={funding.pagination.canPrev}
        canNext={funding.pagination.canNext}
        onPrev={funding.pagination.goPrev}
        onNext={funding.pagination.goNext}
        loading={funding.refreshing}
      />

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete funding pitch"
        message={
          deleteTarget
            ? `Permanently delete "${deleteTarget.title}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete pitch"
        confirming={!!funding.deletingId}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </AdminPageShell>
  );
}
