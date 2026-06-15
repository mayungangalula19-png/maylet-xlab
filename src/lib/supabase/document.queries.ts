import { supabase } from '../supabase/client';
import type { ResearchDocument } from '../../types/research.types';

type SchemaError = { message?: string };

const OPTIONAL_DOC_COLUMNS = ['description', 'tags', 'category', 'size_bytes', 'file_type'] as const;

function missingColumnFromError(error: unknown): string | null {
  const msg = String((error as SchemaError)?.message ?? '');
  const patterns = [
    /column ['"]?([\w_]+)['"]?/i,
    /Could not find the ['"]([\w_]+)['"] column/i,
    /'([\w_]+)' column of 'documents'/i,
  ];
  for (const re of patterns) {
    const match = msg.match(re);
    if (match?.[1]) return match[1].toLowerCase();
  }
  return null;
}

export function formatUploadError(error: unknown): string {
  const msg = String((error as SchemaError)?.message ?? error ?? 'Upload failed');
  const lower = msg.toLowerCase();
  if (lower.includes('bucket not found')) {
    return 'Document storage is not configured. Run migration 20240612000022_storage_buckets.sql on Supabase.';
  }
  if (lower.includes('row-level security') || lower.includes('violates') || lower.includes('permission denied')) {
    return 'Upload denied. Ensure you own this project and are signed in.';
  }
  if (lower.includes('payload too large') || lower.includes('file size')) {
    return 'File is too large for the storage bucket limit (50 MB).';
  }
  return msg;
}

/** Insert documents row; strips optional columns when remote schema omits them. */
export async function documentInsert(row: Record<string, unknown>) {
  let payload = { ...row };
  let response = await supabase.from('documents').insert(payload).select().single();

  let guard = 0;
  while (response.error && guard++ < OPTIONAL_DOC_COLUMNS.length + 2) {
    const col = missingColumnFromError(response.error);
    if (!col || !(col in payload)) break;
    const next = { ...payload };
    delete next[col];
    payload = next;
    response = await supabase.from('documents').insert(payload).select().single();
  }

  return response;
}

export async function uploadProjectDocumentFile(
  projectId: string,
  userId: string,
  file: File,
  meta?: { category?: string; tags?: string[]; description?: string }
): Promise<ResearchDocument> {
  const fileName = `${Date.now()}_${file.name}`;
  const path = `${projectId}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('project-documents').upload(path, file);
  if (uploadError) throw new Error(formatUploadError(uploadError));

  const { data: urlData } = supabase.storage.from('project-documents').getPublicUrl(path);

  const { data, error } = await documentInsert({
    project_id: projectId,
    user_id: userId,
    name: file.name,
    file_url: urlData.publicUrl,
    file_type: file.type || null,
    size_bytes: file.size,
    category: meta?.category ?? 'research',
    tags: meta?.tags ?? [],
    description: meta?.description ?? null,
  });
  if (error) throw new Error(formatUploadError(error));
  return data as ResearchDocument;
}
