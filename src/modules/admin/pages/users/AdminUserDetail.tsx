import { useParams } from 'react-router-dom';
import { AdminDetailPage } from '../../components/layout/AdminDetailPage';
import { AdminUserDetailView } from '../../components/users/AdminUserDetailView';
import { useAdminUserDetail } from '../../hooks/useAdminUserDetail';
import { displayName } from '../../utils/adminPage.utils';

export default function AdminUserDetail() {
  const { id } = useParams();
  const { bundle, loading, error, refresh } = useAdminUserDetail(id);

  const name = bundle ? displayName(bundle.profile.full_name, bundle.profile.email) : 'User';

  return (
    <AdminDetailPage
      title={name}
      backTo="/admin/users"
      backLabel="Users"
      subtitle={bundle?.profile.email ?? undefined}
      actions={[
        { label: 'Edit', to: `/admin/users/${id}/edit`, variant: 'primary', permission: 'manage_users' },
        { label: 'Refresh', onClick: refresh, variant: 'secondary', disabled: loading },
      ]}
      loading={loading}
      error={error}
    >
      {bundle ? <AdminUserDetailView bundle={bundle} /> : null}
    </AdminDetailPage>
  );
}
