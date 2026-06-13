import { useCallback, useState } from 'react';
import { buildService } from '../services/buildService';
import type { PrototypeBuild } from '../types/prototype.types';

export function useBuildRunner(userId: string | undefined, prototypeId: string | undefined) {
  const [running, setRunning] = useState(false);
  const [lastBuild, setLastBuild] = useState<PrototypeBuild | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBuild = useCallback(
    async (config: string) => {
      if (!userId || !prototypeId) return null;
      setRunning(true);
      setError(null);
      try {
        const result = await buildService.run(userId, prototypeId, config);
        setLastBuild(result);
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Build failed');
        return null;
      } finally {
        setRunning(false);
      }
    },
    [userId, prototypeId]
  );

  return { running, lastBuild, error, runBuild };
}
