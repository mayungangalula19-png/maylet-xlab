export type WorkflowStageId =
  | 'idea'
  | 'research'
  | 'prototype'
  | 'experiment'
  | 'validation'
  | 'funding'
  | 'commercialization'
  | 'completed'
  | 'archived';

export type WorkflowStatus =
  | 'pending'
  | 'in_progress'
  | 'blocked'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'completed';

export interface WorkflowStage {
  id: WorkflowStageId;
  label: string;
  sequenceOrder: number;
  moduleRoute: string;
  isTerminal: boolean;
  minReadinessToExit: number;
}

export interface InnovationLifecycleRecord {
  projectId: string;
  currentStageId: WorkflowStageId;
  previousStageId: WorkflowStageId | null;
  workflowStatus: WorkflowStatus;
  stageEnteredAt: string;
  overallReadinessScore: number;
  blocked: boolean;
  blockedReason: string | null;
  nextRecommendedAction: string | null;
}

export interface WorkflowReadinessScores {
  projectId: string;
  researchScore: number;
  prototypeScore: number;
  experimentScore: number;
  validationScore: number;
  fundingScore: number;
  commercializationScore: number;
  overallScore: number;
  blockers: string[];
  warnings: string[];
}

export interface WorkflowGuardResult {
  allowed: boolean;
  reason: string | null;
  requirements: string[];
}
