import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  bulkUpdateAdminUserRole,
  bulkUpdateAdminUserStatus,
  downloadUsersCsvFile,
  exportAdminUsersCsv,
  fetchAdminUserStats,
  fetchAdminUsersPage,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '../services/adminUsers.service';
import type { AdminProfileRow } from '../services/adminUsers.service';
import type {
  AdminUserFilters,
  AdminUserRole,
  AdminUserStats,
  AdminUserStatus,
} from '../types/userAdmin.types';
import { getPageRange, getTotalPages } from '../utils/adminPage.utils';

const DEFAULT_STATS: AdminUserStats = {
  total: 0,
  active: 0,
  pending: 0,
  banned: 0,
  admins: 0,
  innovators: 0,
  withTwoFactor: 0,
  newThisMonth: 0,
};

export function useAdminUsers(pageSize = 20) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminUserFilters['role']>('all');
  const [statusFilter, setStatusFilter] = useState<AdminUserFilters['status']>('all');
  const [planFilter, setPlanFilter] = useState<AdminUserFilters['plan']>('all');
  const [twoFactorFilter, setTwoFactorFilter] = useState<AdminUserFilters['twoFactor']>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rows, setRows] = useState<AdminProfileRow[]>([]);
  const [stats, setStats] = useState<AdminUserStats>(DEFAULT_STATS);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filters: AdminUserFilters = useMemo(
    () => ({
      search,
      role: roleFilter,
      status: statusFilter,
      plan: planFilter,
      twoFactor: twoFactorFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [search, roleFilter, statusFilter, planFilter, twoFactorFilter, dateFrom, dateTo]
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [listResult, statsResult] = await Promise.all([
        fetchAdminUsersPage({ page, pageSize, filters }),
        fetchAdminUserStats(),
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
    void load();
  }, [load]);

  const totalPages = getTotalPages(total, pageSize);
  const range = getPageRange(page, pageSize, total);

  const resetFilters = useCallback(() => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setPlanFilter('all');
    setTwoFactorFilter('all');
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

  const updateRole = useCallback(
    async (userId: string, role: AdminUserRole) => {
      setActionLoading(userId);
      const result = await updateAdminUserRole(userId, role);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [load]
  );

  const updateStatus = useCallback(
    async (userId: string, status: AdminUserStatus) => {
      setActionLoading(userId);
      const result = await updateAdminUserStatus(userId, status);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [load]
  );

  const bulkActivate = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    const result = await bulkUpdateAdminUserStatus(selectedIds, 'active');
    setBulkLoading(false);
    if (result.error) throw new Error(result.error.message);
    await load(true);
  }, [selectedIds, load]);

  const bulkSuspend = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    const result = await bulkUpdateAdminUserStatus(selectedIds, 'suspended');
    setBulkLoading(false);
    if (result.error) throw new Error(result.error.message);
    await load(true);
  }, [selectedIds, load]);

  const bulkSetRole = useCallback(
    async (role: AdminUserRole) => {
      if (selectedIds.length === 0) return;
      setBulkLoading(true);
      const result = await bulkUpdateAdminUserRole(selectedIds, role);
      setBulkLoading(false);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [selectedIds, load]
  );

  const exportUsers = useCallback(async () => {
    setExporting(true);
    const result = await exportAdminUsersCsv(filters);
    setExporting(false);
    if (result.error) throw new Error(result.error.message);
    if (result.data) {
      downloadUsersCsvFile(result.data, `users-export-${new Date().toISOString().slice(0, 10)}.csv`);
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
    setSearch: (v: string) => {
      setSearch(v);
      setPage(0);
    },
    roleFilter,
    setRoleFilter: (v: AdminUserFilters['role']) => {
      setRoleFilter(v);
      setPage(0);
    },
    statusFilter,
    setStatusFilter: (v: AdminUserFilters['status']) => {
      setStatusFilter(v);
      setPage(0);
    },
    planFilter,
    setPlanFilter: (v: AdminUserFilters['plan']) => {
      setPlanFilter(v);
      setPage(0);
    },
    twoFactorFilter,
    setTwoFactorFilter: (v: AdminUserFilters['twoFactor']) => {
      setTwoFactorFilter(v);
      setPage(0);
    },
    dateFrom,
    setDateFrom: (v: string) => {
      setDateFrom(v);
      setPage(0);
    },
    dateTo,
    setDateTo: (v: string) => {
      setDateTo(v);
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
    updateRole,
    updateStatus,
    bulkActivate,
    bulkSuspend,
    bulkSetRole,
    bulkLoading,
    actionLoading,
    exporting,
    exportUsers,
  };
}
