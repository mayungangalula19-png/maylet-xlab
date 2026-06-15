export function Skeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="mxl-ds-skeleton" />
      ))}
    </>
  );
}
