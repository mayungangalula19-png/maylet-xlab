import { supabase } from '../lib/supabase/client';

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
    .single();
  if (error) throw error;
  return data;
}

export async function syncProfileOnLogin(userId: string, email: string, metadata?: Record<string, unknown>) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    full_name: (metadata?.full_name as string) ?? undefined,
    updated_at: new Date().toISOString(),
  });
  if (error) console.warn('[auth.service] profile upsert:', error.message);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
