/**
 * Minimal in-memory TTL cache for Supabase read queries.
 * Prevents duplicate fetches on remount (StrictMode) and rapid navigation.
 */
const store = new Map<string, { data: unknown; expires: number }>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs = 30_000): void {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function invalidateCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

const inflight = new Map<string, Promise<unknown>>();

/** Coalesce parallel identical reads (e.g. StrictMode double-mount, multiple widgets). */
export function dedupeAsync<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = fn().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
