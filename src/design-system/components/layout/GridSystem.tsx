import type { ReactNode, CSSProperties } from 'react';

interface GridSystemProps {
  children: ReactNode;
  columns?: number;
  className?: string;
  style?: CSSProperties;
}

export function GridSystem({ children, columns = 1, className = '', style }: GridSystemProps) {
  return (
    <div
      className={`mxl-ds-grid ${className}`.trim()}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, ...style }}
    >
      {children}
    </div>
  );
}
