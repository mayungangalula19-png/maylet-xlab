import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminUserDetailView } from './AdminUserDetailView';
import { AdminLoadingState } from '../layout/AdminLoadingState';
import {
  ADMIN_USER_ROLES,
  ADMIN_USER_STATUSES,
  type AdminUserRole,
  type AdminUserStatus,
} from '../../types/userAdmin.types';
import { useAdminUserDetail } from '../../hooks/useAdminUserDetail';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { isSuperAdminRole } from '../../config/adminRbac.config';
import type { AdminProfileRow } from '../../services/adminUsers.service';
import { profileDisplayName } from '../../services/adminUsers.service';
import { displayName } from '../../utils/adminPage.utils';

interface UserProfileDrawerProps {
  open: boolean;
  user: AdminProfileRow | null;
  saving?: boolean;
  onClose: () => void;
  onUpdateRole: (userId: string, role: AdminUserRole) => Promise<void>;
  onUpdateStatus: (userId: string, status: AdminUserStatus) => Promise<void>;
}

export function UserProfileDrawer({
  open,
  user,
  saving,
  onClose,
  onUpdateRole,
  onUpdateStatus,
}: UserProfileDrawerProps) {
  const { bundle, loading, error, refresh } = useAdminUserDetail(open ? user?.id : undefined);
  const { role: actorRole } = useAdminPermissions();
  const [role, setRole] = useState<AdminUserRole>('innovator');
  const [status, setStatus] = useState<AdminUserStatus>('active');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!bundle?.profile) return;
    setRole((bundle.profile.role as AdminUserRole) ?? 'innovator');
    setStatus((bundle.profile.status as AdminUserStatus) ?? 'active');
  }, [bundle?.profile]);

  if (!open || !user) return null;

  const name = profileDisplayName(user);
  const canAssignAdminRoles = isSuperAdminRole(actorRole);
  const assignableRoles = canAssignAdminRoles
    ? ADMIN_USER_ROLES
    : ADMIN_USER_ROLES.filter((r) => r !== 'admin' && r !== 'super_admin');

  const handleSaveRole = async () => {
    setLocalError(null);
    try {
      await onUpdateRole(user.id, role);
      await refresh();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleSaveStatus = async () => {
    setLocalError(null);
    try {
      await onUpdateStatus(user.id, status);
      await refresh();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  return (
    <div className="admin-drawer-overlay" role="dialog" aria-modal="true" aria-labelledby="user-drawer-title">
      <div className="admin-drawer admin-drawer--wide">
        <div className="admin-drawer-header">
          <div>
            <h3 id="user-drawer-title">{name}</h3>
            <p className="admin-form-hint">{user.email}</p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="admin-drawer-actions">
          <Link to={`/admin/users/${user.id}`} className="admin-action-link">
            Full profile →
          </Link>
          <Link to={`/admin/users/${user.id}/edit`} className="admin-action-link">
            Edit user →
          </Link>
        </div>

        {localError || error ? (
          <div className="admin-alert admin-alert--danger">{localError || error}</div>
        ) : null}

        {loading || !bundle ? (
          <AdminLoadingState label="Loading user profile…" />
        ) : (
          <>
            <section className="admin-section-card admin-user-drawer-controls">
              <h4>Role & status management</h4>
              <div className="admin-user-drawer-grid">
                <label className="admin-form-field">
                  <span>Role</span>
                  <select
                    value={role}
                    disabled={saving}
                    onChange={(e) => setRole(e.target.value as AdminUserRole)}
                  >
                    {assignableRoles.map((r) => (
                      <option key={r} value={r}>
                        {r.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary admin-btn--xs"
                    disabled={saving}
                    onClick={handleSaveRole}
                  >
                    Save role
                  </button>
                </label>

                <label className="admin-form-field">
                  <span>Status</span>
                  <select
                    value={status}
                    disabled={saving}
                    onChange={(e) => setStatus(e.target.value as AdminUserStatus)}
                  >
                    {ADMIN_USER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary admin-btn--xs"
                    disabled={saving}
                    onClick={handleSaveStatus}
                  >
                    Save status
                  </button>
                </label>
              </div>

              <div className="admin-security-indicators">
                <span className={`admin-security-pill admin-security-pill--${bundle.profile.two_factor_enabled ? 'ok' : 'warn'}`}>
                  2FA: {bundle.profile.two_factor_enabled ? 'Enabled' : 'Disabled'}
                </span>
                {(bundle.profile.role === 'admin' || bundle.profile.role === 'super_admin') && (
                  <span className="admin-security-pill admin-security-pill--warn">Elevated privileges</span>
                )}
                {(bundle.profile.status === 'banned' || bundle.profile.status === 'suspended') && (
                  <span className="admin-security-pill admin-security-pill--danger">Account restricted</span>
                )}
              </div>
            </section>

            <AdminUserDetailView bundle={bundle} />

            <section className="admin-section-card">
              <div className="admin-card-header">
                <h3>📋 Audit trail</h3>
              </div>
              <p className="admin-form-hint">
                Recent platform activity for {displayName(bundle.profile.full_name, bundle.profile.email)}.
                Admin mutations are logged via the audit service.
              </p>
              <div className="admin-activity-list">
                {bundle.activities.length === 0 ? (
                  <p className="admin-empty-state">No activity recorded.</p>
                ) : (
                  bundle.activities.map((activity) => (
                    <div key={activity.id} className="admin-activity-item">
                      <div className={`admin-activity-icon ${activity.target_type}`}>•</div>
                      <div className="admin-activity-content">
                        <div className="admin-activity-text">
                          {activity.action}
                          {activity.target_name ? (
                            <span className="admin-activity-target"> — {activity.target_name}</span>
                          ) : null}
                        </div>
                        <div className="admin-activity-time">
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
