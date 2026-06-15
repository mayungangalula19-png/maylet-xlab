import type { ReactNode } from 'react';

export function Sidebar({ children, label }: { children: ReactNode; label: string }) {
  return (
    <aside className="mxl-ds-card" aria-label={label}>
      {children}
    </aside>
  );
}
