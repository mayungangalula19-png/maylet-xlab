import { supabase } from '../../../lib/supabase/client';
import { prototypeInsert } from '../../../lib/supabase/prototype.queries';
import { logActivity } from '../../../lib/supabase/dbHelpers';
import { createProject, updateProjectRecord } from '../../../lib/supabase/projects.queries';
import {
  fetchResearchFindings,
  fetchResearchNotes,
  fetchResearchProfile,
  fetchResearchDocuments,
} from '../../../lib/supabase/research.queries';
import {
  normalizeLifecycleStatus,
  toCreatedPrototype,
  validatePrototypeUploadFile,
  getPrototypeFileExtension,
  computeDashboardStats,
  PROTOTYPE_UPLOAD_MAX_BYTES,
  type CreatePrototypeData,
  type CreatePrototypeInput,
  type CreatedPrototype,
  type PrototypeDashboardStats,
  type PrototypeFile,
  type PrototypeLifecycleStatus,
  type PrototypeRecord,
  type PromoteToProjectResult,
  type ResearchLinkSummary,
  type UpdatePrototypeInput,
} from '../types/prototype.types';
import { bumpPatchVersion } from './versionService';

async function safe<T>(fn: () => PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await fn();
    if (error) return fallback;
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

function mapRow(row: Record<string, unknown>, extras?: Partial<PrototypeRecord>): PrototypeRecord {
  const status = String(row.status ?? 'draft');
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    project_id: row.project_id ? String(row.project_id) : null,
    research_id: row.research_id ? String(row.research_id) : null,
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    file_url: row.file_url ? String(row.file_url) : null,
    thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
    version: String(row.version ?? '1.0.0'),
    status,
    lifecycle_status: normalizeLifecycleStatus(status),
    views: Number(row.views ?? 0),
    downloads: Number(row.downloads ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    ...extras,
  };
}

async function uploadFile(userId: string, file: File, prefix: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${userId}-${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('prototypes').upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('prototypes').getPublicUrl(fileName);
  return data.publicUrl;
}

function mapFileRow(row: Record<string, unknown>): PrototypeFile {
  return {
    id: String(row.id),
    prototypeId: String(row.prototype_id),
    fileName: String(row.file_name),
    fileType: String(row.file_type),
    fileSize: Number(row.file_size),
    url: row.url ? String(row.url) : undefined,
    uploadedAt: String(row.uploaded_at),
  };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function isMissingTableError(error: unknown): boolean {
  const code = String((error as { code?: string })?.code ?? '');
  return code === '42P01' || code === 'PGRST205';
}

async function uploadBuildToStorage(userId: string, prototypeId: string, file: File): Promise<{ url: string; path: string }> {
  const safeName = sanitizeFileName(file.name);
  const path = `${userId}/${prototypeId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('prototypes').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('prototypes').getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Upload a build artifact and attach it to a prototype record */
export async function uploadPrototypeBuild(
  prototypeId: string,
  file: File,
  options?: { maxSizeBytes?: number }
): Promise<PrototypeFile> {
  const maxSize = options?.maxSizeBytes ?? PROTOTYPE_UPLOAD_MAX_BYTES;
  validatePrototypeUploadFile(file, maxSize);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const prototype = await prototypeService.getById(prototypeId, user.id);
  if (!prototype) throw new Error('Prototype not found');

  const { url, path } = await uploadBuildToStorage(user.id, prototypeId, file);
  const ext = getPrototypeFileExtension(file.name);
  const fileType = file.type || ext;
  const uploadedAt = new Date().toISOString();

  let data: Record<string, unknown>;
  try {
    const result = await supabase
      .from('prototype_files')
      .insert({
        prototype_id: prototypeId,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        url,
        uploaded_at: uploadedAt,
      })
      .select()
      .single();

    if (result.error) {
      if (isMissingTableError(result.error)) {
        throw new Error('Upload storage is not configured. Run database migration 20240612000005_prototype_files.sql');
      }
      throw result.error;
    }
    data = result.data as Record<string, unknown>;
  } catch (err) {
    await supabase.storage.from('prototypes').remove([path]).catch(() => undefined);
    throw err instanceof Error ? err : new Error('Failed to save file metadata');
  }

  if (!prototype.file_url && (ext === 'zip' || ext === 'apk')) {
    await supabase
      .from('prototypes')
      .update({ file_url: url, updated_at: uploadedAt })
      .eq('id', prototypeId)
      .eq('user_id', user.id);
  }

  return mapFileRow(data as Record<string, unknown>);
}

/** Core engine: create a new prototype innovation record */
export async function createPrototype(data: CreatePrototypeData): Promise<CreatedPrototype> {
  const name = data.name.trim();
  if (!name) {
    throw new Error('Prototype name is required');
  }

  const record = await prototypeService.create(data.userId, {
    name,
    description: data.description?.trim() ?? '',
    project_id: data.projectId ?? null,
    research_id: data.researchId ?? null,
    version: '0.1.0',
  });

  return toCreatedPrototype({
    ...record,
    lifecycle_status: data.status ?? 'draft',
    status: data.status ?? 'draft',
  });
}

export const prototypeService = {
  async list(userId: string, filters?: { projectId?: string; researchId?: string }): Promise<PrototypeRecord[]> {
    let query = supabase.from('prototypes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (filters?.projectId) query = query.eq('project_id', filters.projectId);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as Record<string, unknown>[];
    const filtered = filters?.researchId
      ? rows.filter((r) => r.research_id === filters.researchId)
      : rows;

    const projectIds = [
      ...new Set(filtered.map((r) => r.project_id).filter((id): id is string => Boolean(id))),
    ];
    const projectNameById = new Map<string, string>();
    if (projectIds.length > 0) {
      const { data: projects } = await supabase.from('projects').select('id, name').in('id', projectIds);
      for (const p of projects ?? []) {
        projectNameById.set(String(p.id), String(p.name));
      }
    }

    return filtered.map((row) =>
      mapRow(row, {
        project_name: row.project_id ? projectNameById.get(String(row.project_id)) : undefined,
      })
    );
  },

  async getById(id: string, userId: string): Promise<PrototypeRecord | null> {
    const row = await safe(
      () => supabase.from('prototypes').select('*').eq('id', id).eq('user_id', userId).maybeSingle(),
      null as Record<string, unknown> | null
    );
    if (!row) return null;
    let project_name: string | undefined;
    if (row.project_id) {
      const proj = await safe(
        () => supabase.from('projects').select('name').eq('id', row.project_id).maybeSingle(),
        null as { name: string } | null
      );
      project_name = proj?.name;
    }
    return mapRow(row, { project_name });
  },

  async getDashboardStats(userId: string, existingList?: PrototypeRecord[]): Promise<PrototypeDashboardStats> {
    const list = existingList ?? (await prototypeService.list(userId));
    return computeDashboardStats(list);
  },

  async create(userId: string, input: CreatePrototypeInput): Promise<PrototypeRecord> {
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUserId = sessionData.session?.user?.id;
    if (!sessionUserId) {
      throw new Error('You must be signed in to create a prototype.');
    }
    if (sessionUserId !== userId) {
      throw new Error('Session mismatch. Sign out and sign in again.');
    }

    let file_url: string | null = null;
    let thumbnail_url: string | null = null;
    if (input.file) file_url = await uploadFile(userId, input.file, 'file');
    if (input.thumbnail) thumbnail_url = await uploadFile(userId, input.thumbnail, 'thumb');

    const { data } = await prototypeInsert({
      user_id: userId,
      project_id: input.project_id ?? null,
      research_id: input.research_id ?? null,
      name: input.name,
      description: input.description ?? '',
      version: input.version ?? '1.0.0',
      status: 'draft',
      file_url,
      thumbnail_url,
    });
    return mapRow(data as Record<string, unknown>);
  },

  async update(id: string, userId: string, input: UpdatePrototypeInput): Promise<PrototypeRecord> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name != null) patch.name = input.name;
    if (input.description != null) patch.description = input.description;
    if (input.version != null) patch.version = input.version;
    if (input.project_id != null) patch.project_id = input.project_id;
    if (input.lifecycle_status != null) patch.status = input.lifecycle_status;
    if (input.file) patch.file_url = await uploadFile(userId, input.file, 'file');
    if (input.thumbnail) patch.thumbnail_url = await uploadFile(userId, input.thumbnail, 'thumb');

    const { data, error } = await supabase.from('prototypes').update(patch).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  },

  async remove(id: string, userId: string): Promise<void> {
    const { error } = await supabase.from('prototypes').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },

  async createFromResearch(
    userId: string,
    projectId: string,
    researchId: string,
    payload: { name: string; description?: string; insights?: string[] }
  ): Promise<PrototypeRecord> {
    const desc = [
      payload.description ?? '',
      payload.insights?.length ? `\n\nResearch insights:\n${payload.insights.map((i) => `- ${i}`).join('\n')}` : '',
    ].join('');
    return prototypeService.create(userId, {
      project_id: projectId,
      research_id: researchId,
      name: payload.name,
      description: desc.trim(),
      version: '0.1.0',
    });
  },

  async advanceLifecycle(id: string, userId: string, status: PrototypeLifecycleStatus): Promise<PrototypeRecord> {
    return prototypeService.update(id, userId, { lifecycle_status: status });
  },

  async listFiles(prototypeId: string): Promise<PrototypeFile[]> {
    const { data, error } = await supabase
      .from('prototype_files')
      .select('*')
      .eq('prototype_id', prototypeId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      if (isMissingTableError(error)) return [];
      throw error;
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapFileRow);
  },

  async fetchResearchContext(
    projectId: string | null,
    userId: string
  ): Promise<ResearchLinkSummary | null> {
    if (!projectId) return null;
    const [profile, findings, documents, notes] = await Promise.all([
      fetchResearchProfile(projectId, userId),
      fetchResearchFindings(projectId),
      fetchResearchDocuments(projectId),
      fetchResearchNotes(projectId),
    ]);
    return {
      projectId,
      researchProfileId: profile?.id ?? null,
      problemStatement: profile?.problem_statement ?? null,
      findingsCount: findings.length,
      documentsCount: documents.length,
      notesCount: notes.length,
    };
  },

  /** Alias: create prototype from research project/profile */
  async createPrototypeFromResearch(
    userId: string,
    projectId: string,
    researchId: string,
    payload: { name: string; description?: string; insights?: string[] }
  ): Promise<PrototypeRecord> {
    return prototypeService.createFromResearch(userId, projectId, researchId, payload);
  },

  /** Promote validated prototype → linked project (status prototype / launched path) */
  async promotePrototypeToProject(
    prototypeId: string,
    userId: string
  ): Promise<PromoteToProjectResult> {
    const proto = await prototypeService.getById(prototypeId, userId);
    if (!proto) throw new Error('Prototype not found');
    if (proto.lifecycle_status !== 'success') {
      throw new Error('Prototype must be validated (pass tests) before promotion to project');
    }

    let projectId = proto.project_id;

    if (!projectId) {
      const created = await createProject({
        name: proto.name,
        description: proto.description?.trim() || `Promoted from prototype ${proto.name}`,
        sector: 'General',
        initialStage: 'Prototype',
        userId,
        metadata: { source_prototype_id: prototypeId },
      });
      projectId = created.id;
    } else {
      await updateProjectRecord(projectId, userId, {
        status: 'Prototype',
        progress: 90,
      });
    }

    const nextVersion = bumpPatchVersion(proto.version);
    await prototypeService.update(prototypeId, userId, {
      project_id: projectId,
      version: nextVersion,
      lifecycle_status: 'success',
    });

    await logActivity({
      user_id: userId,
      project_id: projectId,
      type: 'prototype',
      title: `Promoted prototype "${proto.name}" to project`,
      metadata: { prototype_id: prototypeId, version: nextVersion },
    });

    return { projectId, prototypeId, promoted: true };
  },

  async incrementViews(prototypeId: string): Promise<void> {
    const { data } = await supabase.from('prototypes').select('views').eq('id', prototypeId).single();
    const views = Number(data?.views ?? 0) + 1;
    await supabase.from('prototypes').update({ views }).eq('id', prototypeId);
  },
};
