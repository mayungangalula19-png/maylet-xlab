export function Toast({ message }: { message: string }) {
  return (
    <div role="status" className="mxl-ds-card" style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1100 }}>
      {message}
    </div>
  );
}
