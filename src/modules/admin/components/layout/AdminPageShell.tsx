import type { ReactNode } from 'react';

interface AdminPageShellProps {
  children: ReactNode;
  className?: string;
}

/** Root wrapper for every admin route — consistent padding & max-width. */
export function AdminPageShell({ children, className = '' }: AdminPageShellProps) {
  return <div className={`admin-page ${className}`.trim()}>{children}</div>;
}
