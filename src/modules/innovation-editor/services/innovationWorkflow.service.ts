import { supabase } from '../../../lib/supabase/client';
import type { WorkflowStageId, WorkflowStatus } from '../../workflow/types/workflow.types';

const STAGE_SCORE_COLUMN: Partial<Record<WorkflowStageId, string>> = {
  research: 'research_score',
  prototype: 'prototype_score',
  experiment: 'experiment_score',
  validation: 'validation_score',
  funding: 'funding_score',
  commercialization: 'commercialization_score',
};

function isSchemaError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table')
  );
}

export const innovationWorkflowService = {
  async ensureLifecycle(projectId: string) {
    const { data: existing } = await supabase
      .from('innovation_lifecycle_records')
      .select('project_id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (existing) return;

    await supabase.from('innovation_lifecycle_records').insert({
      project_id: projectId,
      current_stage_id: 'research',
      workflow_status: 'in_progress',
    });
  },

  async advanceStage(
    projectId: string,
    stageId: WorkflowStageId,
    status: WorkflowStatus = 'in_progress'
  ) {
    await innovationWorkflowService.ensureLifecycle(projectId);

    const { data: current } = await supabase
      .from('innovation_lifecycle_records')
      .select('current_stage_id')
      .eq('project_id', projectId)
      .maybeSingle();

    const { error } = await supabase
      .from('innovation_lifecycle_records')
      .update({
        previous_stage_id: current?.current_stage_id ?? null,
        current_stage_id: stageId,
        workflow_status: status,
        stage_entered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId);

    if (error && !isSchemaError(error)) {
      throw new Error(error.message);
    }
  },

  async updateStageScore(projectId: string, stageId: WorkflowStageId, score: number) {
    const column = STAGE_SCORE_COLUMN[stageId];
    if (!column) return;

    const clamped = Math.max(0, Math.min(100, Math.round(score)));

    const { data: existing } = await supabase
      .from('workflow_readiness_scores')
      .select('project_id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (!existing) {
      await supabase.from('workflow_readiness_scores').insert({ project_id: projectId });
    }

    const { error } = await supabase
      .from('workflow_readiness_scores')
      .update({
        [column]: clamped,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId);

    if (error && !isSchemaError(error)) {
      throw new Error(error.message);
    }
  },

  async onEntitySaved(
    projectId: string | null,
    stageId: WorkflowStageId,
    score: number | undefined,
    mode: 'draft' | 'autosave' | 'publish'
  ) {
    if (!projectId) return;
    if (score != null) {
      await innovationWorkflowService.updateStageScore(projectId, stageId, score);
    }
    if (mode === 'publish') {
      await innovationWorkflowService.advanceStage(projectId, stageId, 'in_progress');
    }
  },
};
