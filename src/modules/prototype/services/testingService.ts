import { supabase } from '../../../lib/supabase/client';
import { prototypeService } from './prototypeService';
import type { PrototypeTestRun, TestVerdict } from '../types/prototype.types';

const memoryTests = new Map<string, PrototypeTestRun[]>();

function testId() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function persistTest(run: PrototypeTestRun): Promise<void> {
  const { error } = await supabase.from('prototype_test_runs').insert({
    id: run.id,
    prototype_id: run.prototype_id,
    name: run.name,
    verdict: run.verdict,
    score: run.score,
    notes: run.notes,
    metrics: run.metrics,
    created_at: run.created_at,
  });
  if (error) {
    const list = memoryTests.get(run.prototype_id) ?? [];
    list.unshift(run);
    memoryTests.set(run.prototype_id, list);
  }
}

async function fetchTests(prototypeId: string): Promise<PrototypeTestRun[]> {
  const { data, error } = await supabase
    .from('prototype_test_runs')
    .select('*')
    .eq('prototype_id', prototypeId)
    .order('created_at', { ascending: false });
  if (error || !data) return memoryTests.get(prototypeId) ?? [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    prototype_id: String(row.prototype_id),
    name: String(row.name),
    verdict: row.verdict as TestVerdict,
    score: row.score != null ? Number(row.score) : null,
    notes: row.notes ? String(row.notes) : null,
    metrics: (row.metrics as Record<string, number>) ?? {},
    created_at: String(row.created_at),
  }));
}

export const testingService = {
  async list(prototypeId: string): Promise<PrototypeTestRun[]> {
    return fetchTests(prototypeId);
  },

  async record(
    userId: string,
    prototypeId: string,
    payload: { name: string; verdict: TestVerdict; score?: number; notes?: string; metrics?: Record<string, number> }
  ): Promise<PrototypeTestRun> {
    const run: PrototypeTestRun = {
      id: testId(),
      prototype_id: prototypeId,
      name: payload.name,
      verdict: payload.verdict,
      score: payload.score ?? null,
      notes: payload.notes ?? null,
      metrics: payload.metrics ?? {},
      created_at: new Date().toISOString(),
    };
    await persistTest(run);

    if (payload.verdict === 'pass') {
      await prototypeService.advanceLifecycle(prototypeId, userId, 'success');
    } else if (payload.verdict === 'fail') {
      await prototypeService.advanceLifecycle(prototypeId, userId, 'failed');
    } else {
      await prototypeService.advanceLifecycle(prototypeId, userId, 'testing');
    }

    return run;
  },

  passRate(runs: PrototypeTestRun[]): number {
    if (runs.length === 0) return 0;
    const passed = runs.filter((r) => r.verdict === 'pass').length;
    return passed / runs.length;
  },
};
