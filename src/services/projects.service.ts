import { supabase } from '../lib/supabase/client';

export {
  fetchAccessibleProjects,
  fetchUserProjects,
  listProjects,
  deleteProjectById,
  subscribeToProjectChanges,
} from '../modules/projects/services/projectService';

export async function listProjectsByUser(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProject(id: string) {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createProject(payload: {
  user_id: string;
  name: string;
  description?: string;
  sector?: string;
  status?: string;
}) {
  const { data, error } = await supabase.from('projects').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}
