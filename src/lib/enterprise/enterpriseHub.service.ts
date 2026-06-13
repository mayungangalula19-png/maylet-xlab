import { supabase } from '../supabase/client';
import { getProjects } from '../supabase/projects.queries';
import { fetchOwnedTeamIds } from '../supabase/dbHelpers';
import {
  computeInnovationStageCounts,
  getFundingReadiness,
  getInnovationStage,
  INNOVATION_STAGES,
} from '../innovation/lifecycle';
import type { Project } from '../../types/project.types';
import type {
  EnterpriseActivityRow,
  EnterpriseHubSnapshot,
  EnterpriseMayaInsight,
  EnterpriseProfile,
  EnterpriseSubscription,
  EnterpriseTeamRow,
  EnterpriseVaultRow,
} from '../../types/enterpriseHub.types';

async function safeCount(
  fn: () => PromiseLike<{ count: number | null; error: unknown }>
): Promise<number> {
  try {
    const { count, error } = await fn();
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

function buildMayaInsights(projects: Project[]): EnterpriseMayaInsight {
  const bullets: string[] = [];
  let priorityProject: Project | null = null;
  let priorityAction = 'Review portfolio health and assign next gate owners.';

  const validationStuck = projects.filter((p) => getInnovationStage(p) === 'Validation');
  const fundingReady = projects.filter((p) => getFundingReadiness(p) >= 70);
  const earlyStage = projects.filter((p) =>
    ['Idea', 'Research'].includes(getInnovationStage(p))
  );

  if (projects.length === 0) {
    return {
      bullets: ['Create your first innovation project to populate the enterprise portfolio.'],
      priorityProject: null,
      priorityAction: 'Start a project in the Project Control Center.',
    };
  }

  if (fundingReady.length > 0) {
    priorityProject = fundingReady[0];
    priorityAction = `Advance "${fundingReady[0].name}" into Funding — readiness ${getFundingReadiness(fundingReady[0])}%.`;
    bullets.push(`${fundingReady.length} project(s) show strong funding readiness.`);
  } else if (validationStuck.length > 0) {
    priorityProject = validationStuck[0];
    priorityAction = `Complete validation gate for "${validationStuck[0].name}".`;
    bullets.push(`${validationStuck.length} project(s) are at Validation — evidence review needed.`);
  } else if (earlyStage.length > projects.length * 0.6) {
    priorityProject = earlyStage[0];
    priorityAction = `Move "${earlyStage[0].name}" from research into prototype build.`;
    bullets.push('Majority of portfolio is early-stage — accelerate prototype linkage.');
  }

  const lowProgress = projects.filter((p) => p.progress < 25);
  if (lowProgress.length > 0) {
    bullets.push(`${lowProgress.length} project(s) below 25% progress — assign module owners.`);
  }

  if (bullets.length === 0) {
    bullets.push('Portfolio is balanced across lifecycle stages.');
    bullets.push('Focus on commercialization for launched innovations.');
    priorityProject = projects[0];
    priorityAction = `Open control center for "${projects[0].name}" and confirm gate status.`;
  }

  return {
    bullets: bullets.slice(0, 5),
    priorityProject,
    priorityAction,
  };
}

export async function loadEnterpriseHub(userId: string): Promise<EnterpriseHubSnapshot> {
  const ownedTeamIds = await fetchOwnedTeamIds(userId);

  const [
    profileRes,
    subRes,
    projects,
    vaultRes,
    vaultTotalCount,
    docCount,
    expCount,
    pitchCount,
    valCount,
    memberCountRes,
    timelineRes,
    teamsRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, organization_name, plan')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', userId)
      .maybeSingle(),
    getProjects(userId),
    supabase
      .from('vault_entries')
      .select('id, title, description, is_confidential, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(8),
    safeCount(() =>
      supabase.from('vault_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    ),
    safeCount(() =>
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    ),
    safeCount(() =>
      supabase.from('experiments').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    ),
    safeCount(() =>
      supabase
        .from('funding_pitches')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
    ),
    safeCount(() =>
      supabase.from('validations').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    ),
    ownedTeamIds.length > 0
      ? supabase
          .from('team_members')
          .select('id', { count: 'exact', head: true })
          .in('team_id', ownedTeamIds)
      : Promise.resolve({ count: 0, error: null }),
    supabase
      .from('activities')
      .select('id, type, title, project_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12),
    ownedTeamIds.length > 0
      ? supabase
          .from('teams')
          .select('id, name, description, project_id, created_at')
          .in('id', ownedTeamIds)
          .order('updated_at', { ascending: false })
      : supabase
          .from('teams')
          .select('id, name, description, project_id, created_at')
          .eq('owner_id', userId)
          .order('updated_at', { ascending: false }),
  ]);

  const profileRow = profileRes.data;
  const profile: EnterpriseProfile = {
    full_name: profileRow?.full_name ?? 'Enterprise user',
    email: profileRow?.email ?? '',
    organization_name: profileRow?.organization_name?.trim() || 'Your organization',
    plan: profileRow?.plan ?? 'free',
  };

  const subscription: EnterpriseSubscription = subRes.data
    ? {
        plan: subRes.data.plan ?? profile.plan,
        status: subRes.data.status ?? 'active',
        current_period_end: subRes.data.current_period_end ?? null,
      }
    : {
        plan: profile.plan,
        status: 'active',
        current_period_end: null,
      };

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const teamsRaw = teamsRes.data ?? [];

  const teamsWithCounts: EnterpriseTeamRow[] = await Promise.all(
    teamsRaw.map(async (t) => {
      const { count } = await supabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', t.id);
      const pid = t.project_id ? String(t.project_id) : null;
      return {
        id: String(t.id),
        name: String(t.name),
        description: t.description ? String(t.description) : null,
        project_id: pid,
        project_name: pid ? (projectMap.get(pid) ?? null) : null,
        member_count: count ?? 0,
        created_at: String(t.created_at),
      };
    })
  );

  const stageCounts = computeInnovationStageCounts(projects);
  const avgProgress =
    projects.length > 0
      ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
      : 0;
  const fundingReadyCount = projects.filter((p) => getFundingReadiness(p) >= 70).length;

  const metrics = {
    projectCount: projects.length,
    teamCount: teamsWithCounts.length,
    memberCount: memberCountRes.count ?? 0,
    vaultCount: vaultTotalCount,
    documentCount: docCount,
    experimentCount: expCount,
    pitchCount: pitchCount,
    validationCount: valCount,
    avgProgress,
    fundingReadyCount,
    stageCounts,
  };

  const vault: EnterpriseVaultRow[] = (vaultRes.data ?? []).map((v) => ({
    id: String(v.id),
    title: String(v.title),
    description: v.description ? String(v.description) : null,
    is_confidential: Boolean(v.is_confidential),
    created_at: String(v.created_at),
  }));

  const timeline: EnterpriseActivityRow[] = (timelineRes.data ?? []).map((a) => ({
    id: String(a.id),
    type: String(a.type ?? 'system'),
    title: String(a.title ?? 'Activity'),
    project_id: a.project_id ? String(a.project_id) : null,
    created_at: String(a.created_at),
  }));

  return {
    profile,
    subscription,
    metrics,
    projects,
    teams: teamsWithCounts,
    vault,
    timeline,
    maya: buildMayaInsights(projects),
  };
}

export async function updateEnterpriseOrganization(
  userId: string,
  input: { organization_name: string }
): Promise<void> {
  const organizationName = input.organization_name.trim();
  if (!organizationName) {
    throw new Error('Organization name is required');
  }

  const updatedAt = new Date().toISOString();
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ organization_name: organizationName, updated_at: updatedAt })
    .eq('id', userId);
  if (profileError) throw profileError;

  const { error: usersError } = await supabase
    .from('users')
    .update({ organization_name: organizationName, updated_at: updatedAt })
    .eq('id', userId);
  if (usersError) throw usersError;
}

export interface EnterpriseDocumentRow {
  id: string;
  name: string;
  file_type: string | null;
  project_id: string;
  project_name: string | null;
  created_at: string;
}

export async function loadEnterpriseKnowledgeVault(userId: string): Promise<{
  entries: EnterpriseVaultRow[];
  documents: EnterpriseDocumentRow[];
}> {
  const [vaultRes, docsRes, projects] = await Promise.all([
    supabase
      .from('vault_entries')
      .select('id, title, description, is_confidential, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('documents')
      .select('id, name, file_type, project_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
    getProjects(userId),
  ]);

  if (vaultRes.error) throw vaultRes.error;
  if (docsRes.error) throw docsRes.error;

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  return {
    entries: (vaultRes.data ?? []).map((v) => ({
      id: String(v.id),
      title: String(v.title),
      description: v.description ? String(v.description) : null,
      is_confidential: Boolean(v.is_confidential),
      created_at: String(v.created_at),
    })),
    documents: (docsRes.data ?? []).map((d) => {
      const projectId = String(d.project_id);
      return {
        id: String(d.id),
        name: String(d.name),
        file_type: d.file_type ? String(d.file_type) : null,
        project_id: projectId,
        project_name: projectMap.get(projectId) ?? null,
        created_at: String(d.created_at),
      };
    }),
  };
}

export async function createVaultEntry(
  userId: string,
  input: { title: string; description: string; is_confidential: boolean; tags: string[] }
): Promise<void> {
  const { error } = await supabase.from('vault_entries').insert({
    user_id: userId,
    title: input.title.trim(),
    description: input.description.trim() || null,
    is_confidential: input.is_confidential,
    tags: input.tags,
  });
  if (error) throw error;
}

export async function updateVaultEntry(
  userId: string,
  entryId: string,
  input: { title: string; description: string; is_confidential: boolean; tags: string[] }
): Promise<void> {
  const { error } = await supabase
    .from('vault_entries')
    .update({
      title: input.title.trim(),
      description: input.description.trim() || null,
      is_confidential: input.is_confidential,
      tags: input.tags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteVaultEntry(userId: string, entryId: string): Promise<void> {
  const { error } = await supabase
    .from('vault_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);
  if (error) throw error;
}

export { INNOVATION_STAGES };
