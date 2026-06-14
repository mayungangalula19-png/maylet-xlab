import { supabase } from '../../../lib/supabase/client';
import { fetchTeamMembersForProject, logActivity } from '../../../lib/supabase/dbHelpers';
import {
  fetchProjectById,
  updateProjectRecord,
} from '../../../lib/supabase/projects.queries';
import { fetchProjectResearchSnapshot } from '../../../lib/supabase/research.queries';
import { listExperiments } from '../../../lib/experiment/experiment.service';
import { prototypeService } from '../../prototype/services/prototypeService';
import { gatherValidationEvidence } from '../../validation/services/validationService';
import { evaluateValidation } from '../../validation/ai/validationAI.engine';
import {
  getInnovationMetrics,
  getInnovationStage,
  type InnovationStage,
} from '../../../lib/innovation/lifecycle';
import { normalizeProjectStatus } from '../../../types/project.types';
import type { Project } from '../../../types/project.types';
import type {
  MayaControlInsights,
  ProjectControlAssets,
  ProjectMetadataPayload,
  ProjectWorkspaceMeta,
  StageGate,
  ValidationEvaluationResult,
  ValidationEvidenceSummary,
} from '../../../types/projectWorkspace.types';
import { EMPTY_PROJECT_WORKSPACE } from '../../../types/projectWorkspace.types';

export function innovationStageToProgress(stage: InnovationStage): number {
  const map: Record<InnovationStage, number> = {
    Idea: 10,
    Research: 30,
    Prototype: 55,
    Experiment: 45,
    Validation: 72,
    Funding: 85,
    Commercialization: 100,
  };
  return map[stage];
}

export function innovationStageToStatus(stage: InnovationStage): Project['status'] {
  if (stage === 'Commercialization') return 'Launched';
  if (stage === 'Prototype' || stage === 'Validation' || stage === 'Funding') return 'Prototype';
  if (stage === 'Experiment') return 'Experiment';
  return 'Idea';
}

export function parseWorkspaceMeta(source: unknown): ProjectWorkspaceMeta {
  const raw = (source as Record<string, unknown>) ?? {};
  const workspace = (raw.workspace as Record<string, unknown>) ?? raw;
  return {
    tagline: String(workspace.tagline ?? raw.tagline ?? ''),
    category: String(workspace.category ?? raw.category ?? 'Product Innovation'),
    tags: Array.isArray(workspace.tags)
      ? workspace.tags.map(String)
      : typeof raw.tags === 'string'
        ? raw.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    problem_statement: String(workspace.problem_statement ?? raw.problem_statement ?? ''),
    innovation_goals: String(workspace.innovation_goals ?? raw.innovation_goals ?? ''),
    target_users: String(workspace.target_users ?? raw.target_users ?? ''),
    pending_invites: Array.isArray(workspace.pending_invites)
      ? workspace.pending_invites.map(String)
      : [],
  };
}

export function buildMetadataPayload(
  workspace: ProjectWorkspaceMeta,
  stage: InnovationStage,
  maya: MayaControlInsights
): ProjectMetadataPayload {
  return {
    workspace,
    innovation_stage: stage,
    maya_snapshot: {
      innovation_score: maya.score,
      risk_level: maya.risk,
      next_action: maya.next,
      overall_readiness: maya.dimensionScores?.overall,
      evaluated_at: new Date().toISOString(),
    },
  };
}

async function loadWorkspaceFromActivities(projectId: string): Promise<ProjectWorkspaceMeta> {
  const { data } = await supabase
    .from('activities')
    .select('metadata')
    .eq('project_id', projectId)
    .eq('type', 'project')
    .order('created_at', { ascending: false })
    .limit(3);

  for (const row of data ?? []) {
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    if (meta.workspace || meta.tagline || meta.problem_statement) {
      return parseWorkspaceMeta(meta);
    }
  }
  return { ...EMPTY_PROJECT_WORKSPACE };
}

export async function resolveProjectWorkspace(
  projectId: string,
  metadata: unknown
): Promise<ProjectWorkspaceMeta> {
  const meta = (metadata as Record<string, unknown>) ?? {};
  if (meta.workspace || meta.tagline || meta.problem_statement || meta.tags) {
    return parseWorkspaceMeta(meta);
  }
  return loadWorkspaceFromActivities(projectId);
}

export function computeStageGates(assets: ProjectControlAssets): StageGate[] {
  return [
    {
      stage: 'Research',
      status:
        assets.researchCompletion >= 50
          ? 'passed'
          : assets.researchNotes + assets.researchFindings > 0
            ? 'in_progress'
            : 'locked',
      detail: `${assets.researchCompletion}% research completion · ${assets.researchFindings} findings`,
    },
    {
      stage: 'Prototype',
      status:
        assets.prototypes.length > 0
          ? assets.prototypes.some((p) => p.lifecycle_status === 'success')
            ? 'passed'
            : 'in_progress'
          : 'locked',
      detail: `${assets.prototypes.length} prototype(s) linked`,
    },
    {
      stage: 'Experiment',
      status:
        assets.experiments.length > 0
          ? assets.experiments.some((e) =>
              ['completed', 'done', 'success'].includes(String(e.status ?? '').toLowerCase())
            )
            ? 'passed'
            : 'in_progress'
          : 'locked',
      detail: `${assets.experiments.length} experiment(s) on record`,
    },
    {
      stage: 'Validation',
      status: assets.validations.some((v) => v.decision === 'pass')
        ? 'passed'
        : assets.validations.length > 0
          ? 'in_progress'
          : 'locked',
      detail: assets.validations.length
        ? `${assets.validations[0].decision.toUpperCase()} · ${assets.validations[0].overall_score}%`
        : 'No validation gate submitted',
    },
    {
      stage: 'Funding',
      status: assets.pitches.some((p) =>
        ['submitted', 'funded', 'approved'].includes(String(p.status ?? ''))
      )
        ? 'passed'
        : assets.pitches.length > 0
          ? 'in_progress'
          : 'locked',
      detail: `${assets.pitches.length} pitch(es)`,
    },
    {
      stage: 'Commercialization',
      status: assets.pitches.some((p) => p.status === 'funded')
        ? 'ready'
        : assets.validations.some((v) => v.decision === 'pass')
          ? 'in_progress'
          : 'locked',
      detail: 'GTM planning & scale operations',
    },
  ];
}

export function buildMayaInsights(
  project: Project,
  assets: ProjectControlAssets,
  workspace: ProjectWorkspaceMeta,
  evaluation: ValidationEvaluationResult | null
): MayaControlInsights {
  const metrics = getInnovationMetrics(project);
  const bullets: string[] = [];

  if (evaluation) {
    bullets.push(evaluation.summary);
    for (const insight of evaluation.maya_insights.slice(0, 3)) {
      bullets.push(`${insight.title}: ${insight.detail}`);
    }
    if (evaluation.scores.technical < 50) {
      bullets.push(`Technical readiness ${evaluation.scores.technical}% — strengthen prototype and experiment evidence.`);
    }
    if (evaluation.scores.user < 50) {
      bullets.push(`User evidence ${evaluation.scores.user}% — add interviews and usability findings.`);
    }
  }

  if (!workspace.problem_statement.trim()) {
    bullets.push('Add a problem statement to strengthen investor narrative.');
  }
  if (assets.researchCompletion < 40) {
    bullets.push('Research evidence is thin — capture literature and interview notes.');
  }
  if (assets.prototypes.length === 0 && metrics.stage !== 'Idea' && metrics.stage !== 'Research') {
    bullets.push('No prototypes linked — upload an MVP before advancing validation.');
  }
  if (
    assets.experiments.length === 0 &&
    ['Experiment', 'Validation', 'Funding'].includes(metrics.stage)
  ) {
    bullets.push('Run structured experiments to support validation dimensions.');
  }
  if (!assets.validations.some((v) => v.decision === 'pass') && metrics.fundingReadiness >= 60) {
    bullets.push('Funding readiness is rising but validation PASS is still required.');
  }
  if (assets.documents.length < 3) {
    bullets.push('Centralize key artifacts in Documents for audit trail.');
  }
  if (assets.teamMembers.length < 2) {
    bullets.push('Invite collaborators — multi-disciplinary teams score higher.');
  }

  if (bullets.length === 0) {
    bullets.push('Lifecycle alignment is strong. Focus on the next gate criteria.');
    bullets.push(`Maintain momentum in ${metrics.stage} with measurable milestones.`);
  }

  const blendedScore = evaluation
    ? Math.round(metrics.innovationScore * 0.45 + evaluation.scores.overall * 0.55)
    : metrics.innovationScore;

  return {
    score: blendedScore,
    risk: metrics.riskLevel,
    bullets: [...new Set(bullets)].slice(0, 6),
    next: metrics.nextAction,
    evidenceSummary: evaluation?.summary ?? null,
    dimensionScores: evaluation?.scores ?? null,
  };
}

export async function loadProjectControlAssets(
  projectId: string,
  userId: string
): Promise<ProjectControlAssets> {
  const [
    researchSnap,
    experiments,
    allPrototypes,
    validationsRes,
    pitchesRes,
    docsRes,
    membersRaw,
    timelineRes,
    teamRes,
  ] = await Promise.all([
    fetchProjectResearchSnapshot(projectId, userId).catch(() => null),
    listExperiments(userId, projectId).catch(() => []),
    prototypeService.list(userId).catch(() => []),
    supabase
      .from('validations')
      .select('id, decision, overall_score, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),
    supabase
      .from('funding_pitches')
      .select('id, title, status, amount_sought, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),
    supabase
      .from('documents')
      .select('id, name, file_type, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(12),
    fetchTeamMembersForProject(projectId),
    supabase
      .from('activities')
      .select('id, type, title, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(16),
    supabase.from('teams').select('id').eq('project_id', projectId).limit(1).maybeSingle(),
  ]);

  const prototypes = allPrototypes.filter((p) => p.project_id === projectId);

  return {
    researchCompletion: researchSnap?.completionRate ?? 0,
    researchNotes: researchSnap?.notes.length ?? 0,
    researchFindings: researchSnap?.findings.length ?? 0,
    researchDocs: researchSnap?.documents.length ?? 0,
    prototypes: prototypes.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      lifecycle_status: p.lifecycle_status,
    })),
    experiments: (experiments as Record<string, unknown>[]).map((e) => ({
      id: String(e.id),
      title: String(e.title ?? e.name ?? 'Experiment'),
      status: e.status ? String(e.status) : null,
      type: e.type ? String(e.type) : null,
    })),
    validations: (validationsRes.data ?? []).map((v) => ({
      id: String(v.id),
      decision: String(v.decision ?? 'pending'),
      overall_score: Number(v.overall_score ?? 0),
      created_at: String(v.created_at),
    })),
    pitches: (pitchesRes.data ?? []).map((p) => ({
      id: String(p.id),
      title: String(p.title),
      status: p.status ? String(p.status) : null,
      amount_sought: p.amount_sought != null ? Number(p.amount_sought) : null,
      created_at: String(p.created_at),
    })),
    documents: (docsRes.data ?? []).map((d) => ({
      id: String(d.id),
      name: String(d.name),
      file_type: d.file_type ? String(d.file_type) : null,
      created_at: String(d.created_at),
    })),
    teamMembers: membersRaw.map((m) => ({
      id: String(m.id),
      user_id: String(m.user_id),
      role: String(m.role ?? 'member'),
      joined_at: String(m.joined_at ?? ''),
      full_name: String(m.profiles?.full_name ?? 'Member'),
      email: String(m.profiles?.email ?? ''),
    })),
    timeline: (timelineRes.data ?? []).map((t) => ({
      id: String(t.id),
      type: String(t.type ?? 'system'),
      title: String(t.title ?? 'Activity'),
      created_at: String(t.created_at),
    })),
    teamId: teamRes.data?.id ? String(teamRes.data.id) : null,
  };
}

export async function loadValidationEvidence(
  projectId: string,
  userId: string,
  projectName: string
): Promise<ValidationEvidenceSummary> {
  return gatherValidationEvidence(projectId, userId, projectName);
}

export function evaluateProjectEvidence(
  evidence: ValidationEvidenceSummary,
  project: Project
): ValidationEvaluationResult {
  return evaluateValidation({
    evidence,
    projectProgress: project.progress,
    projectStatus: project.status,
  });
}

export async function loadProjectControlCenter(projectId: string, userId: string) {
  const row = await fetchProjectById(projectId, userId);
  if (!row) throw new Error('Project not found');

  const project: Project = {
    id: row.id,
    name: row.name,
    description: row.description,
    sector: row.sector,
    progress: row.progress,
    status: normalizeProjectStatus(row.status),
    created_at: row.created_at,
    updated_at: row.updated_at,
    user_id: row.user_id,
    team_size: 1,
    tasks_completed: 0,
    tasks_total: 0,
  };

  const [workspace, assets, evidence] = await Promise.all([
    resolveProjectWorkspace(projectId, row.metadata),
    loadProjectControlAssets(projectId, userId),
    loadValidationEvidence(projectId, userId, project.name).catch(() => null),
  ]);

  const storedStage = (row.metadata as Record<string, unknown>)?.innovation_stage;
  const stage =
    typeof storedStage === 'string'
      ? (storedStage as InnovationStage)
      : getInnovationStage(project);

  const evaluation = evidence ? evaluateProjectEvidence(evidence, project) : null;

  return { project, workspace, assets, evidence, evaluation, stage };
}

export async function saveProjectControlCenter(input: {
  projectId: string;
  userId: string;
  name: string;
  description: string;
  sector: string;
  stage: InnovationStage;
  progress: number;
  workspace: ProjectWorkspaceMeta;
  maya: MayaControlInsights;
}): Promise<Project> {
  const metadata = buildMetadataPayload(input.workspace, input.stage, input.maya);

  const updated = await updateProjectRecord(input.projectId, input.userId, {
    name: input.name.trim(),
    description: input.description.trim(),
    sector: input.sector,
    status: innovationStageToStatus(input.stage),
    progress: input.progress,
    metadata: metadata as unknown as Record<string, unknown>,
  });

  await logActivity({
    user_id: input.userId,
    project_id: input.projectId,
    type: 'project',
    title: `Updated project control center "${input.name.trim()}"`,
    metadata: {
      ...metadata,
      sector: input.sector,
      tags: input.workspace.tags,
    },
  });

  return updated;
}
