import type { ReactNode } from 'react';
import { AdminEmptyState } from '../ui/AdminEmptyState';

interface AdminDataTableProps {
  children: ReactNode;
  empty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  minWidth?: number;
}

export function AdminDataTable({
  children,
  empty,
  emptyTitle,
  emptyMessage,
  minWidth = 640,
}: AdminDataTableProps) {
  if (empty) {
    return <AdminEmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="admin-table-responsive">
      <table className="admin-data-table" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}
