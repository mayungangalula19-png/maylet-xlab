import { useCallback, useEffect, useMemo, useState } from 'react';
import { savePrototypeMeta } from '../services/prototypeCreation.storage';
import type { FilterState, PortfolioItem, PortfolioViewMode } from '../types/commandCenter.types';
import { DEFAULT_FILTER, FILTER_PRESETS } from '../types/commandCenter.types';
import {
  applyFilters,
  computeCommandCenterKPIs,
  computePipelineMetrics,
  enrichPortfolio,
  stageToWorkspaceStage,
} from '../utils/commandCenter.utils';
import type { BuilderActivity } from '../types/prototypeBuilder.types';
import type { ExperimentLink } from '../types/prototypeCreation.types';
import { usePrototype } from './usePrototype';

const FILTER_KEY = 'maylet-proto-cc-filters';
const VIEW_KEY = 'maylet-proto-cc-view';

function loadFilter(): FilterState {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    if (raw) return { ...DEFAULT_FILTER, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_FILTER;
}

export function usePrototypeCommandCenter(userId: string | undefined, projectId?: string) {
  const proto = usePrototype(userId, undefined, projectId);
  const [filter, setFilter] = useState<FilterState>(loadFilter);
  const [viewMode, setViewMode] = useState<PortfolioViewMode>(() => {
    return (localStorage.getItem(VIEW_KEY) as PortfolioViewMode) || 'grid';
  });
  const [live, setLive] = useState(true);

  const portfolio = useMemo(
    () => enrichPortfolio(proto.prototypes),
    [proto.prototypes]
  );

  const filtered = useMemo(() => applyFilters(portfolio, filter), [portfolio, filter]);

  const kpis = useMemo(() => computeCommandCenterKPIs(portfolio), [portfolio]);
  const pipeline = useMemo(() => computePipelineMetrics(portfolio), [portfolio]);

  const industries = useMemo(
    () => [...new Set(portfolio.map((p) => p.meta.industry).filter(Boolean))],
    [portfolio]
  );
  const categories = useMemo(
    () => [...new Set(portfolio.map((p) => p.meta.category).filter(Boolean))],
    [portfolio]
  );

  const activityFeed = useMemo(() => {
    return portfolio
      .flatMap((p) =>
        p.meta.activity.map((a: BuilderActivity) => ({
          ...a,
          prototypeId: p.prototype.id,
          prototypeName: p.prototype.name,
        }))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }, [portfolio]);

  const experimentOps = useMemo(() => {
    const running = portfolio.filter((p) => p.meta.experiments.length > 0 && p.stage === 'experiment');
    const completed = portfolio.filter((p) => p.meta.experiments.length > 0 && p.stage !== 'experiment');
    const failedAssumptions = portfolio.reduce(
      (s, p) => s + p.meta.experiments.filter((e: ExperimentLink) => !e.expectedOutcome.trim()).length,
      0
    );
    return { running, completed, failedAssumptions, total: running.length + completed.length };
  }, [portfolio]);

  const validationIntel = useMemo(() => {
    const pending = portfolio.filter((p) => p.stage === 'validation' && p.validationScore < 70);
    const passed = portfolio.filter((p) => p.validationScore >= 70);
    const failed = portfolio.filter((p) => p.prototype.lifecycle_status === 'failed');
    const successRate =
      portfolio.length === 0 ? 0 : Math.round((passed.length / portfolio.length) * 100);
    return { pending, passed, failed, successRate, queue: pending.length };
  }, [portfolio]);

  const fundingCenter = useMemo(() => {
    const ready = portfolio.filter((p) => p.fundingScore >= 70);
    const avgInvestor = ready.length
      ? Math.round(ready.reduce((s, p) => s + p.fundingScore, 0) / ready.length)
      : 0;
    const avgMarket = ready.length
      ? Math.round(ready.reduce((s, p) => s + (p.meta.marketNeed.trim() ? 80 : 40), 0) / ready.length)
      : 0;
    return { ready, avgInvestor, avgMarket, count: ready.length };
  }, [portfolio]);

  const commercialCenter = useMemo(() => {
    const launch = portfolio.filter((p) => p.stage === 'commercialization' || p.readinessIndex >= 80);
    const adoption = portfolio.filter((p) => p.meta.adoptionIndicators.trim().length > 0);
    return { launch, adoption, pipeline: portfolio.filter((p) => p.stage === 'funding' || p.stage === 'commercialization') };
  }, [portfolio]);

  const researchLinks = useMemo(
    () => portfolio.filter((p) => p.prototype.project_id || p.prototype.research_id),
    [portfolio]
  );

  const stalled = useMemo(
    () =>
      portfolio.filter((p) => {
        const days = (Date.now() - new Date(p.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
        return days > 14 && p.stage !== 'commercialization';
      }),
    [portfolio]
  );

  const highPotential = useMemo(
    () => [...portfolio].sort((a, b) => b.readinessIndex - a.readinessIndex).slice(0, 5),
    [portfolio]
  );

  useEffect(() => {
    localStorage.setItem(FILTER_KEY, JSON.stringify(filter));
  }, [filter]);

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!live || !userId) return;
    const t = setInterval(() => {
      void proto.refresh({ silent: true });
    }, 30000);
    return () => clearInterval(t);
  }, [live, userId, proto.refresh]);

  const patchFilter = useCallback((patch: Partial<FilterState>) => {
    setFilter((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    const preset = FILTER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setFilter({ ...DEFAULT_FILTER, ...preset.filter, preset: presetId });
  }, []);

  const moveToStage = useCallback((item: PortfolioItem, stage: PortfolioItem['stage']) => {
    const nextMeta = {
      ...item.meta,
      workspaceStage: stageToWorkspaceStage(stage),
      updatedAt: new Date().toISOString(),
      activity: [
        {
          id: crypto.randomUUID(),
          type: 'status' as const,
          message: `Moved to ${stage} stage`,
          createdAt: new Date().toISOString(),
        },
        ...item.meta.activity,
      ].slice(0, 50),
    };
    savePrototypeMeta(item.prototype.id, nextMeta);
    void proto.refresh({ silent: true });
  }, [proto.refresh]);

  const currentQuarter = useMemo(() => {
    const d = new Date();
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `Q${q} ${d.getFullYear()}`;
  }, []);

  return {
    ...proto,
    portfolio,
    filtered,
    kpis,
    pipeline,
    filter,
    patchFilter,
    applyPreset,
    viewMode,
    setViewMode,
    live,
    setLive,
    industries,
    categories,
    activityFeed,
    experimentOps,
    validationIntel,
    fundingCenter,
    commercialCenter,
    researchLinks,
    stalled,
    highPotential,
    moveToStage,
    currentQuarter,
  };
}
