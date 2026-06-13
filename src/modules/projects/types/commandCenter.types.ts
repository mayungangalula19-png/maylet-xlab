export type PipelineStage =
  | 'Idea'
  | 'Analysis'
  | 'Experiment'
  | 'Prototype'
  | 'Funding'
  | 'Launched';

export type PipelineFilterStage = 'All' | PipelineStage;

export const PIPELINE_STAGES: PipelineStage[] = [
  'Idea',
  'Analysis',
  'Experiment',
  'Prototype',
  'Funding',
  'Launched',
];

export type ProjectDbStatus =
  | 'idea'
  | 'experiment'
  | 'prototype'
  | 'launched'
  | 'archived';

export type ProjectStatus =
  | 'Idea'
  | 'Experiment'
  | 'Prototype'
  | 'Launched'
  | 'Archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  sector: string;
  progress: number;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
  team_size: number;
  tasks_completed: number;
  tasks_total: number;
  ai_score?: number;
}

export interface ProjectStats {
  total: number;
  inProgress: number;
  completed: number;
  onHold: number;
  avgProgress: number;
  stageCounts: Record<PipelineStage, number>;
}

export interface Activity {
  id: string;
  user_name: string;
  action: string;
  project_name: string;
  created_at: string;
  type: 'task' | 'document' | 'team' | 'experiment';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ai' | 'team' | 'funding' | 'system';
  read: boolean;
  created_at: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  sector: string;
  initialStage: PipelineStage;
  userId: string;
  /** Extra fields (budget, tech stack, etc.) stored in activity metadata */
  metadata?: Record<string, unknown>;
}

export interface MayaInsight {
  recommendation: string;
  tip: string;
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export function normalizeProjectStatus(status: string): ProjectStatus {
  const map: Record<string, ProjectStatus> = {
    idea: 'Idea',
    experiment: 'Experiment',
    prototype: 'Prototype',
    launched: 'Launched',
    archived: 'Archived',
    Idea: 'Idea',
    Experiment: 'Experiment',
    Prototype: 'Prototype',
    Launched: 'Launched',
    Archived: 'Archived',
  };
  return map[status] ?? 'Idea';
}

/** Map UI / legacy status labels to PostgreSQL project_status enum */
export function toDbProjectStatus(status: ProjectStatus | string): ProjectDbStatus {
  const map: Record<string, ProjectDbStatus> = {
    Idea: 'idea',
    idea: 'idea',
    Experiment: 'experiment',
    experiment: 'experiment',
    Prototype: 'prototype',
    prototype: 'prototype',
    Launched: 'launched',
    launched: 'launched',
    Archived: 'archived',
    archived: 'archived',
  };
  return map[status] ?? 'idea';
}

export function getProjectPipelineStage(project: Pick<Project, 'status' | 'progress'>): PipelineStage {
  const status = project.status;
  const progress = project.progress ?? 0;

  if (status === 'Launched' || progress >= 100) return 'Launched';
  if (status === 'Prototype') return progress >= 80 ? 'Funding' : 'Prototype';
  if (status === 'Experiment') return 'Experiment';
  if (status === 'Idea') return progress >= 20 ? 'Analysis' : 'Idea';
  return 'Idea';
}

export function pipelineStageToDbFields(stage: PipelineStage): {
  status: ProjectDbStatus;
  progress: number;
} {
  switch (stage) {
    case 'Idea':
      return { status: 'idea', progress: 0 };
    case 'Analysis':
      return { status: 'idea', progress: 25 };
    case 'Experiment':
      return { status: 'experiment', progress: 45 };
    case 'Prototype':
      return { status: 'prototype', progress: 65 };
    case 'Funding':
      return { status: 'prototype', progress: 85 };
    case 'Launched':
      return { status: 'launched', progress: 100 };
  }
}

export function createEmptyStageCounts(): Record<PipelineStage, number> {
  return {
    Idea: 0,
    Analysis: 0,
    Experiment: 0,
    Prototype: 0,
    Funding: 0,
    Launched: 0,
  };
}

export function computeStageCounts(projects: Project[]): Record<PipelineStage, number> {
  const counts = createEmptyStageCounts();
  for (const project of projects) {
    const stage = getProjectPipelineStage(project);
    counts[stage] += 1;
  }
  return counts;
}
