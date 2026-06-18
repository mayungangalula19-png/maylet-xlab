import { useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase/client';

type UseRealtimeOptions = {
  /**
   * Milliseconds to throttle high-frequency events.
   * If omitted/undefined, no throttling is applied.
   */
  throttleMs?: number;
};

type RealtimePayload = Record<string, unknown>;

/**
 * Safe Supabase realtime subscription.
 * - unmount safe: ignores events after cleanup
 * - stable: avoids resubscribing when callback identity changes
 * - optional: throttles callback invocation
 */
export const useRealtime = (
  table: string,
  callback: (payload: RealtimePayload) => void,
  options?: UseRealtimeOptions
) => {
  const callbackRef = useRef(callback);
  const unmountedRef = useRef(false);
  const lastInvokeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    unmountedRef.current = false;
    lastInvokeRef.current = 0;


    const channel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (unmountedRef.current) return;

        const throttleMs = options?.throttleMs;
        const cb = callbackRef.current;

        if (!throttleMs || throttleMs <= 0) {
          cb(payload);
          return;
        }

        const now = Date.now();
        const remaining = throttleMs - (now - lastInvokeRef.current);

        if (remaining <= 0) {
          lastInvokeRef.current = now;
          cb(payload);
          return;
        }

        // Throttle by scheduling the latest payload for the next slot
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (unmountedRef.current) return;
          lastInvokeRef.current = Date.now();
          cb(payload);
        }, remaining);
      })
      .subscribe();

    return () => {
      unmountedRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      supabase.removeChannel(channel);
    };
    // Intentionally omit callback from deps; callbackRef keeps it fresh.
    // Recreate subscription only when table changes or throttle interval changes.
  }, [table, options?.throttleMs]);
};

