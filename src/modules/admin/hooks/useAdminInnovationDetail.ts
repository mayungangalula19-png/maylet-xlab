import { useCallback, useEffect, useState } from 'react';
import type { AdminServiceResult } from '../types/projectAdmin.types';

interface UseAdminInnovationDetailOptions<T> {
  id: string | undefined;
  fetch: (id: string) => Promise<AdminServiceResult<T>>;
  remove?: (id: string, name: string) => Promise<AdminServiceResult<void>>;
  getName: (bundle: T) => string;
}

export function useAdminInnovationDetail<T>({
  id,
  fetch,
  remove,
  getName,
}: UseAdminInnovationDetailOptions<T>) {
  const [bundle, setBundle] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) {
      setBundle(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetch(id);
    if (result.error) {
      setError(result.error.message);
      setBundle(null);
    } else {
      setBundle(result.data);
    }
    setLoading(false);
  }, [id, fetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deleteRecord = useCallback(async () => {
    if (!id || !bundle || !remove) {
      return { ok: false as const, error: 'Cannot delete' };
    }

    setDeleting(true);
    const result = await remove(id, getName(bundle));
    setDeleting(false);

    if (result.error) {
      return { ok: false as const, error: result.error.message };
    }
    return { ok: true as const };
  }, [id, bundle, remove, getName]);

  return { bundle, loading, error, refresh, deleteRecord, deleting };
}
