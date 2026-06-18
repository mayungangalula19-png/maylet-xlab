import { supabase } from '../../../../lib/supabase/client';
import { assertAdminPermission } from '../../services/adminAuth.service';
import { displayName } from '../../utils/adminPage.utils';
import type { AdminServiceResult } from '../../types/projectAdmin.types';
import type { AdminVaultOpsSnapshot } from '../types/vaultOpsAdmin.types';
import {
  buildAdminVaultStats,
  buildKnowledgeGraph,
  extractApprovalItems,
  buildCollections,
  buildDomains,
  buildFolderTree,
  buildPortfolioMaya,
  buildVaultAnalytics,
  buildVaultAssetRow,
  extractErrorMessage,
  extractVaultActivity,
  isSchemaError,
  linkRelatedAssets,
  schemaMissingError,
  type RawVaultInput,
} from '../utils/vaultOpsAdmin.utils';

async function fetchProfilesSafe(
  userIds: string[]
): Promise<Map<string, { name: string; email: string }>> {
  const map = new Map<string, { name: string; email: string }>();
  if (userIds.length === 0) return map;
  for (const select of ['id, full_name, email', 'id, full_name', 'id, email']) {
    const { data, error } = await supabase.from('profiles').select(select).in('id', userIds);
    if (!error) {
      for (const p of data ?? []) {
        const row = p as unknown as Record<string, unknown>;
        map.set(String(row.id), {
          name: displayName(row.full_name as string | null, row.email as string | null),
          email: String(row.email ?? ''),
        });
      }
      return map;
    }
    if (!isSchemaError(error)) break;
  }
  return map;
}

async function fetchProjectsMap(
  projectIds: string[]
): Promise<Map<string, { name?: string; sector?: string }>> {
  const map = new Map<string, { name?: string; sector?: string }>();
  if (projectIds.length === 0) return map;
  for (const select of ['id, name, sector', 'id, name', '*']) {
    const { data, error } = await supabase.from('projects').select(select).in('id', projectIds);
    if (!error) {
      for (const p of data ?? []) {
        const row = p as unknown as Record<string, unknown>;
        map.set(String(row.id), {
          name: row.name ? String(row.name) : undefined,
          sector: row.sector ? String(row.sector) : undefined,
        });
      }
      return map;
    }
    if (!isSchemaError(error)) break;
  }
  return map;
}

async function fetchResearchPrograms(projectIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (projectIds.length === 0) return map;
  const { data, error } = await supabase
    .from('research_profiles')
    .select('project_id, title, problem_statement');
  if (error && !isSchemaError(error)) return map;
  for (const r of data ?? []) {
    const row = r as Record<string, unknown>;
    const pid = row.project_id ? String(row.project_id) : null;
    if (pid && projectIds.includes(pid)) {
      map.set(pid, String(row.title ?? row.problem_statement ?? 'Research Program'));
    }
  }
  return map;
}

async function fetchVaultEntries(): Promise<RawVaultInput[]> {
  const { data, error } = await supabase
    .from('vault_entries')
    .select(
      'id, user_id, title, description, content, tags, is_confidential, version, created_at, updated_at'
    )
    .order('updated_at', { ascending: false });
  if (error && !isSchemaError(error)) return [];
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      source: 'vault_entry' as const,
      title: String(r.title ?? 'Vault entry'),
      userId: String(r.user_id),
      description: r.description ? String(r.description) : null,
      content: r.content ? String(r.content) : null,
      tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
      isConfidential: r.is_confidential !== false,
      isPublic: r.is_confidential === false,
      version: Number(r.version ?? 1),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at ?? r.created_at),
    };
  });
}

async function fetchVaultItems(): Promise<RawVaultInput[]> {
  const { data, error } = await supabase
    .from('vault_items')
    .select('id, user_id, title, name, content, created_at')
    .order('created_at', { ascending: false });
  if (error && !isSchemaError(error)) return [];
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const title = String(r.title ?? r.name ?? 'Vault item');
    return {
      id: String(r.id),
      source: 'vault_item' as const,
      title,
      userId: String(r.user_id),
      content: r.content ? String(r.content) : null,
      tags: [],
      isConfidential: true,
      createdAt: String(r.created_at),
      updatedAt: String(r.created_at),
    };
  });
}

async function fetchDocuments(): Promise<RawVaultInput[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, user_id, project_id, name, file_url, file_type, size_bytes, created_at')
    .order('created_at', { ascending: false });
  if (error && !isSchemaError(error)) return [];
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      source: 'document' as const,
      title: String(r.name ?? 'Document'),
      userId: String(r.user_id),
      projectId: r.project_id ? String(r.project_id) : null,
      fileUrl: r.file_url ? String(r.file_url) : null,
      fileType: r.file_type ? String(r.file_type) : null,
      sizeBytes: r.size_bytes != null ? Number(r.size_bytes) : null,
      tags: ['document'],
      isConfidential: false,
      createdAt: String(r.created_at),
      updatedAt: String(r.created_at),
    };
  });
}

async function fetchPrototypeFiles(): Promise<RawVaultInput[]> {
  const { data, error } = await supabase
    .from('prototype_files')
    .select('id, prototype_id, file_name, file_type, file_size, url, uploaded_at');
  if (error && !isSchemaError(error)) return [];

  const protoIds = [
    ...new Set(
      (data ?? []).map((r) => String((r as Record<string, unknown>).prototype_id)).filter(Boolean)
    ),
  ];
  const protoMap = new Map<string, { userId: string; projectId: string | null; name: string }>();
  if (protoIds.length > 0) {
    const { data: protos } = await supabase
      .from('prototypes')
      .select('id, user_id, project_id, name')
      .in('id', protoIds);
    for (const p of protos ?? []) {
      const row = p as Record<string, unknown>;
      protoMap.set(String(row.id), {
        userId: String(row.user_id),
        projectId: row.project_id ? String(row.project_id) : null,
        name: String(row.name ?? 'Prototype'),
      });
    }
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const protoId = String(r.prototype_id);
    const proto = protoMap.get(protoId);
    return {
      id: String(r.id),
      source: 'prototype_file' as const,
      title: String(r.file_name ?? 'Prototype file'),
      userId: proto?.userId ?? '',
      projectId: proto?.projectId ?? null,
      fileUrl: r.url ? String(r.url) : null,
      fileType: r.file_type ? String(r.file_type) : null,
      sizeBytes: r.file_size != null ? Number(r.file_size) : null,
      tags: ['prototype', proto?.name ?? ''].filter(Boolean),
      isConfidential: false,
      createdAt: String(r.uploaded_at ?? new Date().toISOString()),
      updatedAt: String(r.uploaded_at ?? new Date().toISOString()),
    };
  }).filter((r) => r.userId);
}

async function fetchPrototypeAssets(): Promise<RawVaultInput[]> {
  const { data, error } = await supabase
    .from('prototypes')
    .select(
      'id, user_id, project_id, name, description, file_url, thumbnail_url, version, status, created_at, updated_at'
    )
    .order('updated_at', { ascending: false });
  if (error && !isSchemaError(error)) return [];
  return (data ?? []).flatMap((row) => {
    const r = row as Record<string, unknown>;
    const base = {
      userId: String(r.user_id),
      projectId: r.project_id ? String(r.project_id) : null,
      tags: ['prototype'],
      status: String(r.status ?? 'draft'),
      version: Number(String(r.version ?? '1').replace(/\D/g, '') || 1),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at ?? r.created_at),
    };
    const items: RawVaultInput[] = [
      {
        id: String(r.id),
        source: 'prototype',
        title: String(r.name ?? 'Prototype'),
        description: r.description ? String(r.description) : null,
        fileUrl: r.file_url ? String(r.file_url) : null,
        ...base,
      },
    ];
    if (r.thumbnail_url) {
      items.push({
        id: `${r.id}-thumb`,
        source: 'prototype_file',
        title: `${r.name} — Thumbnail`,
        fileUrl: String(r.thumbnail_url),
        fileType: 'image',
        ...base,
      });
    }
    return items;
  });
}

async function fetchExperiments(): Promise<RawVaultInput[]> {
  const { data, error } = await supabase
    .from('experiments')
    .select('id, user_id, project_id, title, hypothesis, status, findings, results, created_at, updated_at')
    .order('updated_at', { ascending: false });
  if (error && !isSchemaError(error)) return [];
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      source: 'experiment' as const,
      title: String(r.title ?? r.hypothesis ?? 'Experiment'),
      userId: String(r.user_id),
      projectId: r.project_id ? String(r.project_id) : null,
      content: [r.findings, r.results].filter(Boolean).map(String).join('\n').slice(0, 500) || null,
      tags: ['experiment'],
      status: String(r.status ?? 'draft'),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at ?? r.created_at),
    };
  });
}

async function fetchFundingPitches(): Promise<RawVaultInput[]> {
  const { data, error } = await supabase
    .from('funding_pitches')
    .select(
      'id, user_id, project_id, title, summary, description, pitch_deck_url, status, created_at, updated_at'
    )
    .order('updated_at', { ascending: false });
  if (error && !isSchemaError(error)) return [];
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      source: 'funding_pitch' as const,
      title: String(r.title ?? 'Funding pitch'),
      userId: String(r.user_id),
      projectId: r.project_id ? String(r.project_id) : null,
      description: r.summary ? String(r.summary) : r.description ? String(r.description) : null,
      fileUrl: r.pitch_deck_url ? String(r.pitch_deck_url) : null,
      fileType: r.pitch_deck_url ? 'pdf' : null,
      tags: ['funding', 'investor'],
      status: String(r.status ?? 'draft'),
      isConfidential: true,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at ?? r.created_at),
    };
  });
}

async function fetchValidations(): Promise<RawVaultInput[]> {
  const { data, error } = await supabase
    .from('validations')
    .select('id, user_id, project_id, decision, overall_score, summary, created_at, updated_at')
    .order('updated_at', { ascending: false });
  if (error && !isSchemaError(error)) return [];
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      source: 'validation' as const,
      title: `Validation Report — ${String(r.decision ?? 'pending')}`,
      userId: String(r.user_id),
      projectId: r.project_id ? String(r.project_id) : null,
      content: r.summary ? String(r.summary) : null,
      tags: ['validation', `score:${r.overall_score ?? 0}`],
      status: String(r.decision ?? 'pending'),
      isConfidential: true,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at ?? r.created_at),
    };
  });
}

async function fetchIpRecords(): Promise<RawVaultInput[]> {
  const { data, error } = await supabase
    .from('ai_innovation_vault')
    .select('id, user_id, vault_entry_id, version_hash, created_at')
    .order('created_at', { ascending: false });
  if (error && !isSchemaError(error)) return [];
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      source: 'ip_record' as const,
      title: `IP Record ${String(r.version_hash ?? '').slice(0, 12)}`,
      userId: String(r.user_id),
      tags: ['ip', 'patent'],
      isConfidential: true,
      content: r.vault_entry_id ? `Linked entry: ${r.vault_entry_id}` : null,
      createdAt: String(r.created_at ?? new Date().toISOString()),
      updatedAt: String(r.created_at ?? new Date().toISOString()),
    };
  });
}

export async function loadAdminVaultOps(): Promise<AdminServiceResult<AdminVaultOpsSnapshot>> {
  try {
    await assertAdminPermission('manage_projects');
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'ADMIN_SESSION_REQUIRED',
        message:
          extractErrorMessage(err) === 'Admin session required'
            ? 'Admin session required. Sign in with an admin account.'
            : extractErrorMessage(err),
      },
    };
  }

  try {
    const [
      vaultEntries,
      vaultItems,
      documents,
      prototypeFiles,
      prototypes,
      experiments,
      fundingPitches,
      validations,
      ipRecords,
    ] = await Promise.all([
      fetchVaultEntries(),
      fetchVaultItems(),
      fetchDocuments(),
      fetchPrototypeFiles(),
      fetchPrototypeAssets(),
      fetchExperiments(),
      fetchFundingPitches(),
      fetchValidations(),
      fetchIpRecords(),
    ]);

    const rawAssets = [
      ...vaultEntries,
      ...vaultItems,
      ...documents,
      ...prototypeFiles,
      ...prototypes,
      ...experiments,
      ...fundingPitches,
      ...validations,
      ...ipRecords,
    ];

    const projectIds = [
      ...new Set(rawAssets.map((a) => a.projectId).filter(Boolean)),
    ] as string[];
    const userIds = [...new Set(rawAssets.map((a) => a.userId).filter(Boolean))];

    const [profileMap, projectMap, programMap] = await Promise.all([
      fetchProfilesSafe(userIds),
      fetchProjectsMap(projectIds),
      fetchResearchPrograms(projectIds),
    ]);

    let rows = rawAssets.map((raw) => {
      const owner = profileMap.get(raw.userId) ?? { name: 'Innovator', email: '' };
      const project = raw.projectId ? projectMap.get(raw.projectId) ?? null : null;
      const program = raw.projectId ? programMap.get(raw.projectId) ?? null : null;
      return buildVaultAssetRow(raw, owner, project, program);
    });

    rows = linkRelatedAssets(rows);
    rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const departments = [...new Set(rows.map((r) => r.department))].sort();
    const authors = [...new Set(rows.map((r) => r.authorName))].sort();

    return {
      data: {
        rows,
        stats: buildAdminVaultStats(rows),
        folders: buildFolderTree(rows),
        collections: buildCollections(rows),
        domains: buildDomains(rows),
        maya: buildPortfolioMaya(rows),
        activity: extractVaultActivity(rows),
        analytics: buildVaultAnalytics(rows),
        platformTotal: rows.length,
        scopeWarning: null,
        departments,
        authors,
      },
      error: null,
    };
  } catch (err) {
    if (isSchemaError(err)) return schemaMissingError(err);
    return {
      data: null,
      error: {
        code: 'LOAD_VAULT_OPS_FAILED',
        message: extractErrorMessage(err),
      },
    };
  }
}

export async function bulkArchiveVaultAssets(
  sourceKeys: string[]
): Promise<AdminServiceResult<number>> {
  try {
    await assertAdminPermission('manage_projects');
    let count = 0;
    for (const key of sourceKeys) {
      const [source, id] = key.split(':') as [string, string];
      if (source === 'vault_entry') {
        const { error } = await supabase
          .from('vault_entries')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', id);
        if (!error) count += 1;
        try {
          await supabase.from('vault_audit_events').insert({
            asset_source: source,
            asset_id: id,
            action: 'archived',
          });
        } catch {
          /* audit table optional until migration applied */
        }
      }
    }
    return { data: count, error: null };
  } catch (err) {
    return {
      data: null,
      error: { code: 'BULK_ARCHIVE_FAILED', message: extractErrorMessage(err) },
    };
  }
}

export async function requestVaultReview(sourceKey: string): Promise<AdminServiceResult<void>> {
  try {
    const session = await assertAdminPermission('manage_projects');
    const [source, id] = sourceKey.split(':');
    const { error } = await supabase.from('vault_approvals').insert({
      asset_source: source,
      asset_id: id,
      reviewer_id: session.userId,
      reviewer_role: 'admin',
      status: 'pending',
      comments: 'Review requested from Innovation Vault Command Center',
    });
    if (error && !isSchemaError(error)) throw error;
    return { data: undefined, error: null };
  } catch (err) {
    if (isSchemaError(err)) return { data: undefined, error: null };
    return {
      data: null,
      error: { code: 'REQUEST_REVIEW_FAILED', message: extractErrorMessage(err) },
    };
  }
}

export { buildKnowledgeGraph, extractApprovalItems };