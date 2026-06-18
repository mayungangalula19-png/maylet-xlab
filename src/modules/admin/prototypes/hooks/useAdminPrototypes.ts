import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadAdminPrototypeOps } from '../services/adminPrototypeOps.service';
import type {
  AdminPrototypeFilters,
  AdminPrototypeOpsSnapshot,
  ExecutivePrototypeStage,
} from '../types/prototypeOpsAdmin.types';
import { buildAdminPrototypeStats } from '../utils/prototypeOpsAdmin.utils';

const EMPTY_SNAPSHOT: AdminPrototypeOpsSnapshot = {
  rows: [],
  stats: {
    total: 0,
    active: 0,
    successRate: 0,
    experimentReady: 0,
    validationReady: 0,
    commercializationReady: 0,
    highRisk: 0,
    fundingEligible: 0,
    avgDevelopmentDays: 0,
    portfolioHealthScore: 0,
    trendTotalPct: 0,
    trendActivePct: 0,
    trendSuccessPct: 0,
  },
  executiveStageCounts: {
    idea: 0,
    research: 0,
    concept_design: 0,
    prototype_design: 0,
    development: 0,
    internal_testing: 0,
    external_testing: 0,
    experiment_ready: 0,
    validation_ready: 0,
    funding_ready: 0,
    commercialization_ready: 0,
  },
  lifecycleInsights: [],
  maya: {
    bullets: [],
    patterns: [],
    anomalies: [],
    improvements: [],
    executiveSummary: '',
    technicalSummary: '',
    engineeringReport: '',
    validationReadiness: 0,
    successProbability: 0,
    failureRisk: 0,
    manufacturingReadiness: 0,
    commercializationPrediction: 0,
    aiConfidence: 0,
    priorityPrototype: null,
    priorityAction: '',
    bottleneckStage: null,
    recommendations: [],
  },
  activity: [],
  analytics: {
    successTrend: [],
    failureTrend: [],
    readinessDistribution: [],
    fundingFunnel: [],
    commercializationFunnel: [],
    departmentPerformance: [],
    innovationVelocity: [],
    riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
    testingPassRate: 0,
  },
  platformTotal: 0,
  scopeWarning: null,
  departments: [],
};

export function useAdminPrototypes(pageSize = 10) {
  const [snapshot, setSnapshot] = useState<AdminPrototypeOpsSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminPrototypeFilters>({});
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const result = await loadAdminPrototypeOps();
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

  useEffect(() => {
    const interval = setInterval(() => {
      void load(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [load]);

  const filteredRows = useMemo(() => {
    let rows = snapshot.rows;
    const q = filters.search?.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.displayId.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q) ||
          (r.parentProjectName?.toLowerCase().includes(q) ?? false) ||
          r.department.toLowerCase().includes(q)
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
    if (departmentFilter !== 'all') {
      rows = rows.filter((r) => r.department === departmentFilter);
    }
    if (filters.department && filters.department !== 'all') {
      rows = rows.filter((r) => r.department === filters.department);
    }
    return rows;
  }, [snapshot.rows, filters, departmentFilter]);

  const statsForDepartment = useMemo(() => {
    if (departmentFilter === 'all') return snapshot.stats;
    const deptRows = snapshot.rows.filter((r) => r.department === departmentFilter);
    if (deptRows.length === 0) return snapshot.stats;
    return buildAdminPrototypeStats(deptRows);
  }, [snapshot.rows, snapshot.stats, departmentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = page * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [filters, departmentFilter]);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;
  const goPrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const goNext = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  const selected = useMemo(
    () => snapshot.rows.find((r) => r.id === selectedId) ?? null,
    [snapshot.rows, selectedId]
  );

  const setExecutiveStageFilter = useCallback((stage: ExecutivePrototypeStage | 'all') => {
    setFilters((prev) => ({
      ...prev,
      executiveStage: stage === 'all' ? undefined : stage,
    }));
  }, []);

  return {
    ...snapshot,
    stats: statsForDepartment,
    rows: paginatedRows,
    allRows: filteredRows,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    departmentFilter,
    setDepartmentFilter,
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
