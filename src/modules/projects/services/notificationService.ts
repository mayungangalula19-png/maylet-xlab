import { supabase } from '../../../lib/supabase/client';
import type { NotificationViewModel, ProjectAccessContext } from '../types';
import { normalizeNotification } from '../utils/normalize';

export async function fetchRecentNotifications(
  ctx: ProjectAccessContext,
  limit = 3
): Promise<NotificationViewModel[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[projects] notifications unavailable:', error.message);
    return [];
  }
  return (data ?? []).map((row) => normalizeNotification(row as Record<string, unknown>));
}
