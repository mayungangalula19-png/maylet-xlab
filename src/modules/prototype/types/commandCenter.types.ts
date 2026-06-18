import type { PrototypeBuilderMeta } from './prototypeBuilder.types';
import type { PrototypeLifecycleStatus, PrototypeRecord } from './prototype.types';

export type InnovationStage =
  | 'research'
  | 'prototype'
  | 'experiment'
  | 'validation'
  | 'funding'
  | 'commercialization';

export type PortfolioViewMode = 'grid' | 'list' | 'table' | 'kanban' | 'timeline';

export interface PortfolioItem {
  prototype: PrototypeRecord;
  meta: PrototypeBuilderMeta;
  stage: InnovationStage;
  completion: number;
  validationScore: number;
  fundingScore: number;
  readinessIndex: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastActivity: string;
}

export interface CommandCenterKPIs {
  total: number;
  active: number;
  inValidation: number;
  fundingReady: number;
  commercialized: number;
  revenueGenerating: number;
  highRisk: number;
  archived: number;
  innovationHealth: number;
  growthPct: number;
}

export interface PipelineStageMetrics {
  id: InnovationStage;
  label: string;
  count: number;
  successRate: number;
  avgDaysInStage: number;
  bottleneck: boolean;
  riskCount: number;
}

export interface FilterState {
  search: string;
  industry: string;
  stage: string;
  category: string;
  validationStatus: string;
  fundingStatus: string;
  preset: string;
}

export const INNOVATION_STAGES: { id: InnovationStage; label: string }[] = [
  { id: 'research', label: 'Research' },
  { id: 'prototype', label: 'Prototype' },
  { id: 'experiment', label: 'Experiment' },
  { id: 'validation', label: 'Validation' },
  { id: 'funding', label: 'Funding' },
  { id: 'commercialization', label: 'Commercialization' },
];

export const FILTER_PRESETS: { id: string; label: string; filter: Partial<FilterState> }[] = [
  { id: 'all', label: 'All prototypes', filter: {} },
  { id: 'active', label: 'Active builds', filter: { stage: 'prototype' } },
  { id: 'validation', label: 'In validation', filter: { stage: 'validation' } },
  { id: 'funding', label: 'Funding ready', filter: { stage: 'funding' } },
  { id: 'high-risk', label: 'High risk', filter: { validationStatus: 'at-risk' } },
];

export const DEFAULT_FILTER: FilterState = {
  search: '',
  industry: 'all',
  stage: 'all',
  category: 'all',
  validationStatus: 'all',
  fundingStatus: 'all',
  preset: 'all',
};

export function inferInnovationStage(
  p: PrototypeRecord,
  meta: PrototypeBuilderMeta
): InnovationStage {
  if (meta.workspaceStage === 'commercialization') return 'commercialization';
  if (meta.workspaceStage === 'funding_ready' || p.lifecycle_status === 'success') return 'funding';
  if (meta.workspaceStage === 'validation' || p.lifecycle_status === 'testing') return 'validation';
  if (meta.experiments.length > 0 || meta.workspaceStage === 'testing') return 'experiment';
  if (p.lifecycle_status === 'building' || meta.workspaceStage === 'prototype') return 'prototype';
  if (p.project_id || p.research_id || p.lifecycle_status === 'draft') return 'research';
  return 'prototype';
}

export function computePortfolioCompletion(meta: PrototypeBuilderMeta): number {
  const checks = [
    !!meta.name.trim(),
    !!meta.description.trim(),
    !!meta.problemStatement.trim(),
    !!meta.solutionOverview.trim(),
    meta.features.length > 0,
    meta.experiments.length > 0,
    meta.validation.validationScore != null,
    meta.attachments.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function computeFundingScore(meta: PrototypeBuilderMeta, lifecycle: PrototypeLifecycleStatus): number {
  let score = computePortfolioCompletion(meta) * 0.4;
  if (meta.marketNeed.trim()) score += 15;
  if (meta.competitiveAdvantage.trim()) score += 10;
  if (lifecycle === 'success') score += 25;
  if (meta.validation.validationScore != null) score += meta.validation.validationScore * 0.1;
  return Math.min(100, Math.round(score));
}

export function computeReadinessIndex(
  completion: number,
  validationScore: number,
  fundingScore: number
): number {
  return Math.round(completion * 0.3 + validationScore * 0.35 + fundingScore * 0.35);
}

export function computeRiskLevel(
  p: PrototypeRecord,
  meta: PrototypeBuilderMeta
): PortfolioItem['riskLevel'] {
  if (p.lifecycle_status === 'failed') return 'high';
  if (meta.validation.validationScore != null && meta.validation.validationScore < 40) return 'high';
  if (p.lifecycle_status === 'testing' && meta.features.length === 0) return 'medium';
  return 'low';
}
