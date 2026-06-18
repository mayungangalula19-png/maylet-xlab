import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadAdminExperimentOps } from '../services/adminExperimentOps.service';
import type {
  AdminExperimentFilters,
  AdminExperimentOpsSnapshot,
  ExecutivePipelineStage,
} from '../types/experimentOpsAdmin.types';

const EMPTY_SNAPSHOT: AdminExperimentOpsSnapshot = {
  rows: [],
  stats: {
    total: 0,
    active: 0,
    completed: 0,
    failed: 0,
    validationReady: 0,
    fundingReady: 0,
    successRate: 0,
    pendingReview: 0,
  },
  executiveStageCounts: {
    draft: 0,
    scheduled: 0,
    running: 0,
    completed: 0,
    under_review: 0,
    approved: 0,
    validation_ready: 0,
    funding_ready: 0,
  },
  maya: {
    bullets: [],
    patterns: [],
    anomalies: [],
    improvements: [],
    validationReadiness: 0,
    successProbability: 0,
    failureRisk: 0,
    predictedValidationOutcome: 'HOLD',
    priorityExperiment: null,
    priorityAction: '',
    futureExperiments: [],
  },
  activity: [],
  analytics: {
    successTrend: [],
    budgetVsOutcome: [],
    categoryBreakdown: [],
    validationFunnel: [],
    riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
  },
  platformTotal: 0,
  scopeWarning: null,
};

export function useAdminExperiments(pageSize = 12) {
  const [snapshot, setSnapshot] = useState<AdminExperimentOpsSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminExperimentFilters>({});
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const result = await loadAdminExperimentOps();
    if (result.error) {
      setError(result.error.message);
      setSnapshot(EMPTY_SNAPSHOT);
    } else {
      setSnapshot(result.data ?? EMPTY_SNAPSHOT);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    let rows = snapshot.rows;
    const q = filters.search?.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.displayId.toLowerCase().includes(q) ||
          r.leadResearcher.toLowerCase().includes(q) ||
          (r.projectName?.toLowerCase().includes(q) ?? false)
      );
    }
    if (filters.executiveStage && filters.executiveStage !== 'all') {
      rows = rows.filter((r) => r.executiveStage === filters.executiveStage);
    }
    if (filters.riskLevel && filters.riskLevel !== 'all') {
      rows = rows.filter((r) => r.riskLevel === filters.riskLevel);
    }
    if (filters.status && filters.status !== 'all') {
      rows = rows.filter((r) => r.status.toLowerCase() === filters.status!.toLowerCase());
    }
    if (filters.category && filters.category !== 'all') {
      rows = rows.filter((r) => r.category === filters.category);
    }
    return rows;
  }, [snapshot.rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = page * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [filters]);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;
  const goPrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const goNext = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  const selected = useMemo(
    () => snapshot.rows.find((r) => r.id === selectedId) ?? null,
    [snapshot.rows, selectedId]
  );

  const setExecutiveStageFilter = useCallback((stage: ExecutivePipelineStage | 'all') => {
    setFilters((prev) => ({
      ...prev,
      executiveStage: stage === 'all' ? undefined : stage,
    }));
  }, []);

  return {
    ...snapshot,
    rows: paginatedRows,
    allRows: filteredRows,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    page,
    setPage,
    totalPages,
    pageSize,
    totalFiltered: filteredRows.length,
    pagination: { page, totalPages, canPrev, canNext, goPrev, goNext },
    selected,
    selectedId,
    setSelectedId,
    setExecutiveStageFilter,
    refresh: () => load(true),
  };
}
