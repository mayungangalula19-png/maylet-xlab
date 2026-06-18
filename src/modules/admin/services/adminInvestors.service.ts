import { supabase } from '../../../lib/supabase/client';
import { displayName } from '../utils/adminPage.utils';
import { assertAdminPermission } from './adminAuth.service';
import { logAdminAudit } from './adminAudit.service';
import {
  fetchAdminUsersPage,
  updateAdminUserStatus,
  type AdminProfileRow,
} from './adminUsers.service';
import type { AdminServiceResult } from '../types/projectAdmin.types';
import type {
  AdminInvestorAccountListParams,
  AdminInvestorAccountRow,
  AdminInvestorDirectoryFilters,
  AdminInvestorDirectoryFormValues,
  AdminInvestorDirectoryListParams,
  AdminInvestorDirectoryRow,
  AdminInvestorStats,
  InvestorDirectoryType,
} from '../types/investorsAdmin.types';
import type { AdminUserStatus } from '../types/userAdmin.types';

const DIRECTORY_SELECT =
  'id, name, type, focus_industries, investment_range_min, investment_range_max, description, logo_url, website, contact_email, is_active, created_at, updated_at';

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.length > 0) return err.message;
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    for (const key of ['message', 'details', 'hint'] as const) {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
  }
  return 'Request failed';
}

function toServiceError(err: unknown, code: string): AdminServiceResult<never> {
  return {
    data: null,
    error: { code, message: extractErrorMessage(err) },
  };
}

function mapAccountRow(row: AdminProfileRow): AdminInvestorAccountRow {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    plan: row.plan ?? 'free',
    status: row.status ?? 'active',
    organization_name: row.organization_name ?? null,
    two_factor_enabled: row.two_factor_enabled ?? false,
    created_at: row.created_at ?? null,
    last_active: row.last_active ?? null,
  };
}

function mapDirectoryRow(
  row: Record<string, unknown>,
  applicationCount = 0
): AdminInvestorDirectoryRow {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    type: (row.type as InvestorDirectoryType) ?? 'angel',
    focus_industries: Array.isArray(row.focus_industries)
      ? (row.focus_industries as string[])
      : [],
    investment_range_min: Number(row.investment_range_min ?? 0),
    investment_range_max: Number(row.investment_range_max ?? 0),
    description: String(row.description ?? ''),
    logo_url: (row.logo_url as string | null) ?? null,
    website: String(row.website ?? ''),
    contact_email: String(row.contact_email ?? ''),
    is_active: Boolean(row.is_active),
    application_count: applicationCount,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function applyDirectoryFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters?: AdminInvestorDirectoryFilters
) {
  let q = query;
  if (filters?.type && filters.type !== 'all') q = q.eq('type', filters.type);
  if (filters?.active === 'active') q = q.eq('is_active', true);
  if (filters?.active === 'inactive') q = q.eq('is_active', false);
  if (filters?.industry && filters.industry !== 'All') {
    q = q.contains('focus_industries', [filters.industry]);
  }
  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    q = q.or(`name.ilike.${term},description.ilike.${term},contact_email.ilike.${term}`);
  }
  return q;
}

async function attachDirectoryApplicationCounts(
  rows: AdminInvestorDirectoryRow[]
): Promise<AdminInvestorDirectoryRow[]> {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const { data, error } = await supabase
    .from('pitch_investor_applications')
    .select('investor_id')
    .in('investor_id', ids);

  if (error) return rows;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.investor_id as string | null;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return rows.map((r) => ({ ...r, application_count: counts.get(r.id) ?? 0 }));
}

function directoryPayload(values: AdminInvestorDirectoryFormValues) {
  const industries = values.focus_industries
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    name: values.name.trim(),
    type: values.type,
    focus_industries: industries.length > 0 ? industries : ['Technology'],
    investment_range_min: values.investment_range_min,
    investment_range_max: values.investment_range_max,
    description: values.description.trim(),
    logo_url: values.logo_url.trim() || null,
    website: values.website.trim(),
    contact_email: values.contact_email.trim(),
    is_active: values.is_active,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchAdminInvestorStats(): Promise<AdminServiceResult<AdminInvestorStats>> {
  try {
    await assertAdminPermission('manage_users');

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [accountsResult, directoryResult, appCountResult] = await Promise.all([
      supabase.from('profiles').select('status, created_at').eq('role', 'investor'),
      supabase.from('investors').select('is_active'),
      supabase.from('pitch_investor_applications').select('*', { count: 'exact', head: true }),
    ]);

    if (accountsResult.error) throw accountsResult.error;
    if (directoryResult.error) throw directoryResult.error;

    const stats: AdminInvestorStats = {
      accountTotal: 0,
      accountActive: 0,
      accountPending: 0,
      accountSuspended: 0,
      directoryTotal: 0,
      directoryActive: 0,
      pitchApplications: appCountResult.count ?? 0,
      newAccountsThisMonth: 0,
    };

    for (const row of accountsResult.data ?? []) {
      stats.accountTotal += 1;
      const status = (row.status as string | null) ?? 'active';
      if (status === 'active') stats.accountActive += 1;
      if (status === 'pending') stats.accountPending += 1;
      if (status === 'suspended' || status === 'banned') stats.accountSuspended += 1;
      if (row.created_at && new Date(row.created_at) >= monthStart) {
        stats.newAccountsThisMonth += 1;
      }
    }

    for (const row of directoryResult.data ?? []) {
      stats.directoryTotal += 1;
      if (row.is_active) stats.directoryActive += 1;
    }

    return { data: stats, error: null };
  } catch (err) {
    return toServiceError(err, 'FETCH_INVESTOR_STATS_FAILED');
  }
}

export async function fetchAdminInvestorAccountsPage(
  params: AdminInvestorAccountListParams
): Promise<AdminServiceResult<AdminInvestorAccountRow[]>> {
  try {
    await assertAdminPermission('manage_users');

    const result = await fetchAdminUsersPage({
      page: params.page,
      pageSize: params.pageSize,
      filters: {
        role: 'investor',
        status: params.filters?.status,
        plan: params.filters?.plan as 'free' | 'pro' | 'enterprise' | 'all' | undefined,
        search: params.filters?.search,
        dateFrom: params.filters?.dateFrom,
        dateTo: params.filters?.dateTo,
      },
    });

    if (result.error) {
      return { data: null, error: result.error };
    }

    return {
      data: (result.data ?? []).map(mapAccountRow),
      error: null,
      meta: result.meta,
    };
  } catch (err) {
    return toServiceError(err, 'FETCH_INVESTOR_ACCOUNTS_FAILED');
  }
}

export async function verifyAdminInvestorAccount(
  userId: string,
  before?: AdminInvestorAccountRow | null
): Promise<AdminServiceResult<AdminInvestorAccountRow>> {
  const result = await updateAdminUserStatus(userId, 'active', before ? {
    id: before.id,
    email: before.email,
    full_name: before.full_name,
    role: 'investor',
    plan: before.plan,
    status: before.status,
    user_type: null,
    organization_name: before.organization_name,
    bio: null,
    location: null,
    website: null,
    github_handle: null,
    twitter_handle: null,
    linkedin_url: null,
    phone: null,
    avatar_url: null,
    two_factor_enabled: before.two_factor_enabled,
    created_at: before.created_at,
    updated_at: null,
    last_active: before.last_active,
  } : undefined);

  if (result.error) return { data: null, error: result.error };
  return {
    data: mapAccountRow({
      id: result.data!.id,
      full_name: result.data!.full_name,
      email: result.data!.email,
      role: result.data!.role,
      plan: result.data!.plan,
      status: result.data!.status,
      organization_name: result.data!.organization_name,
      two_factor_enabled: result.data!.two_factor_enabled,
      created_at: result.data!.created_at,
      last_active: result.data!.last_active,
    }),
    error: null,
  };
}

export async function suspendAdminInvestorAccount(
  userId: string,
  before?: AdminInvestorAccountRow | null
): Promise<AdminServiceResult<AdminInvestorAccountRow>> {
  const result = await updateAdminUserStatus(userId, 'suspended', before ? {
    id: before.id,
    email: before.email,
    full_name: before.full_name,
    role: 'investor',
    plan: before.plan,
    status: before.status,
    user_type: null,
    organization_name: before.organization_name,
    bio: null,
    location: null,
    website: null,
    github_handle: null,
    twitter_handle: null,
    linkedin_url: null,
    phone: null,
    avatar_url: null,
    two_factor_enabled: before.two_factor_enabled,
    created_at: before.created_at,
    updated_at: null,
    last_active: before.last_active,
  } : undefined);

  if (result.error) return { data: null, error: result.error };
  return {
    data: mapAccountRow({
      id: result.data!.id,
      full_name: result.data!.full_name,
      email: result.data!.email,
      role: result.data!.role,
      plan: result.data!.plan,
      status: result.data!.status,
      organization_name: result.data!.organization_name,
      two_factor_enabled: result.data!.two_factor_enabled,
      created_at: result.data!.created_at,
      last_active: result.data!.last_active,
    }),
    error: null,
  };
}

export async function fetchAdminInvestorDirectoryPage(
  params: AdminInvestorDirectoryListParams
): Promise<AdminServiceResult<AdminInvestorDirectoryRow[]>> {
  try {
    await assertAdminPermission('manage_users');
    const { page, pageSize, filters } = params;
    const from = page * pageSize;

    let query = supabase.from('investors').select(DIRECTORY_SELECT, { count: 'exact' });
    query = applyDirectoryFilters(query, filters);

    const { data, count, error } = await query
      .order('updated_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    const mapped = (data ?? []).map((row) =>
      mapDirectoryRow(row as Record<string, unknown>, 0)
    );
    const rows = await attachDirectoryApplicationCounts(mapped);

    return {
      data: rows,
      error: null,
      meta: { total: count ?? 0, page, pageSize },
    };
  } catch (err) {
    return toServiceError(err, 'FETCH_INVESTOR_DIRECTORY_FAILED');
  }
}

export async function createAdminInvestorDirectoryEntry(
  values: AdminInvestorDirectoryFormValues
): Promise<AdminServiceResult<AdminInvestorDirectoryRow>> {
  try {
    await assertAdminPermission('manage_users');

    const { data, error } = await supabase
      .from('investors')
      .insert(directoryPayload(values))
      .select(DIRECTORY_SELECT)
      .single();

    if (error) throw error;

    const row = mapDirectoryRow(data as Record<string, unknown>);

    await logAdminAudit({
      resourceType: 'investor_directory',
      resourceId: row.id,
      resourceName: row.name,
      action: 'create',
      after: { type: row.type, is_active: row.is_active },
    });

    return { data: row, error: null };
  } catch (err) {
    return toServiceError(err, 'CREATE_INVESTOR_DIRECTORY_FAILED');
  }
}

export async function updateAdminInvestorDirectoryEntry(
  id: string,
  values: AdminInvestorDirectoryFormValues,
  before?: AdminInvestorDirectoryRow | null
): Promise<AdminServiceResult<AdminInvestorDirectoryRow>> {
  try {
    await assertAdminPermission('manage_users');

    const { data, error } = await supabase
      .from('investors')
      .update(directoryPayload(values))
      .eq('id', id)
      .select(DIRECTORY_SELECT)
      .single();

    if (error) throw error;

    const row = mapDirectoryRow(data as Record<string, unknown>);

    await logAdminAudit({
      resourceType: 'investor_directory',
      resourceId: id,
      resourceName: row.name,
      action: 'update',
      before: before ? { name: before.name, is_active: before.is_active } : undefined,
      after: { name: row.name, is_active: row.is_active },
    });

    return { data: row, error: null };
  } catch (err) {
    return toServiceError(err, 'UPDATE_INVESTOR_DIRECTORY_FAILED');
  }
}

export async function toggleAdminInvestorDirectoryActive(
  id: string,
  isActive: boolean,
  before?: AdminInvestorDirectoryRow | null
): Promise<AdminServiceResult<AdminInvestorDirectoryRow>> {
  try {
    await assertAdminPermission('manage_users');

    const { data, error } = await supabase
      .from('investors')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(DIRECTORY_SELECT)
      .single();

    if (error) throw error;

    const row = mapDirectoryRow(data as Record<string, unknown>);

    await logAdminAudit({
      resourceType: 'investor_directory',
      resourceId: id,
      resourceName: row.name,
      action: 'update',
      before: before ? { is_active: before.is_active } : undefined,
      after: { is_active: isActive },
      metadata: { field: 'is_active' },
    });

    return { data: row, error: null };
  } catch (err) {
    return toServiceError(err, 'TOGGLE_INVESTOR_DIRECTORY_FAILED');
  }
}

export async function deleteAdminInvestorDirectoryEntry(
  id: string,
  before?: AdminInvestorDirectoryRow | null
): Promise<AdminServiceResult<{ id: string }>> {
  try {
    await assertAdminPermission('delete_records');

    const { error } = await supabase.from('investors').delete().eq('id', id);
    if (error) throw error;

    await logAdminAudit({
      resourceType: 'investor_directory',
      resourceId: id,
      resourceName: before?.name ?? id,
      action: 'delete',
      before: before ? { name: before.name, type: before.type } : undefined,
    });

    return { data: { id }, error: null };
  } catch (err) {
    return toServiceError(err, 'DELETE_INVESTOR_DIRECTORY_FAILED');
  }
}

export function investorAccountDisplayName(row: AdminInvestorAccountRow) {
  return displayName(row.full_name, row.email);
}

export async function updateAdminInvestorAccountStatus(
  userId: string,
  status: AdminUserStatus,
  before?: AdminInvestorAccountRow | null
) {
  if (status === 'active') return verifyAdminInvestorAccount(userId, before);
  if (status === 'suspended') return suspendAdminInvestorAccount(userId, before);
  const result = await updateAdminUserStatus(userId, status, before ? {
    id: before.id,
    email: before.email,
    full_name: before.full_name,
    role: 'investor',
    plan: before.plan,
    status: before.status,
    user_type: null,
    organization_name: before.organization_name,
    bio: null,
    location: null,
    website: null,
    github_handle: null,
    twitter_handle: null,
    linkedin_url: null,
    phone: null,
    avatar_url: null,
    two_factor_enabled: before.two_factor_enabled,
    created_at: before.created_at,
    updated_at: null,
    last_active: before.last_active,
  } : undefined);
  if (result.error) return { data: null, error: result.error };
  return {
    data: mapAccountRow({
      id: result.data!.id,
      full_name: result.data!.full_name,
      email: result.data!.email,
      role: result.data!.role,
      plan: result.data!.plan,
      status: result.data!.status,
      organization_name: result.data!.organization_name,
      two_factor_enabled: result.data!.two_factor_enabled,
      created_at: result.data!.created_at,
      last_active: result.data!.last_active,
    }),
    error: null,
  };
}
