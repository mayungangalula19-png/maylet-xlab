import { AdminButton } from './AdminButton';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  loading?: boolean;
}

export function AdminPagination({
  page,
  totalPages,
  canPrev,
  canNext,
  onPrev,
  onNext,
  loading,
}: AdminPaginationProps) {
  return (
    <div className="admin-pagination">
      <AdminButton variant="ghost" onClick={onPrev} disabled={!canPrev || loading}>
        ← Previous
      </AdminButton>
      <span className="admin-pagination-meta">
        Page {page + 1} of {totalPages}
      </span>
      <AdminButton variant="ghost" onClick={onNext} disabled={!canNext || loading}>
        Next →
      </AdminButton>
    </div>
  );
}
