import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPrototypeRecommendation } from '../ai/recommendationEngine';
import {
  loadTestingWorkspace,
  saveTestingWorkspace,
} from '../services/prototypeTesting.storage';
import { testingService } from '../services/testingService';
import type { PrototypeTestingWorkspace, TestingActivity } from '../types/prototypeTesting.types';
import { emptyTestingWorkspace, newTestingId } from '../types/prototypeTesting.types';
import type { TestVerdict } from '../types/prototype.types';
import {
  computeReadinessScores,
  computeTestingKPIs,
  syncDbRunsToCases,
} from '../utils/testingCenter.utils';
import { usePrototype } from './usePrototype';

export function usePrototypeTestingCenter(userId: string | undefined, prototypeId: string | undefined) {
  const proto = usePrototype(userId, prototypeId);
  const [workspace, setWorkspace] = useState<PrototypeTestingWorkspace>(() =>
    prototypeId ? loadTestingWorkspace(prototypeId) : emptyTestingWorkspace()
  );
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!prototypeId) return;
    setWorkspace(loadTestingWorkspace(prototypeId));
  }, [prototypeId]);

  const persist = useCallback(
    (next: PrototypeTestingWorkspace) => {
      if (!prototypeId) return;
      saveTestingWorkspace(prototypeId, next);
    },
    [prototypeId]
  );

  const patchWorkspace = useCallback(
    (patch: Partial<PrototypeTestingWorkspace>) => {
      setWorkspace((prev) => {
        const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => persist(next), 800);
        return next;
      });
    },
    [persist]
  );

  const logActivity = useCallback(
    (message: string, type: TestingActivity['type'] = 'execution') => {
      setWorkspace((prev) => {
        const next = {
          ...prev,
          activity: [
            { id: newTestingId(), type, message, createdAt: new Date().toISOString() },
            ...prev.activity,
          ].slice(0, 50),
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const allCases = useMemo(() => {
    const dbCases = syncDbRunsToCases(proto.tests);
    const localIds = new Set(workspace.testCases.map((c) => c.id));
    const merged = [...workspace.testCases, ...dbCases.filter((c) => !localIds.has(c.id))];
    return merged;
  }, [workspace.testCases, proto.tests]);

  const wsWithCases = useMemo(() => ({ ...workspace, testCases: allCases }), [workspace, allCases]);

  const kpis = useMemo(() => computeTestingKPIs(wsWithCases, proto.tests), [wsWithCases, proto.tests]);

  const recommendation = useMemo(() => {
    if (!proto.prototype) return null;
    return getPrototypeRecommendation({
      prototype: proto.prototype,
      testPassRate: kpis.passRate / 100,
    });
  }, [proto.prototype, kpis.passRate]);

  const readiness = useMemo(
    () => computeReadinessScores(wsWithCases, kpis, recommendation?.evaluation.riskScore ?? null),
    [wsWithCases, kpis, recommendation]
  );

  const recordTest = useCallback(
    async (payload: { name: string; verdict: TestVerdict; score?: number; notes?: string }) => {
      if (!prototypeId || !userId) return;
      await proto.withSaving(() =>
        testingService.record(userId, prototypeId, {
          name: payload.name,
          verdict: payload.verdict,
          score: payload.score,
          notes: payload.notes,
        })
      );
      logActivity(`Recorded test: ${payload.name} — ${payload.verdict}`, 'execution');
    },
    [prototypeId, userId, proto, logActivity]
  );

  const runTestSuite = useCallback(async () => {
    const pending = workspace.testCases.filter((c) => c.status === 'pending' || c.status === 'draft');
    for (const tc of pending.slice(0, 5)) {
      const startedAt = new Date().toISOString();
      patchWorkspace({
        testCases: workspace.testCases.map((c) =>
          c.id === tc.id ? { ...c, status: 'running' as const, startedAt } : c
        ),
      });
      await new Promise((r) => setTimeout(r, 300));
      const endedAt = new Date().toISOString();
      const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
      patchWorkspace({
        testCases: workspace.testCases.map((c) =>
          c.id === tc.id
            ? {
                ...c,
                status: 'passed' as const,
                testedAt: endedAt,
                endedAt,
                durationMs,
                tester: 'Auto-suite',
              }
            : c
        ),
      });
    }
    logActivity(`Ran test suite on ${Math.min(pending.length, 5)} cases`, 'execution');
  }, [workspace.testCases, patchWorkspace, logActivity]);

  const exportReport = useCallback(() => {
    if (!proto.prototype) return '';
    return [
      `# Testing Report — ${proto.prototype.name}`,
      '',
      `Version: ${proto.prototype.version}`,
      `Quality score: ${kpis.qualityScore}`,
      `Readiness index: ${readiness.readinessIndex}`,
      '',
      '## KPIs',
      `- Total cases: ${kpis.totalCases}`,
      `- Passed: ${kpis.passed}`,
      `- Failed: ${kpis.failed}`,
      `- Critical issues: ${kpis.criticalIssues}`,
      '',
      '## Defects',
      ...workspace.defects.map((d) => `- [${d.severity}] ${d.title} (${d.status})`),
    ].join('\n');
  }, [proto.prototype, kpis, readiness, workspace.defects]);

  return {
    ...proto,
    workspace: wsWithCases,
    patchWorkspace,
    logActivity,
    kpis,
    readiness,
    recommendation,
    recordTest,
    runTestSuite,
    exportReport,
    activeSection,
    setActiveSection,
    saveNow: () => prototypeId && persist(workspace),
  };
}
