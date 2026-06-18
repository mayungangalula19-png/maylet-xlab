import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import type {
  InnovationEntityAdapter,
  InnovationEntityVersion,
  InnovationEditorActivity,
  InnovationSaveMode,
} from '../types/innovationEditor.types';
import {
  fetchEntityActivities,
  fetchInnovationVersions,
  loadInnovationDraft,
  logInnovationEditEvent,
  notifyInnovationUpdate,
  saveInnovationDraft,
  saveInnovationVersion,
} from '../services/innovationEditor.service';
import { innovationWorkflowService } from '../services/innovationWorkflow.service';
import {
  canUserEditInnovationEntity,
  resolveInnovationProjectId,
} from '../services/innovationEditorPermissions.service';
import { logAdminAudit } from '../../admin/services/adminAudit.service';

function deepEqual(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

interface UseInnovationEditorOptions<TValues> {
  adapter: InnovationEntityAdapter<TValues>;
  entityId: string;
  projectId?: string | null;
  autosaveMs?: number;
  isAdminContext?: boolean;
}

export function useInnovationEditor<TValues>({
  adapter,
  entityId,
  projectId = null,
  autosaveMs = 12000,
  isAdminContext = false,
}: UseInnovationEditorOptions<TValues>) {
  const [values, setValuesState] = useState<TValues | null>(null);
  const [baseline, setBaseline] = useState<TValues | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lastAutosaveAt, setLastAutosaveAt] = useState<string | null>(null);
  const [versions, setVersions] = useState<InnovationEntityVersion[]>([]);
  const [activities, setActivities] = useState<InnovationEditorActivity[]>([]);
  const [optimisticEntityId, setOptimisticEntityId] = useState<string | null>(entityId);
  const [resolvedProjectId, setResolvedProjectId] = useState<string | null>(projectId);
  const [canEdit, setCanEdit] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveProjectId = resolvedProjectId ?? projectId;

  const dirty = useMemo(
    () => values != null && baseline != null && !deepEqual(values, baseline),
    [values, baseline]
  );

  const refreshMeta = useCallback(
    async (projectIdOverride?: string | null) => {
      const id = optimisticEntityId ?? entityId;
      const pid = projectIdOverride ?? effectiveProjectId ?? null;
      const [versionRows, activityRows] = await Promise.all([
        fetchInnovationVersions(adapter.entityType, id),
        fetchEntityActivities(pid),
      ]);
    setVersions(
      versionRows.map((row) => ({
        id: String(row.id),
        entity_type: adapter.entityType,
        entity_id: String(row.entity_id),
        project_id: row.project_id ? String(row.project_id) : null,
        version_number: Number(row.version_number),
        snapshot: (row.snapshot as Record<string, unknown>) ?? {},
        change_summary: row.change_summary ? String(row.change_summary) : null,
        save_mode: row.save_mode as InnovationSaveMode,
        created_at: String(row.created_at),
      }))
    );
    setActivities(activityRows);
    },
    [adapter.entityType, effectiveProjectId, entityId, optimisticEntityId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      const nextUserId = session.user.id;
      const nextUserRole = profile?.role ?? null;
      setUserId(nextUserId);

      const permission = await canUserEditInnovationEntity({
        userId: nextUserId,
        userRole: nextUserRole,
        entityType: adapter.entityType,
        entityId,
        isAdminContext,
      });
      setCanEdit(permission.allowed);
      if (!permission.allowed) {
        setError(permission.reason ?? 'You do not have permission to edit.');
        return;
      }

      const resolved =
        projectId ?? (await resolveInnovationProjectId(adapter.entityType, entityId));
      setResolvedProjectId(resolved);

      const draft = await loadInnovationDraft<TValues>(
        adapter.entityType,
        entityId,
        nextUserId
      );
      const record = await adapter.load(entityId);
      const fromRecord = adapter.toValues(record);
      const merged = draft ?? fromRecord;

      setValuesState(merged);
      setBaseline(fromRecord);
      setOptimisticEntityId(entityId);
      await refreshMeta(resolved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [adapter, entityId, isAdminContext, projectId, refreshMeta]);

  useEffect(() => {
    load();
  }, [load]);

  const setValues = useCallback((updater: TValues | ((prev: TValues) => TValues)) => {
    setValuesState((prev) => {
      if (!prev) return prev;
      return typeof updater === 'function' ? (updater as (p: TValues) => TValues)(prev) : updater;
    });
  }, []);

  const persist = useCallback(
    async (mode: InnovationSaveMode) => {
      if (!values || !userId) return { ok: false as const, error: 'Not ready' };
      if (!canEdit) return { ok: false as const, error: 'You do not have permission to edit.' };

      const validationError = adapter.validate(values, mode);
      if (validationError) {
        setError(validationError);
        return { ok: false as const, error: validationError };
      }

      const isAutosave = mode === 'autosave';
      const isDraft = mode === 'draft';
      if (isAutosave) setAutosaving(true);
      else setSaving(true);
      setError(null);

      const previousBaseline = baseline;
      setBaseline(values);

      try {
        if (isDraft || isAutosave) {
          await saveInnovationDraft({
            entityType: adapter.entityType,
            entityId,
            projectId: effectiveProjectId ?? null,
            userId,
            payload: values as Record<string, unknown>,
            isPublished: false,
          });
        }

        let persistedEntityId = entityId;
        if (!isAutosave) {
          const result = await adapter.persist(values, {
            entityId,
            projectId: effectiveProjectId ?? null,
            userId,
            mode,
          });
          persistedEntityId = result.entityId;
          setBaseline(adapter.toValues(result.record as never));
          setValuesState(adapter.toValues(result.record as never));
        }

        await saveInnovationVersion({
          entityType: adapter.entityType,
          entityId: persistedEntityId,
          projectId: effectiveProjectId ?? null,
          userId,
          snapshot: values as Record<string, unknown>,
          saveMode: mode,
          changeSummary: dirty ? 'Field updates' : undefined,
        });

        const score = adapter.readinessScore?.(values);
        await innovationWorkflowService.onEntitySaved(
          effectiveProjectId ?? null,
          adapter.workflowStageId,
          score,
          mode
        );

        await logInnovationEditEvent({
          userId,
          projectId: effectiveProjectId ?? null,
          entityType: adapter.entityType,
          entityId: persistedEntityId,
          entityLabel: adapter.entityLabel,
          mode,
        });

        if (isAdminContext) {
          await logAdminAudit({
            resourceType: adapter.entityType,
            resourceId: persistedEntityId,
            resourceName: adapter.entityLabel,
            action: 'update',
            projectId: effectiveProjectId ?? null,
            metadata: {
              save_mode: mode,
              admin_edit: true,
              entity_type: adapter.entityType,
            },
            after: values as Record<string, unknown>,
          });
        }

        await notifyInnovationUpdate({
          userId,
          projectId: effectiveProjectId ?? null,
          entityType: adapter.entityType,
          entityLabel: adapter.entityLabel,
          mode,
        });

        const now = new Date().toISOString();
        if (isAutosave) setLastAutosaveAt(now);
        else setLastSavedAt(now);

        setOptimisticEntityId(persistedEntityId);
        await refreshMeta(effectiveProjectId);

        return { ok: true as const, entityId: persistedEntityId };
      } catch (err) {
        setBaseline(previousBaseline);
        const message = err instanceof Error ? err.message : 'Save failed';
        setError(message);
        return { ok: false as const, error: message };
      } finally {
        setSaving(false);
        setAutosaving(false);
      }
    },
    [
      adapter,
      baseline,
      canEdit,
      dirty,
      effectiveProjectId,
      entityId,
      isAdminContext,
      refreshMeta,
      userId,
      values,
    ]
  );

  const saveDraft = useCallback(() => persist('draft'), [persist]);
  const publish = useCallback(() => persist('publish'), [persist]);
  const autosave = useCallback(() => persist('autosave'), [persist]);

  useEffect(() => {
    if (!dirty || !values || loading) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void autosave();
    }, autosaveMs);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [autosave, autosaveMs, dirty, loading, values]);

  const restoreVersion = useCallback(
    (version: InnovationEntityVersion) => {
      setValuesState(version.snapshot as TValues);
    },
    []
  );

  return {
    values,
    setValues,
    baseline,
    dirty,
    loading,
    saving,
    autosaving,
    error,
    lastSavedAt,
    lastAutosaveAt,
    versions,
    activities,
    canEdit,
    optimisticEntityId,
    saveDraft,
    publish,
    refresh: load,
    restoreVersion,
  };
}
