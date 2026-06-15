import { supabase } from '../../lib/supabase/client';

export interface MentorRecord {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  title: string;
  expertise: string[];
  bio: string;
  years_experience: number;
  hourly_rate: number | null;
  rating: number;
  total_sessions: number;
  is_active: boolean;
}

export interface MentorshipRequestRecord {
  id: string;
  mentor_id: string;
  mentor_name?: string;
  mentor_avatar?: string;
  user_id: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_date: string;
  scheduled_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MentorshipSessionRecord {
  id: string;
  request_id: string;
  mentor_id: string;
  mentor_name?: string;
  user_id: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  feedback: string | null;
  rating: number | null;
}

export interface MentorshipPageData {
  mentors: MentorRecord[];
  requests: MentorshipRequestRecord[];
  sessions: MentorshipSessionRecord[];
}

class MentorshipService {
  async getPageData(userId: string): Promise<MentorshipPageData> {
    const { data: mentorsData, error: mentorsError } = await supabase
      .from('mentors')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false });
    if (mentorsError) throw mentorsError;

    const { data: requestsData, error: requestsError } = await supabase
      .from('mentorship_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (requestsError) throw requestsError;

    const enrichedRequests = await Promise.all(
      (requestsData ?? []).map(async (req) => {
        const { data: mentor } = await supabase
          .from('mentors')
          .select('full_name, avatar_url')
          .eq('id', req.mentor_id)
          .single();
        return {
          ...req,
          mentor_name: mentor?.full_name ?? 'Unknown',
          mentor_avatar: mentor?.avatar_url ?? undefined,
        };
      })
    );

    const { data: sessionsData, error: sessionsError } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: true });
    if (sessionsError) throw sessionsError;

    const enrichedSessions = await Promise.all(
      (sessionsData ?? []).map(async (sess) => {
        const { data: mentor } = await supabase
          .from('mentors')
          .select('full_name')
          .eq('id', sess.mentor_id)
          .single();
        return { ...sess, mentor_name: mentor?.full_name ?? 'Unknown' };
      })
    );

    return {
      mentors: (mentorsData ?? []) as MentorRecord[],
      requests: enrichedRequests,
      sessions: enrichedSessions,
    };
  }

  async submitRequest(mentorId: string, userId: string, message: string): Promise<void> {
    const { error } = await supabase.from('mentorship_requests').insert({
      mentor_id: mentorId,
      user_id: userId,
      message,
      status: 'pending',
      requested_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  async cancelRequest(requestId: string): Promise<void> {
    const { error } = await supabase.from('mentorship_requests').delete().eq('id', requestId);
    if (error) throw error;
  }
}

export const mentorshipService = new MentorshipService();
