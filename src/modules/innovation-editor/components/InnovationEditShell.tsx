import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { timeAgo } from '../../admin/hooks/useAdminDashboard';
import type { InnovationEntityVersion, InnovationEditorActivity } from '../types/innovationEditor.types';
import '../innovation-editor.css';

interface InnovationEditShellProps {
  title: string;
  subtitle?: string;
  backTo: string;
  backLabel?: string;
  loading?: boolean;
  dirty?: boolean;
  saving?: boolean;
  autosaving?: boolean;
  error?: string | null;
  lastSavedAt?: string | null;
  lastAutosaveAt?: string | null;
  canEdit?: boolean;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  versions?: InnovationEntityVersion[];
  activities?: InnovationEditorActivity[];
  onRestoreVersion?: (version: InnovationEntityVersion) => void;
  children: ReactNode;
}

export function InnovationEditShell({
  title,
  subtitle,
  backTo,
  backLabel = 'Back',
  loading,
  dirty,
  saving,
  autosaving,
  error,
  lastSavedAt,
  lastAutosaveAt,
  canEdit = true,
  onSaveDraft,
  onPublish,
  versions = [],
  activities = [],
  onRestoreVersion,
  children,
}: InnovationEditShellProps) {
  if (loading) {
    return (
      <div className="innovation-edit-page">
        <div className="innovation-edit-loading">Loading editor…</div>
      </div>
    );
  }

  return (
    <div className="innovation-edit-page">
      <Link to={backTo} className="admin-back-link">
        ← {backLabel}
      </Link>

      <header className="innovation-edit-header">
        <div>
          <h1>{title}</h1>
          {subtitle ? <p className="innovation-edit-subtitle">{subtitle}</p> : null}
          <div className="innovation-edit-status">
            {dirty ? <span className="innovation-edit-badge innovation-edit-badge--dirty">Unsaved changes</span> : null}
            {autosaving ? <span className="innovation-edit-badge">Autosaving…</span> : null}
            {lastAutosaveAt ? (
              <span className="innovation-edit-meta">Autosaved {timeAgo(lastAutosaveAt)}</span>
            ) : null}
            {lastSavedAt ? (
              <span className="innovation-edit-meta">Saved {timeAgo(lastSavedAt)}</span>
            ) : null}
          </div>
        </div>
        {canEdit ? (
          <div className="innovation-edit-actions">
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={onSaveDraft}
              disabled={saving || !dirty}
            >
              Save draft
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={onPublish}
              disabled={saving}
            >
              {saving ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        ) : null}
      </header>

      {error ? <div className="admin-alert admin-alert--danger">{error}</div> : null}

      <div className="innovation-edit-layout">
        <main className="innovation-edit-main admin-section-card">{children}</main>

        <aside className="innovation-edit-sidebar">
          <section className="admin-section-card">
            <h3>Version history</h3>
            {versions.length === 0 ? (
              <p className="admin-empty-state">No versions yet.</p>
            ) : (
              <ul className="innovation-version-list">
                {versions.map((version) => (
                  <li key={version.id} className="innovation-version-item">
                    <div>
                      <strong>v{version.version_number}</strong>
                      <span className="innovation-edit-meta"> · {version.save_mode}</span>
                    </div>
                    <div className="innovation-edit-meta">{timeAgo(version.created_at)}</div>
                    {onRestoreVersion ? (
                      <button
                        type="button"
                        className="admin-action-link"
                        onClick={() => onRestoreVersion(version)}
                      >
                        Restore
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="admin-section-card">
            <h3>Activity timeline</h3>
            <div className="admin-activity-list">
              {activities.length === 0 ? (
                <p className="admin-empty-state">No activity yet.</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="admin-activity-item">
                    <div className={`admin-activity-icon ${activity.type}`}>•</div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-text">{activity.title}</div>
                      <div className="admin-activity-time">{timeAgo(activity.created_at)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
