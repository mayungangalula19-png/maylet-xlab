import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import {
  createAdminInvestorDirectoryEntry,
  deleteAdminInvestorDirectoryEntry,
  fetchAdminInvestorAccountsPage,
  fetchAdminInvestorDirectoryPage,
  fetchAdminInvestorStats,
  toggleAdminInvestorDirectoryActive,
  updateAdminInvestorAccountStatus,
  updateAdminInvestorDirectoryEntry,
} from '../services/adminInvestors.service';
import type {
  AdminInvestorAccountFilters,
  AdminInvestorAccountRow,
  AdminInvestorDirectoryFilters,
  AdminInvestorDirectoryFormValues,
  AdminInvestorDirectoryRow,
  AdminInvestorStats,
  AdminInvestorTab,
} from '../types/investorsAdmin.types';
import type { AdminUserStatus } from '../types/userAdmin.types';
import { getPageRange, getTotalPages } from '../utils/adminPage.utils';

const DEFAULT_STATS: AdminInvestorStats = {
  accountTotal: 0,
  accountActive: 0,
  accountPending: 0,
  accountSuspended: 0,
  directoryTotal: 0,
  directoryActive: 0,
  pitchApplications: 0,
  newAccountsThisMonth: 0,
};

export function useAdminInvestors(pageSize = 15) {
  const [tab, setTab] = useState<AdminInvestorTab>('accounts');
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState<AdminInvestorStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [accountSearch, setAccountSearch] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] =
    useState<AdminInvestorAccountFilters['status']>('all');
  const [accountPlanFilter, setAccountPlanFilter] = useState('all');
  const [accountDateFrom, setAccountDateFrom] = useState('');
  const [accountDateTo, setAccountDateTo] = useState('');
  const [accountRows, setAccountRows] = useState<AdminInvestorAccountRow[]>([]);
  const [accountTotal, setAccountTotal] = useState(0);

  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryTypeFilter, setDirectoryTypeFilter] =
    useState<AdminInvestorDirectoryFilters['type']>('all');
  const [directoryActiveFilter, setDirectoryActiveFilter] =
    useState<AdminInvestorDirectoryFilters['active']>('all');
  const [directoryIndustryFilter, setDirectoryIndustryFilter] = useState('All');
  const [directoryRows, setDirectoryRows] = useState<AdminInvestorDirectoryRow[]>([]);
  const [directoryTotal, setDirectoryTotal] = useState(0);

  const accountFilters: AdminInvestorAccountFilters = useMemo(
    () => ({
      search: accountSearch,
      status: accountStatusFilter,
      plan: accountPlanFilter !== 'all' ? accountPlanFilter : undefined,
      dateFrom: accountDateFrom || undefined,
      dateTo: accountDateTo || undefined,
    }),
    [accountSearch, accountStatusFilter, accountPlanFilter, accountDateFrom, accountDateTo]
  );

  const directoryFilters: AdminInvestorDirectoryFilters = useMemo(
    () => ({
      search: directorySearch,
      type: directoryTypeFilter,
      active: directoryActiveFilter,
      industry: directoryIndustryFilter,
    }),
    [directorySearch, directoryTypeFilter, directoryActiveFilter, directoryIndustryFilter]
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const statsResult = await fetchAdminInvestorStats();
      if (statsResult.data) setStats(statsResult.data);

      if (tab === 'accounts') {
        const listResult = await fetchAdminInvestorAccountsPage({
          page,
          pageSize,
          filters: accountFilters,
        });
        if (listResult.error) {
          setError(listResult.error.message);
          setAccountRows([]);
          setAccountTotal(0);
        } else {
          setAccountRows(listResult.data ?? []);
          setAccountTotal(listResult.meta?.total ?? 0);
        }
      } else {
        const listResult = await fetchAdminInvestorDirectoryPage({
          page,
          pageSize,
          filters: directoryFilters,
        });
        if (listResult.error) {
          setError(listResult.error.message);
          setDirectoryRows([]);
          setDirectoryTotal(0);
        } else {
          setDirectoryRows(listResult.data ?? []);
          setDirectoryTotal(listResult.meta?.total ?? 0);
        }
      }

      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    },
    [tab, page, pageSize, accountFilters, directoryFilters]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [tab, accountSearch, accountStatusFilter, accountPlanFilter, accountDateFrom, accountDateTo, directorySearch, directoryTypeFilter, directoryActiveFilter, directoryIndustryFilter]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel('admin_investors_ops')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => load(true), 600);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investors' }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => load(true), 600);
      })
      .subscribe();

    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const resetAccountFilters = useCallback(() => {
    setAccountSearch('');
    setAccountStatusFilter('all');
    setAccountPlanFilter('all');
    setAccountDateFrom('');
    setAccountDateTo('');
    setPage(0);
  }, []);

  const resetDirectoryFilters = useCallback(() => {
    setDirectorySearch('');
    setDirectoryTypeFilter('all');
    setDirectoryActiveFilter('all');
    setDirectoryIndustryFilter('All');
    setPage(0);
  }, []);

  const updateAccountStatus = useCallback(
    async (userId: string, status: AdminUserStatus) => {
      const before = accountRows.find((r) => r.id === userId) ?? null;
      setActionLoading(userId);
      const result = await updateAdminInvestorAccountStatus(userId, status, before);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [accountRows, load]
  );

  const saveDirectoryEntry = useCallback(
    async (values: AdminInvestorDirectoryFormValues, id?: string) => {
      setActionLoading(id ?? 'create');
      const before = id ? directoryRows.find((r) => r.id === id) ?? null : null;
      const result = id
        ? await updateAdminInvestorDirectoryEntry(id, values, before)
        : await createAdminInvestorDirectoryEntry(values);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [directoryRows, load]
  );

  const toggleDirectoryActive = useCallback(
    async (row: AdminInvestorDirectoryRow) => {
      setActionLoading(row.id);
      const result = await toggleAdminInvestorDirectoryActive(row.id, !row.is_active, row);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [load]
  );

  const deleteDirectoryEntry = useCallback(
    async (row: AdminInvestorDirectoryRow) => {
      setDeletingId(row.id);
      const result = await deleteAdminInvestorDirectoryEntry(row.id, row);
      setDeletingId(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [load]
  );

  const activeTotal = tab === 'accounts' ? accountTotal : directoryTotal;
  const totalPages = getTotalPages(activeTotal, pageSize);
  const range = getPageRange(page, pageSize, activeTotal);

  return {
    tab,
    setTab,
    stats,
    loading,
    refreshing,
    error,
    lastUpdated,
    actionLoading,
    deletingId,
    refresh: () => load(true),
    accountRows,
    accountSearch,
    setAccountSearch,
    accountStatusFilter,
    setAccountStatusFilter,
    accountPlanFilter,
    setAccountPlanFilter,
    accountDateFrom,
    setAccountDateFrom,
    accountDateTo,
    setAccountDateTo,
    resetAccountFilters,
    directoryRows,
    directorySearch,
    setDirectorySearch,
    directoryTypeFilter,
    setDirectoryTypeFilter,
    directoryActiveFilter,
    setDirectoryActiveFilter,
    directoryIndustryFilter,
    setDirectoryIndustryFilter,
    resetDirectoryFilters,
    updateAccountStatus,
    saveDirectoryEntry,
    toggleDirectoryActive,
    deleteDirectoryEntry,
    pagination: {
      page,
      totalPages,
      total: activeTotal,
      canPrev: page > 0,
      canNext: page < totalPages - 1,
      goPrev: () => setPage((p) => Math.max(0, p - 1)),
      goNext: () => setPage((p) => Math.min(totalPages - 1, p + 1)),
      showingFrom: range.showingFrom,
      showingTo: range.showingTo,
    },
  };
}
