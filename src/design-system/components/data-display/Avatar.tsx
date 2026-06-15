export function Avatar({ label }: { label: string }) {
  const initials = label
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return <div className="mxl-ds-avatar" aria-hidden="true">{initials}</div>;
}
