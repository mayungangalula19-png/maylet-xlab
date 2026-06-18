import { supabase } from '../../../lib/supabase/client';
import { displayName } from '../utils/adminPage.utils';
import { assertAdminPermission } from './adminAuth.service';
import { logAdminAudit } from './adminAudit.service';
import type {
  AdminCareerApplicationSummary,
  AdminCareerFilters,
  AdminCareerFormValues,
  AdminCareerListParams,
  AdminCareerRow,
  AdminCareerStats,
  AdminServiceResult,
  CareerOpportunityStatus,
} from '../types/careersAdmin.types';

const CAREER_SELECT =
  'id, title, slug, description, type, department, location, is_remote, status, requirements, benefits, application_deadline, published_at, created_by, updated_by, created_at, updated_at';

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || `career-${Date.now()}`;
}

function mapCareerRow(
  row: Record<string, unknown>,
  creator?: { full_name: string | null; email: string | null } | null,
  applicationCount = 0
): AdminCareerRow {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    description: String(row.description ?? ''),
    type: row.type as AdminCareerRow['type'],
    department: String(row.department ?? ''),
    location: String(row.location ?? ''),
    is_remote: Boolean(row.is_remote),
    status: row.status as AdminCareerRow['status'],
    requirements: String(row.requirements ?? ''),
    benefits: String(row.benefits ?? ''),
    application_deadline: (row.application_deadline as string | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    created_by_name: displayName(creator?.full_name, creator?.email, 'System'),
    updated_by: (row.updated_by as string | null) ?? null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    application_count: applicationCount,
  };
}

function applyCareerFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters?: AdminCareerFilters
) {
  let q = query;
  if (filters?.status && filters.status !== 'all') {
    q = q.eq('status', filters.status);
  }
  if (filters?.type && filters.type !== 'all') {
    q = q.eq('type', filters.type);
  }
  if (filters?.department && filters.department !== 'All') {
    q = q.eq('department', filters.department);
  }
  if (filters?.location?.trim()) {
    q = q.ilike('location', `%${filters.location.trim()}%`);
  }
  if (filters?.remote === 'remote') {
    q = q.eq('is_remote', true);
  } else if (filters?.remote === 'onsite') {
    q = q.eq('is_remote', false);
  }
  if (filters?.dateFrom) {
    q = q.gte('created_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    q = q.lte('created_at', `${filters.dateTo}T23:59:59.999Z`);
  }
  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    q = q.or(`title.ilike.${term},description.ilike.${term},department.ilike.${term},location.ilike.${term}`);
  }
  return q;
}

async function attachApplicationCounts(rows: AdminCareerRow[]): Promise<AdminCareerRow[]> {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const { data, error } = await supabase
    .from('career_applications')
    .select('career_id')
    .in('career_id', ids);

  if (error) return rows;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.career_id as string | null;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return rows.map((r) => ({ ...r, application_count: counts.get(r.id) ?? 0 }));
}

async function enrichCreators(rows: Record<string, unknown>[]): Promise<AdminCareerRow[]> {
  const creatorIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))] as string[];
  const { data: creators } = creatorIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', creatorIds)
    : { data: [] };
  const creatorMap = new Map((creators ?? []).map((c) => [c.id, c]));

  const mapped = rows.map((row) =>
    mapCareerRow(row, creatorMap.get(row.created_by as string) ?? null, 0)
  );
  return attachApplicationCounts(mapped);
}

function serviceError(code: string, message: string): AdminServiceResult<never> {
  return { data: null, error: { code, message } };
}

export async function fetchAdminCareersPage(
  params: AdminCareerListParams
): Promise<AdminServiceResult<AdminCareerRow[]>> {
  try {
    await assertAdminPermission('manage_users');
    const { page, pageSize, filters } = params;
    const from = page * pageSize;

    let query = supabase.from('career_opportunities').select(CAREER_SELECT, { count: 'exact' });
    query = applyCareerFilters(query, filters);

    const { data, count, error } = await query
      .order('updated_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    const rows = await enrichCreators((data ?? []) as Record<string, unknown>[]);
    return {
      data: rows,
      error: null,
      meta: { total: count ?? 0, page, pageSize },
    };
  } catch (err) {
    return serviceError(
      'FETCH_CAREERS_FAILED',
      err instanceof Error ? err.message : 'Failed to load careers'
    );
  }
}

export async function fetchAdminCareerStats(): Promise<AdminServiceResult<AdminCareerStats>> {
  try {
    await assertAdminPermission('manage_users');

    const [careersResult, appsResult] = await Promise.all([
      supabase.from('career_opportunities').select('status'),
      supabase.from('career_applications').select('id', { count: 'exact', head: true }),
    ]);

    if (careersResult.error) throw careersResult.error;

    const stats: AdminCareerStats = {
      total: 0,
      published: 0,
      draft: 0,
      archived: 0,
      applicationsReceived: appsResult.count ?? 0,
    };

    for (const row of careersResult.data ?? []) {
      stats.total += 1;
      if (row.status === 'published') stats.published += 1;
      if (row.status === 'draft') stats.draft += 1;
      if (row.status === 'archived') stats.archived += 1;
    }

    return { data: stats, error: null };
  } catch (err) {
    return serviceError(
      'FETCH_CAREER_STATS_FAILED',
      err instanceof Error ? err.message : 'Failed to load career stats'
    );
  }
}

export async function fetchAdminCareerById(id: string): Promise<AdminServiceResult<AdminCareerRow>> {
  try {
    await assertAdminPermission('manage_users');
    const { data, error } = await supabase
      .from('career_opportunities')
      .select(CAREER_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return serviceError('NOT_FOUND', 'Career not found');

    const [row] = await enrichCreators([data as Record<string, unknown>]);
    return { data: row, error: null };
  } catch (err) {
    return serviceError(
      'FETCH_CAREER_FAILED',
      err instanceof Error ? err.message : 'Failed to load career'
    );
  }
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base);
  let attempt = 0;

  while (attempt < 20) {
    let query = supabase.from('career_opportunities').select('id').eq('slug', slug);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    attempt += 1;
    slug = `${slugify(base)}-${attempt}`;
  }

  return `${slugify(base)}-${crypto.randomUUID().slice(0, 8)}`;
}

function formToPayload(values: AdminCareerFormValues, userId: string, slug: string) {
  const now = new Date().toISOString();
  const deadline = values.application_deadline.trim()
    ? new Date(values.application_deadline).toISOString()
    : null;

  return {
    title: values.title.trim(),
    slug,
    description: values.description.trim(),
    type: values.type,
    department: values.department,
    location: values.location.trim() || 'Remote',
    is_remote: values.is_remote,
    status: values.status,
    requirements: values.requirements.trim(),
    benefits: values.benefits.trim(),
    application_deadline: deadline,
    published_at: values.status === 'published' ? now : null,
    updated_by: userId,
    updated_at: now,
  };
}

export async function createAdminCareer(
  values: AdminCareerFormValues
): Promise<AdminServiceResult<AdminCareerRow>> {
  try {
    const session = await assertAdminPermission('manage_users');
    const slug = await uniqueSlug(values.title);
    const now = new Date().toISOString();
    const payload = {
      ...formToPayload(values, session.userId, slug),
      created_by: session.userId,
      created_at: now,
      published_at: values.status === 'published' ? now : null,
    };

    const { data, error } = await supabase
      .from('career_opportunities')
      .insert(payload)
      .select(CAREER_SELECT)
      .single();

    if (error) throw error;

    const [row] = await enrichCreators([data as Record<string, unknown>]);
    await logAdminAudit({
      resourceType: 'career_opportunity',
      resourceId: row.id,
      resourceName: row.title,
      action: 'create',
      after: { status: row.status, type: row.type },
    });

    return { data: row, error: null };
  } catch (err) {
    return serviceError(
      'CREATE_CAREER_FAILED',
      err instanceof Error ? err.message : 'Failed to create career'
    );
  }
}

export async function updateAdminCareer(
  id: string,
  values: AdminCareerFormValues
): Promise<AdminServiceResult<AdminCareerRow>> {
  try {
    const session = await assertAdminPermission('manage_users');
    const existing = await fetchAdminCareerById(id);
    if (existing.error || !existing.data) {
      return serviceError('NOT_FOUND', existing.error?.message ?? 'Career not found');
    }

    const slug =
      slugify(values.title) === slugify(existing.data.title)
        ? existing.data.slug
        : await uniqueSlug(values.title, id);

    const payload = formToPayload(values, session.userId, slug);
    if (values.status === 'published' && !existing.data.published_at) {
      payload.published_at = new Date().toISOString();
    } else if (values.status !== 'published') {
      payload.published_at = null;
    }

    const { data, error } = await supabase
      .from('career_opportunities')
      .update(payload)
      .eq('id', id)
      .select(CAREER_SELECT)
      .single();

    if (error) throw error;

    const [row] = await enrichCreators([data as Record<string, unknown>]);
    await logAdminAudit({
      resourceType: 'career_opportunity',
      resourceId: id,
      resourceName: row.title,
      action: 'update',
      before: { status: existing.data.status },
      after: { status: row.status },
    });

    return { data: row, error: null };
  } catch (err) {
    return serviceError(
      'UPDATE_CAREER_FAILED',
      err instanceof Error ? err.message : 'Failed to update career'
    );
  }
}

export async function setAdminCareerStatus(
  id: string,
  status: CareerOpportunityStatus
): Promise<AdminServiceResult<AdminCareerRow>> {
  const existing = await fetchAdminCareerById(id);
  if (existing.error || !existing.data) {
    return serviceError('NOT_FOUND', existing.error?.message ?? 'Career not found');
  }

  return updateAdminCareer(id, {
    title: existing.data.title,
    type: existing.data.type,
    department: existing.data.department,
    location: existing.data.location,
    is_remote: existing.data.is_remote,
    description: existing.data.description,
    requirements: existing.data.requirements,
    benefits: existing.data.benefits,
    application_deadline: existing.data.application_deadline?.slice(0, 10) ?? '',
    status,
  });
}

export async function deleteAdminCareer(id: string): Promise<AdminServiceResult<{ id: string }>> {
  try {
    await assertAdminPermission('delete_records');
    const existing = await fetchAdminCareerById(id);
    if (existing.error || !existing.data) {
      return serviceError('NOT_FOUND', existing.error?.message ?? 'Career not found');
    }

    const { error } = await supabase.from('career_opportunities').delete().eq('id', id);
    if (error) throw error;

    await logAdminAudit({
      resourceType: 'career_opportunity',
      resourceId: id,
      resourceName: existing.data.title,
      action: 'delete',
    });

    return { data: { id }, error: null };
  } catch (err) {
    return serviceError(
      'DELETE_CAREER_FAILED',
      err instanceof Error ? err.message : 'Failed to delete career'
    );
  }
}

export async function bulkSetAdminCareerStatus(
  ids: string[],
  status: CareerOpportunityStatus
): Promise<AdminServiceResult<{ updated: number }>> {
  try {
    await assertAdminPermission('manage_users');
    if (ids.length === 0) return { data: { updated: 0 }, error: null };

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status, updated_at: now };
    if (status === 'published') patch.published_at = now;

    const { data, error } = await supabase
      .from('career_opportunities')
      .update(patch)
      .in('id', ids)
      .select('id');

    if (error) throw error;

    await logAdminAudit({
      resourceType: 'career_opportunity',
      action: 'update',
      metadata: { bulk: true, status, ids, count: data?.length ?? 0 },
    });

    return { data: { updated: data?.length ?? 0 }, error: null };
  } catch (err) {
    return serviceError(
      'BULK_UPDATE_CAREERS_FAILED',
      err instanceof Error ? err.message : 'Bulk update failed'
    );
  }
}

export async function bulkDeleteAdminCareers(
  ids: string[]
): Promise<AdminServiceResult<{ deleted: number }>> {
  try {
    await assertAdminPermission('delete_records');
    if (ids.length === 0) return { data: { deleted: 0 }, error: null };

    const { data, error } = await supabase
      .from('career_opportunities')
      .delete()
      .in('id', ids)
      .select('id');

    if (error) throw error;

    await logAdminAudit({
      resourceType: 'career_opportunity',
      action: 'delete',
      metadata: { bulk: true, ids, count: data?.length ?? 0 },
    });

    return { data: { deleted: data?.length ?? 0 }, error: null };
  } catch (err) {
    return serviceError(
      'BULK_DELETE_CAREERS_FAILED',
      err instanceof Error ? err.message : 'Bulk delete failed'
    );
  }
}

export async function fetchAdminCareerApplications(
  careerId: string,
  careerTitle: string
): Promise<AdminServiceResult<AdminCareerApplicationSummary[]>> {
  try {
    await assertAdminPermission('manage_users');

    const { data: linked, error: linkedError } = await supabase
      .from('career_applications')
      .select('id, full_name, email, role_interest, status, created_at')
      .eq('career_id', careerId)
      .order('created_at', { ascending: false });

    if (linkedError) throw linkedError;

    if ((linked ?? []).length > 0) {
      return { data: linked as AdminCareerApplicationSummary[], error: null };
    }

    const { data: legacy, error: legacyError } = await supabase
      .from('career_applications')
      .select('id, full_name, email, role_interest, status, created_at')
      .ilike('role_interest', careerTitle)
      .order('created_at', { ascending: false })
      .limit(50);

    if (legacyError) throw legacyError;
    return { data: (legacy ?? []) as AdminCareerApplicationSummary[], error: null };
  } catch (err) {
    return serviceError(
      'FETCH_CAREER_APPLICATIONS_FAILED',
      err instanceof Error ? err.message : 'Failed to load applications'
    );
  }
}

export async function exportAdminCareersCsv(
  filters?: AdminCareerFilters
): Promise<AdminServiceResult<string>> {
  try {
    await assertAdminPermission('manage_users');

    let query = supabase.from('career_opportunities').select(CAREER_SELECT);
    query = applyCareerFilters(query, filters);

    const { data, error } = await query.order('created_at', { ascending: false }).limit(5000);
    if (error) throw error;

    const rows = await enrichCreators((data ?? []) as Record<string, unknown>[]);
    const header = [
      'Title',
      'Type',
      'Department',
      'Location',
      'Remote',
      'Status',
      'Applications',
      'Created By',
      'Created',
      'Updated',
    ];

    const lines = rows.map((r) =>
      [
        r.title,
        r.type,
        r.department,
        r.location,
        r.is_remote ? 'Yes' : 'No',
        r.status,
        String(r.application_count),
        r.created_by_name,
        r.created_at,
        r.updated_at,
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    );

    const csv = [header.join(','), ...lines].join('\n');
    await logAdminAudit({
      resourceType: 'career_opportunity',
      action: 'export',
      metadata: { count: rows.length },
    });

    return { data: csv, error: null };
  } catch (err) {
    return serviceError(
      'EXPORT_CAREERS_FAILED',
      err instanceof Error ? err.message : 'Export failed'
    );
  }
}

export function downloadCsvFile(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
