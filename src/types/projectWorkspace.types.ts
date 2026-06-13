import type { InnovationStage } from '../lib/innovation/lifecycle';
import type { ValidationEvaluationResult, ValidationEvidenceSummary } from '../modules/validation/types/validation.types';

export interface ProjectWorkspaceMeta {
  tagline: string;
  category: string;
  tags: string[];
  problem_statement: string;
  innovation_goals: string;
  target_users: string;
  pending_invites: string[];
}

export interface LinkedPrototype {
  id: string;
  name: string;
  status: string;
  lifecycle_status: string;
}

export interface LinkedExperiment {
  id: string;
  title: string;
  status: string | null;
  type: string | null;
}

export interface LinkedValidation {
  id: string;
  decision: string;
  overall_score: number;
  created_at: string;
}

export interface LinkedPitch {
  id: string;
  title: string;
  status: string | null;
  amount_sought: number | null;
  created_at: string;
}

export interface LinkedDocument {
  id: string;
  name: string;
  file_type: string | null;
  created_at: string;
}

export interface TeamMemberRow {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  full_name: string;
  email: string;
}

export interface TimelineRow {
  id: string;
  type: string;
  title: string;
  created_at: string;
}

export interface StageGate {
  stage: InnovationStage;
  status: 'locked' | 'in_progress' | 'ready' | 'passed';
  detail: string;
}

export interface ProjectControlAssets {
  researchCompletion: number;
  researchNotes: number;
  researchFindings: number;
  researchDocs: number;
  prototypes: LinkedPrototype[];
  experiments: LinkedExperiment[];
  validations: LinkedValidation[];
  pitches: LinkedPitch[];
  documents: LinkedDocument[];
  teamMembers: TeamMemberRow[];
  timeline: TimelineRow[];
  teamId: string | null;
}

export interface MayaControlInsights {
  score: number;
  risk: 'low' | 'medium' | 'high';
  bullets: string[];
  next: string;
  evidenceSummary: string | null;
  dimensionScores: ValidationEvaluationResult['scores'] | null;
}

export interface ControlCenterFormState {
  name: string;
  description: string;
  sector: string;
  stage: InnovationStage;
  progress: number;
  tagsInput: string;
}

export interface ProjectMetadataPayload {
  workspace: ProjectWorkspaceMeta;
  innovation_stage?: InnovationStage;
  maya_snapshot?: {
    innovation_score: number;
    risk_level: string;
    next_action: string;
    overall_readiness?: number;
    evaluated_at: string;
  };
}

export const EMPTY_PROJECT_WORKSPACE: ProjectWorkspaceMeta = {
  tagline: '',
  category: 'Product Innovation',
  tags: [],
  problem_statement: '',
  innovation_goals: '',
  target_users: '',
  pending_invites: [],
};

export type { ValidationEvidenceSummary, ValidationEvaluationResult };
