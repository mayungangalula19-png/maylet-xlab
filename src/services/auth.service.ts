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
  console.log('[fetchMyRole] Calling RPC get_my_role...');
  const { data, error } = await supabase.rpc('get_my_role');
  if (error) {
    console.warn('[fetchMyRole] RPC error:', error.message);
    return null;
  }
  console.log('[fetchMyRole] RPC returned:', data);
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
  console.log('[resolveUserRole] === START ===');
  console.log('[resolveUserRole] userId:', userId);
  console.log('[resolveUserRole] metadata:', metadata);

  // 1️⃣ Attempt RPC
  console.log('[resolveUserRole] Step 1: Trying RPC...');
  const rpcRole = await fetchMyRole();
  console.log('[resolveUserRole] RPC result:', rpcRole);
  if (rpcRole) {
    console.log('[resolveUserRole] ✅ Returning RPC role:', rpcRole);
    return rpcRole;
  }

  // 2️⃣ Direct query to profiles
  console.log('[resolveUserRole] Step 2: Direct query to profiles...');
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[resolveUserRole] Direct query error:', error.message);
  } else {
    console.log('[resolveUserRole] Direct query result:', data);
  }

  if (data?.role) {
    console.log('[resolveUserRole] ✅ Returning direct query role:', data.role);
    return String(data.role);
  }

  // 3️⃣ Fallback to ensure_profile
  console.log('[resolveUserRole] Step 3: Falling back to ensure_profile...');
  const ensured = await ensureProfileRole(userId, metadata);
  console.log('[resolveUserRole] ensureProfile result:', ensured);
  if (ensured) {
    console.log('[resolveUserRole] ✅ Returning ensured role:', ensured);
    return ensured;
  }

  // 4️⃣ Default
  console.log('[resolveUserRole] ⚠️ No role found, defaulting to "innovator"');
  return 'innovator';
}

export async function ensureProfileRole(
  userId: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return dedupeAsync(`ensure-profile:${userId}`, async () => {
    const fullName = typeof metadata?.full_name === 'string' ? metadata.full_name.trim() : null;
    console.log('[ensureProfileRole] Creating/updating profile with name:', fullName);

    const { data, error } = await supabase.rpc('ensure_profile', {
      p_full_name: fullName,
    });

    if (error) {
      console.warn(
        '[ensureProfileRole] RPC error:',
        error.message,
        error.details ?? '',
        error.hint ?? ''
      );
      return null;
    }

    const result = data as EnsureProfileResult | null;
    if (!result?.ok) {
      console.warn('[ensureProfileRole] RPC returned not ok:', result?.error ?? 'unknown');
      return null;
    }

    console.log('[ensureProfileRole] ✅ Profile ensured, role:', result.role);
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