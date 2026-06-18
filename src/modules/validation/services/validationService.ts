import { supabase } from '../../../lib/supabase/client';
import { logActivity } from '../../../lib/supabase/dbHelpers';
import { getProjects, updateProjectRecord } from '../../../lib/supabase/projects.queries';
import { fetchProjectResearchSnapshot } from '../../../lib/supabase/research.queries';
import { computeProjectCompletion } from '../../../lib/research/utils';
import { getInnovationStage } from '../../../lib/innovation/lifecycle';
import { listExperiments } from '../../experiment/services/experiment.service';
import { prototypeService } from '../../prototype/services/prototypeService';
import { testingService } from '../../prototype/services/testingService';
import { evaluateValidation } from '../ai/validationAI.engine';
import type {
  ValidationDashboardStats,
  ValidationDecision,
  ValidationEvidenceSummary,
  ValidationMayaInsight,
  ValidationRecord,
} from '../types/validation.types';
import type { Project } from '../../../types/project.types';

const EMPTY_RESEARCH: ValidationEvidenceSummary['research'] = {
  findingsCount: 0,
  notesCount: 0,
  documentsCount: 0,
  literatureCount: 0,
  interviewNotesCount: 0,
  completionPct: 0,
};

const EMPTY_PROTOTYPES: ValidationEvidenceSummary['prototypes'] = {
  count: 0,
  successCount: 0,
  withBuildCount: 0,
  avgTestPassRate: 0,
};

const EMPTY_EXPERIMENTS: ValidationEvidenceSummary['experiments'] = {
  count: 0,
  completedCount: 0,
  withResultsCount: 0,
  marketTypeCount: 0,
  userTypeCount: 0,
};

/** Merge partial/stale JSONB evidence from DB into a complete summary. */
export function normalizeValidationEvidence(
  raw: unknown,
  projectId: string,
  projectName?: string
): ValidationEvidenceSummary {
  const e = (raw && typeof raw === 'object' ? raw : {}) as Partial<ValidationEvidenceSummary>;
  const research =
    e.research && typeof e.research === 'object'
      ? e.research
      : ({} as Partial<ValidationEvidenceSummary['research']>);
  const prototypes =
    e.prototypes && typeof e.prototypes === 'object'
      ? e.prototypes
      : ({} as Partial<ValidationEvidenceSummary['prototypes']>);
  const experiments =
    e.experiments && typeof e.experiments === 'object'
      ? e.experiments
      : ({} as Partial<ValidationEvidenceSummary['experiments']>);

  return {
    projectId: String(e.projectId ?? projectId),
    projectName: String(e.projectName ?? projectName ?? 'Project'),
    research: {
      findingsCount: Number(research.findingsCount ?? EMPTY_RESEARCH.findingsCount),
      notesCount: Number(research.notesCount ?? EMPTY_RESEARCH.notesCount),
      documentsCount: Number(research.documentsCount ?? EMPTY_RESEARCH.documentsCount),
      literatureCount: Number(research.literatureCount ?? EMPTY_RESEARCH.literatureCount),
      interviewNotesCount: Number(research.interviewNotesCount ?? EMPTY_RESEARCH.interviewNotesCount),
      completionPct: Number(research.completionPct ?? EMPTY_RESEARCH.completionPct),
    },
    prototypes: {
      count: Number(prototypes.count ?? EMPTY_PROTOTYPES.count),
      successCount: Number(prototypes.successCount ?? EMPTY_PROTOTYPES.successCount),
      withBuildCount: Number(prototypes.withBuildCount ?? EMPTY_PROTOTYPES.withBuildCount),
      avgTestPassRate: Number(prototypes.avgTestPassRate ?? EMPTY_PROTOTYPES.avgTestPassRate),
    },
    experiments: {
      count: Number(experiments.count ?? EMPTY_EXPERIMENTS.count),
      completedCount: Number(experiments.completedCount ?? EMPTY_EXPERIMENTS.completedCount),
      withResultsCount: Number(experiments.withResultsCount ?? EMPTY_EXPERIMENTS.withResultsCount),
      marketTypeCount: Number(experiments.marketTypeCount ?? EMPTY_EXPERIMENTS.marketTypeCount),
      userTypeCount: Number(experiments.userTypeCount ?? EMPTY_EXPERIMENTS.userTypeCount),
    },
  };
}

function mapRow(row: Record<string, unknown>, projectName?: string): ValidationRecord {
  const projectId = String(row.project_id);
  return {
    id: String(row.id),
    project_id: projectId,
    user_id: String(row.user_id),
    project_name: projectName,
    scores: {
      technical: Number(row.technical_score ?? 0),
      user: Number(row.user_score ?? 0),
      market: Number(row.market_score ?? 0),
      financial: Number(row.financial_score ?? 0),
      overall: Number(row.overall_score ?? 0),
    },
    decision: String(row.decision) as ValidationDecision,
    evidence: normalizeValidationEvidence(row.evidence, projectId, projectName),
    maya_insights: (row.maya_insights as ValidationMayaInsight[]) ?? [],
    reviewer_notes: row.reviewer_notes ? String(row.reviewer_notes) : null,
    promoted_at: row.promoted_at ? String(row.promoted_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function gatherValidationEvidence(
  projectId: string,
  userId: string,
  projectName: string
): Promise<ValidationEvidenceSummary> {
  const [snapshot, experiments, allPrototypes] = await Promise.all([
    fetchProjectResearchSnapshot(projectId, userId).catch(() => null),
    listExperiments(userId, projectId),
    prototypeService.list(userId),
  ]);

  const prototypes = allPrototypes.filter((p) => p.project_id === projectId);
  let totalPassRate = 0;
  let passSamples = 0;
  for (const proto of prototypes) {
    const runs = await testingService.list(proto.id);
    if (runs.length > 0) {
      totalPassRate += testingService.passRate(runs);
      passSamples += 1;
    }
  }

  const interviewNotes =
    snapshot?.notes.filter((n) => n.category === 'interview' || n.category === 'fieldwork') ?? [];

  const completedStatuses = new Set(['completed', 'done', 'closed', 'success']);
  const experimentRows = experiments as Record<string, unknown>[];

  return {
    projectId,
    projectName,
    research: {
      findingsCount: snapshot?.findings.length ?? 0,
      notesCount: snapshot?.notes.length ?? 0,
      documentsCount: snapshot?.documents.length ?? 0,
      literatureCount: snapshot?.literature.length ?? 0,
      interviewNotesCount: interviewNotes.length,
      completionPct: snapshot ? computeProjectCompletion(snapshot) : 0,
    },
    prototypes: {
      count: prototypes.length,
      successCount: prototypes.filter((p) => p.lifecycle_status === 'success').length,
      withBuildCount: prototypes.filter((p) => Boolean(p.file_url)).length,
      avgTestPassRate: passSamples > 0 ? totalPassRate / passSamples : 0,
    },
    experiments: {
      count: experimentRows.length,
      completedCount: experimentRows.filter((e) => completedStatuses.has(String(e.status ?? '').toLowerCase())).length,
      withResultsCount: experimentRows.filter((e) => Boolean(e.results || e.findings)).length,
      marketTypeCount: experimentRows.filter((e) => String(e.type ?? '').toLowerCase() === 'market').length,
      userTypeCount: experimentRows.filter((e) => ['user', 'usability', 'customer'].includes(String(e.type ?? '').toLowerCase())).length,
    },
  };
}

export function isProjectEligibleForValidation(project: Project): boolean {
  const stage = getInnovationStage(project);
  return stage === 'Experiment' || stage === 'Validation' || stage === 'Prototype';
}

export async function listEligibleProjects(userId: string): Promise<Project[]> {
  const projects = await getProjects(userId);
  return projects.filter(isProjectEligibleForValidation);
}

export async function listValidations(userId: string): Promise<ValidationRecord[]> {
  const { data, error } = await supabase
    .from('validations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as Record<string, unknown>[];
  const projectIds = [...new Set(rows.map((r) => String(r.project_id)))];
  const nameById = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase.from('projects').select('id, name').in('id', projectIds);
    for (const p of projects ?? []) nameById.set(String(p.id), String(p.name));
  }

  return rows.map((row) => mapRow(row, nameById.get(String(row.project_id))));
}

export async function getValidation(id: string, userId: string): Promise<ValidationRecord | null> {
  const { data, error } = await supabase
    .from('validations')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: project } = await supabase.from('projects').select('name').eq('id', data.project_id).maybeSingle();
  return mapRow(data as Record<string, unknown>, project?.name ? String(project.name) : undefined);
}

export async function createValidation(projectId: string, userId: string): Promise<ValidationRecord> {
  const projects = await getProjects(userId);
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw new Error('Project not found');
  if (!isProjectEligibleForValidation(project)) {
    throw new Error('Project must be in Experiment, Prototype, or Validation stage');
  }

  const evidence = await gatherValidationEvidence(projectId, userId, project.name);
  const evaluation = evaluateValidation({
    evidence,
    projectProgress: project.progress ?? 0,
    projectStatus: project.status,
  });

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('validations')
    .insert({
      project_id: projectId,
      user_id: userId,
      technical_score: evaluation.scores.technical,
      user_score: evaluation.scores.user,
      market_score: evaluation.scores.market,
      financial_score: evaluation.scores.financial,
      overall_score: evaluation.scores.overall,
      decision: evaluation.decision,
      evidence,
      maya_insights: evaluation.maya_insights,
      reviewer_notes: evaluation.summary,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw error;

  await logActivity({
    user_id: userId,
    project_id: projectId,
    type: 'validation',
    title: `Validation ${evaluation.decision.toUpperCase()} for "${project.name}"`,
    metadata: { scores: evaluation.scores, decision: evaluation.decision },
  });

  return mapRow(data as Record<string, unknown>, project.name);
}

export async function updateValidationDecision(
  id: string,
  userId: string,
  decision: ValidationDecision,
  reviewerNotes?: string
): Promise<ValidationRecord> {
  const { data, error } = await supabase
    .from('validations')
    .update({
      decision,
      reviewer_notes: reviewerNotes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;

  const { data: project } = await supabase.from('projects').select('name').eq('id', data.project_id).maybeSingle();
  return mapRow(data as Record<string, unknown>, project?.name ? String(project.name) : undefined);
}

export async function promoteToFunding(validationId: string, userId: string): Promise<{ projectId: string }> {
  const record = await getValidation(validationId, userId);
  if (!record) throw new Error('Validation not found');
  if (record.decision !== 'pass') throw new Error('Only PASS validations can be promoted to Funding');
  if (record.promoted_at) throw new Error('Already promoted to Funding');

  await updateProjectRecord(record.project_id, userId, {
    status: 'Prototype',
    progress: 85,
  });

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('validations')
    .update({ promoted_at: now, updated_at: now })
    .eq('id', validationId)
    .eq('user_id', userId);
  if (error) throw error;

  await logActivity({
    user_id: userId,
    project_id: record.project_id,
    type: 'validation',
    title: `Promoted "${record.project_name ?? 'project'}" to Funding`,
    metadata: { validationId, overall: record.scores.overall },
  });

  return { projectId: record.project_id };
}

export function computeDashboardStats(records: ValidationRecord[]): ValidationDashboardStats {
  if (records.length === 0) {
    return { total: 0, pass: 0, hold: 0, fail: 0, pending: 0, avgReadiness: 0 };
  }
  const pass = records.filter((r) => r.decision === 'pass').length;
  const hold = records.filter((r) => r.decision === 'hold').length;
  const fail = records.filter((r) => r.decision === 'fail').length;
  const pending = records.filter((r) => r.decision === 'pending').length;
  const avgReadiness = Math.round(records.reduce((s, r) => s + r.scores.overall, 0) / records.length);
  return { total: records.length, pass, hold, fail, pending, avgReadiness };
}

export const validationService = {
  normalizeValidationEvidence,
  gatherValidationEvidence,
  isProjectEligibleForValidation,
  listEligibleProjects,
  listValidations,
  getValidation,
  createValidation,
  updateValidationDecision,
  promoteToFunding,
  computeDashboardStats,
};
