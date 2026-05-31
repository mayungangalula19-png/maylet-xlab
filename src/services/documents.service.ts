import { supabase } from '../lib/supabase/client';

export async function listDocumentsByProject(projectId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function uploadDocumentMeta(payload: {
  project_id: string;
  user_id: string;
  name: string;
  file_url: string;
  file_type?: string;
  size_bytes?: number;
}) {
  const { data, error } = await supabase.from('documents').insert(payload).select().single();
  if (error) throw error;
  return data;
}
