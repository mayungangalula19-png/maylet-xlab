import type { ReactNode } from 'react';

export function Drawer({ children, open, onClose, title }: { children: ReactNode; open: boolean; onClose: () => void; title: string }) {
  if (!open) return null;
  return (
    <div className="mxl-ds-modal-backdrop" role="dialog" aria-modal="true">
      <div className="mxl-ds-modal" style={{ marginLeft: 'auto', height: '100vh', borderRadius: 0 }}>
        <h3>{title}</h3>
        {children}
        <button type="button" className="mxl-ds-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
