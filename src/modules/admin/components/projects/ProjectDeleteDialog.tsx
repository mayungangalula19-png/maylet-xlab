interface ProjectDeleteDialogProps {
  open: boolean;
  projectName?: string;
  deleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ProjectDeleteDialog({
  open,
  projectName,
  deleting,
  onCancel,
  onConfirm,
}: ProjectDeleteDialogProps) {
  if (!open) return null;

  return (
    <div className="admin-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-project-title">
      <div className="admin-dialog">
        <div className="admin-dialog-icon" aria-hidden>
          ⚠️
        </div>
        <h3 id="delete-project-title">Delete project</h3>
        <p>
          Delete <strong>{projectName ?? 'this project'}</strong>? This cannot be undone.
        </p>
        <p className="admin-dialog-warning">
          All linked tasks, team members, documents, and child records will be removed.
        </p>
        <div className="admin-dialog-actions">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button type="button" className="admin-btn admin-btn--danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
