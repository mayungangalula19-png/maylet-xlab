import type { ReactNode } from 'react';

interface Props {
  id?: string;
  number: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({ id, number, title, subtitle, children, className = '' }: Props) {
  return (
    <section id={id} className={`icc-dashboard-section ${className}`.trim()}>
      <header className="icc-section-header">
        <span className="icc-section-number">{String(number).padStart(2, '0')}</span>
        <div>
          <h2 className="icc-section-title">{title}</h2>
          {subtitle ? <p className="icc-section-subtitle">{subtitle}</p> : null}
        </div>
      </header>
      <div className="icc-section-body">{children}</div>
    </section>
  );
}
