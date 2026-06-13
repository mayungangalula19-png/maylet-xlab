import { useCallback, useEffect, useState } from 'react';
import { researchService } from '../services/researchService';
import type {
  ProjectResearchSnapshot,
  ResearchActivityPoint,
  ResearchDashboardStats,
  ResearchProjectSummary,
} from '../types/research.types';

export function useResearch(userId: string | undefined, projectId?: string) {
  const [dashboard, setDashboard] = useState<{
    stats: ResearchDashboardStats;
    projects: ResearchProjectSummary[];
  } | null>(null);
  const [snapshot, setSnapshot] = useState<ProjectResearchSnapshot | null>(null);
  const [activity, setActivity] = useState<ResearchActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await researchService.getDashboard(userId);
      setDashboard(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadWorkspace = useCallback(async () => {
    if (!userId || !projectId) return;
    setLoading(true);
    try {
      const [snap, act] = await Promise.all([
        researchService.getSnapshot(projectId, userId),
        researchService.getActivity(userId),
      ]);
      setSnapshot(snap);
      setActivity(act);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  }, [userId, projectId]);

  const refresh = useCallback(async () => {
    if (projectId) await loadWorkspace();
    else await loadDashboard();
  }, [projectId, loadWorkspace, loadDashboard]);

  useEffect(() => {
    if (projectId) loadWorkspace();
    else loadDashboard();
  }, [projectId, loadWorkspace, loadDashboard]);

  const withSaving = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    setSaving(true);
    try {
      const result = await fn();
      await refresh();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed');
      return undefined;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  return {
    dashboard,
    snapshot,
    activity,
    loading,
    saving,
    error,
    setError,
    refresh,
    withSaving,
    researchService,
  };
}
