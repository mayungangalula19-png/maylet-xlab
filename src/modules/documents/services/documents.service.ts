import { supabase } from '../../../lib/supabase/client';
import { documentInsert, formatUploadError } from '../../../lib/supabase/document.queries';

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
  const { data, error } = await documentInsert(payload);
  if (error) throw new Error(formatUploadError(error));
  return data;
}
