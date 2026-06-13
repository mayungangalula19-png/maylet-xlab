import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { fetchUserProjects } from '../features/projects/services/projectService';
import type { ProjectViewModel } from '../features/projects/types';

/** Lightweight hook for simple project list consumers. */
export function useProjects() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserProjects({ userId: user.id });
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, refresh]);

  return { projects, loading: authLoading || loading, error, refresh };
}
