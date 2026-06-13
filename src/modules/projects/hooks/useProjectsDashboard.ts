import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import type {
  ActivityViewModel,
  CollaborationStats,
  NotificationViewModel,
  ProjectAccessContext,
  ProjectListResult,
  ProjectListStats,
  ProjectViewModel,
  TeamMemberRole,
} from '../types';
import { useDebouncedValue } from './useDebouncedValue';
import { useProjectFilters } from './useProjectFilters';
import { computeProjectStats } from '../utils/projectStats';
import {
  deleteProjectById,
  fetchAccessibleProjects,
  listProjects,
  subscribeToProjectChanges,
} from '../services/projectService';
import { fetchRecentActivities, subscribeToActivities } from '../services/activityService';
import { fetchRecentNotifications } from '../services/notificationService';
import {
  ensureProjectTeam,
  fetchCollaborationStats,
  inviteTeamMember,
} from '../services/teamService';
import { invalidateCache } from '../../../lib/utils/queryCache';

const EMPTY_COLLAB_STATS: CollaborationStats = {
  teams: 0,
  shared_projects: 0,
  collaborators: 0,
};

function formatLoadError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Failed to load projects';
}

export function useProjectsDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { filters, setFilter } = useProjectFilters();

  const [allProjects, setAllProjects] = useState<ProjectViewModel[]>([]);
  const [listResult, setListResult] = useState<ProjectListResult | null>(null);
  const [stats, setStats] = useState<ProjectListStats>({
    total: 0,
    inProgress: 0,
    completed: 0,
    onHold: 0,
    avgProgress: 0,
  });
  const [collaborationStats, setCollaborationStats] = useState<CollaborationStats>(EMPTY_COLLAB_STATS);
  const [activities, setActivities] = useState<ActivityViewModel[]>([]);
  const [notifications, setNotifications] = useState<NotificationViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [invitingProjectId, setInvitingProjectId] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const ctx: ProjectAccessContext | null = useMemo(
    () => (user ? { userId: user.id, role: user.user_metadata?.role as string | undefined } : null),
    [user]
  );

  const loadSecondaryData = useCallback(async (accessCtx: ProjectAccessContext) => {
    const [actsResult, notifsResult, collabResult] = await Promise.allSettled([
      fetchRecentActivities(accessCtx),
      fetchRecentNotifications(accessCtx),
      fetchCollaborationStats(accessCtx),
    ]);

    if (actsResult.status === 'fulfilled') setActivities(actsResult.value);
    if (notifsResult.status === 'fulfilled') setNotifications(notifsResult.value);
    if (collabResult.status === 'fulfilled') setCollaborationStats(collabResult.value);
  }, []);

  const loadData = useCallback(async () => {
    if (!ctx) return;
    setError(null);
    try {
      const projects = await fetchAccessibleProjects(ctx);
      setAllProjects(projects);
      setStats(computeProjectStats(projects));
      await loadSecondaryData(ctx);
    } catch (err) {
      setError(formatLoadError(err));
    } finally {
      setLoading(false);
    }
  }, [ctx, loadSecondaryData]);

  const applyListFilters = useCallback(async () => {
    if (!ctx) return;
    try {
      const result = await listProjects(ctx, {
        userId: ctx.userId,
        page: filters.page,
        pageSize: filters.pageSize,
        search: debouncedSearch,
        statusFilter: filters.statusFilter,
        priorityFilter: filters.priorityFilter,
        dateRange: filters.dateRange,
        collaborationScope: filters.collaborationScope,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setListResult(result);
    } catch (err) {
      setError(formatLoadError(err));
    }
  }, [ctx, filters, debouncedSearch]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [authLoading, user, navigate, loadData]);

  useEffect(() => {
    if (!loading && ctx) applyListFilters();
  }, [loading, ctx, applyListFilters]);

  useEffect(() => {
    if (!ctx) return;

    const debouncedReload = () => {
      invalidateCache('projects:');
      loadData();
    };

    let timeout: ReturnType<typeof setTimeout>;
    const onProjectChange = () => {
      clearTimeout(timeout);
      timeout = setTimeout(debouncedReload, 400);
    };

    const unsubProjects = subscribeToProjectChanges(onProjectChange);
    const unsubActivities = subscribeToActivities(() => {
      fetchRecentActivities(ctx).then(setActivities).catch(console.error);
    });

    return () => {
      clearTimeout(timeout);
      unsubProjects();
      unsubActivities();
    };
  }, [ctx, loadData]);

  const deleteProject = useCallback(
    async (projectId: string) => {
      if (!ctx) return;
      setDeletingId(projectId);
      setError(null);
      try {
        await deleteProjectById(ctx, projectId);
        await loadData();
        await applyListFilters();
      } catch (err) {
        setError(formatLoadError(err));
      } finally {
        setDeletingId(null);
      }
    },
    [ctx, loadData, applyListFilters]
  );

  const inviteCollaborator = useCallback(
    async (projectId: string, email: string, role: TeamMemberRole) => {
      if (!ctx) return;
      setInvitingProjectId(projectId);
      setError(null);
      try {
        const project = allProjects.find((p) => p.id === projectId);
        if (!project) throw new Error('Project not found');

        const teamId =
          project.team_id ?? (await ensureProjectTeam(ctx, project.id, project.name));

        await inviteTeamMember(ctx, teamId, email, role);
        await loadData();
        await applyListFilters();
      } catch (err) {
        const message = formatLoadError(err);
        setError(message);
        throw err;
      } finally {
        setInvitingProjectId(null);
      }
    },
    [allProjects, applyListFilters, ctx, loadData]
  );

  const featuredProject = allProjects[0] ?? null;

  return {
    ctx,
    filters,
    setFilter,
    listResult,
    stats,
    collaborationStats,
    activities,
    notifications,
    loading: authLoading || loading,
    error,
    deletingId,
    invitingProjectId,
    deleteProject,
    inviteCollaborator,
    retry: loadData,
    featuredProject,
    allProjects,
  };
}
