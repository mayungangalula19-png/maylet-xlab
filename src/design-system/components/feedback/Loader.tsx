export function Loader({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} style={{ display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div className="mxl-ds-loader" />
    </div>
  );
}
