import { supabase } from '../lib/supabase/client';
import { dedupeAsync, invalidateCache } from '../modules/shared/utils/queryCache';

type EnsureProfileResult = {
  ok?: boolean;
  id?: string;
  role?: string;
  error?: string;
};

/** Read the signed-in user's role from the database. */
export async function fetchMyRole(): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_my_role');
  if (error) {
    console.warn('[auth.service] get_my_role:', error.message);
    return null;
  }
  return typeof data === 'string' && data.length > 0 ? data : null;
}

export function isAppAdminRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin';
}

/** Resolve role via RPC, profile row, then ensure_profile fallback. */
export async function resolveUserRole(
  userId: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const rpcRole = await fetchMyRole();
  if (rpcRole) return rpcRole;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[auth.service] profiles.role:', error.message);
  }

  if (data?.role) return String(data.role);

  const ensured = await ensureProfileRole(userId, metadata);
  return ensured ?? 'innovator';
}

export async function ensureProfileRole(
  userId: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return dedupeAsync(`ensure-profile:${userId}`, async () => {
    const fullName = typeof metadata?.full_name === 'string' ? metadata.full_name.trim() : null;

    const { data, error } = await supabase.rpc('ensure_profile', {
      p_full_name: fullName,
    });

    if (error) {
      console.warn(
        '[auth.service] ensure_profile rpc:',
        error.message,
        error.details ?? '',
        error.hint ?? ''
      );
      return null;
    }

    const result = data as EnsureProfileResult | null;
    if (!result?.ok) {
      console.warn('[auth.service] ensure_profile:', result?.error ?? 'unknown error');
      return null;
    }

    return result.role ?? 'innovator';
  });
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Profile not found');
  return data;
}

/** @deprecated use ensureProfileRole */
export async function syncProfileOnLogin(
  userId: string,
  _email: string,
  metadata?: Record<string, unknown>
) {
  await ensureProfileRole(userId, metadata);
}

export async function signOut(redirectTo = '/') {
  invalidateCache('profile-role:');
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  if (typeof window !== 'undefined') {
    window.location.assign(redirectTo);
  }
}
