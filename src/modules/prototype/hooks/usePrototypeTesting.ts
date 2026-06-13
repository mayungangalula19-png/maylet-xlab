import { useCallback, useMemo } from 'react';
import { testingService } from '../services/testingService';
import type { PrototypeTestRun, TestVerdict } from '../types/prototype.types';

interface Options {
  prototypeId: string | undefined;
  userId: string | undefined;
  tests: PrototypeTestRun[];
  withSaving: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
}

export function usePrototypeTesting({ prototypeId, userId, tests, withSaving }: Options) {
  const passRate = useMemo(() => testingService.passRate(tests), [tests]);
  const failedCount = useMemo(() => tests.filter((t) => t.verdict === 'fail').length, [tests]);
  const passedCount = useMemo(() => tests.filter((t) => t.verdict === 'pass').length, [tests]);

  const recordTest = useCallback(
    async (payload: { name: string; verdict: TestVerdict; score?: number; notes?: string }) => {
      if (!prototypeId || !userId) return;
      await withSaving(() =>
        testingService.record(userId, prototypeId, {
          name: payload.name,
          verdict: payload.verdict,
          score: payload.score,
          notes: payload.notes,
        })
      );
    },
    [prototypeId, userId, withSaving]
  );

  return {
    tests,
    passRate,
    failedCount,
    passedCount,
    recordTest,
  };
}
