import { supabase } from '../../../lib/supabase/client';
import { fetchProjectNames } from '../../../lib/supabase/dbHelpers';

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
