import { type DependencyList, useEffect } from 'react';
import type { PageLoadContext } from '../types/global.types';

export function usePageLoad(
  loader: (ctx: PageLoadContext) => Promise<void>,
  deps: DependencyList
): void {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loader({ cancelled: () => cancelled });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
