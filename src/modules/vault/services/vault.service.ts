import { supabase } from '../../../lib/supabase/client';

export interface VaultEntryRecord {
  id: string;
  user_id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

type VaultRow = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  tags?: string[] | null;
  is_confidential?: boolean | null;
  is_public?: boolean | null;
  created_at: string;
  updated_at: string;
};

type SupabaseErrorLike = { message?: string; details?: string; hint?: string; code?: string };

export function formatVaultError(e: unknown): string {
  if (e && typeof e === 'object') {
    const err = e as SupabaseErrorLike;
    const parts = [err.message, err.details, err.hint].filter(Boolean);
    if (parts.length > 0) return parts.join(' — ');
  }
  if (e instanceof Error) return e.message;
  return 'Save failed';
}

function errorText(error: SupabaseErrorLike | null): string {
  if (!error) return '';
  return [error.message, error.details, error.hint, error.code].filter(Boolean).join(' ');
}

function isMissingColumnError(error: SupabaseErrorLike | null): boolean {
  const text = errorText(error);
  return (
    error?.code === 'PGRST204' ||
    /schema cache/i.test(text) ||
    /Could not find the/i.test(text)
  );
}

function mergeBody(description: string, content: string, tags: string[]): string {
  const desc = description.trim();
  const body = content.trim();
  const tagLine = tags.length > 0 ? `Tags: ${tags.join(', ')}` : '';
  return [desc, body, tagLine].filter(Boolean).join('\n\n');
}

function toEntry(row: VaultRow): VaultEntryRecord {
  const isPublic =
    row.is_public === true || (row.is_public !== false && row.is_confidential === false);
  const description = row.description ?? '';
  const content = row.content ?? description;
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description,
    content,
    tags: row.tags ?? [],
    is_public: isPublic,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function buildPayloadVariants(input: {
  title: string;
  description: string;
  content: string;
  tags: string[];
  is_public: boolean;
}): Record<string, unknown>[] {
  const title = input.title.trim();
  const shortDesc = input.description.trim() || null;
  const body = input.content.trim();
  const merged = mergeBody(input.description, input.content, input.tags);
  const tags = input.tags.length > 0 ? input.tags : undefined;

  const variants: Record<string, unknown>[] = [];
  const push = (...rows: Record<string, unknown>[]) => {
    for (const row of rows) {
      const clean = Object.fromEntries(
        Object.entries(row).filter(([, value]) => value !== undefined && value !== null)
      );
      const key = JSON.stringify(clean);
      if (!variants.some((v) => JSON.stringify(v) === key)) variants.push(clean);
    }
  };

  // Enterprise / full schema
  push(
    {
      title,
      description: shortDesc,
      content: body || undefined,
      tags,
      is_confidential: !input.is_public,
    },
    {
      title,
      description: merged || shortDesc,
      content: body || undefined,
      tags,
      is_confidential: !input.is_public,
    }
  );

  // SaveIdea-style (no description / is_confidential)
  push(
    { title, content: body, tags, version: 1 },
    { title, content: body || merged, tags },
    { title, content: body || merged }
  );

  // Partial schemas
  push(
    { title, description: merged || shortDesc, tags, is_confidential: !input.is_public },
    { title, description: merged || shortDesc, tags },
    { title, description: merged || shortDesc },
    { title, content: body || merged },
    { title }
  );

  return variants;
}

async function writeVaultEntry(
  mode: 'insert' | 'update',
  input: {
    title: string;
    description: string;
    content: string;
    tags: string[];
    is_public: boolean;
  },
  options: { userId?: string; id?: string }
): Promise<void> {
  let lastError: SupabaseErrorLike | null = null;

  for (const payload of buildPayloadVariants(input)) {
    const row = mode === 'insert' ? { ...payload, user_id: options.userId } : payload;

    const result =
      mode === 'insert'
        ? await supabase.from('vault_entries').insert(row)
        : await supabase.from('vault_entries').update(row).eq('id', options.id!);

    if (!result.error) return;

    if (!isMissingColumnError(result.error)) throw result.error;
    lastError = result.error;
  }

  if (lastError) throw lastError;
}

export async function listVaultEntries(userId: string) {
  const { data, error } = await supabase
    .from('vault_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as VaultRow[];
}

export async function listVaultEntriesForUser(
  userId: string,
  options?: { publicOnly?: boolean }
): Promise<VaultEntryRecord[]> {
  let query = supabase.from('vault_entries').select('*');
  if (options?.publicOnly) {
    query = query.eq('is_confidential', false);
  } else {
    query = query.or(`user_id.eq.${userId},is_confidential.eq.false`);
  }

  let { data, error } = await query.order('created_at', { ascending: false });

  if (isMissingColumnError(error)) {
    ({ data, error } = await supabase
      .from('vault_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }));
  }

  if (error) throw error;
  return ((data ?? []) as VaultRow[]).map(toEntry);
}

export async function getVaultEntry(id: string): Promise<VaultEntryRecord | null> {
  const { data, error } = await supabase.from('vault_entries').select('*').eq('id', id).single();
  if (error) return null;
  return toEntry(data as VaultRow);
}

export async function createVaultEntry(
  userId: string,
  input: {
    title: string;
    description: string;
    content: string;
    tags: string[];
    is_public: boolean;
  }
): Promise<void> {
  await writeVaultEntry('insert', input, { userId });
}

export async function updateVaultEntry(
  id: string,
  input: {
    title: string;
    description: string;
    content: string;
    tags: string[];
    is_public: boolean;
  }
): Promise<void> {
  await writeVaultEntry('update', input, { id });
}

export async function deleteVaultEntry(id: string): Promise<void> {
  const { error } = await supabase.from('vault_entries').delete().eq('id', id);
  if (error) throw error;
}

export async function registerVaultIP(params: {
  user_id: string;
  node_id?: string;
  vault_entry_id?: string;
  version_hash: string;
  ownership_signature: string;
}) {
  const { data, error } = await supabase.from('ai_innovation_vault').insert(params).select().single();
  if (error) throw error;
  return data;
}
