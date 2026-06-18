import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../../lib/supabase/client';
import {
  collectAllTags,
  fetchInvestors,
  updateInvestorTags,
} from '../services/investors.service';
import type { Investor, InvestorFilters, InvestorOpsEvent } from '../types/investorOps.types';

export function useInvestors(initialFilters?: InvestorFilters) {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InvestorFilters>(initialFilters ?? { sortBy: 'score' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [events, setEvents] = useState<InvestorOpsEvent[]>([]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const result = await fetchInvestors(filters);
      if (result.error) {
        setError(result.error.message);
        setInvestors([]);
      } else {
        setInvestors(result.data ?? []);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [filters]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel('investor_ops_investors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investors' }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          void load(true);
          setEvents((prev) => [
            { type: 'investor:updated', payload: {}, at: new Date().toISOString() },
            ...prev.slice(0, 19),
          ]);
        }, 400);
      })
      .subscribe();

    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const selectedInvestor = useMemo(
    () => investors.find((i) => i.id === selectedId) ?? null,
    [investors, selectedId]
  );

  const allTags = useMemo(() => collectAllTags(investors), [investors]);

  const updateTags = useCallback(
    async (investorId: string, tags: string[]) => {
      const result = await updateInvestorTags(investorId, tags);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [load]
  );

  return {
    investors,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    selectedId,
    setSelectedId,
    selectedInvestor,
    allTags,
    events,
    refresh: () => load(true),
    updateTags,
  };
}
