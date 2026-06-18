import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  bulkDeleteAdminCareers,
  bulkSetAdminCareerStatus,
  createAdminCareer,
  deleteAdminCareer,
  downloadCsvFile,
  exportAdminCareersCsv,
  fetchAdminCareerStats,
  fetchAdminCareersPage,
  setAdminCareerStatus,
  updateAdminCareer,
} from '../services/adminCareers.service';
import type {
  AdminCareerFilters,
  AdminCareerFormValues,
  AdminCareerRow,
  AdminCareerStats,
} from '../types/careersAdmin.types';
import { getPageRange, getTotalPages } from '../utils/adminPage.utils';

const DEFAULT_STATS: AdminCareerStats = {
  total: 0,
  published: 0,
  draft: 0,
  archived: 0,
  applicationsReceived: 0,
};

export function useAdminCareers(pageSize = 15) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminCareerFilters['status']>('all');
  const [typeFilter, setTypeFilter] = useState<AdminCareerFilters['type']>('all');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');
  const [remoteFilter, setRemoteFilter] = useState<AdminCareerFilters['remote']>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rows, setRows] = useState<AdminCareerRow[]>([]);
  const [stats, setStats] = useState<AdminCareerStats>(DEFAULT_STATS);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filters: AdminCareerFilters = useMemo(
    () => ({
      search,
      status: statusFilter,
      type: typeFilter,
      department: departmentFilter,
      location: locationFilter,
      remote: remoteFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [search, statusFilter, typeFilter, departmentFilter, locationFilter, remoteFilter, dateFrom, dateTo]
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [listResult, statsResult] = await Promise.all([
        fetchAdminCareersPage({ page, pageSize, filters }),
        fetchAdminCareerStats(),
      ]);

      if (listResult.error) {
        setError(listResult.error.message);
        setRows([]);
        setTotal(0);
      } else {
        setRows(listResult.data ?? []);
        setTotal(listResult.meta?.total ?? 0);
        setSelectedIds([]);
      }

      if (statsResult.data) setStats(statsResult.data);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    },
    [page, pageSize, filters]
  );

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = getTotalPages(total, pageSize);
  const range = getPageRange(page, pageSize, total);

  const resetFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDepartmentFilter('All');
    setLocationFilter('');
    setRemoteFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => (prev.length === rows.length ? [] : rows.map((r) => r.id)));
  }, [rows]);

  const runRowAction = useCallback(
    async (id: string, action: () => Promise<{ error: { message: string } | null }>) => {
      setActionLoading(id);
      const result = await action();
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [load]
  );

  const publishCareer = useCallback(
    (id: string) => runRowAction(id, () => setAdminCareerStatus(id, 'published')),
    [runRowAction]
  );

  const unpublishCareer = useCallback(
    (id: string) => runRowAction(id, () => setAdminCareerStatus(id, 'draft')),
    [runRowAction]
  );

  const archiveCareer = useCallback(
    (id: string) => runRowAction(id, () => setAdminCareerStatus(id, 'archived')),
    [runRowAction]
  );

  const deleteCareer = useCallback(
    async (id: string) => {
      setActionLoading(id);
      const result = await deleteAdminCareer(id);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [load]
  );

  const saveCareer = useCallback(
    async (values: AdminCareerFormValues, id?: string) => {
      setActionLoading(id ?? 'create');
      const result = id ? await updateAdminCareer(id, values) : await createAdminCareer(values);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
      return result.data;
    },
    [load]
  );

  const bulkPublish = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    const result = await bulkSetAdminCareerStatus(selectedIds, 'published');
    setBulkLoading(false);
    if (result.error) throw new Error(result.error.message);
    await load(true);
  }, [selectedIds, load]);

  const bulkArchive = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    const result = await bulkSetAdminCareerStatus(selectedIds, 'archived');
    setBulkLoading(false);
    if (result.error) throw new Error(result.error.message);
    await load(true);
  }, [selectedIds, load]);

  const bulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    const result = await bulkDeleteAdminCareers(selectedIds);
    setBulkLoading(false);
    if (result.error) throw new Error(result.error.message);
    await load(true);
  }, [selectedIds, load]);

  const exportCareers = useCallback(async () => {
    setExporting(true);
    const result = await exportAdminCareersCsv(filters);
    setExporting(false);
    if (result.error) throw new Error(result.error.message);
    if (result.data) {
      downloadCsvFile(result.data, `careers-export-${new Date().toISOString().slice(0, 10)}.csv`);
    }
  }, [filters]);

  return {
    rows,
    stats,
    loading,
    refreshing,
    error,
    lastUpdated,
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(0);
    },
    statusFilter,
    setStatusFilter: (value: AdminCareerFilters['status']) => {
      setStatusFilter(value);
      setPage(0);
    },
    typeFilter,
    setTypeFilter: (value: AdminCareerFilters['type']) => {
      setTypeFilter(value);
      setPage(0);
    },
    departmentFilter,
    setDepartmentFilter: (value: string) => {
      setDepartmentFilter(value);
      setPage(0);
    },
    locationFilter,
    setLocationFilter: (value: string) => {
      setLocationFilter(value);
      setPage(0);
    },
    remoteFilter,
    setRemoteFilter: (value: AdminCareerFilters['remote']) => {
      setRemoteFilter(value);
      setPage(0);
    },
    dateFrom,
    setDateFrom: (value: string) => {
      setDateFrom(value);
      setPage(0);
    },
    dateTo,
    setDateTo: (value: string) => {
      setDateTo(value);
      setPage(0);
    },
    resetFilters,
    selectedIds,
    toggleSelected,
    toggleSelectAll,
    allSelected: rows.length > 0 && selectedIds.length === rows.length,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      range,
      canPrev: page > 0,
      canNext: page + 1 < totalPages,
      goPrev: () => setPage((p) => Math.max(0, p - 1)),
      goNext: () => setPage((p) => (p + 1 < totalPages ? p + 1 : p)),
    },
    refresh: () => load(true),
    publishCareer,
    unpublishCareer,
    archiveCareer,
    deleteCareer,
    saveCareer,
    bulkPublish,
    bulkArchive,
    bulkDelete,
    bulkLoading,
    actionLoading,
    exporting,
    exportCareers,
  };
}

export type UseAdminCareersReturn = ReturnType<typeof useAdminCareers>;
