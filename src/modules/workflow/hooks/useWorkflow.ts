import { useCallback, useEffect, useState } from 'react';
import { workflowService } from '../services/workflow.service';
import type {
  InnovationLifecycleRecord,
  WorkflowReadinessScores,
  WorkflowStage,
} from '../types/workflow.types';

export function useWorkflow(projectId: string | undefined) {
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [lifecycle, setLifecycle] = useState<InnovationLifecycleRecord | null>(null);
  const [readiness, setReadiness] = useState<WorkflowReadinessScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) {
      setLifecycle(null);
      setReadiness(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [stageList, life, ready] = await Promise.all([
        workflowService.fetchStages(),
        workflowService.ensureLifecycleRecord(projectId),
        workflowService.ensureReadinessRecord(projectId),
      ]);
      setStages(stageList);
      setLifecycle(life);
      setReadiness(ready);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stages, lifecycle, readiness, loading, error, refresh };
}
