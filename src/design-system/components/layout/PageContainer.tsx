import type { ReactNode } from 'react';

export function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mxl-ds-page-container ${className}`.trim()}>{children}</div>;
}
