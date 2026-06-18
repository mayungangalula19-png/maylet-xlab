import { supabase } from '../../../lib/supabase/client';
import { normalizeExperimentRow } from '../../../lib/experiment/experimentOps';
import { displayName } from '../utils/adminPage.utils';
import { assertAdminPermission } from './adminAuth.service';
import { logAdminAudit } from './adminAudit.service';
import type { AdminServiceResult } from '../types/projectAdmin.types';
import type {
  AdminExperimentDetailBundle,
  AdminInnovationOwner,
  AdminPrototypeDetail,
  AdminPrototypeDetailBundle,
  AdminVaultDetail,
  AdminVaultDetailBundle,
} from '../types/innovationAdmin.types';

async function fetchOwner(userId: string): Promise<AdminInnovationOwner> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', userId)
    .maybeSingle();

  return {
    id: userId,
    name: displayName(data?.full_name, data?.email),
    email: data?.email ?? '',
  };
}

async function fetchProjectName(projectId: string | null): Promise<string | null> {
  if (!projectId) return null;
  const { data } = await supabase.from('projects').select('name').eq('id', projectId).maybeSingle();
  return data?.name ? String(data.name) : null;
}

export async function fetchAdminExperimentDetail(
  id: string
): Promise<AdminServiceResult<AdminExperimentDetailBundle>> {
  try {
    const { data: row, error } = await supabase.from('experiments').select('*').eq('id', id).single();
    if (error) throw error;

    const userId = String(row.user_id ?? '');
    const projectId = row.project_id ? String(row.project_id) : null;

    const [owner, projectName, prototypeName] = await Promise.all([
      fetchOwner(userId),
      fetchProjectName(projectId),
      resolvePrototypeName(row as Record<string, unknown>),
    ]);

    const project = projectName ? { name: projectName } : null;
    const experiment = normalizeExperimentRow(row as Record<string, unknown>, project, prototypeName);

    return { data: { experiment, owner }, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'FETCH_EXPERIMENT_FAILED',
        message: err instanceof Error ? err.message : 'Experiment not found',
      },
    };
  }
}

async function resolvePrototypeName(row: Record<string, unknown>): Promise<string | null> {
  const findings = row.findings;
  if (!findings || typeof findings !== 'string') return null;
  try {
    const parsed = JSON.parse(findings) as { prototype_id?: string };
    if (!parsed.prototype_id) return null;
    const { data } = await supabase
      .from('prototypes')
      .select('name')
      .eq('id', parsed.prototype_id)
      .maybeSingle();
    return data?.name ? String(data.name) : null;
  } catch {
    return null;
  }
}

function mapPrototype(row: Record<string, unknown>, projectName: string | null): AdminPrototypeDetail {
  return {
    id: String(row.id),
    name: String(row.name ?? 'Untitled'),
    description: (row.description as string | null) ?? null,
    status: String(row.status ?? 'draft'),
    version: String(row.version ?? '1.0'),
    file_url: (row.file_url as string | null) ?? null,
    thumbnail_url: (row.thumbnail_url as string | null) ?? null,
    views: Number(row.views ?? 0),
    downloads: Number(row.downloads ?? 0),
    project_id: row.project_id ? String(row.project_id) : null,
    project_name: projectName,
    user_id: String(row.user_id ?? ''),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

export async function fetchAdminPrototypeDetail(
  id: string
): Promise<AdminServiceResult<AdminPrototypeDetailBundle>> {
  try {
    const { data: row, error } = await supabase.from('prototypes').select('*').eq('id', id).single();
    if (error) throw error;

    const userId = String(row.user_id ?? '');
    const projectId = row.project_id ? String(row.project_id) : null;

    const [owner, projectName, fileCountResult] = await Promise.all([
      fetchOwner(userId),
      fetchProjectName(projectId),
      supabase
        .from('prototype_files')
        .select('*', { count: 'exact', head: true })
        .eq('prototype_id', id),
    ]);

    return {
      data: {
        prototype: mapPrototype(row as Record<string, unknown>, projectName),
        owner,
        fileCount: fileCountResult.count ?? 0,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'FETCH_PROTOTYPE_FAILED',
        message: err instanceof Error ? err.message : 'Prototype not found',
      },
    };
  }
}

function mapVaultItem(row: Record<string, unknown>): AdminVaultDetail {
  return {
    id: String(row.id),
    title: String(row.title ?? row.name ?? 'Vault item'),
    content: (row.content as string | null) ?? null,
    user_id: String(row.user_id ?? ''),
    created_at: String(row.created_at ?? ''),
  };
}

export async function fetchAdminVaultDetail(
  id: string
): Promise<AdminServiceResult<AdminVaultDetailBundle>> {
  try {
    const { data: row, error } = await supabase.from('vault_items').select('*').eq('id', id).single();
    if (error) throw error;

    const userId = String(row.user_id ?? '');
    const owner = await fetchOwner(userId);

    return {
      data: { item: mapVaultItem(row as Record<string, unknown>), owner },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'FETCH_VAULT_FAILED',
        message: err instanceof Error ? err.message : 'Vault item not found',
      },
    };
  }
}

export async function deleteAdminExperiment(
  id: string,
  title: string
): Promise<AdminServiceResult<void>> {
  try {
    await assertAdminPermission('delete_records');
    const { error } = await supabase.from('experiments').delete().eq('id', id);
    if (error) throw error;

    await logAdminAudit({
      resourceType: 'experiment',
      resourceId: id,
      resourceName: title,
      action: 'delete',
    });

    return { data: undefined, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'DELETE_EXPERIMENT_FAILED',
        message: err instanceof Error ? err.message : 'Failed to delete experiment',
      },
    };
  }
}

export async function deleteAdminPrototype(
  id: string,
  name: string
): Promise<AdminServiceResult<void>> {
  try {
    await assertAdminPermission('delete_records');
    const { error } = await supabase.from('prototypes').delete().eq('id', id);
    if (error) throw error;

    await logAdminAudit({
      resourceType: 'prototype',
      resourceId: id,
      resourceName: name,
      action: 'delete',
    });

    return { data: undefined, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'DELETE_PROTOTYPE_FAILED',
        message: err instanceof Error ? err.message : 'Failed to delete prototype',
      },
    };
  }
}

export async function deleteAdminVaultItem(
  id: string,
  title: string
): Promise<AdminServiceResult<void>> {
  try {
    await assertAdminPermission('delete_records');
    const { error } = await supabase.from('vault_items').delete().eq('id', id);
    if (error) throw error;

    await logAdminAudit({
      resourceType: 'vault_item',
      resourceId: id,
      resourceName: title,
      action: 'delete',
    });

    return { data: undefined, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'DELETE_VAULT_FAILED',
        message: err instanceof Error ? err.message : 'Failed to delete vault item',
      },
    };
  }
}
