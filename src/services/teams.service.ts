import { supabase } from '../lib/supabase/client';

export async function listTeamsForUser(userId: string) {
  const { data, error } = await supabase.from('teams').select('*').eq('owner_id', userId);
  if (error) throw error;
  return data ?? [];
}

export async function getTeamMembers(teamId: string) {
  const { data, error } = await supabase
    .from('team_members')
    .select('*, profiles(id, full_name, email, avatar_url)')
    .eq('team_id', teamId);
  if (error) throw error;
  return data ?? [];
}
