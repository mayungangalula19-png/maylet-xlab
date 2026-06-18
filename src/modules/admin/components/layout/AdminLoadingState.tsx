interface AdminLoadingStateProps {
  label?: string;
  compact?: boolean;
}

export function AdminLoadingState({ label = 'Loading…', compact = false }: AdminLoadingStateProps) {
  return (
    <div className={`admin-loading-state ${compact ? 'admin-loading-state--compact' : ''}`}>
      <div className="admin-loading-spinner" role="status" aria-label={label} />
      <p>{label}</p>
    </div>
  );
}
