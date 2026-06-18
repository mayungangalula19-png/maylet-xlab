import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminDetailPage } from '../../components/layout/AdminDetailPage';
import { AdminExperimentDetailView } from '../../components/experiments/AdminExperimentDetailView';
import { AdminConfirmDialog } from '../../components/ui/AdminConfirmDialog';
import { useAdminInnovationDetail } from '../../hooks/useAdminInnovationDetail';
import {
  deleteAdminExperiment,
  fetchAdminExperimentDetail,
} from '../../services/adminInnovation.service';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';

export default function AdminExperimentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetch = useMemo(() => fetchAdminExperimentDetail, []);
  const remove = useMemo(() => deleteAdminExperiment, []);
  const getName = useMemo(
    () => (bundle: { experiment: { title: string } }) => bundle.experiment.title,
    []
  );

  const { bundle, loading, error, refresh, deleteRecord, deleting } = useAdminInnovationDetail({
    id,
    fetch,
    remove,
    getName,
  });

  const title = bundle?.experiment.title ?? 'Experiment';

  const handleDelete = async () => {
    setDeleteError(null);
    const result = await deleteRecord();
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    navigate('/admin/experiments');
  };

  return (
    <>
      <AdminDetailPage
        title={title}
        backTo="/admin/experiments"
        backLabel="Experiments"
        breadcrumbs={adminBreadcrumbsFor('/admin/experiments', title)}
        subtitle={bundle?.experiment.status}
        actions={[
          { label: 'Edit', to: `/admin/experiments/${id}/edit`, variant: 'primary', permission: 'manage_projects' },
          { label: 'Refresh', onClick: refresh, variant: 'secondary', disabled: loading },
          { label: 'Delete', onClick: () => setShowDelete(true), variant: 'danger', permission: 'delete_records' },
        ]}
        loading={loading}
        error={deleteError ?? error}
      >
        {bundle ? <AdminExperimentDetailView bundle={bundle} /> : null}
      </AdminDetailPage>

      <AdminConfirmDialog
        open={showDelete}
        title="Delete experiment"
        message={
          <>
            Delete <strong>{title}</strong>? This cannot be undone.
          </>
        }
        warning="All experiment data and linked evidence will be removed."
        confirming={deleting}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
