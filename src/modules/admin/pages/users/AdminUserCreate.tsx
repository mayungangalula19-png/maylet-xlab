import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPermissionDenied } from '../../components/AdminPermissionDenied';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { AdminUserForm } from '../../components/users/AdminUserForm';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { createAdminUser } from '../../services/adminUsers.service';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';
import { EMPTY_USER_FORM } from '../../types/userAdmin.types';
import { validateAdminUserCreate } from '../../utils/userAdmin.validation';

export default function AdminUserCreate() {
  const navigate = useNavigate();
  const { can, roleLoading } = useAdminPermissions();
  const [values, setValues] = useState(EMPTY_USER_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const validationError = validateAdminUserCreate(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createAdminUser(values);
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    navigate(`/admin/users/${result.data!.id}`);
  };

  if (!roleLoading && !can('manage_users')) {
    return (
      <AdminPageShell>
        <AdminPermissionDenied permission="manage_users" />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Create user"
        subtitle="Provision a new platform account with role and profile metadata."
        breadcrumbs={adminBreadcrumbsFor('/admin/users', 'Create')}
        actions={[{ label: 'Back to users', to: '/admin/users', variant: 'ghost' }]}
      />

      <div className="admin-section-card">
        <AdminUserForm
          mode="create"
          values={values}
          onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/users')}
          submitting={submitting}
          error={error}
        />
      </div>
    </AdminPageShell>
  );
}
