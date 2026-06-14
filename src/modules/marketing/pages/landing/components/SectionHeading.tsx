import type { ReactNode } from 'react';

interface Props {
  kicker: string;
  title: ReactNode;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({ kicker, title, subtitle, className = '' }: Props) {
  return (
    <div className={`lp-section-heading fade-in-up ${className}`.trim()}>
      <div className="lp-kicker">{kicker}</div>
      <h2>{title}</h2>
      {subtitle && <p className="lp-section-sub">{subtitle}</p>}
    </div>
  );
}
