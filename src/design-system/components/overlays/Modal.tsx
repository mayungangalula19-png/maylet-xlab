import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}

export function Modal({ title, children, onClose, footer }: ModalProps) {
  return (
    <div className="mxl-ds-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="mxl-ds-modal-title">
      <div className="mxl-ds-modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 id="mxl-ds-modal-title" style={{ margin: 0 }}>{title}</h3>
          <button type="button" className="mxl-ds-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
        {footer && <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}
