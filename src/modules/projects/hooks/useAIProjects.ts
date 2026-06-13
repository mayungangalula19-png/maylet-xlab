import { useCallback, useEffect, useState } from 'react';
import type { AIProjectInsight, ProjectAccessContext, ProjectViewModel } from '../types';
import { fetchAIInsightForProject } from '../services/aiProjectService';

interface UseAIProjectsResult {
  insight: AIProjectInsight | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * AI Hooks Layer — connects Projects UI to aiProjectService.
 * Frontend → useAIProjects → aiProjectService → Supabase ai_analyses (→ future AI Engine)
 */
export function useAIProjects(
  ctx: ProjectAccessContext | null,
  featuredProject: ProjectViewModel | null
): UseAIProjectsResult {
  const [insight, setInsight] = useState<AIProjectInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ctx?.userId || !featuredProject) {
      setInsight(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAIInsightForProject(ctx, featuredProject);
      setInsight(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI insights');
      setInsight(null);
    } finally {
      setLoading(false);
    }
  }, [ctx, featuredProject]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { insight, loading, error, refresh };
}
