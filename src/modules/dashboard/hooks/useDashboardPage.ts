import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { useAuthContext } from '../../../contexts/AuthContext';
import { usePageLoad } from '../../../core/hooks/usePageLoad';
import { dashboardService, type DashboardData } from '../../../core/services/dashboard.service';
import { debounce } from '../../../core/utils/debounce';
import { getCached, setCached, invalidateCache } from '../../../lib/utils/queryCache';

export function useDashboardPage() {
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  const loadDashboard = useCallback(async (userId: string, skipCache = false) => {
    const cacheKey = `dashboard:${userId}`;
    if (!skipCache) {
      const cached = getCached<DashboardData>(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getDashboardData(userId);
      setData(result);
      setCached(cacheKey, result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  usePageLoad(async ({ cancelled }) => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    await loadDashboard(user.id);
    if (cancelled()) return;
  }, [authLoading, user, navigate, loadDashboard]);

  useEffect(() => {
    if (!user) return;

    const debouncedRefetch = debounce(() => {
      invalidateCache(`dashboard:${user.id}`);
      void loadDashboard(user.id, true);
    }, 800);

    const channel = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, debouncedRefetch)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, debouncedRefetch)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, loadDashboard]);

  const userName =
    (user?.user_metadata?.full_name as string | undefined) || user?.email?.split('@')[0] || 'Innovator';
  const userEmail = user?.email || '';

  return {
    loading: authLoading || loading,
    error,
    data,
    stats: data?.stats ?? null,
    recentProjects: data?.recentProjects ?? [],
    activities: data?.activities ?? [],
    userName,
    userEmail,
  };
}
