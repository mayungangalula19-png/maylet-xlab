import { supabase } from './client';

type SchemaError = { message?: string; code?: string; details?: string; hint?: string };

const EXTENDED_PROTOTYPE_COLUMNS = [
  'research_id',
  'thumbnail_url',
  'views',
  'downloads',
  'created_at',
  'updated_at',
] as const;

const OPTIONAL_PROTOTYPE_COLUMNS = [
  ...EXTENDED_PROTOTYPE_COLUMNS,
  'file_url',
  'description',
  'project_id',
  'version',
  'status',
] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

function missingColumnFromError(error: unknown): string | null {
  const msg = String((error as SchemaError)?.message ?? '');
  const patterns = [
    /column ['"]?([\w_]+)['"]?/i,
    /Could not find the ['"]([\w_]+)['"] column/i,
    /'([\w_]+)' column of 'prototypes'/i,
  ];
  for (const re of patterns) {
    const match = msg.match(re);
    if (match?.[1]) return match[1].toLowerCase();
  }
  return null;
}

function stripExtendedColumns(payload: Record<string, unknown>): Record<string, unknown> {
  const next = { ...payload };
  for (const col of EXTENDED_PROTOTYPE_COLUMNS) {
    delete next[col];
  }
  return next;
}

function sanitizePrototypeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };

  for (const key of ['user_id', 'project_id', 'research_id'] as const) {
    const value = out[key];
    if (value === '' || value === undefined) {
      if (key === 'user_id') {
        throw new Error('You must be signed in to create a prototype.');
      }
      delete out[key];
      continue;
    }
    if (value === null) {
      if (key !== 'user_id') delete out[key];
      continue;
    }
    if (!isValidUuid(value)) {
      if (key === 'user_id') {
        throw new Error('Invalid user session. Sign out and sign in again.');
      }
      delete out[key];
    }
  }

  for (const key of OPTIONAL_PROTOTYPE_COLUMNS) {
    if (out[key] === null || out[key] === undefined) {
      delete out[key];
    }
  }

  if (out.file_url === '') delete out.file_url;
  if (out.thumbnail_url === '') delete out.thumbnail_url;

  return out;
}

function minimalPrototypeRow(row: Record<string, unknown>): Record<string, unknown> {
  const minimal: Record<string, unknown> = {
    user_id: row.user_id,
    name: row.name,
  };
  if (row.description) minimal.description = row.description;
  if (row.version) minimal.version = row.version;
  if (row.status) minimal.status = row.status;
  if (row.file_url) minimal.file_url = row.file_url;
  if (row.project_id && isValidUuid(row.project_id)) minimal.project_id = row.project_id;
  return minimal;
}

export function formatPrototypeError(error: unknown): string {
  const err = error as SchemaError;
  const msg = String(err?.message ?? error ?? 'Failed to create prototype');
  const lower = msg.toLowerCase();
  const code = String(err?.code ?? '');
  const details = err?.details ? ` (${err.details})` : '';
  const hint = err?.hint ? ` Hint: ${err.hint}` : '';

  if (code === '23503' || lower.includes('foreign key')) {
    if (lower.includes('project_id')) {
      return 'The selected project was not found or you no longer have access to it.';
    }
    if (lower.includes('user_id')) {
      return 'Your account could not be linked to this prototype. Sign out and sign in again.';
    }
    return 'A linked record was not found. Try creating the prototype without a project link.';
  }
  if (code === '22P02' || lower.includes('invalid input syntax for type uuid')) {
    return 'Invalid project or research link. Try again without optional links.';
  }
  if (code === '42501' || lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'Permission denied. Sign in and ensure you own this prototype.';
  }
  if (lower.includes('bucket not found')) {
    return 'Prototype storage is not configured. Run migration 20240612000022_storage_buckets.sql on Supabase.';
  }
  if (code === 'PGRST204' || (lower.includes('could not find') && lower.includes('column'))) {
    return `${msg}${details}${hint} Run migration 20240612000027_prototypes_schema_compat.sql on your Supabase project.`;
  }
  if (code === '42P01' || lower.includes('relation') && lower.includes('prototypes')) {
    return `Prototypes table is missing.${details} Run migration 20240612000027_prototypes_schema_compat.sql on Supabase.`;
  }
  return `${msg}${details}${hint}`;
}

function logPrototypeInsertError(error: unknown, payload: Record<string, unknown>) {
  if (!import.meta.env.DEV) return;
  console.error('[prototypeInsert] failed', {
    error,
    payloadKeys: Object.keys(payload),
  });
}

/** Insert prototypes row; strips optional columns when remote schema omits them. */
export async function prototypeInsert(row: Record<string, unknown>) {
  let payload = sanitizePrototypeRow(row);
  let response = await supabase.from('prototypes').insert(payload).select().single();

  let guard = 0;
  while (response.error && guard++ < OPTIONAL_PROTOTYPE_COLUMNS.length + 3) {
    const col = missingColumnFromError(response.error);
    if (col && col in payload) {
      const next = { ...payload };
      delete next[col];
      payload = next;
      response = await supabase.from('prototypes').insert(payload).select().single();
      continue;
    }

    const hasExtended = EXTENDED_PROTOTYPE_COLUMNS.some((key) => key in payload);
    if (hasExtended) {
      payload = stripExtendedColumns(payload);
      response = await supabase.from('prototypes').insert(payload).select().single();
      continue;
    }

    break;
  }

  if (response.error) {
    const minimal = minimalPrototypeRow(payload);
    if (JSON.stringify(minimal) !== JSON.stringify(payload)) {
      response = await supabase.from('prototypes').insert(minimal).select().single();
      payload = minimal;
    }
  }

  if (response.error) {
    logPrototypeInsertError(response.error, payload);
    throw new Error(formatPrototypeError(response.error));
  }

  return response;
}
