import { useCallback, useEffect, useState } from 'react';
import { fetchAdminUserDetail } from '../services/adminUsers.service';
import type { AdminUserDetailBundle } from '../types/userAdmin.types';

export function useAdminUserDetail(userId: string | undefined) {
  const [bundle, setBundle] = useState<AdminUserDetailBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setBundle(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchAdminUserDetail(userId);
    if (result.error) {
      setError(result.error.message);
      setBundle(null);
    } else {
      setBundle(result.data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bundle, loading, error, refresh };
}
