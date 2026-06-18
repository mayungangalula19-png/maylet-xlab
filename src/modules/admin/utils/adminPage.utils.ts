export function formatAdminDate(value: string | Date | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatAdminDateTime(value: string | Date | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function formatAdminCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

export function getTotalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function getPageRange(page: number, pageSize: number, total: number) {
  if (total === 0) return { from: 0, to: -1, showingFrom: 0, showingTo: 0 };
  const from = page * pageSize;
  const to = Math.min(from + pageSize - 1, total - 1);
  return {
    from,
    to,
    showingFrom: from + 1,
    showingTo: to + 1,
  };
}

export function displayName(
  fullName: string | null | undefined,
  email: string | null | undefined,
  fallback = 'Unknown'
) {
  return fullName?.trim() || email?.split('@')[0] || fallback;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}
