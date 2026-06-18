import type { ReactNode } from 'react';

interface AdminToolbarProps {
  children: ReactNode;
}

export function AdminToolbar({ children }: AdminToolbarProps) {
  return <div className="admin-toolbar">{children}</div>;
}
