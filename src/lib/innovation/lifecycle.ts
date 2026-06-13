import type { Project } from '../../types/project.types';

export type InnovationStage =
  | 'Idea'
  | 'Research'
  | 'Prototype'
  | 'Experiment'
  | 'Validation'
  | 'Funding'
  | 'Commercialization';

export type InnovationFilterStage = 'All' | InnovationStage;

export const INNOVATION_STAGES: InnovationStage[] = [
  'Idea',
  'Research',
  'Prototype',
  'Experiment',
  'Validation',
  'Funding',
  'Commercialization',
];

export type RiskLevel = 'low' | 'medium' | 'high';

export interface InnovationMetrics {
  stage: InnovationStage;
  progress: number;
  readinessScore: number;
  innovationScore: number;
  fundingReadiness: number;
  commercializationReadiness: number;
  riskLevel: RiskLevel;
  nextAction: string;
  missingRequirements: string[];
}

const NEXT_ACTIONS: Record<InnovationStage, string> = {
  Idea: 'Document your problem statement and validate the market need',
  Research: 'Compile literature review and capture research findings',
  Prototype: 'Build and iterate on your minimum viable prototype',
  Experiment: 'Design and run structured hypothesis experiments',
  Validation: 'Collect user feedback and validate product-market fit',
  Funding: 'Prepare pitch deck and apply to matching grants',
  Commercialization: 'Execute go-to-market strategy and scale operations',
};

const MISSING_BY_STAGE: Record<InnovationStage, string[]> = {
  Idea: ['Problem statement', 'Target user profile'],
  Research: ['Literature review', 'Research methodology'],
  Prototype: ['Technical architecture', 'MVP specification'],
  Experiment: ['Hypothesis definition', 'Success metrics'],
  Validation: ['User testing results', 'Market validation data'],
  Funding: ['Pitch deck', 'Financial projections'],
  Commercialization: ['Go-to-market plan', 'Partnership pipeline'],
};

export function getInnovationStage(project: Pick<Project, 'status' | 'progress'>): InnovationStage {
  const { status, progress } = project;

  if (status === 'Launched' || progress >= 100) return 'Commercialization';
  if (status === 'Prototype') {
    if (progress >= 85) return 'Funding';
    if (progress >= 65) return 'Validation';
    return 'Prototype';
  }
  if (status === 'Experiment') return 'Experiment';
  if (progress >= 30) return 'Research';
  return 'Idea';
}

export function getReadinessScore(project: Project): number {
  const taskRatio =
    project.tasks_total > 0
      ? (project.tasks_completed / project.tasks_total) * 25
      : 0;
  const aiBonus = project.ai_score ? project.ai_score * 0.15 : 0;
  return Math.min(100, Math.round(project.progress * 0.55 + taskRatio + aiBonus + 10));
}

export function getInnovationScore(project: Project): number {
  const stageIndex = INNOVATION_STAGES.indexOf(getInnovationStage(project));
  const stageBonus = (stageIndex + 1) * 8;
  return Math.min(100, Math.round(project.progress * 0.5 + stageBonus + (project.ai_score ?? 0) * 0.2));
}

export function getFundingReadiness(project: Project): number {
  const stage = getInnovationStage(project);
  const stageBase: Record<InnovationStage, number> = {
    Idea: 5,
    Research: 15,
    Prototype: 30,
    Experiment: 45,
    Validation: 60,
    Funding: 80,
    Commercialization: 95,
  };
  return Math.min(100, Math.round(stageBase[stage] * 0.6 + project.progress * 0.4));
}

export function getCommercializationReadiness(project: Project): number {
  if (project.status === 'Launched') return 95;
  const stage = getInnovationStage(project);
  if (stage === 'Commercialization') return 90;
  if (stage === 'Funding') return Math.min(85, project.progress + 20);
  return Math.max(0, Math.round(project.progress * 0.35));
}

export function getRiskLevel(project: Project): RiskLevel {
  const readiness = getReadinessScore(project);
  const stage = getInnovationStage(project);
  if (readiness >= 75 && stage !== 'Idea') return 'low';
  if (readiness >= 45) return 'medium';
  return 'high';
}

export function getInnovationMetrics(project: Project): InnovationMetrics {
  const stage = getInnovationStage(project);
  const progress = Math.round(project.progress);
  const readinessScore = getReadinessScore(project);
  const missing = MISSING_BY_STAGE[stage].filter((_, i) => {
    if (readinessScore > 70) return i > 0;
    if (readinessScore > 40) return i > 1;
    return true;
  });

  return {
    stage,
    progress,
    readinessScore,
    innovationScore: getInnovationScore(project),
    fundingReadiness: getFundingReadiness(project),
    commercializationReadiness: getCommercializationReadiness(project),
    riskLevel: getRiskLevel(project),
    nextAction: NEXT_ACTIONS[stage],
    missingRequirements: missing.slice(0, 2),
  };
}

export function createEmptyInnovationCounts(): Record<InnovationStage, number> {
  return {
    Idea: 0,
    Research: 0,
    Prototype: 0,
    Experiment: 0,
    Validation: 0,
    Funding: 0,
    Commercialization: 0,
  };
}

export function computeInnovationStageCounts(
  projects: Project[]
): Record<InnovationStage, number> {
  const counts = createEmptyInnovationCounts();
  for (const project of projects) {
    counts[getInnovationStage(project)] += 1;
  }
  return counts;
}

export function formatTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
