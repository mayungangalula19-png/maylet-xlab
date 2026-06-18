interface AdminPermissionDeniedProps {
  permission?: string;
  message?: string;
}

export function AdminPermissionDenied({
  permission,
  message = 'You do not have permission to access this page.',
}: AdminPermissionDeniedProps) {
  return (
    <div className="admin-section-card admin-detail-placeholder">
      <h2>Access denied</h2>
      <p>{message}</p>
      {permission ? <p className="admin-form-hint">Required permission: {permission}</p> : null}
    </div>
  );
}
