import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminLoadingState } from '../../components/layout/AdminLoadingState';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { ProjectDeleteDialog } from '../../components/projects/ProjectDeleteDialog';
import { ProjectDetailView } from '../../components/projects/ProjectDetailView';
import { useAdminProjectDetail } from '../../hooks/useAdminProjectDetail';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';

export default function AdminProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bundle, loading, error, refresh, remove, deleting } = useAdminProjectDetail(id);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleteError(null);
    const result = await remove();
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    navigate('/admin/projects');
  };

  if (loading && !bundle) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Loading project details…" />
      </AdminPageShell>
    );
  }

  if (error || !bundle) {
    return (
      <AdminPageShell>
        <div className="admin-section-card admin-detail-placeholder">
          <h2>Project not found</h2>
          <p>{error ?? 'This project may have been deleted.'}</p>
          <Link to="/admin/projects" className="admin-card-link">
            ← Back to projects
          </Link>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={bundle.project.name}
        breadcrumbs={adminBreadcrumbsFor('/admin/projects', bundle.project.name)}
        actions={[
          {
            label: 'Edit research',
            to: `/admin/projects/${bundle.project.id}/research/edit`,
            variant: 'secondary',
            permission: 'manage_projects',
          },
          {
            label: 'Edit commercialization',
            to: `/admin/projects/${bundle.project.id}/commercialization/edit`,
            variant: 'secondary',
            permission: 'manage_projects',
          },
          { label: 'Refresh', onClick: refresh, variant: 'secondary', disabled: loading },
          {
            label: 'Review',
            to: `/admin/projects/${bundle.project.id}/review`,
            variant: 'secondary',
            permission: 'manage_projects',
          },
          {
            label: 'Delete',
            onClick: () => setShowDelete(true),
            variant: 'danger',
            permission: 'delete_records',
          },
        ]}
      />

      {deleteError ? <div className="admin-alert admin-alert--danger">{deleteError}</div> : null}

      <ProjectDetailView bundle={bundle} />

      <ProjectDeleteDialog
        open={showDelete}
        projectName={bundle.project.name}
        deleting={deleting}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </AdminPageShell>
  );
}
