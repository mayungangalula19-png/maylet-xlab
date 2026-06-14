import { supabase } from './client';
import { deleteProjectRelations, linkTeamToProject, logActivity } from './dbHelpers';
import { fetchAccessibleProjects } from '../../modules/projects/services/projectService';
import { invalidateCache } from '../../lib/utils/queryCache';
import type { ProjectViewModel } from '../../modules/projects/types';
import type {
  CreateProjectInput,
  Project,
  ProjectStatus,
} from '../../types/project.types';
import {
  normalizeProjectStatus,
  pipelineStageToDbFields,
  toDbProjectStatus,
} from '../../types/project.types';

interface RawProject {
  id: string;
  name: string;
  description?: string | null;
  sector?: string | null;
  progress?: number | null;
  progress_score?: number | null;
  status: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ProjectRecord extends Project {
  metadata: Record<string, unknown>;
}

function mapViewModelToProject(vm: ProjectViewModel): Project {
  return {
    id: vm.id,
    name: vm.name,
    description: vm.description,
    sector: vm.sector,
    progress: vm.progress,
    status: vm.status,
    created_at: vm.created_at,
    updated_at: vm.updated_at,
    user_id: vm.user_id,
    team_size: vm.team_size,
    tasks_completed: vm.tasks_completed,
    tasks_total: vm.tasks_total,
    ai_score: vm.ai_score,
  };
}

function mapRawProjectRecord(raw: RawProject): ProjectRecord {
  return {
    ...mapRawProject(raw),
    metadata: (raw.metadata as Record<string, unknown>) ?? {},
  };
}

/** Fetch single project — owner only via RLS */
export async function fetchProjectById(
  projectId: string,
  userId: string
): Promise<ProjectRecord | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRawProjectRecord(data as RawProject);
}

function mapRawProject(raw: RawProject): Project {
  const progress = Math.round(Number(raw.progress ?? raw.progress_score ?? 0));
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    sector: raw.sector ?? 'General',
    progress,
    status: normalizeProjectStatus(raw.status) as ProjectStatus,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    user_id: raw.user_id,
    team_size: 1,
    tasks_completed: 0,
    tasks_total: 0,
  };
}

/** Direct read — relies on RLS (auth.uid()) so all owned projects are returned */
async function listProjectsViaRls(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as RawProject[]).map(mapRawProject);
}

/** Load projects — direct DB read first (works even when enrichment schema is incomplete) */
export async function getProjects(userId: string): Promise<Project[]> {
  invalidateCache('projects:');

  try {
    const direct = await listProjectsViaRls();
    if (direct.length > 0) return direct;
  } catch (err) {
    console.warn('[getProjects] direct query failed:', err);
  }

  try {
    const list = await fetchAccessibleProjects({ userId });
    return list.map(mapViewModelToProject);
  } catch (err) {
    console.warn('[getProjects] enriched fetch failed:', err);
    return listProjectsViaRls();
  }
}

export async function deleteProject(id: string, userId?: string): Promise<void> {
  await deleteProjectRelations(id);

  let query = supabase.from('projects').delete().eq('id', id);
  if (userId) query = query.eq('user_id', userId);

  const { error } = await query;
  if (error) throw error;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { status, progress } = pipelineStageToDbFields(input.initialStage);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: input.name.trim(),
      description: input.description.trim(),
      sector: input.sector,
      status,
      progress,
      progress_score: progress,
      user_id: input.userId,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw error;

  const project = mapRawProject(data as RawProject);

  await logActivity({
    user_id: input.userId,
    project_id: project.id,
    type: 'project',
    title: `Created project "${project.name}"`,
    metadata: { sector: input.sector, stage: input.initialStage, ...input.metadata },
  });

  const teamId = input.metadata?.team_id;
  if (typeof teamId === 'string' && teamId) {
    await linkTeamToProject(teamId, project.id, input.userId);
  }

  const enriched = await getProjects(input.userId);
  return enriched.find((p) => p.id === project.id) ?? project;
}

export async function updateProjectStage(
  projectId: string,
  userId: string,
  stage: 'Prototype' | 'Idea' | 'Experiment' | 'Launched'
): Promise<Project> {
  const { status, progress } = pipelineStageToDbFields(
    stage === 'Prototype'
      ? 'Prototype'
      : stage === 'Experiment'
        ? 'Experiment'
        : stage === 'Launched'
          ? 'Launched'
          : 'Idea'
  );

  const { data, error } = await supabase
    .from('projects')
    .update({
      status,
      progress,
      progress_score: progress,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapRawProject(data as RawProject);
}

/** Update core project fields — only columns that exist on public.projects */
export async function updateProjectRecord(
  projectId: string,
  userId: string,
  patch: {
    name?: string;
    description?: string;
    sector?: string;
    status?: ProjectStatus | string;
    progress?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<Project> {
  const dbPatch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.name != null) dbPatch.name = patch.name;
  if (patch.description != null) dbPatch.description = patch.description;
  if (patch.sector != null) dbPatch.sector = patch.sector;
  if (patch.status != null) dbPatch.status = toDbProjectStatus(patch.status);
  if (patch.progress != null) {
    dbPatch.progress = patch.progress;
    dbPatch.progress_score = patch.progress;
  }
  if (patch.metadata != null) dbPatch.metadata = patch.metadata;

  const { data, error } = await supabase
    .from('projects')
    .update(dbPatch)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapRawProject(data as RawProject);
}
