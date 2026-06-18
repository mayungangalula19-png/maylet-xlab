import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import {
  deleteAdminFundingPitch,
  fetchAdminFundingPage,
  fetchAdminFundingStats,
  updateAdminFundingStatus,
} from '../services/adminFunding.service';
import type {
  AdminFundingFilters,
  AdminFundingPitchStatus,
  AdminFundingRow,
  AdminFundingStats,
} from '../types/fundingAdmin.types';
import { getPageRange, getTotalPages } from '../utils/adminPage.utils';

const DEFAULT_STATS: AdminFundingStats = {
  total: 0,
  draft: 0,
  submitted: 0,
  underReview: 0,
  funded: 0,
  declined: 0,
  totalAmountSought: 0,
  applicationsReceived: 0,
};

export function useAdminFunding(pageSize = 15) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminFundingFilters['status']>('all');
  const [stageFilter, setStageFilter] = useState<AdminFundingFilters['stage']>('all');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rows, setRows] = useState<AdminFundingRow[]>([]);
  const [stats, setStats] = useState<AdminFundingStats>(DEFAULT_STATS);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filters: AdminFundingFilters = useMemo(
    () => ({
      search,
      status: statusFilter,
      stage: stageFilter,
      industry: industryFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [search, statusFilter, stageFilter, industryFilter, dateFrom, dateTo]
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [listResult, statsResult] = await Promise.all([
        fetchAdminFundingPage({ page, pageSize, filters }),
        fetchAdminFundingStats(),
      ]);

      if (listResult.error) {
        setError(listResult.error.message);
        setRows([]);
        setTotal(0);
      } else {
        setRows(listResult.data ?? []);
        setTotal(listResult.meta?.total ?? 0);
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

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel('admin_funding_ops')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'funding_pitches' }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => load(true), 600);
      })
      .subscribe();

    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('all');
    setStageFilter('all');
    setIndustryFilter('All');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  }, []);

  const updateStatus = useCallback(
    async (pitchId: string, status: AdminFundingPitchStatus) => {
      const before = rows.find((r) => r.id === pitchId) ?? null;
      setActionLoading(pitchId);
      const result = await updateAdminFundingStatus(pitchId, status, before);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
      return result.data!;
    },
    [rows, load]
  );

  const deletePitch = useCallback(
    async (pitch: AdminFundingRow) => {
      setDeletingId(pitch.id);
      const result = await deleteAdminFundingPitch(pitch.id, pitch);
      setDeletingId(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [load]
  );

  const totalPages = getTotalPages(total, pageSize);
  const range = getPageRange(page, pageSize, total);

  return {
    rows,
    stats,
    loading,
    refreshing,
    error,
    lastUpdated,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    stageFilter,
    setStageFilter,
    industryFilter,
    setIndustryFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    resetFilters,
    actionLoading,
    deletingId,
    updateStatus,
    deletePitch,
    refresh: () => load(true),
    pagination: {
      page,
      totalPages,
      total,
      canPrev: page > 0,
      canNext: page < totalPages - 1,
      goPrev: () => setPage((p) => Math.max(0, p - 1)),
      goNext: () => setPage((p) => Math.min(totalPages - 1, p + 1)),
      showingFrom: range.showingFrom,
      showingTo: range.showingTo,
    },
  };
}
