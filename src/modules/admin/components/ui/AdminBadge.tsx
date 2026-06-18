import type { AdminBadgeVariant } from '../../types/admin.types';

interface AdminBadgeProps {
  children: React.ReactNode;
  variant?: AdminBadgeVariant;
  className?: string;
}

export function AdminBadge({ children, variant = 'default', className = '' }: AdminBadgeProps) {
  return (
    <span className={`admin-badge admin-badge--${variant} ${className}`.trim()}>{children}</span>
  );
}

/** Role/plan/status badges with semantic class names from row data. */
export function AdminRoleBadge({ role }: { role: string | null | undefined }) {
  const key = (role || 'user').replace(/\s+/g, '_').toLowerCase();
  return <span className={`admin-role-badge ${key}`}>{role || 'user'}</span>;
}

export function AdminStatusBadge({ status }: { status: string | null | undefined }) {
  const key = (status || 'pending').toLowerCase();
  return <span className={`admin-status-badge ${key}`}>{status || 'pending'}</span>;
}

export function AdminPlanBadge({ plan }: { plan: string | null | undefined }) {
  const key = (plan || 'free').toLowerCase();
  return <span className={`admin-plan-badge ${key}`}>{plan || 'free'}</span>;
}
