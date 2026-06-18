import { supabase } from '../../../lib/supabase/client';
import type {
  InnovationLifecycleRecord,
  WorkflowReadinessScores,
  WorkflowStage,
  WorkflowStageId,
  WorkflowStatus,
} from '../types/workflow.types';

function isSchemaError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table')
  );
}

type DbStage = {
  id: string;
  label: string;
  sequence_order: number;
  module_route: string;
  is_terminal: boolean;
  min_readiness_to_exit: number;
};

type DbLifecycle = {
  project_id: string;
  current_stage_id: string;
  previous_stage_id: string | null;
  workflow_status: WorkflowStatus;
  stage_entered_at: string;
  overall_readiness_score: number;
  blocked: boolean;
  blocked_reason: string | null;
  next_recommended_action: string | null;
};

type DbReadiness = {
  project_id: string;
  research_score: number;
  prototype_score: number;
  experiment_score: number;
  validation_score: number;
  funding_score: number;
  commercialization_score: number;
  overall_score: number;
  blockers: string[] | null;
  warnings: string[] | null;
};

function mapStage(row: DbStage): WorkflowStage {
  return {
    id: row.id as WorkflowStageId,
    label: row.label,
    sequenceOrder: row.sequence_order,
    moduleRoute: row.module_route,
    isTerminal: row.is_terminal,
    minReadinessToExit: row.min_readiness_to_exit,
  };
}

function mapLifecycle(row: DbLifecycle): InnovationLifecycleRecord {
  return {
    projectId: row.project_id,
    currentStageId: row.current_stage_id as WorkflowStageId,
    previousStageId: (row.previous_stage_id as WorkflowStageId | null) ?? null,
    workflowStatus: row.workflow_status,
    stageEnteredAt: row.stage_entered_at,
    overallReadinessScore: row.overall_readiness_score,
    blocked: row.blocked,
    blockedReason: row.blocked_reason,
    nextRecommendedAction: row.next_recommended_action,
  };
}

function mapReadiness(row: DbReadiness): WorkflowReadinessScores {
  return {
    projectId: row.project_id,
    researchScore: row.research_score,
    prototypeScore: row.prototype_score,
    experimentScore: row.experiment_score,
    validationScore: row.validation_score,
    fundingScore: row.funding_score,
    commercializationScore: row.commercialization_score,
    overallScore: row.overall_score,
    blockers: row.blockers ?? [],
    warnings: row.warnings ?? [],
  };
}

const FALLBACK_STAGES: WorkflowStage[] = [
  { id: 'idea', label: 'Idea', sequenceOrder: 0, moduleRoute: '/projects/:id', isTerminal: false, minReadinessToExit: 0 },
  { id: 'research', label: 'Research', sequenceOrder: 1, moduleRoute: '/research/:projectId', isTerminal: false, minReadinessToExit: 80 },
  { id: 'prototype', label: 'Prototype', sequenceOrder: 2, moduleRoute: '/prototypes', isTerminal: false, minReadinessToExit: 75 },
  { id: 'experiment', label: 'Experiment', sequenceOrder: 3, moduleRoute: '/experiments', isTerminal: false, minReadinessToExit: 70 },
  { id: 'validation', label: 'Validation', sequenceOrder: 4, moduleRoute: '/validation', isTerminal: false, minReadinessToExit: 70 },
  { id: 'funding', label: 'Funding', sequenceOrder: 5, moduleRoute: '/funding', isTerminal: false, minReadinessToExit: 55 },
  { id: 'commercialization', label: 'Commercialization', sequenceOrder: 6, moduleRoute: '/commercialization', isTerminal: false, minReadinessToExit: 75 },
  { id: 'completed', label: 'Completed', sequenceOrder: 7, moduleRoute: '/projects/:id', isTerminal: true, minReadinessToExit: 100 },
  { id: 'archived', label: 'Archived', sequenceOrder: 8, moduleRoute: '/projects/:id', isTerminal: true, minReadinessToExit: 0 },
];

export const workflowService = {
  async fetchStages(): Promise<WorkflowStage[]> {
    const { data, error } = await supabase
      .from('workflow_stages')
      .select('id, label, sequence_order, module_route, is_terminal, min_readiness_to_exit')
      .order('sequence_order');

    if (error && isSchemaError(error)) return FALLBACK_STAGES;
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbStage[]).map(mapStage);
  },

  async fetchLifecycle(projectId: string): Promise<InnovationLifecycleRecord | null> {
    const { data, error } = await supabase
      .from('innovation_lifecycle_records')
      .select(
        'project_id, current_stage_id, previous_stage_id, workflow_status, stage_entered_at, overall_readiness_score, blocked, blocked_reason, next_recommended_action'
      )
      .eq('project_id', projectId)
      .maybeSingle();

    if (error && isSchemaError(error)) return null;
    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapLifecycle(data as DbLifecycle);
  },

  async ensureLifecycleRecord(projectId: string): Promise<InnovationLifecycleRecord | null> {
    const existing = await workflowService.fetchLifecycle(projectId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('innovation_lifecycle_records')
      .insert({
        project_id: projectId,
        current_stage_id: 'research',
        workflow_status: 'in_progress',
      })
      .select(
        'project_id, current_stage_id, previous_stage_id, workflow_status, stage_entered_at, overall_readiness_score, blocked, blocked_reason, next_recommended_action'
      )
      .single();

    if (error) {
      if (isSchemaError(error)) return null;
      throw new Error(error.message);
    }
    return mapLifecycle(data as DbLifecycle);
  },

  async fetchReadiness(projectId: string): Promise<WorkflowReadinessScores | null> {
    const { data, error } = await supabase
      .from('workflow_readiness_scores')
      .select(
        'project_id, research_score, prototype_score, experiment_score, validation_score, funding_score, commercialization_score, overall_score, blockers, warnings'
      )
      .eq('project_id', projectId)
      .maybeSingle();

    if (error && isSchemaError(error)) return null;
    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapReadiness(data as DbReadiness);
  },

  async ensureReadinessRecord(projectId: string): Promise<WorkflowReadinessScores | null> {
    const existing = await workflowService.fetchReadiness(projectId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('workflow_readiness_scores')
      .insert({ project_id: projectId })
      .select(
        'project_id, research_score, prototype_score, experiment_score, validation_score, funding_score, commercialization_score, overall_score, blockers, warnings'
      )
      .single();

    if (error) {
      if (isSchemaError(error)) return null;
      throw new Error(error.message);
    }
    return mapReadiness(data as DbReadiness);
  },
};
