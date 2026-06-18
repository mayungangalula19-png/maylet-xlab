import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  computeFollowUps,
  computeInnovatorStats,
  fetchInnovators,
  fetchRecentInnovatorActivity,
  groupInnovatorsByStage,
  recordInnovatorContact,
  submitInnovatorReview,
  updateInnovatorStage,
} from '../services/innovators.service';
import type {
  Innovator,
  InnovatorActivityFeedItem,
  InnovatorFilters,
  ReviewFormValues,
  InnovatorStage,
} from '../types/innovatorOps.types';
import { useInnovatorsRealtime } from './useInnovatorsRealtime';

export function useInnovators() {
  const [innovators, setInnovators] = useState<Innovator[]>([]);
  const [recentActivity, setRecentActivity] = useState<InnovatorActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<InnovatorFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadActivity = useCallback(async () => {
    const result = await fetchRecentInnovatorActivity();
    if (!result.error) setRecentActivity(result.data ?? []);
  }, []);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const result = await fetchInnovators(filters);
      if (result.error) {
        setError(result.error.message);
        setInnovators([]);
      } else {
        setInnovators(result.data ?? []);
      }

      await loadActivity();
      setLoading(false);
      setRefreshing(false);
    },
    [filters, loadActivity]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const { live } = useInnovatorsRealtime({
    onPipelineChange: () => void load(true),
    onReviewChange: () => void load(true),
    onActivityChange: () => void loadActivity(),
  });

  const stats = useMemo(() => computeInnovatorStats(innovators), [innovators]);
  const followUps = useMemo(() => computeFollowUps(innovators), [innovators]);
  const byStage = useMemo(() => groupInnovatorsByStage(innovators), [innovators]);
  const stageCounts = useMemo(
    () =>
      Object.fromEntries(
        (Object.entries(byStage) as [InnovatorStage, Innovator[]][]).map(([k, v]) => [k, v.length])
      ),
    [byStage]
  );
  const selected = useMemo(
    () => innovators.find((i) => i.id === selectedId) ?? null,
    [innovators, selectedId]
  );

  const moveStage = useCallback(
    async (innovatorId: string, stage: InnovatorStage) => {
      const previous = innovators.find((i) => i.id === innovatorId);
      if (!previous || previous.stage === stage) return;

      setInnovators((prev) =>
        prev.map((i) => (i.id === innovatorId ? { ...i, stage, updatedAt: new Date().toISOString() } : i))
      );
      setActionLoading(innovatorId);

      const result = await updateInnovatorStage(innovatorId, stage);
      setActionLoading(null);

      if (result.error) {
        setInnovators((prev) =>
          prev.map((i) => (i.id === innovatorId ? { ...i, stage: previous.stage } : i))
        );
        throw new Error(result.error.message);
      }

      void loadActivity();
    },
    [innovators, loadActivity]
  );

  const submitReview = useCallback(
    async (
      innovatorId: string,
      values: ReviewFormValues,
      reviewerId: string,
      reviewerName: string
    ) => {
      setActionLoading(innovatorId);
      const result = await submitInnovatorReview(innovatorId, values, reviewerId, reviewerName);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [load]
  );

  const logContact = useCallback(
    async (innovatorId: string, nextFollowUp?: string) => {
      setActionLoading(innovatorId);
      const result = await recordInnovatorContact(innovatorId, nextFollowUp);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [load]
  );

  return {
    innovators,
    recentActivity,
    stats,
    followUps,
    byStage,
    stageCounts,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    selected,
    selectedId,
    setSelectedId,
    actionLoading,
    live,
    refresh: () => load(true),
    moveStage,
    submitReview,
    logContact,
  };
}
