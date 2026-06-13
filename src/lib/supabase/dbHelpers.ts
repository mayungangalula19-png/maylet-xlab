import { supabase } from './client';
import { toDbProjectStatus, type ProjectStatus } from '../../types/project.types';

export interface ActivityDbInsert {
  user_id: string;
  project_id?: string | null;
  type: string;
  title: string;
  metadata?: Record<string, unknown>;
}

export interface AdminActivityView {
  id: string;
  user_name: string;
  action: string;
  target_type: string;
  target_name: string;
  created_at: string;
}

/** Build a safe patch for public.projects — only real columns */
export function buildProjectUpdate(patch: {
  name?: string;
  description?: string;
  sector?: string;
  status?: ProjectStatus | string;
  progress?: number;
}): Record<string, unknown> {
  const out: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name != null) out.name = patch.name;
  if (patch.description != null) out.description = patch.description;
  if (patch.sector != null) out.sector = patch.sector;
  if (patch.status != null) out.status = toDbProjectStatus(patch.status);
  if (patch.progress != null) {
    out.progress = patch.progress;
    out.progress_score = patch.progress;
  }
  return out;
}

export async function logActivity(entry: ActivityDbInsert): Promise<void> {
  const { error } = await supabase.from('activities').insert({
    user_id: entry.user_id,
    project_id: entry.project_id ?? null,
    type: entry.type,
    title: entry.title,
    metadata: entry.metadata ?? {},
  });
  if (error) console.warn('[db] activity log failed:', error.message);
}

export async function fetchProjectNames(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return map;

  const { data } = await supabase.from('projects').select('id, name').in('id', unique);
  for (const row of data ?? []) {
    map.set(String(row.id), String(row.name));
  }
  return map;
}

/** All child tables linked to public.projects — keep in sync with docs/RELATIONS.md */
const PROJECT_CHILD_TABLES = [
  'research_notes',
  'literature_items',
  'research_findings',
  'research_profiles',
  'tasks',
  'documents',
  'funding_pitches',
  'ai_analyses',
  'activities',
  'maya_alerts',
  'innovation_nodes',
  'ai_memories',
  'project_reviews',
  'experiments',
  'prototypes',
] as const;

/** Delete child rows before removing a project */
export async function deleteProjectRelations(projectId: string): Promise<void> {
  await Promise.all(
    PROJECT_CHILD_TABLES.map((table) =>
      supabase.from(table).delete().eq('project_id', projectId)
    )
  );
  await supabase.from('teams').update({ project_id: null }).eq('project_id', projectId);
}

/** Link an existing team to a project (teams.project_id) */
export async function linkTeamToProject(
  teamId: string,
  projectId: string,
  ownerId: string
): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .update({ project_id: projectId, updated_at: new Date().toISOString() })
    .eq('id', teamId)
    .eq('owner_id', ownerId);
  if (error) console.warn('[db] link team to project failed:', error.message);
}

/**
 * Team IDs for a user — uses security-definer RPC to avoid team_members RLS recursion.
 * Falls back to owned teams if RPC is not deployed yet.
 */
export async function fetchUserTeamIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_user_team_ids', { p_user_id: userId });
  if (!error && Array.isArray(data)) {
    return mapTeamIdRows(data);
  }

  if (error) {
    console.warn('[db] get_user_team_ids RPC failed, falling back to owned teams:', error.message);
  }

  return fetchOwnedTeamIds(userId);
}

function mapTeamIdRows(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row: { team_id?: string } | string) =>
      typeof row === 'string' ? row : String(row.team_id ?? row)
    )
    .filter(Boolean);
}

/** Teams owned by user — prefers security-definer RPC to avoid RLS recursion */
export async function fetchOwnedTeamIds(userId: string): Promise<string[]> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_owned_team_ids', {
    p_user_id: userId,
  });
  if (!rpcError && Array.isArray(rpcData)) {
    return mapTeamIdRows(rpcData);
  }

  if (rpcError && !/Could not find the function/i.test(rpcError.message)) {
    console.warn('[db] get_owned_team_ids RPC failed:', rpcError.message);
  }

  const { data, error } = await supabase.from('teams').select('id').eq('owner_id', userId);
  if (error) {
    console.warn(
      '[db] owned teams lookup failed:',
      error.message,
      '— run scripts/fix-teams-rls-recursion.sql in Supabase SQL Editor'
    );
    return [];
  }
  return (data ?? []).map((row) => row.id as string);
}

/** Team members for a project via teams.team_id (team_members has no project_id) */
export async function fetchTeamMembersForProject(projectId: string) {
  const { data: projectTeams } = await supabase
    .from('teams')
    .select('id, owner_id')
    .eq('project_id', projectId);

  const teams = projectTeams ?? [];
  if (teams.length === 0) return [];

  const teamIds = teams.map((t) => t.id as string);

  const { data, error } = await supabase
    .from('team_members')
    .select('id, team_id, user_id, role, joined_at')
    .in('team_id', teamIds);

  if (error) {
    if (/recursion/i.test(error.message)) {
      console.warn('[db] team_members blocked by RLS — apply migration 20240612000006');
    } else {
      console.warn('[db] team members fetch failed:', error.message);
    }
    return [];
  }

  const userIds = [...new Set((data ?? []).map((m) => m.user_id as string))];
  const profileMap = new Map<string, { full_name?: string; email?: string }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id as string, {
        full_name: p.full_name as string | undefined,
        email: p.email as string | undefined,
      });
    }
  }

  return (data ?? []).map((row) => ({
    ...row,
    profiles: profileMap.get(row.user_id as string) ?? null,
  }));
}

export async function countTeamMembersForProject(projectId: string): Promise<number> {
  const members = await fetchTeamMembersForProject(projectId);
  return members.length;
}

export function mapActivityRowToAdminView(
  row: Record<string, unknown>,
  profileName?: string
): AdminActivityView {
  const meta = (row.metadata as Record<string, unknown>) ?? {};
  return {
    id: String(row.id),
    user_name: profileName ?? String(meta.user_name ?? 'User'),
    action: String(row.title ?? row.action ?? ''),
    target_type: String(row.type ?? meta.target_type ?? 'project'),
    target_name: String(meta.target_name ?? meta.project_name ?? ''),
    created_at: String(row.created_at),
  };
}

export async function enrichActivitiesForAdmin(
  rows: Record<string, unknown>[]
): Promise<AdminActivityView[]> {
  const userIds = [
    ...new Set(rows.map((r) => r.user_id as string).filter(Boolean)),
  ];
  const profileMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    for (const p of profiles ?? []) {
      profileMap.set(
        p.id as string,
        (p.full_name as string) || (p.email as string)?.split('@')[0] || 'User'
      );
    }
  }

  const projectIds = [
    ...new Set(rows.map((r) => r.project_id as string).filter(Boolean)),
  ];
  const projectNames = await fetchProjectNames(projectIds);

  return rows.map((row) => {
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    const projectId = row.project_id as string | undefined;
    const view = mapActivityRowToAdminView(row, profileMap.get(row.user_id as string));
    if (!view.target_name && projectId) {
      view.target_name = projectNames.get(projectId) ?? '';
    }
    if (!view.target_name) {
      view.target_name = String(meta.target_name ?? '');
    }
    return view;
  });
}
