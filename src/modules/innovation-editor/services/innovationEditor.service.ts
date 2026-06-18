import { supabase } from '../../../lib/supabase/client';
import { logActivity } from '../../../lib/supabase/dbHelpers';
import type { InnovationEntityType, InnovationSaveMode } from '../types/innovationEditor.types';

export async function loadInnovationDraft<T>(
  entityType: InnovationEntityType,
  entityId: string,
  userId: string
): Promise<T | null> {
  const { data, error } = await supabase
    .from('innovation_entity_drafts')
    .select('payload')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (/does not exist|Could not find the table/i.test(error.message)) return null;
    throw new Error(error.message);
  }
  return (data?.payload as T) ?? null;
}

export async function saveInnovationDraft<T extends Record<string, unknown>>(options: {
  entityType: InnovationEntityType;
  entityId: string;
  projectId: string | null;
  userId: string;
  payload: T;
  isPublished?: boolean;
}) {
  const { error } = await supabase.from('innovation_entity_drafts').upsert(
    {
      entity_type: options.entityType,
      entity_id: options.entityId,
      project_id: options.projectId,
      user_id: options.userId,
      payload: options.payload,
      is_published: options.isPublished ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'entity_type,entity_id,user_id' }
  );

  if (error && !/does not exist|Could not find the table/i.test(error.message)) {
    throw new Error(error.message);
  }
}

export async function fetchInnovationVersions(
  entityType: InnovationEntityType,
  entityId: string,
  limit = 20
) {
  const { data, error } = await supabase
    .from('innovation_entity_versions')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('version_number', { ascending: false })
    .limit(limit);

  if (error) {
    if (/does not exist|Could not find the table/i.test(error.message)) return [];
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function saveInnovationVersion(options: {
  entityType: InnovationEntityType;
  entityId: string;
  projectId: string | null;
  userId: string;
  snapshot: Record<string, unknown>;
  saveMode: InnovationSaveMode;
  changeSummary?: string;
}) {
  const { data: latest } = await supabase
    .from('innovation_entity_versions')
    .select('version_number')
    .eq('entity_type', options.entityType)
    .eq('entity_id', options.entityId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const versionNumber = (latest?.version_number ?? 0) + 1;

  const { data, error } = await supabase
    .from('innovation_entity_versions')
    .insert({
      entity_type: options.entityType,
      entity_id: options.entityId,
      project_id: options.projectId,
      user_id: options.userId,
      version_number: versionNumber,
      snapshot: options.snapshot,
      change_summary: options.changeSummary ?? null,
      save_mode: options.saveMode,
    })
    .select('*')
    .single();

  if (error) {
    if (/does not exist|Could not find the table/i.test(error.message)) return null;
    throw new Error(error.message);
  }
  return data;
}

export async function fetchEntityActivities(projectId: string | null, limit = 15) {
  if (!projectId) return [];
  const { data, error } = await supabase
    .from('activities')
    .select('id, type, title, metadata, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    type: String(row.type),
    created_at: String(row.created_at),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }));
}

export async function logInnovationEditEvent(options: {
  userId: string;
  projectId: string | null;
  entityType: InnovationEntityType;
  entityId: string;
  entityLabel: string;
  mode: InnovationSaveMode;
  changeSummary?: string;
}) {
  const action =
    options.mode === 'publish'
      ? 'published'
      : options.mode === 'autosave'
        ? 'autosaved'
        : 'saved draft';

  await logActivity({
    user_id: options.userId,
    project_id: options.projectId,
    type: options.entityType,
    title: `${options.entityLabel} ${action}`,
    metadata: {
      target_type: options.entityType,
      target_name: options.entityLabel,
      entity_id: options.entityId,
      save_mode: options.mode,
      change_summary: options.changeSummary,
    },
  });
}

export async function notifyInnovationUpdate(options: {
  userId: string;
  projectId: string | null;
  entityType: InnovationEntityType;
  entityLabel: string;
  mode: InnovationSaveMode;
}) {
  if (options.mode === 'autosave') return;

  const title =
    options.mode === 'publish'
      ? `${options.entityLabel} published`
      : `${options.entityLabel} draft saved`;

  const { error } = await supabase.from('notifications').insert({
    user_id: options.userId,
    title,
    body: `Your ${options.entityType} update was saved successfully.`,
    type: 'innovation_edit',
    link: null,
    read: false,
  });

  if (error && !/does not exist|Could not find the table/i.test(error.message)) {
    console.warn('[innovation-editor] notification failed:', error.message);
  }
}
