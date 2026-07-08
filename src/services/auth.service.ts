import { supabase } from '../lib/supabase/client';
import { dedupeAsync, invalidateCache } from '../modules/shared/utils/queryCache';

type EnsureProfileResult = {
  ok?: boolean;
  id?: string;
  role?: string;
  error?: string;
};

// ── Hardcoded admin emails ──────────────────────────────────────
// These are checked against the server-verified email from
// supabase.auth.getUser() — NOT from user_metadata or JWT claims,
// so they cannot be spoofed by the client.
const ADMIN_EMAILS: ReadonlySet<string> = new Set([
  'admintest@gmail.com',
  'mayungangalula19@gmail.com',
]);

/**
 * Check if the currently authenticated user is an admin by their
 * server-verified email. Returns 'admin' if matched, null otherwise.
 */
async function getVerifiedAdminRole(): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) return null;

    if (ADMIN_EMAILS.has(user.email.toLowerCase())) {
      console.log('[getVerifiedAdminRole] ✅ Admin email matched:', user.email);
      return 'admin';
    }
    return null;
  } catch {
    return null;
  }
}

/** Read the signed-in user's role from the database. */
export async function fetchMyRole(): Promise<string | null> {
  try {
    // Check hardcoded admin list first (bypasses broken DB enum/RLS)
    const adminRole = await getVerifiedAdminRole();
    if (adminRole) return adminRole;

    console.log('[fetchMyRole] Getting current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.warn('[fetchMyRole] Not authenticated');
      return null;
    }

    console.log('[fetchMyRole] Querying profiles for user:', user.id);
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('[fetchMyRole] Query error:', error);
      return null;
    }

    console.log('[fetchMyRole] Query returned:', data);
    return data?.role ? String(data.role) : null;
  } catch (err) {
    console.warn('[fetchMyRole] Exception:', err);
    return null;
  }
}

export function isAppAdminRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin';
}

/** Resolve role via hardcoded admin list, then RPC/profile fallbacks. */
export async function resolveUserRole(
  userId: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  console.log('[resolveUserRole] === START ===');
  console.log('[resolveUserRole] userId:', userId);

  // 0️⃣ Check hardcoded admin emails first (server-verified, bypasses broken DB)
  const adminRole = await getVerifiedAdminRole();
  if (adminRole) {
    console.log('[resolveUserRole] ✅ Hardcoded admin match, returning:', adminRole);
    return adminRole;
  }

  // 1️⃣ Attempt profile query
  console.log('[resolveUserRole] Step 1: Trying profile query...');
  const rpcRole = await fetchMyRole();
  console.log('[resolveUserRole] Profile result:', rpcRole);
  if (rpcRole) {
    console.log('[resolveUserRole] ✅ Returning profile role:', rpcRole);
    return rpcRole;
  }

  // 2️⃣ Direct query to profiles
  console.log('[resolveUserRole] Step 2: Direct query to profiles table...');
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[resolveUserRole] Direct query error:', error);
  } else {
    console.log('[resolveUserRole] Direct query result:', data);
  }

  if (data?.role) {
    console.log('[resolveUserRole] ✅ Returning direct query role:', data.role);
    return String(data.role);
  }

  // 3️⃣ Fallback to ensure_profile
  console.log('[resolveUserRole] Step 3: Direct query returned null, calling ensure_profile RPC...');
  const ensured = await ensureProfileRole(userId, metadata);
  console.log('[resolveUserRole] ensure_profile returned:', ensured);
  if (ensured) {
    console.log('[resolveUserRole] ✅ Returning ensured role:', ensured);
    return ensured;
  }

  // 4️⃣ Default
  console.log('[resolveUserRole] ⚠️ No role found anywhere, defaulting to "innovator"');
  return 'innovator';
}

export async function ensureProfileRole(
  userId: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return dedupeAsync(`ensure-profile:${userId}`, async () => {
    const fullName = typeof metadata?.full_name === 'string' ? metadata.full_name.trim() : null;
    console.log('[ensureProfileRole] Calling RPC with userId:', userId, 'fullName:', fullName);

    const { data, error } = await supabase.rpc('ensure_profile', {
      p_full_name: fullName,
    });

    if (error) {
      console.warn('[ensureProfileRole] RPC error:', error);
      return null;
    }

    console.log('[ensureProfileRole] RPC response:', data);
    const result = data as EnsureProfileResult | null;
    if (!result?.ok) {
      console.warn('[ensureProfileRole] RPC returned not ok:', result?.error ?? 'unknown');
      return null;
    }

    console.log('[ensureProfileRole] ✅ Profile ensured with role:', result.role);
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