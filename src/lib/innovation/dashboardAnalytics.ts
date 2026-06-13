import type { Project } from '../../types/project.types';
import {
  INNOVATION_STAGES,
  computeInnovationStageCounts,
  getInnovationMetrics,
  getInnovationStage,
  type InnovationStage,
} from './lifecycle';

export type TrendDirection = 'up' | 'down' | 'stable';
export type HealthStatus = 'healthy' | 'attention' | 'critical';

export interface ExecutiveTrends {
  monthlyGrowth: number;
  trendDirection: TrendDirection;
  statusIndicator: HealthStatus;
}

export interface PipelineAnalyticsDetail {
  stageCompletionRates: Record<InnovationStage, number>;
  bottlenecks: InnovationStage[];
  successRates: Record<InnovationStage, number>;
  totalProjects: number;
}

export interface ExperimentCategory {
  name: string;
  count: number;
  key: string;
}

export interface ExperimentSummary {
  running: number;
  completed: number;
  successRate: number;
  validationResults: number;
  categories: ExperimentCategory[];
}

export interface ResearchAnalytics {
  researchCompletion: number;
  citationCount: number;
  researchQualityScore: number;
}

export interface AnalyticsChartData {
  innovationTrends: { label: string; value: number }[];
  researchActivity: { label: string; value: number }[];
  fundingProgress: { label: string; value: number }[];
  experimentResults: { label: string; value: number }[];
  teamProductivity: { label: string; value: number }[];
  commercializationProgress: { label: string; value: number }[];
}

const EXPERIMENT_CATEGORIES: ExperimentCategory[] = [
  { name: 'Market Validation', count: 0, key: 'market' },
  { name: 'Pricing Test', count: 0, key: 'pricing' },
  { name: 'Feature Validation', count: 0, key: 'feature' },
  { name: 'Competitor Analysis', count: 0, key: 'competitor' },
  { name: 'Usability Testing', count: 0, key: 'usability' },
];

export function computeExecutiveTrends(projects: Project[]): ExecutiveTrends {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

  const recent = projects.filter((p) => new Date(p.created_at).getTime() >= thirtyDaysAgo).length;
  const prior = projects.filter((p) => {
    const t = new Date(p.created_at).getTime();
    return t >= sixtyDaysAgo && t < thirtyDaysAgo;
  }).length;

  const monthlyGrowth =
    prior > 0 ? Math.round(((recent - prior) / prior) * 100) : recent > 0 ? 100 : 0;

  const trendDirection: TrendDirection =
    monthlyGrowth > 5 ? 'up' : monthlyGrowth < -5 ? 'down' : 'stable';

  const atRisk = projects.filter((p) => getInnovationMetrics(p).riskLevel === 'high').length;
  const ratio = projects.length > 0 ? atRisk / projects.length : 0;
  const statusIndicator: HealthStatus =
    ratio > 0.4 ? 'critical' : ratio > 0.15 || monthlyGrowth < -10 ? 'attention' : 'healthy';

  return { monthlyGrowth, trendDirection, statusIndicator };
}

export function computePipelineAnalytics(projects: Project[]): PipelineAnalyticsDetail {
  const stageCounts = computeInnovationStageCounts(projects);
  const total = projects.length || 1;

  const stageCompletionRates = {} as Record<InnovationStage, number>;
  const successRates = {} as Record<InnovationStage, number>;

  for (const stage of INNOVATION_STAGES) {
    const idx = INNOVATION_STAGES.indexOf(stage);
    const atOrBeyond = INNOVATION_STAGES.slice(idx).reduce((s, st) => s + stageCounts[st], 0);
    stageCompletionRates[stage] = Math.round((atOrBeyond / total) * 100);
    const inStage = projects.filter((p) => getInnovationStage(p) === stage);
    const avgProgress =
      inStage.length > 0
        ? inStage.reduce((s, p) => s + p.progress, 0) / inStage.length
        : stageCompletionRates[stage];
    successRates[stage] = Math.round(avgProgress);
  }

  const avgCount = total / INNOVATION_STAGES.length;
  const bottlenecks = INNOVATION_STAGES.filter(
    (s) => stageCounts[s] > avgCount * 1.5 && stageCounts[s] >= 2
  );
  if (bottlenecks.length === 0) {
    const maxStage = INNOVATION_STAGES.reduce((best, s) =>
      stageCounts[s] > stageCounts[best] ? s : best
    );
    if (stageCounts[maxStage] > 0) bottlenecks.push(maxStage);
  }

  return {
    stageCompletionRates,
    bottlenecks,
    successRates,
    totalProjects: projects.length,
  };
}

export function buildExperimentSummary(
  projects: Project[],
  runningCount: number,
  totalExperiments: number
): ExperimentSummary {
  const completed = projects.filter(
    (p) => p.status === 'Launched' || getInnovationStage(p) === 'Validation'
  ).length;
  const successRate =
    totalExperiments > 0
      ? Math.round((completed / Math.max(1, totalExperiments)) * 100)
      : projects.length > 0
        ? Math.round((completed / projects.length) * 100)
        : 0;

  const categories = EXPERIMENT_CATEGORIES.map((cat, i) => ({
    ...cat,
    count: Math.max(
      0,
      Math.floor(totalExperiments / 5) +
        (projects.filter((p) => getInnovationStage(p) === 'Experiment').length > i ? 1 : 0)
    ),
  }));

  return {
    running: runningCount,
    completed: completed || Math.floor(totalExperiments * 0.4),
    successRate,
    validationResults: projects.filter((p) => getInnovationStage(p) === 'Validation').length,
    categories,
  };
}

export function computeResearchAnalytics(
  projects: Project[],
  documentCount: number
): ResearchAnalytics {
  const researchProjects = projects.filter((p) => {
    const s = getInnovationStage(p);
    return s === 'Research' || s === 'Idea';
  });
  const completedResearch = projects.filter((p) => {
    const s = getInnovationStage(p);
    return s !== 'Idea' && s !== 'Research';
  }).length;

  const researchCompletion =
    projects.length > 0 ? Math.round((completedResearch / projects.length) * 100) : 0;
  const citationCount = Math.max(documentCount * 2, researchProjects.length * 3);
  const avgQuality =
    projects.length > 0
      ? projects.reduce((s, p) => s + getInnovationMetrics(p).innovationScore, 0) / projects.length
      : 0;
  const researchQualityScore = Math.min(100, Math.round(avgQuality * 0.6 + documentCount * 3));

  return { researchCompletion, citationCount, researchQualityScore };
}

export function buildAnalyticsCharts(
  projects: Project[],
  stageCounts: ReturnType<typeof computeInnovationStageCounts>,
  teamProductivity: number,
  fundingPotential: number
): AnalyticsChartData {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const base = projects.length;

  return {
    innovationTrends: months.map((label, i) => ({
      label,
      value: Math.max(0, Math.round(base * (0.4 + i * 0.12))),
    })),
    researchActivity: months.map((label, i) => ({
      label,
      value: Math.max(0, Math.round((stageCounts.Research + stageCounts.Idea) * (0.5 + i * 0.1))),
    })),
    fundingProgress: months.map((label, i) => ({
      label,
      value: Math.max(0, Math.round(fundingPotential * (0.3 + i * 0.12))),
    })),
    experimentResults: months.map((label, i) => ({
      label,
      value: Math.max(0, Math.round(stageCounts.Experiment * (0.4 + i * 0.15))),
    })),
    teamProductivity: months.map((label, i) => ({
      label,
      value: Math.max(0, Math.round(teamProductivity * (0.5 + i * 0.08))),
    })),
    commercializationProgress: months.map((label, i) => ({
      label,
      value: Math.max(0, Math.round(stageCounts.Commercialization * (0.3 + i * 0.2) + i * 2)),
    })),
  };
}
