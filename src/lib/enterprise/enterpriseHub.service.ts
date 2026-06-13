import { supabase } from '../supabase/client';
import { getProjects } from '../supabase/projects.queries';
import { fetchOwnedTeamIds } from '../supabase/dbHelpers';
import {
  computeInnovationStageCounts,
  getCommercializationReadiness,
  getFundingReadiness,
  getInnovationStage,
  getReadinessScore,
  getRiskLevel,
  INNOVATION_STAGES,
} from '../innovation/lifecycle';
import type { Project } from '../../types/project.types';
import type {
  EnterpriseActivityRow,
  EnterpriseAnalytics,
  EnterpriseDepartmentId,
  EnterpriseDepartmentMetrics,
  EnterpriseDocumentRow,
  EnterpriseExperimentRow,
  EnterpriseFundingRow,
  EnterpriseHubSnapshot,
  EnterpriseMemberRow,
  EnterpriseMayaInsight,
  EnterpriseNotificationRow,
  EnterprisePipelineAnalytics,
  EnterpriseProfile,
  EnterprisePrototypeRow,
  EnterpriseResearchAssetRow,
  EnterpriseSearchResult,
  EnterpriseSubscription,
  EnterpriseTeamRow,
  EnterpriseValidationRow,
  EnterpriseVaultRow,
} from '../../types/enterpriseHub.types';
import { ENTERPRISE_DEPARTMENTS as DEPARTMENTS } from '../../types/enterpriseHub.types';

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

export function mapSectorToDepartment(sector: string): EnterpriseDepartmentId {
  const s = (sector || '').toLowerCase();
  if (s.includes('agri') || s.includes('farm') || s.includes('food')) return 'Agriculture';
  if (s.includes('health') || s.includes('med') || s.includes('clinic')) return 'Health';
  if (s.includes('energy') || s.includes('power') || s.includes('solar')) return 'Energy';
  if (s.includes('manufact') || s.includes('industrial') || s.includes('factory')) return 'Manufacturing';
  if (s.includes('ict') || s.includes('software') || s.includes('blockchain') || s.includes('digital'))
    return 'ICT';
  if (s.includes('business') || s.includes('finance') || s.includes('market') || s.includes('commerce'))
    return 'Business';
  if (s.includes('research') || s.includes('edu') || s.includes('academic')) return 'Research';
  return 'Engineering';
}

function mapTeamRoleToEnterprise(role: string): string {
  switch (role) {
    case 'owner':
      return 'Enterprise Admin';
    case 'admin':
      return 'Manager';
    case 'member':
      return 'Researcher';
    case 'viewer':
      return 'Observer';
    default:
      return 'Contributor';
  }
}

function buildDepartmentMetrics(
  projects: Project[],
  teams: EnterpriseTeamRow[],
  members: EnterpriseMemberRow[],
  prototypes: EnterprisePrototypeRow[],
  experiments: EnterpriseExperimentRow[],
  researchAssets: EnterpriseResearchAssetRow[]
): EnterpriseDepartmentMetrics[] {
  return DEPARTMENTS.map((dept) => {
    const deptProjects = projects.filter((p) => mapSectorToDepartment(p.sector) === dept);
    const deptProjectIds = new Set(deptProjects.map((p) => p.id));
    const deptTeams = teams.filter((t) => t.department === dept);
    const deptMembers = members.filter((m) => m.department === dept);
    const avgProgress =
      deptProjects.length > 0
        ? Math.round(deptProjects.reduce((s, p) => s + p.progress, 0) / deptProjects.length)
        : 0;

    return {
      id: dept,
      projectCount: deptProjects.length,
      researchCount: researchAssets.filter((r) => deptProjectIds.has(r.project_id)).length,
      memberCount: deptMembers.length || deptTeams.reduce((s, t) => s + t.member_count, 0),
      avgProgress,
      activePrototypes: prototypes.filter(
        (p) => p.project_id && deptProjectIds.has(p.project_id) && p.status !== 'archived'
      ).length,
      runningExperiments: experiments.filter(
        (e) =>
          e.project_id &&
          deptProjectIds.has(e.project_id) &&
          ['running', 'active', 'in_progress'].includes(e.status.toLowerCase())
      ).length,
    };
  });
}

function buildPipelineAnalytics(projects: Project[]): EnterprisePipelineAnalytics {
  const stageCounts = computeInnovationStageCounts(projects);
  const conversionRates: EnterprisePipelineAnalytics['conversionRates'] = [];

  for (let i = 0; i < INNOVATION_STAGES.length - 1; i++) {
    const from = INNOVATION_STAGES[i];
    const to = INNOVATION_STAGES[i + 1];
    const fromCount = stageCounts[from];
    const toCount = stageCounts[to];
    const rate = fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0;
    conversionRates.push({ from, to, rate });
  }

  let bottleneck: (typeof INNOVATION_STAGES)[number] | null = null;
  let maxCount = 0;
  for (const stage of INNOVATION_STAGES) {
    if (stageCounts[stage] > maxCount) {
      maxCount = stageCounts[stage];
      bottleneck = stage;
    }
  }

  const advanced = projects.filter((p) => {
    const stage = getInnovationStage(p);
    return INNOVATION_STAGES.indexOf(stage) >= 3;
  }).length;
  const velocity = projects.length > 0 ? Math.round((advanced / projects.length) * 100) : 0;
  const launched = projects.filter((p) => p.status === 'Launched' || getInnovationStage(p) === 'Commercialization').length;
  const successRate = projects.length > 0 ? Math.round((launched / projects.length) * 100) : 0;

  return { conversionRates, bottleneck, velocity, successRate };
}

function buildAnalytics(
  projects: Project[],
  experiments: EnterpriseExperimentRow[],
  validations: EnterpriseValidationRow[],
  funding: EnterpriseFundingRow[],
  departments: EnterpriseDepartmentMetrics[],
  teams: EnterpriseTeamRow[]
): EnterpriseAnalytics {
  const pipeline = buildPipelineAnalytics(projects);
  const valTotal = validations.length || 1;
  const pass = validations.filter((v) => v.decision === 'pass').length;
  const hold = validations.filter((v) => v.decision === 'hold').length;
  const fail = validations.filter((v) => v.decision === 'fail').length;
  const expDone = experiments.filter((e) => ['completed', 'done', 'closed'].includes(e.status.toLowerCase())).length;
  const expTotal = experiments.length || 1;
  const funded = funding.filter((f) => ['funded', 'approved', 'secured'].includes(f.status.toLowerCase())).length;
  const fundTotal = funding.length || 1;

  const deptLeader = [...departments].sort((a, b) => b.avgProgress - a.avgProgress)[0];
  const topTeam = [...teams].sort((a, b) => b.member_count - a.member_count)[0];

  return {
    pipeline,
    validationPassRate: Math.round((pass / valTotal) * 100),
    validationHoldRate: Math.round((hold / valTotal) * 100),
    validationFailRate: Math.round((fail / valTotal) * 100),
    experimentCompletionRate: Math.round((expDone / expTotal) * 100),
    fundingApprovalRate: Math.round((funded / fundTotal) * 100),
    departmentLeader: deptLeader?.projectCount > 0 ? deptLeader.id : null,
    topPerformingTeam: topTeam?.name ?? null,
  };
}

function buildMayaInsights(projects: Project[], analytics: EnterpriseAnalytics, departments: EnterpriseDepartmentMetrics[]): EnterpriseMayaInsight {
  const bullets: string[] = [];
  const risks: string[] = [];
  const recommendations: string[] = [];
  const departmentInsights: string[] = [];
  const opportunities: string[] = [];

  let priorityProject: Project | null = null;
  let priorityAction = 'Review portfolio health and assign gate owners across departments.';

  const healthScores = projects.map((p) => getReadinessScore(p));
  const healthScore =
    healthScores.length > 0 ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length) : 0;
  const innovationPerformance =
    projects.length > 0
      ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
      : 0;
  const fundingReadiness =
    projects.length > 0
      ? Math.round(projects.reduce((s, p) => s + getFundingReadiness(p), 0) / projects.length)
      : 0;
  const commercializationForecast =
    projects.length > 0
      ? Math.round(projects.reduce((s, p) => s + getCommercializationReadiness(p), 0) / projects.length)
      : 0;

  const highRisk = projects.filter((p) => getRiskLevel(p) === 'high');
  const riskLevel: 'low' | 'medium' | 'high' =
    highRisk.length > projects.length * 0.4 ? 'high' : highRisk.length > 0 ? 'medium' : 'low';

  if (projects.length === 0) {
    return {
      healthScore: 0,
      innovationPerformance: 0,
      fundingReadiness: 0,
      commercializationForecast: 0,
      riskLevel: 'medium',
      risks: ['Empty innovation portfolio — no organizational projects tracked.'],
      recommendations: ['Launch a pilot program and create the first enterprise project.'],
      departmentInsights: ['All departments awaiting first assigned initiatives.'],
      opportunities: ['Establish cross-functional innovation council.'],
      bullets: ['Create your first innovation project to populate the enterprise command center.'],
      priorityProject: null,
      priorityAction: 'Start a project in the Project Control Center.',
    };
  }

  const fundingReady = projects.filter((p) => getFundingReadiness(p) >= 70);
  const validationStuck = projects.filter((p) => getInnovationStage(p) === 'Validation');
  const earlyStage = projects.filter((p) => ['Idea', 'Research'].includes(getInnovationStage(p)));

  if (fundingReady.length > 0) {
    priorityProject = fundingReady[0];
    priorityAction = `Advance "${fundingReady[0].name}" into Funding — readiness ${getFundingReadiness(fundingReady[0])}%.`;
    opportunities.push(`${fundingReady.length} initiative(s) ready for investor outreach.`);
  } else if (validationStuck.length > 0) {
    priorityProject = validationStuck[0];
    priorityAction = `Complete validation gate for "${validationStuck[0].name}".`;
    risks.push(`${validationStuck.length} project(s) blocked at validation gate.`);
  } else if (earlyStage.length > projects.length * 0.6) {
    priorityProject = earlyStage[0];
    priorityAction = `Accelerate "${earlyStage[0].name}" from research into prototype build.`;
    risks.push('Portfolio skewed early-stage — limited pipeline velocity.');
  }

  if (analytics.pipeline.bottleneck) {
    bullets.push(`Pipeline bottleneck at ${analytics.pipeline.bottleneck} stage (${analytics.pipeline.velocity}% velocity).`);
    recommendations.push(`Assign innovation managers to unblock ${analytics.pipeline.bottleneck} stage initiatives.`);
  }

  if (highRisk.length > 0) {
    risks.push(`${highRisk.length} high-risk project(s) need executive review.`);
  }

  const activeDepts = departments.filter((d) => d.projectCount > 0);
  if (activeDepts.length > 0) {
    const leader = [...activeDepts].sort((a, b) => b.avgProgress - a.avgProgress)[0];
    const laggard = [...activeDepts].sort((a, b) => a.avgProgress - b.avgProgress)[0];
    departmentInsights.push(`${leader.id} leads with ${leader.avgProgress}% average progress.`);
    if (laggard.id !== leader.id) {
      departmentInsights.push(`${laggard.id} needs resource allocation (${laggard.avgProgress}% avg).`);
    }
  }

  if (fundingReadiness >= 60) {
    opportunities.push('Organization shows strong funding readiness — prepare grant calendar.');
  }
  if (commercializationForecast >= 50) {
    opportunities.push('Commercialization pipeline maturing — evaluate market launch sequencing.');
  }

  recommendations.push('Run monthly portfolio review across all departments.');
  if (analytics.validationHoldRate > 20) {
    recommendations.push('Reduce validation HOLD rate with pre-gate evidence checks.');
  }

  if (bullets.length === 0) {
    bullets.push('Portfolio balanced across lifecycle stages.');
    bullets.push(`Innovation health score: ${healthScore}/100.`);
    priorityProject = projects[0];
    priorityAction = `Open control center for "${projects[0].name}" and confirm gate status.`;
  }

  return {
    healthScore,
    innovationPerformance,
    fundingReadiness,
    commercializationForecast,
    riskLevel,
    risks: risks.slice(0, 4),
    recommendations: recommendations.slice(0, 5),
    departmentInsights: departmentInsights.slice(0, 4),
    opportunities: opportunities.slice(0, 4),
    bullets: bullets.slice(0, 5),
    priorityProject,
    priorityAction,
  };
}

function buildSearchIndex(
  projects: Project[],
  teams: EnterpriseTeamRow[],
  documents: EnterpriseDocumentRow[],
  funding: EnterpriseFundingRow[],
  prototypes: EnterprisePrototypeRow[],
  experiments: EnterpriseExperimentRow[],
  validations: EnterpriseValidationRow[],
  researchAssets: EnterpriseResearchAssetRow[]
): EnterpriseSearchResult[] {
  const results: EnterpriseSearchResult[] = [];

  for (const p of projects) {
    results.push({
      type: 'project',
      id: p.id,
      title: p.name,
      subtitle: `${p.sector} · ${getInnovationStage(p)}`,
      route: `/projects/${p.id}/edit`,
    });
  }
  for (const t of teams) {
    results.push({
      type: 'team',
      id: t.id,
      title: t.name,
      subtitle: t.project_name ?? 'Cross-functional team',
      route: `/teams/${t.id}`,
    });
  }
  for (const d of documents) {
    results.push({
      type: 'document',
      id: d.id,
      title: d.name,
      subtitle: d.project_name ?? 'Document',
      route: '/documents',
    });
  }
  for (const f of funding) {
    results.push({
      type: 'funding',
      id: f.id,
      title: f.title,
      subtitle: f.status,
      route: `/funding/${f.id}`,
    });
  }
  for (const p of prototypes) {
    results.push({
      type: 'prototype',
      id: p.id,
      title: p.name,
      subtitle: p.project_name ?? 'Prototype',
      route: '/prototypes',
    });
  }
  for (const e of experiments) {
    results.push({
      type: 'experiment',
      id: e.id,
      title: e.title || 'Experiment',
      subtitle: e.status,
      route: `/experiments/${e.id}`,
    });
  }
  for (const v of validations) {
    results.push({
      type: 'validation',
      id: v.id,
      title: v.project_name ?? 'Validation',
      subtitle: v.decision.toUpperCase(),
      route: `/validation/${v.id}`,
    });
  }
  for (const r of researchAssets) {
    results.push({
      type: 'research',
      id: r.id,
      title: r.title,
      subtitle: r.asset_type,
      route: `/research/${r.project_id}`,
    });
  }

  return results;
}

export async function loadEnterpriseHub(userId: string): Promise<EnterpriseHubSnapshot> {
  const ownedTeamIds = await fetchOwnedTeamIds(userId);

  const [
    profileRes,
    subRes,
    projects,
    vaultRes,
    vaultTotalCount,
    docsRes,
    prototypesRes,
    experimentsRes,
    validationsRes,
    fundingRes,
    researchProfilesRes,
    researchNotesRes,
    literatureRes,
    findingsRes,
    pitchCount,
    memberRowsRes,
    timelineRes,
    teamsRes,
    notificationsRes,
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
    supabase
      .from('documents')
      .select('id, name, file_type, project_id, category, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('prototypes')
      .select('id, name, status, version, project_id, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(30),
    supabase
      .from('experiments')
      .select('id, title, status, hypothesis, project_id, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(30),
    supabase
      .from('validations')
      .select('id, project_id, decision, overall_score, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(30),
    supabase
      .from('funding_pitches')
      .select('id, title, status, amount_sought, project_id, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(30),
    supabase
      .from('research_profiles')
      .select('id, project_id, problem_statement, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('research_notes')
      .select('id, project_id, title, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('literature_items')
      .select('id, project_id, title, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('research_findings')
      .select('id, project_id, title, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(20),
    safeCount(() =>
      supabase.from('funding_pitches').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    ),
    ownedTeamIds.length > 0
      ? supabase
          .from('team_members')
          .select('id, team_id, user_id, role')
          .in('team_id', ownedTeamIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('activities')
      .select('id, type, title, project_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(16),
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
    supabase
      .from('notifications')
      .select('id, title, body, type, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12),
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
    : { plan: profile.plan, status: 'active', current_period_end: null };

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const projectNameMap = new Map(projects.map((p) => [p.id, p.name]));

  const teamsRaw = teamsRes.data ?? [];
  const teamsWithCounts: EnterpriseTeamRow[] = await Promise.all(
    teamsRaw.map(async (t) => {
      const { count } = await supabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', t.id);
      const pid = t.project_id ? String(t.project_id) : null;
      const linkedProject = pid ? projectMap.get(pid) : null;
      return {
        id: String(t.id),
        name: String(t.name),
        description: t.description ? String(t.description) : null,
        project_id: pid,
        project_name: pid ? (projectNameMap.get(pid) ?? null) : null,
        member_count: count ?? 0,
        created_at: String(t.created_at),
        department: linkedProject ? mapSectorToDepartment(linkedProject.sector) : 'Engineering',
      };
    })
  );

  const teamNameMap = new Map(teamsWithCounts.map((t) => [t.id, t.name]));
  const teamDeptMap = new Map(teamsWithCounts.map((t) => [t.id, t.department]));

  const memberRows = memberRowsRes.data ?? [];
  const memberUserIds = [...new Set(memberRows.map((m) => String(m.user_id)))];
  const profileMap = new Map<string, { full_name: string; email: string }>();

  if (memberUserIds.length > 0) {
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', memberUserIds);
    for (const row of profileRows ?? []) {
      profileMap.set(String(row.id), {
        full_name: row.full_name ? String(row.full_name) : 'Team member',
        email: row.email ? String(row.email) : '',
      });
    }
  }

  const members: EnterpriseMemberRow[] = memberRows.map((m) => {
    const teamId = String(m.team_id);
    const userId = String(m.user_id);
    const prof = profileMap.get(userId);
    const role = String(m.role ?? 'member');
    return {
      id: String(m.id),
      user_id: userId,
      full_name: prof?.full_name ?? 'Team member',
      email: prof?.email ?? '',
      team_id: teamId,
      team_name: teamNameMap.get(teamId) ?? 'Team',
      role,
      enterprise_role: mapTeamRoleToEnterprise(role),
      department: teamDeptMap.get(teamId) ?? 'Engineering',
    };
  });

  const prototypes: EnterprisePrototypeRow[] = (prototypesRes.data ?? []).map((p) => {
    const pid = p.project_id ? String(p.project_id) : null;
    return {
      id: String(p.id),
      name: String(p.name),
      status: String(p.status ?? 'draft'),
      version: String(p.version ?? '1.0'),
      project_id: pid,
      project_name: pid ? (projectNameMap.get(pid) ?? null) : null,
      created_at: String(p.created_at),
    };
  });

  const experiments: EnterpriseExperimentRow[] = (experimentsRes.data ?? []).map((e) => {
    const pid = e.project_id ? String(e.project_id) : null;
    return {
      id: String(e.id),
      title: e.title ? String(e.title) : 'Experiment',
      status: String(e.status ?? 'draft'),
      hypothesis: String(e.hypothesis ?? ''),
      project_id: pid,
      project_name: pid ? (projectNameMap.get(pid) ?? null) : null,
      created_at: String(e.created_at),
    };
  });

  const validations: EnterpriseValidationRow[] = (validationsRes.data ?? []).map((v) => {
    const pid = String(v.project_id);
    return {
      id: String(v.id),
      project_id: pid,
      project_name: projectNameMap.get(pid) ?? null,
      decision: String(v.decision ?? 'pending'),
      overall_score: Number(v.overall_score ?? 0),
      created_at: String(v.created_at),
    };
  });

  const funding: EnterpriseFundingRow[] = (fundingRes.data ?? []).map((f) => {
    const pid = f.project_id ? String(f.project_id) : null;
    return {
      id: String(f.id),
      title: String(f.title),
      status: String(f.status ?? 'draft'),
      amount_sought: f.amount_sought != null ? Number(f.amount_sought) : null,
      project_id: pid,
      project_name: pid ? (projectNameMap.get(pid) ?? null) : null,
      created_at: String(f.created_at),
    };
  });

  const documents: EnterpriseDocumentRow[] = (docsRes.data ?? []).map((d) => {
    const pid = String(d.project_id);
    return {
      id: String(d.id),
      name: String(d.name),
      file_type: d.file_type ? String(d.file_type) : null,
      project_id: pid,
      project_name: projectNameMap.get(pid) ?? null,
      category: d.category ? String(d.category) : null,
      created_at: String(d.created_at),
    };
  });

  const researchAssets: EnterpriseResearchAssetRow[] = [
    ...(researchProfilesRes.data ?? []).map((r) => ({
      id: String(r.id),
      title: r.problem_statement ? String(r.problem_statement).slice(0, 80) : 'Research profile',
      asset_type: 'profile' as const,
      project_id: String(r.project_id),
      project_name: projectNameMap.get(String(r.project_id)) ?? null,
      created_at: String(r.created_at),
    })),
    ...(researchNotesRes.data ?? []).map((r) => ({
      id: String(r.id),
      title: String(r.title),
      asset_type: 'note' as const,
      project_id: String(r.project_id),
      project_name: projectNameMap.get(String(r.project_id)) ?? null,
      created_at: String(r.created_at),
    })),
    ...(literatureRes.data ?? []).map((r) => ({
      id: String(r.id),
      title: String(r.title),
      asset_type: 'literature' as const,
      project_id: String(r.project_id),
      project_name: projectNameMap.get(String(r.project_id)) ?? null,
      created_at: String(r.created_at),
    })),
    ...(findingsRes.data ?? []).map((r) => ({
      id: String(r.id),
      title: String(r.title),
      asset_type: 'finding' as const,
      project_id: String(r.project_id),
      project_name: projectNameMap.get(String(r.project_id)) ?? null,
      created_at: String(r.created_at),
    })),
  ];

  const stageCounts = computeInnovationStageCounts(projects);
  const avgProgress =
    projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;
  const fundingReadyCount = projects.filter((p) => getFundingReadiness(p) >= 70).length;
  const activeResearch = projects.filter((p) => getInnovationStage(p) === 'Research').length;
  const activePrototypes = prototypes.filter((p) => !['archived', 'retired'].includes(p.status.toLowerCase())).length;
  const experimentsRunning = experiments.filter((e) =>
    ['running', 'active', 'in_progress'].includes(e.status.toLowerCase())
  ).length;
  const validationsPending = validations.filter((v) => v.decision === 'pending').length;
  const fundingSecured = funding.filter((f) =>
    ['funded', 'approved', 'secured'].includes(f.status.toLowerCase())
  ).length;
  const commercializedProducts = projects.filter(
    (p) => p.status === 'Launched' || getInnovationStage(p) === 'Commercialization'
  ).length;
  const activeDepts = new Set(projects.map((p) => mapSectorToDepartment(p.sector)));
  const healthScores = projects.map((p) => getReadinessScore(p));
  const innovationHealthScore =
    healthScores.length > 0 ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length) : 0;

  const departments = buildDepartmentMetrics(
    projects,
    teamsWithCounts,
    members,
    prototypes,
    experiments,
    researchAssets
  );

  const analytics = buildAnalytics(projects, experiments, validations, funding, departments, teamsWithCounts);
  const maya = buildMayaInsights(projects, analytics, departments);

  const metrics = {
    projectCount: projects.length,
    teamCount: teamsWithCounts.length,
    memberCount: members.length,
    vaultCount: vaultTotalCount,
    documentCount: documents.length,
    experimentCount: experiments.length,
    pitchCount: pitchCount,
    validationCount: validations.length,
    avgProgress,
    fundingReadyCount,
    stageCounts,
    activeResearch,
    activePrototypes,
    experimentsRunning,
    validationsPending,
    fundingSecured,
    commercializedProducts,
    departmentCount: activeDepts.size,
    innovationHealthScore,
    prototypeCount: prototypes.length,
    researchAssetCount: researchAssets.length,
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

  const notifications: EnterpriseNotificationRow[] = (notificationsRes.data ?? []).map((n) => ({
    id: String(n.id),
    title: String(n.title ?? 'Notification'),
    message: String(n.body ?? ''),
    type: String(n.type ?? 'info'),
    read: Boolean(n.read),
    created_at: String(n.created_at),
  }));

  const searchIndex = buildSearchIndex(
    projects,
    teamsWithCounts,
    documents,
    funding,
    prototypes,
    experiments,
    validations,
    researchAssets
  );

  return {
    profile,
    subscription,
    metrics,
    analytics,
    departments,
    projects,
    teams: teamsWithCounts,
    members,
    vault,
    documents,
    prototypes,
    experiments,
    validations,
    funding,
    researchAssets,
    timeline,
    notifications,
    maya,
    searchIndex,
  };
}

export async function updateEnterpriseOrganization(
  userId: string,
  input: { organization_name: string }
): Promise<void> {
  const organizationName = input.organization_name.trim();
  if (!organizationName) throw new Error('Organization name is required');

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

export async function loadEnterpriseKnowledgeVault(userId: string) {
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
    documents: (docsRes.data ?? []).map((d) => ({
      id: String(d.id),
      name: String(d.name),
      file_type: d.file_type ? String(d.file_type) : null,
      project_id: String(d.project_id),
      project_name: projectMap.get(String(d.project_id)) ?? null,
      created_at: String(d.created_at),
    })),
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
