import { supabase } from '../../../lib/supabase/client';
import { fetchProjectNames } from '../../../lib/supabase/dbHelpers';
import { displayName } from '../utils/adminPage.utils';
import { assertAdminPermission } from './adminAuth.service';
import { logAdminAudit } from './adminAudit.service';
import type { AdminServiceResult } from '../types/projectAdmin.types';
import type {
  AdminFundingFilters,
  AdminFundingListParams,
  AdminFundingPitchStage,
  AdminFundingPitchStatus,
  AdminFundingRow,
  AdminFundingStats,
} from '../types/fundingAdmin.types';

const PITCH_SELECT =
  'id, user_id, project_id, title, summary, description, amount, amount_sought, equity_offered, pitch_deck_url, industry, stage, status, created_at, updated_at';

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.length > 0) return err.message;
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    for (const key of ['message', 'details', 'hint'] as const) {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
    if (typeof record.code === 'string' && record.code.length > 0) {
      return `Database error (${record.code})`;
    }
  }
  if (typeof err === 'string' && err.length > 0) return err;
  return 'Request failed';
}

function formatFundingQueryError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('permission denied') || lower.includes('row-level security')) {
    return 'Cannot read funding pitches — run scripts/fix-funding-pitches-admin-rls.sql in Supabase SQL Editor, then refresh.';
  }
  if (lower.includes('admin session required')) {
    return 'Admin session expired. Sign in again with an admin account.';
  }
  return message;
}

function toServiceError(err: unknown, code: string): AdminServiceResult<never> {
  const raw = extractErrorMessage(err);
  return {
    data: null,
    error: { code, message: formatFundingQueryError(raw) },
  };
}

function parseAmount(row: Record<string, unknown>): number {
  const amount = row.amount ?? row.amount_sought;
  const num = Number(amount ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function mapPitchRow(
  row: Record<string, unknown>,
  founder?: { full_name: string | null; email: string | null } | null,
  projectName?: string | null,
  applicationCount = 0
): AdminFundingRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id ?? ''),
    founder_name: displayName(founder?.full_name, founder?.email),
    founder_email: founder?.email ?? 'Unknown',
    project_id: (row.project_id as string | null) ?? null,
    project_name: projectName ?? null,
    title: String(row.title ?? 'Funding pitch'),
    summary: (row.summary as string | null) ?? (row.description as string | null) ?? null,
    amount: parseAmount(row),
    equity_offered: Number(row.equity_offered ?? 0),
    industry: String(row.industry ?? 'Technology'),
    stage: (row.stage as AdminFundingPitchStage) ?? 'idea',
    status: (row.status as AdminFundingPitchStatus) ?? 'draft',
    pitch_deck_url: (row.pitch_deck_url as string | null) ?? null,
    application_count: applicationCount,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function applyFundingFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters?: AdminFundingFilters
) {
  let q = query;
  if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters?.stage && filters.stage !== 'all') q = q.eq('stage', filters.stage);
  if (filters?.industry && filters.industry !== 'All') q = q.eq('industry', filters.industry);
  if (filters?.dateFrom) q = q.gte('created_at', filters.dateFrom);
  if (filters?.dateTo) q = q.lte('created_at', `${filters.dateTo}T23:59:59.999Z`);
  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    q = q.or(`title.ilike.${term},summary.ilike.${term},description.ilike.${term},industry.ilike.${term}`);
  }
  return q;
}

async function attachApplicationCounts(rows: AdminFundingRow[]): Promise<AdminFundingRow[]> {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const { data, error } = await supabase
    .from('pitch_investor_applications')
    .select('pitch_id')
    .in('pitch_id', ids);

  if (error) return rows;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.pitch_id as string | null;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return rows.map((r) => ({ ...r, application_count: counts.get(r.id) ?? 0 }));
}

async function enrichFundingRows(rows: Record<string, unknown>[]): Promise<AdminFundingRow[]> {
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
  const projectIds = [...new Set(rows.map((r) => r.project_id).filter(Boolean))] as string[];

  const [{ data: founders }, projectNames] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, full_name, email').in('id', userIds)
      : Promise.resolve({ data: [] }),
    fetchProjectNames(projectIds),
  ]);

  const founderMap = new Map((founders ?? []).map((f) => [f.id, f]));

  const mapped = rows.map((row) =>
    mapPitchRow(
      row,
      founderMap.get(row.user_id as string) ?? null,
      row.project_id ? projectNames.get(row.project_id as string) ?? null : null,
      0
    )
  );

  return attachApplicationCounts(mapped);
}

export async function fetchAdminFundingStats(): Promise<AdminServiceResult<AdminFundingStats>> {
  try {
    await assertAdminPermission('manage_projects');

    const [{ data: pitches, error: pitchError }, { count: appCount }] = await Promise.all([
        supabase.from('funding_pitches').select('status, amount, amount_sought'),
        supabase
          .from('pitch_investor_applications')
          .select('*', { count: 'exact', head: true }),
      ]);

    if (pitchError) throw pitchError;

    const stats: AdminFundingStats = {
      total: 0,
      draft: 0,
      submitted: 0,
      underReview: 0,
      funded: 0,
      declined: 0,
      totalAmountSought: 0,
      applicationsReceived: appCount ?? 0,
    };

    for (const row of pitches ?? []) {
      stats.total += 1;
      const status = (row.status as AdminFundingPitchStatus) ?? 'draft';
      if (status === 'draft') stats.draft += 1;
      if (status === 'submitted') stats.submitted += 1;
      if (status === 'under_review') stats.underReview += 1;
      if (status === 'funded') stats.funded += 1;
      if (status === 'declined') stats.declined += 1;
      stats.totalAmountSought += parseAmount(row as Record<string, unknown>);
    }

    return { data: stats, error: null };
  } catch (err) {
    return toServiceError(err, 'FETCH_FUNDING_STATS_FAILED');
  }
}

export async function fetchAdminFundingPage(
  params: AdminFundingListParams
): Promise<AdminServiceResult<AdminFundingRow[]>> {
  try {
    await assertAdminPermission('manage_projects');
    const { page, pageSize, filters } = params;
    const from = page * pageSize;

    let query = supabase.from('funding_pitches').select(PITCH_SELECT, { count: 'exact' });
    query = applyFundingFilters(query, filters);

    const { data, count, error } = await query
      .order('updated_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    const rows = await enrichFundingRows((data ?? []) as Record<string, unknown>[]);
    return {
      data: rows,
      error: null,
      meta: { total: count ?? 0, page, pageSize },
    };
  } catch (err) {
    return toServiceError(err, 'FETCH_FUNDING_FAILED');
  }
}

export async function updateAdminFundingStatus(
  pitchId: string,
  status: AdminFundingPitchStatus,
  before?: AdminFundingRow | null
): Promise<AdminServiceResult<AdminFundingRow>> {
  try {
    await assertAdminPermission('manage_projects');

    const { data, error } = await supabase
      .from('funding_pitches')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', pitchId)
      .select(PITCH_SELECT)
      .single();

    if (error) throw error;

    const [row] = await enrichFundingRows([data as Record<string, unknown>]);

    await logAdminAudit({
      resourceType: 'funding_pitch',
      resourceId: pitchId,
      resourceName: row.title,
      action: 'update',
      before: before ? { status: before.status } : undefined,
      after: { status },
      metadata: { field: 'status' },
    });

    return { data: row, error: null };
  } catch (err) {
    return toServiceError(err, 'UPDATE_FUNDING_STATUS_FAILED');
  }
}

export async function deleteAdminFundingPitch(
  pitchId: string,
  before?: AdminFundingRow | null
): Promise<AdminServiceResult<{ id: string }>> {
  try {
    await assertAdminPermission('delete_records');

    const { error } = await supabase.from('funding_pitches').delete().eq('id', pitchId);
    if (error) throw error;

    await logAdminAudit({
      resourceType: 'funding_pitch',
      resourceId: pitchId,
      resourceName: before?.title ?? pitchId,
      action: 'delete',
      before: before ? { title: before.title, status: before.status } : undefined,
    });

    return { data: { id: pitchId }, error: null };
  } catch (err) {
    return toServiceError(err, 'DELETE_FUNDING_FAILED');
  }
}
