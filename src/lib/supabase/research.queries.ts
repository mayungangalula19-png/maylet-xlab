import { supabase } from '../supabase/client';
import { computeProjectCompletion } from '../research/utils';
import type {
  FindingType,
  LiteratureType,
  ProjectResearchSnapshot,
  ResearchDashboardStats,
  ResearchDocument,
  ResearchFinding,
  ResearchNote,
  ResearchProfile,
  LiteratureItem,
} from '../../types/research.types';
import { buildDashboardStats } from '../research/utils';

async function safe<T>(fn: () => PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await fn();
    if (error) return fallback;
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchResearchProfile(projectId: string, userId: string): Promise<ResearchProfile | null> {
  const existing = await safe(
    () => supabase.from('research_profiles').select('*').eq('project_id', projectId).maybeSingle(),
    null as ResearchProfile | null
  );
  if (existing) return existing;

  const { data, error } = await supabase
    .from('research_profiles')
    .insert({ project_id: projectId, user_id: userId })
    .select()
    .single();
  if (error) return null;
  return data as ResearchProfile;
}

export async function upsertResearchProfile(
  projectId: string,
  userId: string,
  fields: Partial<Omit<ResearchProfile, 'id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ResearchProfile | null> {
  await fetchResearchProfile(projectId, userId);
  const { data, error } = await supabase
    .from('research_profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('project_id', projectId)
    .select()
    .single();
  if (error) throw error;
  return data as ResearchProfile;
}

export async function fetchResearchNotes(projectId: string): Promise<ResearchNote[]> {
  return safe(
    () =>
      supabase
        .from('research_notes')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false }),
    [] as ResearchNote[]
  );
}

export async function createResearchNote(
  projectId: string,
  userId: string,
  payload: { title: string; content?: string; category?: string; tags?: string[] }
): Promise<ResearchNote> {
  const { data, error } = await supabase
    .from('research_notes')
    .insert({
      project_id: projectId,
      user_id: userId,
      title: payload.title,
      content: payload.content ?? '',
      category: payload.category ?? 'general',
      tags: payload.tags ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return data as ResearchNote;
}

export async function updateResearchNote(
  id: string,
  payload: Partial<Pick<ResearchNote, 'title' | 'content' | 'category' | 'tags'>>
): Promise<ResearchNote> {
  const { data, error } = await supabase
    .from('research_notes')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ResearchNote;
}

export async function deleteResearchNote(id: string): Promise<void> {
  const { error } = await supabase.from('research_notes').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchLiteratureItems(projectId: string): Promise<LiteratureItem[]> {
  return safe(
    () =>
      supabase
        .from('literature_items')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false }),
    [] as LiteratureItem[]
  );
}

export async function createLiteratureItem(
  projectId: string,
  userId: string,
  payload: Partial<LiteratureItem> & { title: string; item_type?: LiteratureType }
): Promise<LiteratureItem> {
  const { data, error } = await supabase
    .from('literature_items')
    .insert({
      project_id: projectId,
      user_id: userId,
      title: payload.title,
      item_type: payload.item_type ?? 'paper',
      source: payload.source ?? null,
      authors: payload.authors ?? null,
      publication_date: payload.publication_date ?? null,
      citation_count: payload.citation_count ?? null,
      relevance_score: payload.relevance_score ?? null,
      url: payload.url ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as LiteratureItem;
}

export async function updateLiteratureItem(id: string, payload: Partial<LiteratureItem>): Promise<LiteratureItem> {
  const { data, error } = await supabase
    .from('literature_items')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as LiteratureItem;
}

export async function deleteLiteratureItem(id: string): Promise<void> {
  const { error } = await supabase.from('literature_items').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchResearchFindings(projectId: string): Promise<ResearchFinding[]> {
  return safe(
    () =>
      supabase
        .from('research_findings')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false }),
    [] as ResearchFinding[]
  );
}

export async function createResearchFinding(
  projectId: string,
  userId: string,
  payload: { title: string; content?: string; finding_type?: FindingType }
): Promise<ResearchFinding> {
  const { data, error } = await supabase
    .from('research_findings')
    .insert({
      project_id: projectId,
      user_id: userId,
      title: payload.title,
      content: payload.content ?? '',
      finding_type: payload.finding_type ?? 'finding',
    })
    .select()
    .single();
  if (error) throw error;
  return data as ResearchFinding;
}

export async function updateResearchFinding(
  id: string,
  payload: Partial<Pick<ResearchFinding, 'title' | 'content' | 'finding_type'>>
): Promise<ResearchFinding> {
  const { data, error } = await supabase
    .from('research_findings')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ResearchFinding;
}

export async function deleteResearchFinding(id: string): Promise<void> {
  const { error } = await supabase.from('research_findings').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchResearchDocuments(projectId: string): Promise<ResearchDocument[]> {
  return safe(
    () =>
      supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
    [] as ResearchDocument[]
  );
}

export async function uploadResearchDocument(
  projectId: string,
  userId: string,
  file: File,
  meta?: { category?: string; tags?: string[]; description?: string }
): Promise<ResearchDocument> {
  const fileName = `${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('project-documents')
    .upload(`${projectId}/${fileName}`, file);
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('project-documents').getPublicUrl(`${projectId}/${fileName}`);

  const { data, error } = await supabase
    .from('documents')
    .insert({
      project_id: projectId,
      user_id: userId,
      name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      size_bytes: file.size,
      category: meta?.category ?? 'research',
      tags: meta?.tags ?? [],
      description: meta?.description ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ResearchDocument;
}

export async function deleteResearchDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchProjectResearchSnapshot(
  projectId: string,
  userId: string
): Promise<ProjectResearchSnapshot> {
  const [profile, notes, literature, findings, documents] = await Promise.all([
    fetchResearchProfile(projectId, userId),
    fetchResearchNotes(projectId),
    fetchLiteratureItems(projectId),
    fetchResearchFindings(projectId),
    fetchResearchDocuments(projectId),
  ]);

  const completionRate = computeProjectCompletion({ profile, notes, literature, findings, documents });
  return { profile, notes, literature, findings, documents, completionRate };
}

export async function fetchResearchDashboard(userId: string): Promise<{
  stats: ResearchDashboardStats;
  projects: { id: string; name: string; sector: string; completionRate: number }[];
}> {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, sector')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;

  const projectList = projects ?? [];
  const snapshots = await Promise.all(
    projectList.map((p) => fetchProjectResearchSnapshot(p.id, userId))
  );

  const allNotes = snapshots.flatMap((s) => s.notes);
  const allLiterature = snapshots.flatMap((s) => s.literature);
  const allDocuments = snapshots.flatMap((s) => s.documents);

  const stats = buildDashboardStats(
    projectList.length,
    allNotes,
    allLiterature,
    allDocuments,
    snapshots
  );

  return {
    stats,
    projects: projectList.map((p, i) => ({
      id: p.id,
      name: p.name,
      sector: p.sector,
      completionRate: snapshots[i]?.completionRate ?? 0,
    })),
  };
}

export async function fetchResearchActivity(userId: string, days = 14): Promise<{ date: string; count: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [notes, literature, findings, documents] = await Promise.all([
    safe(
      () =>
        supabase
          .from('research_notes')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', since.toISOString()),
      [] as { created_at: string }[]
    ),
    safe(
      () =>
        supabase
          .from('literature_items')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', since.toISOString()),
      [] as { created_at: string }[]
    ),
    safe(
      () =>
        supabase
          .from('research_findings')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', since.toISOString()),
      [] as { created_at: string }[]
    ),
    safe(
      () =>
        supabase
          .from('documents')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', since.toISOString()),
      [] as { created_at: string }[]
    ),
  ]);

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const row of [...notes, ...literature, ...findings, ...documents]) {
    const key = row.created_at.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

// ── Gate reviews ──────────────────────────────────────────────

export interface GateReviewRow {
  id: string;
  project_id: string;
  user_id: string;
  system_completion: number;
  section_a: unknown;
  section_b: unknown;
  section_c: unknown;
  decision: string;
  v1_scope: string | null;
  out_of_scope: string | null;
  open_risks: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchLatestGateReview(projectId: string): Promise<GateReviewRow | null> {
  return safe(
    () =>
      supabase
        .from('research_gate_reviews')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    null as GateReviewRow | null
  );
}

export async function saveGateReview(
  projectId: string,
  userId: string,
  payload: {
    system_completion: number;
    section_a: unknown;
    section_b: unknown;
    section_c: unknown;
    decision: string;
    v1_scope: string | null;
    out_of_scope: string | null;
    open_risks: string | null;
    reviewer_name: string | null;
    reviewed_at: string;
  }
): Promise<GateReviewRow | null> {
  const { data, error } = await supabase
    .from('research_gate_reviews')
    .insert({
      project_id: projectId,
      user_id: userId,
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as GateReviewRow;
}
