import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase/client';

interface UseInnovatorsRealtimeOptions {
  onPipelineChange: () => void;
  onReviewChange: () => void;
  onActivityChange: () => void;
}

export function useInnovatorsRealtime({
  onPipelineChange,
  onReviewChange,
  onActivityChange,
}: UseInnovatorsRealtimeOptions) {
  const [live, setLive] = useState(false);

  useEffect(() => {
    let pipelineTimer: ReturnType<typeof setTimeout> | undefined;
    let reviewTimer: ReturnType<typeof setTimeout> | undefined;
    let activityTimer: ReturnType<typeof setTimeout> | undefined;

    const channel = supabase
      .channel('innovators-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'innovator_pipeline' },
        () => {
          clearTimeout(pipelineTimer);
          pipelineTimer = setTimeout(onPipelineChange, 350);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'innovator_reviews' },
        () => {
          clearTimeout(reviewTimer);
          reviewTimer = setTimeout(onReviewChange, 350);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'innovator_activity_logs' },
        () => {
          clearTimeout(activityTimer);
          activityTimer = setTimeout(onActivityChange, 350);
        }
      )
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED');
      });

    return () => {
      clearTimeout(pipelineTimer);
      clearTimeout(reviewTimer);
      clearTimeout(activityTimer);
      setLive(false);
      void supabase.removeChannel(channel);
    };
  }, [onPipelineChange, onReviewChange, onActivityChange]);

  return { live };
}
