/**
 * Projects service — API abstraction layer.
 * Currently backed by Supabase; swap transport for REST/GraphQL without UI changes.
 */
import { supabase } from '../../../lib/supabase/client';
import { getCached, setCached, invalidateCache } from '../../../lib/utils/queryCache';
import type {
  ProjectAccessContext,
  ProjectListParams,
  ProjectListResult,
  ProjectRecord,
  ProjectViewModel,
  TeamMemberRole,
} from '../types';
import { filterAndSortProjects, paginateProjects } from '../utils/projectFilters';
import { normalizeProject } from '../utils/normalize';

const CACHE_PREFIX = 'projects:';
const CACHE_TTL = 30_000;

interface TeamLink {
  id: string;
  project_id: string;
  name: string;
}

async function safeSelect<T>(
  label: string,
  fn: () => PromiseLike<{ data: T | null; error: { message: string } | null }>
): Promise<T> {
  try {
    const { data, error } = await fn();
    if (error) {
      console.warn(`[projects] ${label}:`, error.message);
      return [] as T;
    }
    return (data ?? []) as T;
  } catch (err) {
    console.warn(`[projects] ${label}:`, err);
    return [] as T;
  }
}

async function loadTeamsByProject(projectIds: string[]): Promise<Map<string, TeamLink>> {
  const map = new Map<string, TeamLink>();
  if (projectIds.length === 0) return map;

  const withProjectId = await safeSelect<Record<string, unknown>[]>(
    'teams by project_id',
    () =>
      supabase
        .from('teams')
        .select('id, project_id, name')
        .in('project_id', projectIds)
  );

  for (const team of withProjectId) {
    const pid = team.project_id ? String(team.project_id) : '';
    if (pid && !map.has(pid)) {
      map.set(pid, {
        id: String(team.id),
        project_id: pid,
        name: String(team.name ?? 'Project Team'),
      });
    }
  }

  return map;
}

async function enrichProjects(
  ctx: ProjectAccessContext,
  records: ProjectRecord[]
): Promise<ProjectViewModel[]> {
  if (records.length === 0) return [];

  const ids = records.map((r) => r.id);

  const [tasks, aiRows, teamByProject] = await Promise.all([
    safeSelect<{ project_id: string; status: string }[]>(
      'tasks',
      () => supabase.from('tasks').select('project_id, status').in('project_id', ids)
    ),
    safeSelect<{ project_id: string; score: number | null }[]>(
      'ai_analyses',
      () =>
        supabase
          .from('ai_analyses')
          .select('project_id, score')
          .in('project_id', ids)
          .order('created_at', { ascending: false })
    ),
    loadTeamsByProject(ids),
  ]);

  const taskMap = new Map<string, { total: number; done: number }>();
  for (const t of tasks) {
    const pid = t.project_id;
    const cur = taskMap.get(pid) ?? { total: 0, done: 0 };
    cur.total += 1;
    if (t.status === 'done' || t.status === 'completed') cur.done += 1;
    taskMap.set(pid, cur);
  }

  const aiMap = new Map<string, number>();
  for (const a of aiRows) {
    const pid = a.project_id;
    if (!aiMap.has(pid) && a.score != null) aiMap.set(pid, a.score);
  }

  const teamIds = [...new Set([...teamByProject.values()].map((t) => t.id))];
  const memberMap = new Map<string, { count: number; names: string[] }>();

  // team_members SELECT triggers RLS recursion on DBs without migration 006 — skip until applied
  void teamIds;

  return records.map((raw) => {
    const team = teamByProject.get(raw.id);
    const members = team ? memberMap.get(team.id) : undefined;
    const isOwned = raw.user_id === ctx.userId;

    return normalizeProject(raw, {
      team_size: members?.count ?? 1,
      tasks_completed: taskMap.get(raw.id)?.done ?? 0,
      tasks_total: taskMap.get(raw.id)?.total ?? 0,
      ai_score: aiMap.get(raw.id),
      team_id: team?.id,
      team_name: team?.name,
      is_owned: isOwned,
      access_role: (isOwned ? 'owner' : 'member') as TeamMemberRole,
      collaborator_names: members?.names ?? [],
    });
  });
}

export async function fetchAccessibleProjects(ctx: ProjectAccessContext): Promise<ProjectViewModel[]> {
  const cacheKey = `${CACHE_PREFIX}accessible:${ctx.userId}`;
  const cached = getCached<ProjectViewModel[]>(cacheKey);
  if (cached) return cached;

  const { data: owned, error: ownedError } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (ownedError) throw ownedError;

  const ownedRecords = (owned ?? []) as ProjectRecord[];
  const enriched = await enrichProjects(ctx, ownedRecords);
  setCached(cacheKey, enriched, CACHE_TTL);
  return enriched;
}

/** @deprecated Use fetchAccessibleProjects — kept for backward compatibility */
export async function fetchUserProjects(ctx: ProjectAccessContext): Promise<ProjectViewModel[]> {
  return fetchAccessibleProjects(ctx);
}

export async function listProjects(
  ctx: ProjectAccessContext,
  params: ProjectListParams
): Promise<ProjectListResult> {
  const all = await fetchAccessibleProjects(ctx);
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 6;

  const filtered = filterAndSortProjects(all, {
    search: params.search ?? '',
    statusFilter: params.statusFilter ?? 'all',
    priorityFilter: params.priorityFilter ?? 'all',
    dateRange: params.dateRange ?? 'all',
    collaborationScope: params.collaborationScope ?? 'all',
    sortBy: params.sortBy ?? 'updated_at',
    sortOrder: params.sortOrder ?? 'desc',
  });

  const { items, total, totalPages } = paginateProjects(filtered, page, pageSize);

  return { items, total, page, pageSize, totalPages };
}

export async function deleteProjectById(
  ctx: ProjectAccessContext,
  projectId: string
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', ctx.userId);

  if (error) throw error;
  invalidateCache(CACHE_PREFIX);
}

export function subscribeToProjectChanges(onChange: () => void): () => void {
  const channel = supabase
    .channel('projects_feature_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, onChange)
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}
