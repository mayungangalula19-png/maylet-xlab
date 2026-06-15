import { useState, type ReactNode } from 'react';

export function Popover({ trigger, content }: { trigger: ReactNode; content: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" onClick={() => setOpen((v) => !v)}>{trigger}</button>
      {open && (
        <div className="mxl-ds-card" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 20, minWidth: 200 }}>
          {content}
        </div>
      )}
    </div>
  );
}
