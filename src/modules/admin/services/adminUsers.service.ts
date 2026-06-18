import { supabase } from '../../../lib/supabase/client';
import { enrichActivitiesForAdmin } from '../../../lib/supabase/dbHelpers';
import { displayName } from '../utils/adminPage.utils';
import { assertAdminPermission } from './adminAuth.service';
import { logAdminAudit } from './adminAudit.service';
import type { AdminServiceResult } from '../types/projectAdmin.types';
import type {
  AdminUserDetailBundle,
  AdminUserFilters,
  AdminUserFormValues,
  AdminUserListParams,
  AdminUserProfile,
  AdminUserRole,
  AdminUserStats,
  AdminUserStatus,
  AdminUserUpdateValues,
} from '../types/userAdmin.types';
import { isSuperAdminRole } from '../config/adminRbac.config';

export interface AdminProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  plan?: string | null;
  status?: string | null;
  created_at?: string | null;
  last_active?: string | null;
  user_type?: string | null;
  organization_name?: string | null;
  two_factor_enabled?: boolean | null;
}

const PROFILE_LIST_SELECT_MINIMAL = 'id, full_name, email, role, created_at';

const PROFILE_LIST_SELECT_ULTRA = 'id, full_name, created_at';

const PROFILE_LIST_SELECT_BASE =
  'id, full_name, email, role, plan, created_at, user_type, organization_name';

const PROFILE_LIST_SELECT_WITH_2FA = `${PROFILE_LIST_SELECT_BASE}, two_factor_enabled`;

const PROFILE_LIST_SELECT =
  `${PROFILE_LIST_SELECT_WITH_2FA}, status, last_active`;

interface ProfileQueryOptions {
  includeStatus?: boolean;
  includeTwoFactor?: boolean;
  includePlanFilter?: boolean;
  includeOrgSearch?: boolean;
  includeRoleFilter?: boolean;
}

interface ProfileSelectAttempt {
  select: string;
  options: ProfileQueryOptions;
  orderBy?: 'created_at' | 'id';
}

const PROFILE_SELECT_ATTEMPTS: ReadonlyArray<ProfileSelectAttempt> = [
  { select: PROFILE_LIST_SELECT, options: {} },
  {
    select: `${PROFILE_LIST_SELECT_BASE}, status, last_active`,
    options: { includeTwoFactor: false },
  },
  {
    select: PROFILE_LIST_SELECT_BASE,
    options: { includeStatus: false, includeTwoFactor: false },
  },
  {
    select: PROFILE_LIST_SELECT_MINIMAL,
    options: {
      includeStatus: false,
      includeTwoFactor: false,
      includePlanFilter: false,
      includeOrgSearch: false,
    },
  },
  {
    select: PROFILE_LIST_SELECT_ULTRA,
    options: {
      includeStatus: false,
      includeTwoFactor: false,
      includePlanFilter: false,
      includeOrgSearch: false,
      includeRoleFilter: false,
    },
    orderBy: 'created_at',
  },
  {
    select: '*',
    options: {
      includeStatus: false,
      includeTwoFactor: false,
      includePlanFilter: false,
      includeOrgSearch: false,
    },
    orderBy: 'id',
  },
];

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

function isMissingColumnError(err: unknown): boolean {
  const msg = extractErrorMessage(err).toLowerCase();
  return (
    msg.includes('column') ||
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('could not find') ||
    msg.includes('42703')
  );
}

function shouldRetryProfileQuery(err: unknown): boolean {
  const msg = extractErrorMessage(err).toLowerCase();
  if (
    msg.includes('permission denied') ||
    msg.includes('row-level security') ||
    msg.includes('admin session') ||
    msg.includes('jwt') ||
    msg.includes('not authenticated') ||
    msg.includes('do not have permission')
  ) {
    return false;
  }
  return isMissingColumnError(err) || msg.includes('pgrst') || msg.includes('bad request');
}

function normalizeProfileRow(row: Record<string, unknown>): AdminProfileRow {
  return {
    id: String(row.id),
    full_name: (row.full_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    role: (row.role as string | null) ?? 'user',
    plan: (row.plan as string | null) ?? 'free',
    status: (row.status as string | null) ?? 'active',
    created_at: (row.created_at as string | null) ?? null,
    last_active: (row.last_active as string | null) ?? null,
    user_type: (row.user_type as string | null) ?? null,
    organization_name: (row.organization_name as string | null) ?? null,
    two_factor_enabled: Boolean(row.two_factor_enabled),
  };
}

function formatProfilesQueryError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes('status') ||
    lower.includes('last_active') ||
    lower.includes('two_factor_enabled') ||
    lower.includes('organization_name') ||
    lower.includes('user_type') ||
    lower.includes('plan')
  ) {
    return 'Database missing profile columns. Run scripts/fix-profiles-admin-columns.sql in Supabase SQL Editor, then hard refresh.';
  }
  if (lower.includes('permission denied') || lower.includes('row-level security')) {
    return 'Cannot access profiles — ensure fix-profiles-admin-columns.sql ran and admin UPDATE policy exists (profiles_admin_update). Sign in as admin/super_admin.';
  }
  if (lower.includes('admin session required')) {
    return 'Admin session expired. Sign in again with an admin account.';
  }
  if (lower.includes('do not have permission')) {
    return message;
  }
  return message;
}

function toServiceError(err: unknown, code: string): AdminServiceResult<never> {
  const raw = extractErrorMessage(err);
  return {
    data: null,
    error: {
      code,
      message: formatProfilesQueryError(raw),
    },
  };
}

function mapProfile(row: Record<string, unknown>): AdminUserProfile {
  return {
    id: String(row.id),
    email: (row.email as string | null) ?? null,
    full_name: (row.full_name as string | null) ?? null,
    role: (row.role as string | null) ?? 'user',
    plan: (row.plan as string | null) ?? 'free',
    status: (row.status as string | null) ?? null,
    user_type: (row.user_type as string | null) ?? null,
    organization_name: (row.organization_name as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    github_handle: (row.github_handle as string | null) ?? null,
    twitter_handle: (row.twitter_handle as string | null) ?? null,
    linkedin_url: (row.linkedin_url as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    two_factor_enabled: Boolean(row.two_factor_enabled),
    created_at: (row.created_at as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
    last_active: (row.last_active as string | null) ?? null,
  };
}

function profilePayload(values: AdminUserUpdateValues) {
  return {
    full_name: values.full_name.trim(),
    role: values.role,
    plan: values.plan,
    user_type: values.user_type.trim() || null,
    organization_name: values.organization_name.trim() || null,
    bio: values.bio.trim() || null,
    location: values.location.trim() || null,
    website: values.website.trim() || null,
    github_handle: values.github_handle.trim() || null,
    twitter_handle: values.twitter_handle.trim() || null,
    linkedin_url: values.linkedin_url.trim() || null,
    phone: values.phone.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchAdminProfilesPage(options: {
  page: number;
  pageSize: number;
  role?: string;
  search?: string;
}) {
  const { page, pageSize, role, search } = options;
  const from = page * pageSize;

  let query = supabase.from('profiles').select(PROFILE_LIST_SELECT, { count: 'exact' });

  if (role) query = query.eq('role', role);

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw error;

  return {
    rows: (data || []) as AdminProfileRow[],
    total: count || 0,
  };
}

export async function fetchAdminUserDetail(
  userId: string
): Promise<AdminServiceResult<AdminUserDetailBundle>> {
  try {
    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const [{ data: projects }, { count: projectCount }, { data: activitiesRaw }] = await Promise.all([
      supabase
        .from('projects')
        .select('id, name, status, progress, sector, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase
        .from('activities')
        .select('id, user_id, project_id, type, title, metadata, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15),
    ]);

    const activities = await enrichActivitiesForAdmin((activitiesRaw ?? []) as Record<string, unknown>[]);

    return {
      data: {
        profile: mapProfile(profileRow as Record<string, unknown>),
        projects: (projects ?? []).map((p) => ({
          id: String(p.id),
          name: String(p.name ?? ''),
          status: (p.status as string | null) ?? null,
          progress: Number(p.progress ?? 0),
          sector: (p.sector as string | null) ?? null,
          created_at: (p.created_at as string | null) ?? null,
        })),
        activities: activities.map((a) => ({
          id: a.id,
          action: a.action,
          target_type: a.target_type,
          target_name: a.target_name,
          created_at: a.created_at,
        })),
        projectCount: projectCount ?? 0,
      },
      error: null,
    };
  } catch (err) {
    return toServiceError(err, 'FETCH_USER_FAILED');
  }
}

export async function createAdminUser(
  values: AdminUserFormValues
): Promise<AdminServiceResult<AdminUserProfile>> {
  try {
    await assertAdminPermission('manage_users');
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
      options: {
        data: {
          full_name: values.full_name.trim(),
          user_type: values.user_type,
          organization_name: values.organization_name,
          phone: values.phone.trim() || undefined,
        },
      },
    });

    if (signUpError) throw signUpError;
    if (!authData.user?.id) throw new Error('User account was not created');

    const userId = authData.user.id;
    const payload = profilePayload(values);

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    const mapped = mapProfile({ ...profile, email: values.email.trim() } as Record<string, unknown>);

    await logAdminAudit({
      resourceType: 'user',
      resourceId: userId,
      resourceName: displayName(mapped.full_name, mapped.email),
      action: 'create',
      after: payload as Record<string, unknown>,
    });

    return { data: mapped, error: null };
  } catch (err) {
    return toServiceError(err, 'CREATE_USER_FAILED');
  }
}

export async function updateAdminUser(
  userId: string,
  values: AdminUserUpdateValues,
  before?: AdminUserProfile | null
): Promise<AdminServiceResult<AdminUserProfile>> {
  try {
    await assertAdminPermission('manage_users');
    const payload = profilePayload(values);

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;

    const mapped = mapProfile(data as Record<string, unknown>);

    await logAdminAudit({
      resourceType: 'user',
      resourceId: userId,
      resourceName: displayName(mapped.full_name, mapped.email),
      action: 'update',
      before: before ? (profilePayload(profileToUpdateValues(before)) as Record<string, unknown>) : undefined,
      after: payload as Record<string, unknown>,
    });

    return { data: mapped, error: null };
  } catch (err) {
    return toServiceError(err, 'UPDATE_USER_FAILED');
  }
}

function profileToUpdateValues(profile: AdminUserProfile): AdminUserUpdateValues {
  return {
    full_name: profile.full_name ?? '',
    role: (profile.role as AdminUserUpdateValues['role']) ?? 'innovator',
    plan: (profile.plan as AdminUserUpdateValues['plan']) ?? 'free',
    user_type: profile.user_type ?? '',
    organization_name: profile.organization_name ?? '',
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    website: profile.website ?? '',
    github_handle: profile.github_handle ?? '',
    twitter_handle: profile.twitter_handle ?? '',
    linkedin_url: profile.linkedin_url ?? '',
    phone: profile.phone ?? '',
  };
}

export function profileDisplayName(row: Pick<AdminProfileRow, 'full_name' | 'email'>) {
  return displayName(row.full_name, row.email);
}

/** @deprecated use fetchAdminProfileById */
export async function fetchAdminProfileById(id: string) {
  const result = await fetchAdminUserDetail(id);
  if (result.error) throw new Error(result.error.message);
  return result.data!.profile;
}

function applyUserFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters?: AdminUserFilters,
  options?: ProfileQueryOptions
) {
  const includeStatus = options?.includeStatus !== false;
  const includeTwoFactor = options?.includeTwoFactor !== false;
  const includePlanFilter = options?.includePlanFilter !== false;
  const includeOrgSearch = options?.includeOrgSearch !== false;
  const includeRoleFilter = options?.includeRoleFilter !== false;
  let q = query;
  if (includeRoleFilter && filters?.role && filters.role !== 'all') q = q.eq('role', filters.role);
  if (includeStatus && filters?.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (includePlanFilter && filters?.plan && filters.plan !== 'all') q = q.eq('plan', filters.plan);
  if (filters?.dateFrom) q = q.gte('created_at', filters.dateFrom);
  if (filters?.dateTo) q = q.lte('created_at', `${filters.dateTo}T23:59:59.999Z`);
  if (includeTwoFactor && filters?.twoFactor === 'enabled') q = q.eq('two_factor_enabled', true);
  if (includeTwoFactor && filters?.twoFactor === 'disabled') q = q.eq('two_factor_enabled', false);
  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    q = includeOrgSearch
      ? q.or(`full_name.ilike.${term},email.ilike.${term},organization_name.ilike.${term}`)
      : q.or(`full_name.ilike.${term},email.ilike.${term}`);
  }
  return q;
}

async function runProfilesListQuery(
  params: AdminUserListParams
): Promise<{ data: AdminProfileRow[]; total: number }> {
  const { page, pageSize, filters } = params;
  const from = page * pageSize;

  const attempt = async (
    select: string,
    options: ProfileQueryOptions,
    orderBy: 'created_at' | 'id' = 'created_at'
  ) => {
    let query = supabase.from('profiles').select(select, { count: 'exact' });
    query = applyUserFilters(query, filters, options);
    query = query.order(orderBy, { ascending: false }).range(from, from + pageSize - 1);
    return query;
  };

  let lastError: unknown = null;
  for (const { select, options, orderBy } of PROFILE_SELECT_ATTEMPTS) {
    const { data, count, error } = await attempt(select, options, orderBy ?? 'created_at');
    if (!error) {
      const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map(normalizeProfileRow);
      return { data: rows, total: count ?? 0 };
    }
    if (!shouldRetryProfileQuery(error)) throw error;
    lastError = error;
  }

  throw lastError ?? new Error('Failed to load profiles');
}

function assertCanAssignRole(actorRole: string | null | undefined, targetRole: string) {
  if ((targetRole === 'super_admin' || targetRole === 'admin') && !isSuperAdminRole(actorRole)) {
    throw new Error('Only super admins can assign admin or super_admin roles');
  }
}

export async function fetchAdminUserStats(): Promise<AdminServiceResult<AdminUserStats>> {
  try {
    await assertAdminPermission('manage_users');

    const statsSelectAttempts = [
      'role, status, two_factor_enabled, created_at',
      'role, status, created_at',
      'role, created_at',
      'id, created_at',
      'id',
    ];

    let data: Record<string, unknown>[] | null = null;
    let lastStatsError: unknown = null;

    for (const select of statsSelectAttempts) {
      const result = await supabase.from('profiles').select(select);
      if (!result.error) {
        data = (result.data ?? []) as unknown as Record<string, unknown>[];
        lastStatsError = null;
        break;
      }
      if (!shouldRetryProfileQuery(result.error)) throw result.error;
      lastStatsError = result.error;
    }

    if (lastStatsError) throw lastStatsError;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const stats: AdminUserStats = {
      total: 0,
      active: 0,
      pending: 0,
      banned: 0,
      admins: 0,
      innovators: 0,
      withTwoFactor: 0,
      newThisMonth: 0,
    };

    for (const row of data ?? []) {
      stats.total += 1;
      const status = (row.status as string | null) ?? 'active';
      if (status === 'active') stats.active += 1;
      if (status === 'pending') stats.pending += 1;
      if (status === 'banned' || status === 'suspended') stats.banned += 1;
      const role = row.role as string | null;
      if (role === 'admin' || role === 'super_admin') stats.admins += 1;
      if (role === 'innovator') stats.innovators += 1;
      if (row.two_factor_enabled) stats.withTwoFactor += 1;
      if (row.created_at && new Date(String(row.created_at)) >= monthStart) stats.newThisMonth += 1;
    }

    return { data: stats, error: null };
  } catch (err) {
    return toServiceError(err, 'FETCH_USER_STATS_FAILED');
  }
}

export async function fetchAdminUsersPage(
  params: AdminUserListParams
): Promise<AdminServiceResult<AdminProfileRow[]>> {
  try {
    await assertAdminPermission('manage_users');
    const { page, pageSize } = params;
    const { data, total } = await runProfilesListQuery(params);

    return {
      data,
      error: null,
      meta: { total, page, pageSize },
    };
  } catch (err) {
    return toServiceError(err, 'FETCH_USERS_FAILED');
  }
}

export async function updateAdminUserRole(
  userId: string,
  role: AdminUserRole,
  before?: AdminUserProfile | null
): Promise<AdminServiceResult<AdminUserProfile>> {
  try {
    const session = await assertAdminPermission('manage_users');
    assertCanAssignRole(session.role, role);

    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    const mapped = mapProfile(data as Record<string, unknown>);

    await logAdminAudit({
      resourceType: 'user',
      resourceId: userId,
      resourceName: displayName(mapped.full_name, mapped.email),
      action: 'update',
      before: before ? { role: before.role } : undefined,
      after: { role },
      metadata: { field: 'role' },
    });

    return { data: mapped, error: null };
  } catch (err) {
    return toServiceError(err, 'UPDATE_USER_ROLE_FAILED');
  }
}

export async function updateAdminUserStatus(
  userId: string,
  status: AdminUserStatus,
  before?: AdminUserProfile | null
): Promise<AdminServiceResult<AdminUserProfile>> {
  try {
    await assertAdminPermission('manage_users');

    const { data, error } = await supabase
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    const mapped = mapProfile(data as Record<string, unknown>);

    await logAdminAudit({
      resourceType: 'user',
      resourceId: userId,
      resourceName: displayName(mapped.full_name, mapped.email),
      action: status === 'banned' || status === 'suspended' ? 'reject' : 'update',
      before: before ? { status: before.status } : undefined,
      after: { status },
      metadata: { field: 'status' },
    });

    return { data: mapped, error: null };
  } catch (err) {
    return toServiceError(err, 'UPDATE_USER_STATUS_FAILED');
  }
}

export async function bulkUpdateAdminUserStatus(
  userIds: string[],
  status: AdminUserStatus
): Promise<AdminServiceResult<{ updated: number }>> {
  try {
    await assertAdminPermission('manage_users');
    if (userIds.length === 0) return { data: { updated: 0 }, error: null };

    const { data, error } = await supabase
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', userIds)
      .select('id');

    if (error) throw error;

    await logAdminAudit({
      resourceType: 'user',
      action: 'update',
      metadata: { bulk: true, field: 'status', status, count: data?.length ?? 0, userIds },
    });

    return { data: { updated: data?.length ?? 0 }, error: null };
  } catch (err) {
    return toServiceError(err, 'BULK_UPDATE_USER_STATUS_FAILED');
  }
}

export async function bulkUpdateAdminUserRole(
  userIds: string[],
  role: AdminUserRole
): Promise<AdminServiceResult<{ updated: number }>> {
  try {
    const session = await assertAdminPermission('manage_users');
    assertCanAssignRole(session.role, role);
    if (userIds.length === 0) return { data: { updated: 0 }, error: null };

    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .in('id', userIds)
      .select('id');

    if (error) throw error;

    await logAdminAudit({
      resourceType: 'user',
      action: 'update',
      metadata: { bulk: true, field: 'role', role, count: data?.length ?? 0, userIds },
    });

    return { data: { updated: data?.length ?? 0 }, error: null };
  } catch (err) {
    return toServiceError(err, 'BULK_UPDATE_USER_ROLE_FAILED');
  }
}

export async function exportAdminUsersCsv(
  filters?: AdminUserFilters
): Promise<AdminServiceResult<string>> {
  try {
    await assertAdminPermission('manage_users');

    let query = supabase.from('profiles').select(PROFILE_LIST_SELECT);
    query = applyUserFilters(query, filters);

    const { data, error } = await query.order('created_at', { ascending: false }).limit(5000);
    if (error) throw error;

    const rows = (data ?? []) as AdminProfileRow[];
    const header = ['Name', 'Email', 'Role', 'Plan', 'Status', '2FA', 'Joined', 'Last Active'];
    const lines = rows.map((r) =>
      [
        profileDisplayName(r),
        r.email ?? '',
        r.role ?? '',
        r.plan ?? '',
        r.status ?? 'active',
        r.two_factor_enabled ? 'Yes' : 'No',
        r.created_at ?? '',
        r.last_active ?? '',
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    );

    const csv = [header.join(','), ...lines].join('\n');
    await logAdminAudit({ resourceType: 'user', action: 'export', metadata: { count: rows.length } });
    return { data: csv, error: null };
  } catch (err) {
    return toServiceError(err, 'EXPORT_USERS_FAILED');
  }
}

export function downloadUsersCsvFile(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function fetchAdminUserAuditTrail(
  userId: string
): Promise<AdminServiceResult<AdminUserDetailBundle['activities']>> {
  try {
    await assertAdminPermission('manage_users');
    const { data, error } = await supabase
      .from('activities')
      .select('id, user_id, project_id, type, title, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    const enriched = await enrichActivitiesForAdmin((data ?? []) as Record<string, unknown>[]);
    return {
      data: enriched.map((a) => ({
        id: a.id,
        action: a.action,
        target_type: a.target_type,
        target_name: a.target_name,
        created_at: a.created_at,
      })),
      error: null,
    };
  } catch (err) {
    return toServiceError(err, 'FETCH_USER_AUDIT_FAILED');
  }
}
