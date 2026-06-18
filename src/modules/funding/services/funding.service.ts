import { supabase } from '../../../lib/supabase/client';
import { fetchProjectNames } from '../../../lib/supabase/dbHelpers';

const MAX_PITCH_AMOUNT = 999_999_999_999.99;

function parseAmount(value: unknown): number {
  if (value === '' || value === null || value === undefined) {
    throw new Error('Enter a funding amount.');
  }
  const amountNum = Number(value);
  if (!Number.isFinite(amountNum) || amountNum < 0) {
    throw new Error('Enter a valid funding amount.');
  }
  if (amountNum > MAX_PITCH_AMOUNT) {
    throw new Error('Funding amount is too large (max 999 billion).');
  }
  return amountNum;
}

function parseEquityPercent(value: unknown): number {
  if (value === '' || value === null || value === undefined) return 0;
  const equityNum = Number(value);
  if (!Number.isFinite(equityNum)) {
    throw new Error('Enter a valid equity percentage (0–100), or leave blank for grants.');
  }
  if (equityNum < 0 || equityNum > 100) {
    throw new Error('Equity must be between 0 and 100 percent.');
  }
  return equityNum;
}

export function sanitizePitchNumbers(amount: unknown, equityOffered: unknown) {
  return {
    amount: parseAmount(amount),
    equity_offered: parseEquityPercent(equityOffered),
  };
}

export async function listPitches(userId: string) {
  const { data, error } = await supabase
    .from('funding_pitches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  const projectIds = rows
    .map((row) => row.project_id as string | null)
    .filter(Boolean) as string[];
  const projectNames = await fetchProjectNames(projectIds);

  return rows.map((row) => ({
    ...row,
    projects: row.project_id
      ? { name: projectNames.get(row.project_id as string) ?? 'Project' }
      : null,
  }));
}

export async function createPitch(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('funding_pitches').insert(payload).select().single();
  if (error) throw error;
  return data;
}
