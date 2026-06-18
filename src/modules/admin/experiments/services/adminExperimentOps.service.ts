import { supabase } from '../../../../lib/supabase/client';
import {
  buildPortfolioMaya,
  detectBottlenecks,
  normalizeExperimentRow,
  type ExperimentRecord,
} from '../../../../lib/experiment/experimentOps';
import { assertAdminPermission } from '../../services/adminAuth.service';
import { displayName } from '../../utils/adminPage.utils';
import type { AdminServiceResult } from '../../types/projectAdmin.types';
import type { AdminExperimentOpsSnapshot } from '../types/experimentOpsAdmin.types';
import {
  buildAdminExperimentRow,
  buildAdminExperimentStats,
  buildExecutiveStageCounts,
  buildExperimentAnalytics,
  extractErrorMessage,
  extractExperimentActivity,
  isSchemaError,
  queryExperimentsWithFallback,
  schemaMissingError,
} from '../utils/experimentOpsAdmin.utils';

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

async function fetchProjectsSafe(
  projectIds: string[]
): Promise<Record<string, { name?: string; sector?: string }>> {
  const map: Record<string, { name?: string; sector?: string }> = {};
  if (projectIds.length === 0) return map;

  for (const select of ['id, name, sector', 'id, name', '*']) {
    const { data, error } = await supabase.from('projects').select(select).in('id', projectIds);
    if (!error) {
      for (const p of data ?? []) {
        const row = p as unknown as Record<string, unknown>;
        map[String(row.id)] = {
          name: row.name ? String(row.name) : undefined,
          sector: row.sector ? String(row.sector) : undefined,
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

async function fetchPrototypeNames(
  rows: Record<string, unknown>[]
): Promise<Record<string, string>> {
  const prototypeIds = [...new Set(rows.map(parsePrototypeIdFromRow).filter(Boolean))] as string[];
  const map: Record<string, string> = {};
  if (prototypeIds.length === 0) return map;

  const { data, error } = await supabase.from('prototypes').select('id, name').in('id', prototypeIds);
  if (error && !isSchemaError(error)) return map;
  for (const p of data ?? []) {
    map[String(p.id)] = String(p.name ?? 'Prototype');
  }
  return map;
}

export async function loadAdminExperimentOps(): Promise<
  AdminServiceResult<AdminExperimentOpsSnapshot>
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
    const { rows: rawRows, count } = await queryExperimentsWithFallback(supabase);

    const platformTotal = count ?? rawRows.length;
    let scopeWarning: string | null = null;
    if (platformTotal > rawRows.length) {
      scopeWarning = `Showing ${rawRows.length} of ${platformTotal} platform experiments. Set profiles.role to admin or super_admin for full access.`;
    }

    const projectIds = [
      ...new Set(
        rawRows.map((row) => (row.project_id ? String(row.project_id) : null)).filter(Boolean)
      ),
    ] as string[];
    const userIds = [...new Set(rawRows.map((row) => String(row.user_id)).filter(Boolean))];

    const [projectMap, profileMap, prototypeNames] = await Promise.all([
      fetchProjectsSafe(projectIds),
      fetchProfilesSafe(userIds),
      fetchPrototypeNames(rawRows),
    ]);

    const experiments: ExperimentRecord[] = rawRows.map((row) => {
      const projectId = row.project_id ? String(row.project_id) : null;
      const project = projectId ? projectMap[projectId] ?? null : null;
      const prototypeId = parsePrototypeIdFromRow(row);
      return normalizeExperimentRow(
        row,
        project,
        prototypeId ? prototypeNames[prototypeId] ?? null : null
      );
    });

    const rows = experiments.map((exp) => {
      const userId = rawRows.find((r) => String(r.id) === exp.id)?.user_id;
      const owner = profileMap.get(String(userId)) ?? { name: 'Research Lead', email: '' };
      return buildAdminExperimentRow(exp, owner);
    });

    void detectBottlenecks(experiments);

    return {
      data: {
        rows,
        stats: buildAdminExperimentStats(rows),
        executiveStageCounts: buildExecutiveStageCounts(rows),
        maya: buildPortfolioMaya(experiments),
        activity: extractExperimentActivity(rows),
        analytics: buildExperimentAnalytics(rows),
        platformTotal,
        scopeWarning,
      },
      error: null,
    };
  } catch (err) {
    if (isSchemaError(err)) return schemaMissingError(err);
    return {
      data: null,
      error: {
        code: 'LOAD_EXPERIMENT_OPS_FAILED',
        message: extractErrorMessage(err),
      },
    };
  }
}
