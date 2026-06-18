import type { ReactNode } from 'react';

interface AdminDetailGridProps {
  children: ReactNode;
}

export function AdminDetailGrid({ children }: AdminDetailGridProps) {
  return <dl className="admin-detail-grid">{children}</dl>;
}

export function AdminDetailItem({
  label,
  value,
  link,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  link?: boolean;
  mono?: boolean;
}) {
  const display = value?.trim() || '—';
  return (
    <div className="admin-detail-item">
      <dt>{label}</dt>
      <dd className={mono ? 'admin-detail-mono' : undefined}>
        {link && value ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer">
            {display}
          </a>
        ) : (
          display
        )}
      </dd>
    </div>
  );
}
