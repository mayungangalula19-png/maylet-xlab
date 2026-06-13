import { supabase } from '../../../lib/supabase/client';

export async function listExperiments(userId?: string, projectId?: string) {
  let q = supabase.from('experiments').select('*').order('created_at', { ascending: false });
  if (userId) q = q.eq('user_id', userId);
  if (projectId) q = q.eq('project_id', projectId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createExperiment(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('experiments').insert(payload).select().single();
  if (error) throw error;
  return data;
}
