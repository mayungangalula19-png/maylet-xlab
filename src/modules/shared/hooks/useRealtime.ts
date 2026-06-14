import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase/client';

export const useRealtime = (table: string, callback: (payload: any) => void) => {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        callback(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback]);
};
