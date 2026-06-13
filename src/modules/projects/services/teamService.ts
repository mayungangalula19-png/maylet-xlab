import { supabase } from '../../../lib/supabase/client';
import { fetchUserTeamIds } from '../../../lib/supabase/dbHelpers';
import { invalidateCache } from '../../../lib/utils/queryCache';
import type { CollaborationStats, ProjectAccessContext, TeamMemberRole, TeamMemberPreview } from '../types';

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function fetchCollaborationStats(ctx: ProjectAccessContext): Promise<CollaborationStats> {
  const teamIds = [...new Set(await fetchUserTeamIds(ctx.userId))];

  if (teamIds.length === 0) {
    return { teams: 0, shared_projects: 0, collaborators: 0 };
  }

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, project_id, owner_id')
    .in('id', teamIds);

  if (teamsError) {
    console.warn('[projects] team lookup failed:', teamsError.message);
    return { teams: teamIds.length, shared_projects: 0, collaborators: 0 };
  }

  const sharedProjectIds = new Set<string>();
  for (const team of teams ?? []) {
    if (team.project_id && team.owner_id !== ctx.userId) {
      sharedProjectIds.add(team.project_id as string);
    }
  }

  const { data: members } = await supabase
    .from('team_members')
    .select('user_id')
    .in('team_id', teamIds);

  const collaboratorIds = new Set<string>();
  for (const member of members ?? []) {
    if (member.user_id !== ctx.userId) collaboratorIds.add(member.user_id as string);
  }

  return {
    teams: teamIds.length,
    shared_projects: sharedProjectIds.size,
    collaborators: collaboratorIds.size,
  };
}

export async function getTeamMembersPreview(teamId: string): Promise<TeamMemberPreview[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, user_id, role, profiles(full_name, email)')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const profile = relationOne(
      row.profiles as
        | { full_name: string | null; email: string | null }
        | { full_name: string | null; email: string | null }[]
        | null
    );
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      name: profile?.full_name || profile?.email || 'Team member',
      role: row.role as TeamMemberRole,
    };
  });
}

export async function ensureProjectTeam(
  ctx: ProjectAccessContext,
  projectId: string,
  projectName: string
): Promise<string> {
  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      owner_id: ctx.userId,
      project_id: projectId,
      name: `${projectName} Team`,
    })
    .select('id')
    .single();

  if (error) throw error;

  const teamId = team.id as string;

  await supabase.from('team_members').insert({
    team_id: teamId,
    user_id: ctx.userId,
    role: 'owner',
  });

  await supabase.from('team_activities').insert({
    team_id: teamId,
    user_id: ctx.userId,
    action: 'created the project team',
    details: { project_id: projectId },
  });

  invalidateCache('projects:');
  return teamId;
}

export async function inviteTeamMember(
  ctx: ProjectAccessContext,
  teamId: string,
  email: string,
  role: TeamMemberRole = 'member'
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Email is required');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) throw new Error('No registered user found with that email address');

  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', profile.id)
    .maybeSingle();

  if (existing) throw new Error('This user is already on the team');

  const { error: insertError } = await supabase.from('team_members').insert({
    team_id: teamId,
    user_id: profile.id,
    role,
  });

  if (insertError) throw insertError;

  const displayName = profile.full_name || profile.email || normalizedEmail;

  await Promise.all([
    supabase.from('team_activities').insert({
      team_id: teamId,
      user_id: ctx.userId,
      action: `invited ${displayName} as ${role}`,
      details: { invited_user_id: profile.id, role },
    }),
    supabase.from('notifications').insert({
      user_id: profile.id,
      title: 'Team invitation',
      body: `You were added to a project team as ${role}.`,
      type: 'team',
      link: '/projects',
    }),
  ]);

  invalidateCache('projects:');
}
