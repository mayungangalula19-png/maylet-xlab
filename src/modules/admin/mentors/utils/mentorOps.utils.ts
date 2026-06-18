import type { AdminServiceResult } from '../../types/projectAdmin.types';

export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.length > 0) return err.message;
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    for (const key of ['message', 'details', 'hint'] as const) {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
    if (typeof record.code === 'string' && record.code.length > 0) {
      return `Database error (${record.code})`;
    }
  }
  if (typeof err === 'string' && err.length > 0) return err;
  return 'Request failed';
}

export function isSchemaError(err: unknown): boolean {
  const msg = extractErrorMessage(err).toLowerCase();
  return (
    msg.includes('does not exist') ||
    msg.includes('could not find') ||
    msg.includes('schema cache') ||
    msg.includes('column') ||
    msg.includes('42p01') ||
    msg.includes('42703') ||
    msg.includes('pgrst')
  );
}

export function toServiceError(err: unknown, code: string): AdminServiceResult<never> {
  return { data: null, error: { code, message: extractErrorMessage(err) } };
}

export function schemaMissingError(
  err: unknown,
  script = 'scripts/create-mentor-ops-tables.sql'
): AdminServiceResult<never> {
  return {
    data: null,
    error: {
      code: 'SCHEMA_MISSING',
      message: `${extractErrorMessage(err)}. Run ${script} in Supabase SQL Editor.`,
    },
  };
}

export async function safeTableQuery<T>(
  run: () => PromiseLike<{ data: T | null; error: unknown }>
): Promise<T | null> {
  try {
    const { data, error } = await run();
    if (error) {
      if (isSchemaError(error)) return null;
      throw error;
    }
    return data;
  } catch (err) {
    if (isSchemaError(err)) return null;
    throw err;
  }
}

/** Strip missing columns from mentor UPDATE payloads (remote schema drift). */
export async function patchMentorRow(
  supabase: {
    from: (table: string) => {
      update: (p: Record<string, unknown>) => {
        eq: (c: string, v: string) => PromiseLike<{ error: unknown }>;
      };
    };
  },
  mentorId: string,
  patch: Record<string, unknown>
): Promise<void> {
  let payload = { ...patch };

  for (let attempt = 0; attempt < 8; attempt++) {
    const { error } = await supabase.from('mentors').update(payload).eq('id', mentorId);
    if (!error) return;
    if (!isSchemaError(error)) throw error;

    const msg = extractErrorMessage(error).toLowerCase();
    const colMatch = msg.match(/could not find the '(\w+)' column/);
    const missingCol = colMatch?.[1];
    if (missingCol && missingCol in payload) {
      const next = { ...payload };
      delete next[missingCol];
      if (Object.keys(next).length === 0) throw error;
      payload = next;
      continue;
    }
    throw error;
  }
}

export async function queryMentorsWithFallback(
  supabase: {
    from: (table: string) => {
      select: (s: string) => {
        order: (
          c: string,
          o: { ascending: boolean }
        ) => PromiseLike<{ data: unknown[] | null; error: unknown }>;
      };
    };
  }
): Promise<Record<string, unknown>[]> {
  const selects = [
    'id, user_id, full_name, avatar_url, title, expertise, bio, years_experience, hourly_rate, rating, total_sessions, is_active, created_at, updated_at, email, phone, organization, industry, country, availability_status, last_session_at',
    'id, user_id, full_name, avatar_url, title, expertise, bio, years_experience, rating, total_sessions, is_active, created_at, updated_at',
    'id, user_id, full_name, avatar_url, title, expertise, bio, years_experience, rating, total_sessions, is_active, created_at',
    'id, user_id, full_name, title, expertise, rating, total_sessions, is_active, created_at',
    '*',
  ];

  for (const select of selects) {
    const { data, error } = await supabase
      .from('mentors')
      .select(select)
      .order('rating', { ascending: false });
    if (!error) return (data ?? []) as Record<string, unknown>[];
    if (!isSchemaError(error)) throw error;
  }
  return [];
}
