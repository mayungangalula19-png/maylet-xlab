import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import {
  deleteAdminProject,
  fetchAdminProjectStats,
  fetchAdminProjectsPage,
} from '../services/adminProjects.service';
import type { AdminProjectFilters, AdminProjectRow, AdminProjectStats } from '../types/projectAdmin.types';
import { getPageRange, getTotalPages } from '../utils/adminPage.utils';

const DEFAULT_STATS: AdminProjectStats = {
  total: 0,
  byStatus: { idea: 0, experiment: 0, prototype: 0, launched: 0 },
  avgProgress: 0,
  totalTeamMembers: 0,
  totalTasks: 0,
};

export function useAdminProjects(pageSize = 15) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [rows, setRows] = useState<AdminProjectRow[]>([]);
  const [stats, setStats] = useState<AdminProjectStats>(DEFAULT_STATS);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filters: AdminProjectFilters = useMemo(
    () => ({
      search,
      status: statusFilter,
      sector: sectorFilter,
    }),
    [search, statusFilter, sectorFilter]
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [listResult, statsResult] = await Promise.all([
        fetchAdminProjectsPage({ page, pageSize, filters }),
        fetchAdminProjectStats(),
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
      .channel('admin_projects_ops')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => load(true), 600);
      })
      .subscribe();

    return () => {
      clearTimeout(timer);
      channel.unsubscribe();
    };
  }, [load]);

  const totalPages = getTotalPages(total, pageSize);
  const range = getPageRange(page, pageSize, total);

  const deleteProject = useCallback(
    async (project: AdminProjectRow) => {
      setDeletingId(project.id);
      const result = await deleteAdminProject(project.id, project.name);
      setDeletingId(null);
      if (result.error) {
        throw new Error(result.error.message);
      }
      await load(true);
    },
    [load]
  );

  const resetFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('all');
    setSectorFilter('All');
    setPage(0);
  }, []);

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
    setStatusFilter: (value: string) => {
      setStatusFilter(value);
      setPage(0);
    },
    sectorFilter,
    setSectorFilter: (value: string) => {
      setSectorFilter(value);
      setPage(0);
    },
    resetFilters,
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
      goTo: (nextPage: number) => setPage(Math.max(0, Math.min(nextPage, totalPages - 1))),
    },
    refresh: () => load(true),
    deleteProject,
    deletingId,
  };
}
