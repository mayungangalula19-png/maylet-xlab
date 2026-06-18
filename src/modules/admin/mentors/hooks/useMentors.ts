import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  assignMentorToInnovator,
  computeMentorMatches,
  computeMentorStats,
  createMentorSession,
  fetchAllSessions,
  fetchMentorAnalytics,
  fetchMentorDetail,
  fetchMentorStats,
  fetchMentors,
  fetchPendingMatchRequests,
  fetchRecentMentorActivity,
  updateMentorAvailability,
  updateMentorStatus,
} from '../services/mentors.service';
import type {
  MatchCandidate,
  Mentor,
  MentorActivityItem,
  MentorAnalyticsData,
  MentorAssignment,
  MentorAvailability,
  MentorFeedbackItem,
  MentorFilters,
  MentorSession,
  MentorStatus,
  SessionFormValues,
} from '../types/mentorOps.types';
import { useMentorsRealtime } from './useMentorsRealtime';

const EMPTY_ANALYTICS: MentorAnalyticsData = {
  sessionsPerMonth: [],
  topMentors: [],
  expertiseCoverage: [],
  utilizationRate: 0,
  activityTrend: [],
};

export function useMentors() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [recentActivity, setRecentActivity] = useState<MentorActivityItem[]>([]);
  const [analytics, setAnalytics] = useState<MentorAnalyticsData>(EMPTY_ANALYTICS);
  const [sessionCount, setSessionCount] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<MentorFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    assignments: MentorAssignment[];
    sessions: MentorSession[];
    feedback: MentorFeedbackItem[];
  } | null>(null);
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [pendingRequestItems, setPendingRequestItems] = useState<
    Array<{ id: string; mentorName: string; message: string; requestedDate: string }>
  >([]);

  const loadActivity = useCallback(async () => {
    const result = await fetchRecentMentorActivity();
    if (!result.error) setRecentActivity(result.data ?? []);
  }, []);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [mentorsResult, statsResult, sessionsResult, analyticsResult, pendingResult] =
        await Promise.all([
          fetchMentors(filters),
          fetchMentorStats(),
          fetchAllSessions(),
          fetchMentorAnalytics(),
          fetchPendingMatchRequests(),
        ]);

      if (mentorsResult.error) {
        setError(mentorsResult.error.message);
        setMentors([]);
      } else {
        setMentors(mentorsResult.data ?? []);
      }

      if (statsResult.data) {
        setSessionCount(statsResult.data.sessionCount);
        setPendingRequestCount(statsResult.data.pendingRequests);
      }
      if (sessionsResult.data) setSessions(sessionsResult.data);
      if (analyticsResult.data) setAnalytics(analyticsResult.data);
      if (pendingResult.data) setPendingRequestItems(pendingResult.data);

      await loadActivity();
      setLoading(false);
      setRefreshing(false);
    },
    [filters, loadActivity]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    void load(true);
  }, [load]);

  const { live } = useMentorsRealtime({
    onMentorChange: refresh,
    onSessionChange: refresh,
    onAssignmentChange: refresh,
    onActivityChange: loadActivity,
  });

  const stats = useMemo(
    () => computeMentorStats(mentors, sessionCount, pendingRequestCount),
    [mentors, sessionCount, pendingRequestCount]
  );

  const selected = useMemo(
    () => mentors.find((m) => m.id === selectedId) ?? null,
    [mentors, selectedId]
  );

  const loadDetail = useCallback(async (mentorId: string) => {
    const [detailResult, matchResult] = await Promise.all([
      fetchMentorDetail(mentorId),
      computeMentorMatches(mentorId),
    ]);
    if (detailResult.data) setDetail(detailResult.data);
    if (matchResult.data) setMatches(matchResult.data);
  }, []);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else {
      setDetail(null);
      setMatches([]);
    }
  }, [selectedId, loadDetail]);

  const setStatus = useCallback(
    async (mentorId: string, status: MentorStatus) => {
      setActionLoading(mentorId);
      const result = await updateMentorStatus(mentorId, status);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [load]
  );

  const assignInnovator = useCallback(
    async (mentorId: string, innovatorId: string, matchScore: number) => {
      setActionLoading(mentorId);
      const result = await assignMentorToInnovator(mentorId, innovatorId, matchScore);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await loadDetail(mentorId);
      await load(true);
    },
    [load, loadDetail]
  );

  const scheduleSession = useCallback(
    async (values: SessionFormValues) => {
      setActionLoading(values.mentorId);
      const result = await createMentorSession(values);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      if (selectedId) await loadDetail(selectedId);
      await load(true);
    },
    [load, loadDetail, selectedId]
  );

  const setAvailability = useCallback(
    async (mentorId: string, availability: MentorAvailability) => {
      setActionLoading(mentorId);
      const result = await updateMentorAvailability(mentorId, availability);
      setActionLoading(null);
      if (result.error) throw new Error(result.error.message);
      await load(true);
    },
    [load]
  );

  return {
    mentors,
    sessions,
    recentActivity,
    analytics,
    stats,
    pendingRequestItems,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    selected,
    selectedId,
    setSelectedId,
    detail,
    matches,
    actionLoading,
    live,
    refresh: () => load(true),
    setStatus,
    assignInnovator,
    scheduleSession,
    setAvailability,
  };
}
