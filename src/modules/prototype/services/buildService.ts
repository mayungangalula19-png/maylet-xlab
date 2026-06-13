import { supabase } from '../../../lib/supabase/client';
import { prototypeService } from './prototypeService';
import type { PrototypeBuild, BuildStatus } from '../types/prototype.types';

const memoryBuilds = new Map<string, PrototypeBuild[]>();

function buildId() {
  return `build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function persistBuild(build: PrototypeBuild): Promise<void> {
  const { error } = await supabase.from('prototype_builds').insert({
    id: build.id,
    prototype_id: build.prototype_id,
    status: build.status,
    build_config: build.build_config,
    output_url: build.output_url,
    logs: build.logs,
    started_at: build.started_at,
    completed_at: build.completed_at,
  });
  if (error) {
    const list = memoryBuilds.get(build.prototype_id) ?? [];
    list.unshift(build);
    memoryBuilds.set(build.prototype_id, list);
  }
}

async function fetchBuilds(prototypeId: string): Promise<PrototypeBuild[]> {
  const { data, error } = await supabase
    .from('prototype_builds')
    .select('*')
    .eq('prototype_id', prototypeId)
    .order('started_at', { ascending: false });
  if (error || !data) return memoryBuilds.get(prototypeId) ?? [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    prototype_id: String(row.prototype_id),
    status: row.status as BuildStatus,
    build_config: row.build_config ? String(row.build_config) : null,
    output_url: row.output_url ? String(row.output_url) : null,
    logs: Array.isArray(row.logs) ? (row.logs as string[]) : [],
    started_at: String(row.started_at),
    completed_at: row.completed_at ? String(row.completed_at) : null,
  }));
}

export const buildService = {
  async list(prototypeId: string): Promise<PrototypeBuild[]> {
    return fetchBuilds(prototypeId);
  },

  async run(userId: string, prototypeId: string, buildConfig: string): Promise<PrototypeBuild> {
    await prototypeService.advanceLifecycle(prototypeId, userId, 'building');

    const build: PrototypeBuild = {
      id: buildId(),
      prototype_id: prototypeId,
      status: 'running',
      build_config: buildConfig,
      output_url: null,
      logs: ['Build queued…', 'Compiling assets…', 'Bundling prototype…'],
      started_at: new Date().toISOString(),
      completed_at: null,
    };
    await persistBuild(build);

    const success = buildConfig.trim().length > 0;
    const finished: PrototypeBuild = {
      ...build,
      status: success ? 'completed' : 'failed',
      output_url: success ? `/artifacts/${prototypeId}/${build.id}` : null,
      logs: [...build.logs, success ? 'Build completed successfully' : 'Build failed — empty config'],
      completed_at: new Date().toISOString(),
    };
    await persistBuild(finished);

    await prototypeService.advanceLifecycle(
      prototypeId,
      userId,
      success ? 'testing' : 'failed'
    );

    return finished;
  },
};
