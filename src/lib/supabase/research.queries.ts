import { supabase } from '../supabase/client';
import { dedupeAsync, getCached, setCached } from '../utils/queryCache';
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
import { uploadProjectDocumentFile } from './document.queries';

type SchemaError = { message?: string };

function isMissingColumnError(error: unknown, column: string): boolean {
  const msg = String((error as SchemaError)?.message ?? '').toLowerCase();
  return msg.includes(column.toLowerCase()) && (msg.includes('schema cache') || msg.includes('column'));
}

/** Insert research row; retries without user_id when remote schema omits that column. */
async function researchInsert(
  table: string,
  projectId: string,
  userId: string,
  fields: Record<string, unknown>
) {
  const full = { project_id: projectId, user_id: userId, ...fields };
  let response = await supabase.from(table).insert(full).select().single();
  if (response.error && isMissingColumnError(response.error, 'user_id')) {
    const { user_id: _omit, ...withoutUser } = full;
    response = await supabase.from(table).insert(withoutUser).select().single();
  }
  return response;
}

/** Update research row; retries without updated_at when column is absent. */
async function researchUpdate(
  table: string,
  filterColumn: string,
  filterValue: string,
  fields: Record<string, unknown>
) {
  const withTs = { ...fields, updated_at: new Date().toISOString() };
  let response = await supabase
    .from(table)
    .update(withTs)
    .eq(filterColumn, filterValue)
    .select()
    .single();
  if (response.error && isMissingColumnError(response.error, 'updated_at')) {
    const { updated_at: _omit, ...withoutTs } = withTs;
    response = await supabase
      .from(table)
      .update(withoutTs)
      .eq(filterColumn, filterValue)
      .select()
      .single();
  }
  return response;
}

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

  const { data, error } = await researchInsert('research_profiles', projectId, userId, {});
  if (error) {
    console.warn('[research] profile insert:', (error as SchemaError).message);
    return null;
  }
  return data as ResearchProfile;
}

export async function upsertResearchProfile(
  projectId: string,
  userId: string,
  fields: Partial<Omit<ResearchProfile, 'id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ResearchProfile | null> {
  await fetchResearchProfile(projectId, userId);
  const { data, error } = await researchUpdate('research_profiles', 'project_id', projectId, fields);
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
  const { data, error } = await researchInsert('research_notes', projectId, userId, {
    title: payload.title,
    content: payload.content ?? '',
    category: payload.category ?? 'general',
    tags: payload.tags ?? [],
  });
  if (error) throw error;
  return data as ResearchNote;
}

export async function updateResearchNote(
  id: string,
  payload: Partial<Pick<ResearchNote, 'title' | 'content' | 'category' | 'tags'>>
): Promise<ResearchNote> {
  const { data, error } = await researchUpdate('research_notes', 'id', id, payload);
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
  const { data, error } = await researchInsert('literature_items', projectId, userId, {
    title: payload.title,
    item_type: payload.item_type ?? 'paper',
    source: payload.source ?? null,
    authors: payload.authors ?? null,
    publication_date: payload.publication_date ?? null,
    citation_count: payload.citation_count ?? null,
    relevance_score: payload.relevance_score ?? null,
    url: payload.url ?? null,
    notes: payload.notes ?? null,
  });
  if (error) throw error;
  return data as LiteratureItem;
}

export async function updateLiteratureItem(id: string, payload: Partial<LiteratureItem>): Promise<LiteratureItem> {
  const { data, error } = await researchUpdate('literature_items', 'id', id, payload as Record<string, unknown>);
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
  const { data, error } = await researchInsert('research_findings', projectId, userId, {
    title: payload.title,
    content: payload.content ?? '',
    finding_type: payload.finding_type ?? 'finding',
  });
  if (error) throw error;
  return data as ResearchFinding;
}

export async function updateResearchFinding(
  id: string,
  payload: Partial<Pick<ResearchFinding, 'title' | 'content' | 'finding_type'>>
): Promise<ResearchFinding> {
  const { data, error } = await researchUpdate('research_findings', 'id', id, payload);
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
  return uploadProjectDocumentFile(projectId, userId, file, meta);
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
    projects: projectList.map((p, i) => {
      const snapshot = snapshots[i];
      return {
        id: p.id,
        name: p.name,
        sector: p.sector,
        completionRate: snapshot?.completionRate ?? 0,
        notesCount: snapshot?.notes.length ?? 0,
        findingsCount: snapshot?.findings.length ?? 0,
        literatureCount: snapshot?.literature.length ?? 0,
        documentsCount: snapshot?.documents.length ?? 0,
      };
    }),
  };
}

export async function fetchResearchActivity(userId: string, days = 14): Promise<{ date: string; count: number }[]> {
  const cacheKey = `researchActivity:${userId}:${days}`;
  const cached = getCached<{ date: string; count: number }[]>(cacheKey);
  if (cached) return cached;

  return dedupeAsync(cacheKey, async () => {
    const result = await fetchResearchActivityUncached(userId, days);
    setCached(cacheKey, result, 30_000);
    return result;
  });
}

async function fetchResearchActivityUncached(userId: string, days = 14): Promise<{ date: string; count: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: ownedProjects } = await supabase.from('projects').select('id').eq('user_id', userId);
  const projectIds = (ownedProjects ?? []).map((p) => p.id as string);

  const emptyBuckets = () => {
    const buckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
  };

  if (projectIds.length === 0) return emptyBuckets();

  const activityFilter = (table: string) =>
    supabase
      .from(table)
      .select('created_at')
      .in('project_id', projectIds)
      .gte('created_at', since.toISOString());

  const [notes, literature, findings, documents] = await Promise.all([
    safe(() => activityFilter('research_notes'), [] as { created_at: string }[]),
    safe(() => activityFilter('literature_items'), [] as { created_at: string }[]),
    safe(() => activityFilter('research_findings'), [] as { created_at: string }[]),
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
  const { data, error } = await researchInsert('research_gate_reviews', projectId, userId, payload);
  if (error) throw error;
  return data as GateReviewRow;
}
