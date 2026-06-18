import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase/client';

interface UseMentorsRealtimeOptions {
  onMentorChange: () => void;
  onSessionChange: () => void;
  onAssignmentChange: () => void;
  onActivityChange: () => void;
}

export function useMentorsRealtime({
  onMentorChange,
  onSessionChange,
  onAssignmentChange,
  onActivityChange,
}: UseMentorsRealtimeOptions) {
  const [live, setLive] = useState(false);

  useEffect(() => {
    let mentorTimer: ReturnType<typeof setTimeout> | undefined;
    let sessionTimer: ReturnType<typeof setTimeout> | undefined;
    let assignTimer: ReturnType<typeof setTimeout> | undefined;
    let activityTimer: ReturnType<typeof setTimeout> | undefined;

    const channel = supabase
      .channel('mentors-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mentors' }, () => {
        clearTimeout(mentorTimer);
        mentorTimer = setTimeout(onMentorChange, 350);
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mentorship_sessions' },
        () => {
          clearTimeout(sessionTimer);
          sessionTimer = setTimeout(onSessionChange, 350);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mentor_assignments' },
        () => {
          clearTimeout(assignTimer);
          assignTimer = setTimeout(onAssignmentChange, 350);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mentorship_requests' },
        () => {
          clearTimeout(assignTimer);
          assignTimer = setTimeout(onAssignmentChange, 350);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mentor_activity_logs' },
        () => {
          clearTimeout(activityTimer);
          activityTimer = setTimeout(onActivityChange, 350);
        }
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));

    return () => {
      clearTimeout(mentorTimer);
      clearTimeout(sessionTimer);
      clearTimeout(assignTimer);
      clearTimeout(activityTimer);
      setLive(false);
      void supabase.removeChannel(channel);
    };
  }, [onMentorChange, onSessionChange, onAssignmentChange, onActivityChange]);

  return { live };
}
