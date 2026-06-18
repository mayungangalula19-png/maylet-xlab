import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadAdminVaultOps } from '../services/adminVaultOps.service';
import type { AdminVaultFilters, AdminVaultOpsSnapshot } from '../types/vaultOpsAdmin.types';
import { buildAdminVaultStats } from '../utils/vaultOpsAdmin.utils';

const EMPTY_SNAPSHOT: AdminVaultOpsSnapshot = {
  rows: [],
  stats: {
    totalAssets: 0,
    activeAssets: 0,
    archivedAssets: 0,
    confidentialAssets: 0,
    patents: 0,
    researchDocuments: 0,
    prototypesStored: 0,
    experimentsStored: 0,
    commercialAssets: 0,
    knowledgeHealthScore: 0,
    trendTotalPct: 0,
    trendActivityPct: 0,
  },
  folders: [],
  collections: [],
  domains: [],
  maya: {
    bullets: [],
    patterns: [],
    anomalies: [],
    improvements: [],
    executiveSummary: '',
    duplicateWarnings: [],
    missingDocumentation: [],
    relatedRecommendations: [],
    knowledgeGraphInsights: [],
    aiConfidence: 0,
    priorityAsset: null,
    priorityAction: '',
  },
  activity: [],
  analytics: {
    knowledgeGrowth: [],
    documentActivity: [],
    assetUtilization: [],
    researchOutput: [],
    portfolioHealth: [],
    classificationDistribution: {
      public: 0,
      internal: 0,
      confidential: 0,
      restricted: 0,
      strategic: 0,
      ip_protected: 0,
      patent_sensitive: 0,
    },
  },
  platformTotal: 0,
  scopeWarning: null,
  departments: [],
  authors: [],
};

export function useAdminVault(pageSize = 12) {
  const [snapshot, setSnapshot] = useState<AdminVaultOpsSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminVaultFilters>({});
  const [page, setPage] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [explorerFolder, setExplorerFolder] = useState<string>('all');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const result = await loadAdminVaultOps();
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
    const interval = setInterval(() => void load(true), 60000);
    return () => clearInterval(interval);
  }, [load]);

  const filteredRows = useMemo(() => {
    let rows = snapshot.rows;
    const q = filters.search?.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.displayId.toLowerCase().includes(q) ||
          r.authorName.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          (r.contentPreview?.toLowerCase().includes(q) ?? false) ||
          (r.projectName?.toLowerCase().includes(q) ?? false)
      );
    }
    if (filters.assetType && filters.assetType !== 'all') {
      rows = rows.filter((r) => r.assetType === filters.assetType);
    }
    if (filters.classification && filters.classification !== 'all') {
      rows = rows.filter((r) => r.classification === filters.classification);
    }
    if (filters.status && filters.status !== 'all') {
      rows = rows.filter((r) => r.status === filters.status);
    }
    if (filters.department && filters.department !== 'all') {
      rows = rows.filter((r) => r.department === filters.department);
    }
    if (filters.author && filters.author !== 'all') {
      rows = rows.filter((r) => r.authorName === filters.author);
    }
    if (filters.innovationStage && filters.innovationStage !== 'all') {
      rows = rows.filter((r) => r.innovationStage === filters.innovationStage);
    }
    if (filters.folder && filters.folder !== 'all') {
      rows = rows.filter((r) => r.folder === filters.folder);
    }
    if (filters.collection && filters.collection !== 'all') {
      rows = rows.filter((r) => r.collection === filters.collection);
    }
    if (filters.domain && filters.domain !== 'all') {
      rows = rows.filter((r) => r.knowledgeDomain === filters.domain);
    }
    if (explorerFolder !== 'all') {
      rows = rows.filter((r) => r.folder === explorerFolder);
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      rows = rows.filter((r) => new Date(r.createdAt).getTime() >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime();
      rows = rows.filter((r) => new Date(r.createdAt).getTime() <= to);
    }
    return rows;
  }, [snapshot.rows, filters, explorerFolder]);

  const statsForScope = useMemo(() => {
    if (filteredRows.length === snapshot.rows.length) return snapshot.stats;
    return buildAdminVaultStats(filteredRows);
  }, [filteredRows, snapshot.rows.length, snapshot.stats]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = page * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [filters, explorerFolder]);

  const selected = useMemo(
    () => snapshot.rows.find((r) => r.sourceKey === selectedKey) ?? null,
    [snapshot.rows, selectedKey]
  );

  const pagination = useMemo(
    () => ({
      page,
      totalPages,
      canPrev: page > 0,
      canNext: page < totalPages - 1,
      goPrev: () => setPage((p) => Math.max(0, p - 1)),
      goNext: () => setPage((p) => Math.min(totalPages - 1, p + 1)),
    }),
    [page, totalPages]
  );

  return {
    ...snapshot,
    stats: statsForScope,
    rows: paginatedRows,
    allRows: filteredRows,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    explorerFolder,
    setExplorerFolder,
    page,
    totalPages,
    pageSize,
    totalFiltered: filteredRows.length,
    pagination,
    selected,
    selectedKey,
    setSelectedKey,
    refresh: () => load(true),
  };
}
