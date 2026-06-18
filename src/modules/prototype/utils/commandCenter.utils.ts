import { loadPrototypeMeta } from '../services/prototypeCreation.storage';
import { emptyBuilderMeta } from '../types/prototypeBuilder.types';
import type {
  CommandCenterKPIs,
  FilterState,
  InnovationStage,
  PipelineStageMetrics,
  PortfolioItem,
} from '../types/commandCenter.types';
import {
  INNOVATION_STAGES,
  computeFundingScore,
  computePortfolioCompletion,
  computeReadinessIndex,
  computeRiskLevel,
  inferInnovationStage,
} from '../types/commandCenter.types';
import type { PrototypeRecord } from '../types/prototype.types';

export function enrichPortfolio(prototypes: PrototypeRecord[]): PortfolioItem[] {
  return prototypes.map((prototype) => {
    const stored = loadPrototypeMeta(prototype.id);
    const meta = {
      ...emptyBuilderMeta({
        name: prototype.name,
        description: prototype.description ?? '',
        projectId: prototype.project_id ?? '',
        researchId: prototype.research_id ?? prototype.project_id ?? '',
      }),
      ...stored,
      name: prototype.name,
    };
    const completion = computePortfolioCompletion(meta);
    const validationScore = meta.validation.validationScore ?? Math.round(completion * 0.6);
    const fundingScore = computeFundingScore(meta, prototype.lifecycle_status);
    const readinessIndex = computeReadinessIndex(completion, validationScore, fundingScore);
    const activityDates = [
      prototype.updated_at,
      meta.updatedAt,
      ...meta.activity.map((a: { createdAt: string }) => a.createdAt),
    ].filter(Boolean);
    const lastActivity = activityDates.sort().reverse()[0] ?? prototype.updated_at;

    return {
      prototype,
      meta,
      stage: inferInnovationStage(prototype, meta),
      completion,
      validationScore,
      fundingScore,
      readinessIndex,
      riskLevel: computeRiskLevel(prototype, meta),
      lastActivity,
    };
  });
}

export function computeCommandCenterKPIs(portfolio: PortfolioItem[]): CommandCenterKPIs {
  const total = portfolio.length;
  const active = portfolio.filter((p) =>
    ['prototype', 'experiment'].includes(p.stage)
  ).length;
  const inValidation = portfolio.filter((p) => p.stage === 'validation').length;
  const fundingReady = portfolio.filter((p) => p.stage === 'funding').length;
  const commercialized = portfolio.filter((p) => p.stage === 'commercialization').length;
  const highRisk = portfolio.filter((p) => p.riskLevel === 'high').length;
  const archived = portfolio.filter((p) => p.prototype.status === 'archived').length;
  const revenueGenerating = portfolio.filter(
    (p) => p.meta.adoptionIndicators.trim().length > 0 && p.stage === 'commercialization'
  ).length;

  const innovationHealth =
    total === 0
      ? 0
      : Math.round(portfolio.reduce((s, p) => s + p.readinessIndex, 0) / total);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = portfolio.filter(
    (p) => new Date(p.prototype.created_at).getTime() > thirtyDaysAgo
  ).length;
  const growthPct = total > 0 ? Math.round((recent / total) * 100) : 0;

  return {
    total,
    active,
    inValidation,
    fundingReady,
    commercialized,
    revenueGenerating,
    highRisk,
    archived,
    innovationHealth,
    growthPct,
  };
}

export function computePipelineMetrics(portfolio: PortfolioItem[]): PipelineStageMetrics[] {
  const now = Date.now();
  return INNOVATION_STAGES.map((stage: (typeof INNOVATION_STAGES)[number]) => {
    const items = portfolio.filter((p) => p.stage === stage.id);
    const successCount = items.filter((p) => p.validationScore >= 70).length;
    const avgDays =
      items.length === 0
        ? 0
        : Math.round(
            items.reduce((s, p) => {
              const days = (now - new Date(p.prototype.updated_at).getTime()) / (1000 * 60 * 60 * 24);
              return s + days;
            }, 0) / items.length
          );
    const riskCount = items.filter((p) => p.riskLevel === 'high').length;
    const maxCount = Math.max(...INNOVATION_STAGES.map((s: (typeof INNOVATION_STAGES)[number]) => portfolio.filter((p) => p.stage === s.id).length), 1);

    return {
      id: stage.id,
      label: stage.label,
      count: items.length,
      successRate: items.length === 0 ? 0 : Math.round((successCount / items.length) * 100),
      avgDaysInStage: avgDays,
      bottleneck: items.length >= maxCount * 0.4 && items.length > 2,
      riskCount,
    };
  });
}

export function applyFilters(portfolio: PortfolioItem[], filter: FilterState): PortfolioItem[] {
  return portfolio.filter((item) => {
    const q = filter.search.toLowerCase();
    if (q) {
      const hay = `${item.prototype.name} ${item.prototype.description ?? ''} ${item.meta.industry} ${item.meta.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filter.industry !== 'all' && item.meta.industry !== filter.industry) return false;
    if (filter.stage !== 'all' && item.stage !== filter.stage) return false;
    if (filter.category !== 'all' && item.meta.category !== filter.category) return false;
    if (filter.validationStatus === 'at-risk' && item.riskLevel !== 'high') return false;
    if (filter.validationStatus === 'validated' && item.validationScore < 70) return false;
    if (filter.fundingStatus === 'ready' && item.fundingScore < 70) return false;
    return true;
  });
}

export function stageToWorkspaceStage(stage: InnovationStage): PortfolioItem['meta']['workspaceStage'] {
  const map: Record<InnovationStage, PortfolioItem['meta']['workspaceStage']> = {
    research: 'draft',
    prototype: 'prototype',
    experiment: 'testing',
    validation: 'validation',
    funding: 'funding_ready',
    commercialization: 'commercialization',
  };
  return map[stage];
}
