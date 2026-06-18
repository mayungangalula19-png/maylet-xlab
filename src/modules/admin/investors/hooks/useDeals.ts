import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../../lib/supabase/client';
import {
  createDeal,
  deleteDeal,
  fetchDeals,
  groupDealsByStage,
  updateDeal,
  updateDealStage,
} from '../services/deals.service';
import type { Deal, DealFilters, DealFormValues, DealStage, InvestorOpsEvent } from '../types/investorOps.types';

export function useDeals(initialFilters?: DealFilters) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DealFilters>(initialFilters ?? {});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [events, setEvents] = useState<InvestorOpsEvent[]>([]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const result = await fetchDeals(filters);
      if (result.error) {
        setError(result.error.message);
        setDeals([]);
      } else {
        setDeals(result.data ?? []);
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
      .channel('investor_ops_deals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investor_deals' }, (payload: { eventType: string; new?: { id?: string }; old?: { id?: string } }) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          void load(true);
          const eventType =
            payload.eventType === 'INSERT' ? 'deal:created' : 'deal:updated';
          setEvents((prev) => [
            { type: eventType, payload: { id: payload.new?.id ?? payload.old?.id }, at: new Date().toISOString() },
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

  const byStage = useMemo(() => groupDealsByStage(deals), [deals]);

  const moveDealToStage = useCallback(
    async (dealId: string, stage: DealStage) => {
      const before = deals.find((d) => d.id === dealId) ?? null;
      setActionLoading(dealId);
      const result = await updateDealStage(dealId, stage, before);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
      return result.data!;
    },
    [deals, load]
  );

  const addDeal = useCallback(
    async (values: DealFormValues) => {
      setActionLoading('create');
      const result = await createDeal(values);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
      return result.data!;
    },
    [load]
  );

  const editDeal = useCallback(
    async (dealId: string, values: Partial<DealFormValues>) => {
      const before = deals.find((d) => d.id === dealId) ?? null;
      setActionLoading(dealId);
      const result = await updateDeal(dealId, values, before);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [deals, load]
  );

  const removeDeal = useCallback(
    async (dealId: string) => {
      const before = deals.find((d) => d.id === dealId) ?? null;
      setActionLoading(dealId);
      const result = await deleteDeal(dealId, before);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [deals, load]
  );

  return {
    deals,
    byStage,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    actionLoading,
    events,
    refresh: () => load(true),
    moveDealToStage,
    addDeal,
    editDeal,
    removeDeal,
  };
}
