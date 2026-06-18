import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminDetailPage } from '../../components/layout/AdminDetailPage';
import { AdminVaultDetailView } from '../../components/vault/AdminVaultDetailView';
import { AdminConfirmDialog } from '../../components/ui/AdminConfirmDialog';
import { useAdminInnovationDetail } from '../../hooks/useAdminInnovationDetail';
import {
  deleteAdminVaultItem,
  fetchAdminVaultDetail,
} from '../../services/adminInnovation.service';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';

export default function AdminVaultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetch = useMemo(() => fetchAdminVaultDetail, []);
  const remove = useMemo(() => deleteAdminVaultItem, []);
  const getName = useMemo(() => (bundle: { item: { title: string } }) => bundle.item.title, []);

  const { bundle, loading, error, refresh, deleteRecord, deleting } = useAdminInnovationDetail({
    id,
    fetch,
    remove,
    getName,
  });

  const title = bundle?.item.title ?? 'Vault item';

  const handleDelete = async () => {
    setDeleteError(null);
    const result = await deleteRecord();
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    navigate('/admin/vault');
  };

  return (
    <>
      <AdminDetailPage
        title={title}
        backTo="/admin/vault"
        backLabel="Innovation Vault"
        breadcrumbs={adminBreadcrumbsFor('/admin/vault', title)}
        actions={[
          { label: 'Refresh', onClick: refresh, variant: 'secondary', disabled: loading },
          { label: 'Delete', onClick: () => setShowDelete(true), variant: 'danger', permission: 'delete_records' },
        ]}
        loading={loading}
        error={deleteError ?? error}
      >
        {bundle ? <AdminVaultDetailView bundle={bundle} /> : null}
      </AdminDetailPage>

      <AdminConfirmDialog
        open={showDelete}
        title="Delete vault item"
        message={
          <>
            Delete <strong>{title}</strong>? This cannot be undone.
          </>
        }
        confirming={deleting}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
