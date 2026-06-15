interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="mxl-ds-error" role="alert">
      <strong>{title}</strong>
      <p style={{ margin: '0.5rem 0 0' }}>{message}</p>
      {onRetry && (
        <button type="button" className="mxl-ds-btn" style={{ marginTop: '0.75rem' }} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
