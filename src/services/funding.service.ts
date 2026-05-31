import { supabase } from '../lib/supabase/client';

export async function listPitches(userId: string) {
  const { data, error } = await supabase
    .from('funding_pitches')
    .select('*, projects(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPitch(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('funding_pitches').insert(payload).select().single();
  if (error) throw error;
  return data;
}
