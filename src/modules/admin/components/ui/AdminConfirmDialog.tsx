import type { ReactNode } from 'react';

interface AdminConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  warning?: string;
  confirmLabel?: string;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AdminConfirmDialog({
  open,
  title,
  message,
  warning,
  confirmLabel = 'Delete permanently',
  confirming,
  onCancel,
  onConfirm,
}: AdminConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="admin-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title">
      <div className="admin-dialog">
        <div className="admin-dialog-icon" aria-hidden>
          ⚠️
        </div>
        <h3 id="admin-confirm-title">{title}</h3>
        <div>{message}</div>
        {warning ? <p className="admin-dialog-warning">{warning}</p> : null}
        <div className="admin-dialog-actions">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onCancel} disabled={confirming}>
            Cancel
          </button>
          <button type="button" className="admin-btn admin-btn--danger" onClick={onConfirm} disabled={confirming}>
            {confirming ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
