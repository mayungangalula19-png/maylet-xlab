interface AdminEmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
}

export function AdminEmptyState({
  title = 'No records found',
  message = 'Try adjusting search or filters.',
  icon = '📭',
}: AdminEmptyStateProps) {
  return (
    <div className="admin-empty-state admin-empty-state--card">
      <span className="admin-empty-state-icon" aria-hidden>
        {icon}
      </span>
      <p className="admin-empty-state-title">{title}</p>
      <p className="admin-empty-state-message">{message}</p>
    </div>
  );
}
