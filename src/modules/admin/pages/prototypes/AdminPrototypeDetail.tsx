import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminDetailPage } from '../../components/layout/AdminDetailPage';
import { AdminPrototypeDetailView } from '../../components/prototypes/AdminPrototypeDetailView';
import { AdminConfirmDialog } from '../../components/ui/AdminConfirmDialog';
import { useAdminInnovationDetail } from '../../hooks/useAdminInnovationDetail';
import {
  deleteAdminPrototype,
  fetchAdminPrototypeDetail,
} from '../../services/adminInnovation.service';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';

export default function AdminPrototypeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetch = useMemo(() => fetchAdminPrototypeDetail, []);
  const remove = useMemo(() => deleteAdminPrototype, []);
  const getName = useMemo(
    () => (bundle: { prototype: { name: string } }) => bundle.prototype.name,
    []
  );

  const { bundle, loading, error, refresh, deleteRecord, deleting } = useAdminInnovationDetail({
    id,
    fetch,
    remove,
    getName,
  });

  const title = bundle?.prototype.name ?? 'Prototype';

  const handleDelete = async () => {
    setDeleteError(null);
    const result = await deleteRecord();
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    navigate('/admin/prototypes');
  };

  return (
    <>
      <AdminDetailPage
        title={title}
        backTo="/admin/prototypes"
        backLabel="Prototypes"
        breadcrumbs={adminBreadcrumbsFor('/admin/prototypes', title)}
        subtitle={bundle ? `v${bundle.prototype.version} · ${bundle.prototype.status}` : undefined}
        actions={[
          { label: 'Edit', to: `/admin/prototypes/${id}/edit`, variant: 'primary', permission: 'manage_projects' },
          { label: 'Edit testing', to: `/admin/prototypes/${id}/testing/edit`, variant: 'secondary', permission: 'manage_projects' },
          { label: 'Refresh', onClick: refresh, variant: 'secondary', disabled: loading },
          { label: 'Delete', onClick: () => setShowDelete(true), variant: 'danger', permission: 'delete_records' },
        ]}
        loading={loading}
        error={deleteError ?? error}
      >
        {bundle ? <AdminPrototypeDetailView bundle={bundle} /> : null}
      </AdminDetailPage>

      <AdminConfirmDialog
        open={showDelete}
        title="Delete prototype"
        message={
          <>
            Delete <strong>{title}</strong>? This cannot be undone.
          </>
        }
        warning="Prototype files and linked records will be removed."
        confirming={deleting}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
