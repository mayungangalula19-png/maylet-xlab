import { supabase } from '../../../../lib/supabase/client';
import { assertAdminPermission } from '../../services/adminAuth.service';
import { displayName } from '../../utils/adminPage.utils';
import type { AdminServiceResult } from '../../types/projectAdmin.types';
import type { AdminPrototypeOpsSnapshot, PrototypeIntelContext } from '../types/prototypeOpsAdmin.types';
import {
  buildAdminPrototypeRow,
  buildAdminPrototypeStats,
  buildExecutiveStageCounts,
  buildLifecycleInsights,
  buildPortfolioMaya,
  buildPrototypeAnalytics,
  extractErrorMessage,
  extractPrototypeActivity,
  isSchemaError,
  mapPrototypeRecord,
  queryPrototypesWithFallback,
  schemaMissingError,
} from '../utils/prototypeOpsAdmin.utils';

async function fetchProjectsSafe(
  projectIds: string[]
): Promise<Record<string, { name?: string; sector?: string; status?: string }>> {
  const map: Record<string, { name?: string; sector?: string; status?: string }> = {};
  if (projectIds.length === 0) return map;

  for (const select of ['id, name, sector, status', 'id, name, sector', 'id, name', '*']) {
    const { data, error } = await supabase.from('projects').select(select).in('id', projectIds);
    if (!error) {
      for (const p of data ?? []) {
        const row = p as unknown as Record<string, unknown>;
        map[String(row.id)] = {
          name: row.name ? String(row.name) : undefined,
          sector: row.sector ? String(row.sector) : undefined,
          status: row.status ? String(row.status) : undefined,
        };
      }
      return map;
    }
    if (!isSchemaError(error)) break;
  }
  return map;
}

async function fetchProfilesSafe(
  userIds: string[]
): Promise<Map<string, { name: string; email: string }>> {
  const profileMap = new Map<string, { name: string; email: string }>();
  if (userIds.length === 0) return profileMap;

  for (const select of ['id, full_name, email', 'id, full_name', 'id, email']) {
    const { data, error } = await supabase.from('profiles').select(select).in('id', userIds);
    if (!error) {
      for (const p of data ?? []) {
        const row = p as unknown as Record<string, unknown>;
        profileMap.set(String(row.id), {
          name: displayName(row.full_name as string | null, row.email as string | null),
          email: String(row.email ?? ''),
        });
      }
      return profileMap;
    }
    if (!isSchemaError(error)) break;
  }
  return profileMap;
}

async function fetchResearchTitles(
  projectIds: string[],
  researchIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const keys = [...new Set([...projectIds, ...researchIds].filter(Boolean))];
  if (keys.length === 0) return map;

  for (const select of ['project_id, problem_statement, title', 'project_id, problem_statement', '*']) {
    const { data, error } = await supabase.from('research_profiles').select(select);
    if (!error) {
      for (const r of data ?? []) {
        const row = r as unknown as Record<string, unknown>;
        const pid = row.project_id ? String(row.project_id) : null;
        const title = String(row.title ?? row.problem_statement ?? 'Research Program');
        if (pid) map.set(pid, title);
      }
      return map;
    }
    if (!isSchemaError(error)) break;
  }
  return map;
}

async function fetchBuildsByPrototype(
  prototypeIds: string[]
): Promise<Map<string, PrototypeIntelContext['builds']>> {
  const map = new Map<string, PrototypeIntelContext['builds']>();
  if (prototypeIds.length === 0) return map;

  const { data, error } = await supabase
    .from('prototype_builds')
    .select('prototype_id, status, completed_at')
    .in('prototype_id', prototypeIds);

  if (error && !isSchemaError(error)) return map;

  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    const pid = String(r.prototype_id);
    const list = map.get(pid) ?? [];
    list.push({
      status: String(r.status ?? 'queued'),
      completed_at: r.completed_at ? String(r.completed_at) : null,
    });
    map.set(pid, list);
  }
  return map;
}

async function fetchTestsByPrototype(
  prototypeIds: string[]
): Promise<Map<string, PrototypeIntelContext['tests']>> {
  const map = new Map<string, PrototypeIntelContext['tests']>();
  if (prototypeIds.length === 0) return map;

  const { data, error } = await supabase
    .from('prototype_test_runs')
    .select('prototype_id, name, verdict, score')
    .in('prototype_id', prototypeIds);

  if (error && !isSchemaError(error)) return map;

  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    const pid = String(r.prototype_id);
    const list = map.get(pid) ?? [];
    list.push({
      name: String(r.name ?? 'Test'),
      verdict: String(r.verdict ?? 'pending'),
      score: r.score != null ? Number(r.score) : null,
    });
    map.set(pid, list);
  }
  return map;
}

async function fetchFilesByPrototype(
  prototypeIds: string[]
): Promise<Map<string, PrototypeIntelContext['files']>> {
  const map = new Map<string, PrototypeIntelContext['files']>();
  if (prototypeIds.length === 0) return map;

  const { data, error } = await supabase
    .from('prototype_files')
    .select('prototype_id, file_name, file_type')
    .in('prototype_id', prototypeIds);

  if (error && !isSchemaError(error)) return map;

  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    const pid = String(r.prototype_id);
    const list = map.get(pid) ?? [];
    list.push({
      file_name: String(r.file_name ?? 'file'),
      file_type: String(r.file_type ?? 'unknown'),
    });
    map.set(pid, list);
  }
  return map;
}

async function fetchFundingByProject(
  projectIds: string[]
): Promise<Map<string, PrototypeIntelContext['fundingPitches']>> {
  const map = new Map<string, PrototypeIntelContext['fundingPitches']>();
  if (projectIds.length === 0) return map;

  const { data, error } = await supabase
    .from('funding_pitches')
    .select('id, project_id, title, status')
    .in('project_id', projectIds);

  if (error && !isSchemaError(error)) return map;

  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    const pid = String(r.project_id);
    const list = map.get(pid) ?? [];
    list.push({
      id: String(r.id),
      status: String(r.status ?? 'draft'),
      title: String(r.title ?? 'Pitch'),
    });
    map.set(pid, list);
  }
  return map;
}

async function fetchApprovalsByPrototype(
  prototypeIds: string[]
): Promise<Map<string, PrototypeIntelContext['approvals']>> {
  const map = new Map<string, PrototypeIntelContext['approvals']>();
  if (prototypeIds.length === 0) return map;

  const { data, error } = await supabase
    .from('prototype_approvals')
    .select('prototype_id, status, reviewer_role')
    .in('prototype_id', prototypeIds);

  if (error) {
    if (!isSchemaError(error)) return map;
    return map;
  }

  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    const pid = String(r.prototype_id);
    const list = map.get(pid) ?? [];
    list.push({
      status: String(r.status ?? 'pending'),
      reviewer_role: String(r.reviewer_role ?? 'reviewer'),
    });
    map.set(pid, list);
  }
  return map;
}

async function fetchArchitectureByPrototype(
  prototypeIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (prototypeIds.length === 0) return map;

  const { data, error } = await supabase
    .from('prototype_architecture')
    .select('prototype_id, layer_type')
    .in('prototype_id', prototypeIds);

  if (error) {
    if (!isSchemaError(error)) return map;
    return map;
  }

  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    const pid = String(r.prototype_id);
    map.set(pid, (map.get(pid) ?? 0) + 1);
  }
  return map;
}

async function fetchExperimentsForProjects(
  projectIds: string[]
): Promise<Map<string, PrototypeIntelContext['experiments']>> {
  const map = new Map<string, PrototypeIntelContext['experiments']>();
  if (projectIds.length === 0) return map;

  const { data, error } = await supabase
    .from('experiments')
    .select('id, project_id, title, hypothesis, status')
    .in('project_id', projectIds);

  if (error && !isSchemaError(error)) return map;

  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    const projectId = String(r.project_id);
    const list = map.get(projectId) ?? [];
    list.push({
      id: String(r.id),
      status: String(r.status ?? 'draft'),
      title: String(r.title ?? r.hypothesis ?? 'Experiment'),
    });
    map.set(projectId, list);
  }
  return map;
}

export async function loadAdminPrototypeOps(): Promise<
  AdminServiceResult<AdminPrototypeOpsSnapshot>
> {
  try {
    await assertAdminPermission('manage_projects');
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'ADMIN_SESSION_REQUIRED',
        message:
          extractErrorMessage(err) === 'Admin session required'
            ? 'Admin session required. Sign in with an admin account (profiles.role = admin or super_admin).'
            : extractErrorMessage(err),
      },
    };
  }

  try {
    const { rows: rawRows, count } = await queryPrototypesWithFallback(supabase);
    const platformTotal = count ?? rawRows.length;
    let scopeWarning: string | null = null;
    if (platformTotal > rawRows.length) {
      scopeWarning = `Showing ${rawRows.length} of ${platformTotal} platform prototypes. Set profiles.role to admin or super_admin for full access.`;
    }

    const prototypes = rawRows.map(mapPrototypeRecord);
    const prototypeIds = prototypes.map((p) => p.id);
    const projectIds = [
      ...new Set(prototypes.map((p) => p.project_id).filter(Boolean)),
    ] as string[];
    const userIds = [...new Set(prototypes.map((p) => p.user_id))];
    const researchIds = [
      ...new Set(prototypes.map((p) => p.research_id).filter(Boolean)),
    ] as string[];

    const [
      projectMap,
      profileMap,
      researchMap,
      buildsMap,
      testsMap,
      filesMap,
      fundingByProject,
      approvalsMap,
      architectureMap,
      experimentsByProject,
    ] = await Promise.all([
      fetchProjectsSafe(projectIds),
      fetchProfilesSafe(userIds),
      fetchResearchTitles(projectIds, researchIds),
      fetchBuildsByPrototype(prototypeIds),
      fetchTestsByPrototype(prototypeIds),
      fetchFilesByPrototype(prototypeIds),
      fetchFundingByProject(projectIds),
      fetchApprovalsByPrototype(prototypeIds),
      fetchArchitectureByPrototype(prototypeIds),
      fetchExperimentsForProjects(projectIds),
    ]);

    const rows = prototypes.map((proto) => {
      const owner = profileMap.get(proto.user_id) ?? { name: 'Innovator', email: '' };
      const project = proto.project_id ? projectMap[proto.project_id] ?? null : null;
      const researchTitle =
        (proto.project_id ? researchMap.get(proto.project_id) : null) ??
        (proto.research_id ? researchMap.get(proto.research_id) : null) ??
        null;

      const intel: PrototypeIntelContext = {
        builds: buildsMap.get(proto.id) ?? [],
        tests: testsMap.get(proto.id) ?? [],
        files: filesMap.get(proto.id) ?? [],
        experiments: proto.project_id ? experimentsByProject.get(proto.project_id) ?? [] : [],
        fundingPitches: proto.project_id ? fundingByProject.get(proto.project_id) ?? [] : [],
        approvals: approvalsMap.get(proto.id) ?? [],
        architectureLayers: architectureMap.get(proto.id) ?? 0,
      };

      if (!intel.files.length && proto.file_url) {
        intel.files.push({ file_name: 'primary_build', file_type: 'artifact' });
      }
      if (proto.thumbnail_url) {
        intel.files.push({ file_name: 'thumbnail', file_type: 'image' });
      }

      const technicalLead = owner.name;

      return buildAdminPrototypeRow(
        proto,
        intel,
        owner,
        project,
        researchTitle,
        technicalLead
      );
    });

    const departments = [...new Set(rows.map((r) => r.department))].sort();

    return {
      data: {
        rows,
        stats: buildAdminPrototypeStats(rows),
        executiveStageCounts: buildExecutiveStageCounts(rows),
        lifecycleInsights: buildLifecycleInsights(rows),
        maya: buildPortfolioMaya(rows),
        activity: extractPrototypeActivity(rows),
        analytics: buildPrototypeAnalytics(rows),
        platformTotal,
        scopeWarning,
        departments,
      },
      error: null,
    };
  } catch (err) {
    if (isSchemaError(err)) return schemaMissingError(err);
    return {
      data: null,
      error: {
        code: 'LOAD_PROTOTYPE_OPS_FAILED',
        message: extractErrorMessage(err),
      },
    };
  }
}

export async function bulkArchivePrototypes(
  ids: string[]
): Promise<AdminServiceResult<number>> {
  try {
    await assertAdminPermission('manage_projects');
    const { error } = await supabase
      .from('prototypes')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .in('id', ids);
    if (error) throw error;
    return { data: ids.length, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'BULK_ARCHIVE_FAILED',
        message: extractErrorMessage(err),
      },
    };
  }
}

export async function requestPrototypeReview(
  prototypeId: string
): Promise<AdminServiceResult<void>> {
  try {
    const session = await assertAdminPermission('manage_projects');
    const { error } = await supabase.from('prototype_approvals').insert({
      prototype_id: prototypeId,
      reviewer_role: 'program_manager',
      reviewer_id: session.userId,
      status: 'pending',
      comments: 'Review requested from Prototype Operations Center',
    });
    if (error && !isSchemaError(error)) throw error;
    return { data: undefined, error: null };
  } catch (err) {
    if (isSchemaError(err)) {
      return { data: undefined, error: null };
    }
    return {
      data: null,
      error: {
        code: 'REQUEST_REVIEW_FAILED',
        message: extractErrorMessage(err),
      },
    };
  }
}
