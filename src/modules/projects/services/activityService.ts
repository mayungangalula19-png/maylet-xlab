import { supabase } from '../../../lib/supabase/client';
import { fetchOwnedTeamIds } from '../../../lib/supabase/dbHelpers';
import type { ActivityViewModel, ProjectAccessContext } from '../types';
import { normalizeActivity } from '../utils/normalize';

async function getUserTeamIds(userId: string): Promise<string[]> {
  // Avoid team_members SELECT until RLS migration 006 (infinite recursion on remote DB)
  return fetchOwnedTeamIds(userId);
}

async function fetchPersonalActivities(
  userId: string,
  limit: number
): Promise<ActivityViewModel[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[projects] activities feed unavailable:', error.message);
    return [];
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const projectIds = [
    ...new Set(rows.map((r) => r.project_id).filter((id): id is string => typeof id === 'string')),
  ];

  const projectNames = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase.from('projects').select('id, name').in('id', projectIds);
    for (const p of projects ?? []) {
      projectNames.set(String(p.id), String(p.name));
    }
  }

  return rows.map((record) => {
    const projectId = record.project_id ? String(record.project_id) : '';
    const metadata = (record.metadata as Record<string, unknown> | null) ?? {};
    return normalizeActivity({
      ...record,
      project_name:
        (projectId && projectNames.get(projectId)) ||
        metadata.project_name ||
        metadata.target_name ||
        'a project',
      action: record.title,
    });
  });
}

async function fetchTeamActivities(
  teamIds: string[],
  limit: number
): Promise<ActivityViewModel[]> {
  if (teamIds.length === 0) return [];

  const { data: teamRows, error: teamError } = await supabase
    .from('team_activities')
    .select('id, action, created_at, user_id, team_id, details')
    .in('team_id', teamIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  type TeamActivityRow = {
    id: string;
    action: string;
    created_at: string;
    user_id: string | null;
    team_id: string;
    details: Record<string, unknown> | null;
  };

  if (teamError) {
    if (/recursion/i.test(teamError.message)) {
      console.warn('[projects] team_activities blocked by RLS — apply migration 20240612000006');
    } else {
      console.warn('[projects] team activities unavailable:', teamError.message);
    }
    return [];
  }

  const rows: TeamActivityRow[] = (teamRows ?? []) as TeamActivityRow[];

  const { data: teamMeta } = await supabase.from('teams').select('id, name').in('id', teamIds);
  const teamNameMap = new Map((teamMeta ?? []).map((t) => [t.id as string, t.name as string]));

  const actorIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean) as string[])];
  const profileMap = new Map<string, string>();

  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', actorIds);

    for (const profile of profiles ?? []) {
      profileMap.set(
        profile.id as string,
        (profile.full_name as string) || (profile.email as string) || 'Team member'
      );
    }
  }

  return rows.map((row) => {
    const details = row.details as { project_name?: string } | null;

    return normalizeActivity({
      id: row.id,
      type: 'team',
      action: row.action,
      user_name: profileMap.get(row.user_id as string) ?? 'Team member',
      project_name:
        details?.project_name ?? teamNameMap.get(row.team_id) ?? 'Project team',
      created_at: row.created_at,
    });
  });
}

export async function fetchRecentActivities(
  ctx: ProjectAccessContext,
  limit = 8
): Promise<ActivityViewModel[]> {
  const teamIds = await getUserTeamIds(ctx.userId);
  const [personal, team] = await Promise.all([
    fetchPersonalActivities(ctx.userId, limit),
    fetchTeamActivities(teamIds, limit),
  ]);

  return [...personal, ...team]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function subscribeToActivities(onInsert: () => void): () => void {
  const channel = supabase
    .channel('projects_activities_changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, onInsert)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_activities' }, onInsert)
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}
