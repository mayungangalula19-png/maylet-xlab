import { createClient } from '@supabase/supabase-js';
import { sanitizeContent } from '../utils/sanitize.js';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const adminSupabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    : null;

export async function verifyAccessToken(token: string): Promise<string | null> {
  if (!token || !adminSupabase) return null;
  const { data, error } = await adminSupabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export { sanitizeContent };
