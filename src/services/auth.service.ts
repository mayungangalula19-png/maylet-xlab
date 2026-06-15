import { supabase } from '../lib/supabase/client';
import { dedupeAsync } from '../modules/shared/utils/queryCache';

type EnsureProfileResult = {
  ok?: boolean;
  id?: string;
  role?: string;
  error?: string;
};

/** Ensure a profiles row exists; returns role or null on failure. */
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
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  if (typeof window !== 'undefined') {
    window.location.assign(redirectTo);
  }
}
