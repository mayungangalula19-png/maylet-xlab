/** Lightweight loader shown inside layouts while lazy page chunks load. */
export function ContentLoader() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9b7ff0',
        fontSize: '0.9rem',
        letterSpacing: '1px',
      }}
    >
      Loading…
    </div>
  );
}
