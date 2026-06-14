import { supabase } from '../supabase/client';
import {
  PIPELINE_STAGES,
  type ExperimentOpsSnapshot,
  type ExperimentRecord,
  type PipelineStage,
  buildPortfolioMaya,
  buildPortfolioMetrics,
  detectBottlenecks,
  groupByPrototype,
  normalizeExperimentRow,
} from './experimentOps';

export async function fetchProjectsByIds(
  projectIds: string[]
): Promise<Record<string, { name?: string; sector?: string }>> {
  const map: Record<string, { name?: string; sector?: string }> = {};
  if (projectIds.length === 0) return map;

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, sector')
    .in('id', projectIds);

  if (error) throw error;

  for (const p of data ?? []) {
    map[String(p.id)] = {
      name: p.name ? String(p.name) : undefined,
      sector: p.sector ? String(p.sector) : undefined,
    };
  }
  return map;
}

function parsePrototypeIdFromRow(row: Record<string, unknown>): string | null {
  try {
    const findings = row.findings;
    if (!findings) return null;
    const parsed = JSON.parse(String(findings)) as { prototype_id?: string };
    return parsed.prototype_id ? String(parsed.prototype_id) : null;
  } catch {
    return null;
  }
}

export async function loadExperimentOps(userId: string): Promise<ExperimentOpsSnapshot> {
  const { data, error } = await supabase
    .from('experiments')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as Record<string, unknown>[];

  const projectIds = [
    ...new Set(rows.map((row) => (row.project_id ? String(row.project_id) : null)).filter(Boolean)),
  ] as string[];
  const projectMap = await fetchProjectsByIds(projectIds);

  const prototypeIds = [
    ...new Set(rows.map(parsePrototypeIdFromRow).filter(Boolean)),
  ] as string[];

  const prototypeNames: Record<string, string> = {};
  if (prototypeIds.length > 0) {
    const { data: prototypes, error: protoError } = await supabase
      .from('prototypes')
      .select('id, name')
      .in('id', prototypeIds);
    if (protoError) throw protoError;
    for (const p of prototypes ?? []) {
      prototypeNames[String(p.id)] = String(p.name ?? 'Prototype');
    }
  }

  const experiments: ExperimentRecord[] = rows.map((row) => {
    const projectId = row.project_id ? String(row.project_id) : null;
    const project = projectId ? projectMap[projectId] ?? null : null;
    const prototypeId = parsePrototypeIdFromRow(row);
    return normalizeExperimentRow(
      row,
      project,
      prototypeId ? prototypeNames[prototypeId] ?? null : null
    );
  });

  const pipelineCounts = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = experiments.filter((e) => e.pipelineStage === stage).length;
      return acc;
    },
    {} as Record<PipelineStage, number>
  );

  return {
    experiments,
    metrics: buildPortfolioMetrics(experiments),
    pipelineCounts,
    bottlenecks: detectBottlenecks(experiments),
    prototypeTrees: groupByPrototype(experiments, prototypeNames),
    maya: buildPortfolioMaya(experiments),
  };
}

export function exportExperimentsCsv(experiments: ExperimentRecord[]) {
  const header =
    'Title,Project,Prototype,Stage,Status,Confidence,Evidence Quality,Data Quality,Hypothesis,Category\n';
  const rows = experiments
    .map((e) =>
      [
        `"${e.title.replace(/"/g, '""')}"`,
        `"${(e.project_name ?? '').replace(/"/g, '""')}"`,
        `"${(e.prototype_name ?? '').replace(/"/g, '""')}"`,
        e.pipelineStage,
        e.status,
        e.confidenceScore,
        e.evidenceQuality,
        e.dataQuality,
        `"${e.hypothesis.replace(/"/g, '""').slice(0, 120)}"`,
        e.config.category ?? e.type,
      ].join(',')
    )
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `experiments-ops-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
