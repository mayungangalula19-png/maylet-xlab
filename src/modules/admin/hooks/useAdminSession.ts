import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminSession } from '../services/adminAuth.service';
import type { AdminSession } from '../types/admin.types';

export function useAdminSession(redirectOnFail = true) {
  const navigate = useNavigate();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const adminSession = await getAdminSession();
      if (!adminSession) {
        setSession(null);
        if (redirectOnFail) navigate('/login');
        return null;
      }
      setSession(adminSession);
      return adminSession;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify admin session';
      setError(message);
      setSession(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [navigate, redirectOnFail]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { session, loading, error, refresh };
}
