import { supabase } from '../lib/supabase/client';

export async function listVaultEntries(userId: string) {
  const { data, error } = await supabase
    .from('vault_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
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
