import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mxl-ds-card ${className}`.trim()}>{children}</div>;
}
