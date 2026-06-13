import { useCallback, useEffect, useState } from 'react';
import { analyzePrototypeRisk } from '../ai/prototypeAI.engine';
import { buildService } from '../services/buildService';
import { prototypeService } from '../services/prototypeService';
import { testingService } from '../services/testingService';
import {
  computeDashboardStats,
  type PrototypeAiEvaluation,
  type PrototypeBuild,
  type PrototypeDashboardStats,
  type PrototypeFile,
  type PrototypeRecord,
  type PrototypeTestRun,
} from '../types/prototype.types';
import { gateService } from '../../research/services/gateService';
import { canAuthorizePrototype } from '../../research/ai/gateEngine';

type RefreshOptions = { silent?: boolean };

export function usePrototype(userId: string | undefined, prototypeId?: string, projectId?: string) {
  const [prototypes, setPrototypes] = useState<PrototypeRecord[]>([]);
  const [prototype, setPrototype] = useState<PrototypeRecord | null>(null);
  const [stats, setStats] = useState<PrototypeDashboardStats | null>(null);
  const [builds, setBuilds] = useState<PrototypeBuild[]>([]);
  const [tests, setTests] = useState<PrototypeTestRun[]>([]);
  const [prototypeFiles, setPrototypeFiles] = useState<PrototypeFile[]>([]);
  const [aiEval, setAiEval] = useState<PrototypeAiEvaluation | null>(null);
  const [gateOk, setGateOk] = useState(false);
  const [gateScope, setGateScope] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async (options?: RefreshOptions) => {
    if (!userId) return;
    if (!options?.silent) setLoading(true);
    try {
      const list = await prototypeService.list(userId, projectId ? { projectId } : undefined);
      setPrototypes(list);
      setStats(computeDashboardStats(list));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load prototypes');
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [userId, projectId]);

  const loadDetail = useCallback(async (options?: RefreshOptions) => {
    if (!userId || !prototypeId) return;
    if (!options?.silent) setLoading(true);
    try {
      const [p, b, t, f] = await Promise.all([
        prototypeService.getById(prototypeId, userId),
        buildService.list(prototypeId),
        testingService.list(prototypeId),
        prototypeService.listFiles(prototypeId),
      ]);
      setBuilds(b);
      setTests(t);
      setPrototypeFiles(f);
      if (p) {
        setPrototype({ ...p, prototypeFiles: f });
        const buildRate = b.length ? b.filter((x) => x.status === 'completed').length / b.length : 0;
        const testRate = testingService.passRate(t);
        setAiEval(analyzePrototypeRisk({ prototype: p, buildSuccessRate: buildRate, testPassRate: testRate }));
      } else {
        setPrototype(null);
        setAiEval(null);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load prototype');
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [userId, prototypeId]);

  const loadGate = useCallback(async () => {
    if (!projectId) {
      setGateOk(false);
      setGateScope(null);
      return;
    }
    const g = await gateService.getLatest(projectId);
    setGateOk(g ? canAuthorizePrototype(g.decision) : false);
    setGateScope(g?.v1_scope ?? null);
  }, [projectId]);

  useEffect(() => {
    if (prototypeId) loadDetail();
    else loadList();
    loadGate();
  }, [prototypeId, loadDetail, loadList, loadGate]);

  const refresh = useCallback(async (options?: RefreshOptions) => {
    if (prototypeId) await loadDetail(options);
    else await loadList(options);
    await loadGate();
  }, [prototypeId, loadDetail, loadList, loadGate]);

  const addUploadedFile = useCallback((file: PrototypeFile) => {
    setPrototypeFiles((prev) => [file, ...prev.filter((f) => f.id !== file.id)]);
    setPrototype((prev) => {
      if (!prev) return prev;
      const nextFiles = [file, ...(prev.prototypeFiles ?? []).filter((f) => f.id !== file.id)];
      const ext = file.fileName.split('.').pop()?.toLowerCase();
      const nextFileUrl = prev.file_url ?? (ext === 'zip' || ext === 'apk' ? file.url ?? prev.file_url : prev.file_url);
      return { ...prev, prototypeFiles: nextFiles, file_url: nextFileUrl ?? prev.file_url };
    });
  }, []);

  const withSaving = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    setSaving(true);
    try {
      const result = await fn();
      await refresh({ silent: true });
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed');
      return undefined;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  return {
    prototypes,
    prototype,
    stats,
    builds,
    tests,
    prototypeFiles,
    aiEval,
    gateOk,
    gateScope,
    loading,
    saving,
    error,
    setError,
    refresh,
    addUploadedFile,
    withSaving,
    prototypeService,
    buildService,
    testingService,
  };
}
