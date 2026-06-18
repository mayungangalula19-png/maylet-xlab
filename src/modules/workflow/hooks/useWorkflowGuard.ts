import { useCallback, useEffect, useState } from 'react';
import { gateService } from '../../research/services/gateService';
import { canAuthorizePrototype } from '../../research/ai/gateEngine';
import { workflowService } from '../services/workflow.service';
import type { WorkflowGuardResult, WorkflowStageId } from '../types/workflow.types';

const STAGE_REQUIREMENTS: Partial<Record<WorkflowStageId, string[]>> = {
  prototype: [
    'Complete research gate review with GO or Conditional GO',
    'Upload research evidence documents',
    'Submit research findings',
  ],
  experiment: ['Create and review a prototype', 'Pass technical readiness check'],
  validation: ['Run at least one experiment', 'Record experiment results'],
  funding: ['Achieve validation PASS with score ≥ 70', 'Submit validation evidence'],
  commercialization: ['Complete funding pitch', 'Meet investor readiness threshold'],
};

export function useWorkflowGuard(projectId: string | undefined, targetStage: WorkflowStageId) {
  const [result, setResult] = useState<WorkflowGuardResult>({
    allowed: true,
    reason: null,
    requirements: STAGE_REQUIREMENTS[targetStage] ?? [],
  });
  const [loading, setLoading] = useState(Boolean(projectId));

  const evaluate = useCallback(async () => {
    const requirements = STAGE_REQUIREMENTS[targetStage] ?? [];

    if (!projectId) {
      setResult({ allowed: true, reason: null, requirements });
      setLoading(false);
      return;
    }

    if (targetStage === 'prototype') {
      setLoading(true);
      try {
        const [gate, lifecycle] = await Promise.all([
          gateService.getLatest(projectId),
          workflowService.fetchLifecycle(projectId),
        ]);

        const gateOk = gate ? canAuthorizePrototype(gate.decision) : false;
        if (!gateOk) {
          setResult({
            allowed: false,
            reason:
              'Research gate approval is required before creating a prototype. Complete the gate review in Research Center.',
            requirements,
          });
          return;
        }

        if (lifecycle?.blocked) {
          setResult({
            allowed: false,
            reason: lifecycle.blockedReason ?? 'Project workflow is blocked.',
            requirements,
          });
          return;
        }

        setResult({ allowed: true, reason: null, requirements });
      } catch (e) {
        setResult({
          allowed: false,
          reason: e instanceof Error ? e.message : 'Unable to verify workflow gate',
          requirements,
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    setResult({ allowed: true, reason: null, requirements });
    setLoading(false);
  }, [projectId, targetStage]);

  useEffect(() => {
    void evaluate();
  }, [evaluate]);

  return { ...result, loading, refresh: evaluate };
}
