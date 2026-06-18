import { AdminDetailPage } from './layout/AdminDetailPage';

interface AdminDetailShellProps {
  title: string;
  backTo: string;
  backLabel?: string;
  subtitle?: string;
  placeholder?: string;
}

/** Lightweight detail route placeholder — swap children for full CRUD when ready. */
export function AdminDetailShell({
  title,
  backTo,
  backLabel,
  subtitle,
  placeholder,
}: AdminDetailShellProps) {
  return (
    <AdminDetailPage
      title={title}
      backTo={backTo}
      backLabel={backLabel}
      subtitle={subtitle}
      placeholder={placeholder}
    />
  );
}
