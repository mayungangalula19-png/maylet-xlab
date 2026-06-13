/** Full-page loader for public (non-layout) lazy routes. */
export function PageLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        color: '#9b7ff0',
        fontSize: '0.9rem',
        letterSpacing: '1px',
      }}
    >
      Loading…
    </div>
  );
}
