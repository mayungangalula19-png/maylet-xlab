import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminPermissionDenied } from '../../components/AdminPermissionDenied';
import { AdminLoadingState } from '../../components/layout/AdminLoadingState';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { AdminUserForm } from '../../components/users/AdminUserForm';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { updateAdminUser } from '../../services/adminUsers.service';
import { useAdminUserDetail } from '../../hooks/useAdminUserDetail';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';
import { profileToFormValues, validateAdminUserUpdate } from '../../utils/userAdmin.validation';
import type { AdminUserUpdateValues } from '../../types/userAdmin.types';
import { displayName } from '../../utils/adminPage.utils';

export default function AdminUserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can, roleLoading } = useAdminPermissions();
  const { bundle, loading, error: loadError } = useAdminUserDetail(id);
  const [values, setValues] = useState<AdminUserUpdateValues | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bundle?.profile) {
      setValues(profileToFormValues(bundle.profile));
    }
  }, [bundle]);

  const handleSubmit = async () => {
    if (!id || !values || !bundle) return;

    const validationError = validateAdminUserUpdate(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await updateAdminUser(id, values, bundle.profile);
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    navigate(`/admin/users/${id}`);
  };

  if (!roleLoading && !can('manage_users')) {
    return (
      <AdminPageShell>
        <AdminPermissionDenied permission="manage_users" />
      </AdminPageShell>
    );
  }

  if (loading || !values) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Loading user…" />
      </AdminPageShell>
    );
  }

  if (loadError || !bundle) {
    return (
      <AdminPageShell>
        <div className="admin-alert admin-alert--danger">{loadError ?? 'User not found'}</div>
      </AdminPageShell>
    );
  }

  const name = displayName(bundle.profile.full_name, bundle.profile.email);

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={`Edit ${name}`}
        subtitle={bundle.profile.email ?? undefined}
        breadcrumbs={adminBreadcrumbsFor('/admin/users', name)}
        actions={[
          { label: 'View profile', to: `/admin/users/${id}`, variant: 'ghost' },
          { label: 'Back to users', to: '/admin/users', variant: 'secondary' },
        ]}
      />

      <div className="admin-section-card">
        <AdminUserForm
          mode="edit"
          values={values}
          onChange={(patch) => setValues((prev) => (prev ? { ...prev, ...patch } : prev))}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/admin/users/${id}`)}
          submitting={submitting}
          error={error}
        />
      </div>
    </AdminPageShell>
  );
}
