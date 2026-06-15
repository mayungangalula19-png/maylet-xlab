import { supabase } from '../../lib/supabase/client';

export type HackathonStatus = 'upcoming' | 'ongoing' | 'completed';
export type HackathonMode = 'online' | 'offline' | 'hybrid';

export interface HackathonRecord {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  mode: HackathonMode;
  location: string | null;
  prize_pool: number;
  max_participants: number | null;
  registered_count: number;
  status: HackathonStatus;
  image_url: string | null;
  organizer: string;
  created_at: string;
}

export interface HackathonRegistration {
  id: string;
  hackathon_id: string;
  user_id: string;
  team_name: string | null;
  registered_at: string;
}

class HackathonsService {
  async getHackathons(statusFilter: string, modeFilter: string): Promise<HackathonRecord[]> {
    let query = supabase.from('hackathons').select('*');
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (modeFilter !== 'all') query = query.eq('mode', modeFilter);
    const { data, error } = await query.order('start_date', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async getRegistrations(userId: string): Promise<HackathonRegistration[]> {
    const { data, error } = await supabase
      .from('hackathon_registrations')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data ?? [];
  }

  async joinHackathon(hackathonId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('hackathon_registrations').insert({
      hackathon_id: hackathonId,
      user_id: userId,
      registered_at: new Date().toISOString(),
    });
    if (error) throw error;
    await supabase.rpc('increment_hackathon_registrations', { hackathon_id: hackathonId });
  }
}

export const hackathonsService = new HackathonsService();
