import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useWorkflowGuard } from '../../workflow';
import { createPrototype, prototypeService } from '../services/prototypeService';
import {
  clearDraft,
  loadDraft,
  saveDraft,
  savePrototypeMeta,
} from '../services/prototypeCreation.storage';
import type { PrototypeCreationDraft } from '../types/prototypeCreation.types';
import { emptyPrototypeDraft } from '../types/prototypeCreation.types';
import {
  overallCompletion,
  sectionCompletion,
  validateCreationDraft,
} from '../validation/prototypeCreation.validation';
import type { PrototypeScreenshot } from '../types/prototype.types';
import { screenshotService } from '../services/screenshotService';

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface ProjectOption {
  id: string;
  name: string;
}

interface Options {
  userId: string;
  draftKey: string;
  defaultProjectId?: string;
  defaultResearchId?: string;
}

export function usePrototypeCreation({
  userId,
  draftKey,
  defaultProjectId,
  defaultResearchId,
}: Options) {
  const [draft, setDraft] = useState<PrototypeCreationDraft>(() => {
    const stored = loadDraft(userId, draftKey);
    if (stored) return stored;
    return emptyPrototypeDraft({
      projectId: defaultProjectId,
      researchId: defaultResearchId ?? defaultProjectId,
    });
  });
  const [prototypeId, setPrototypeId] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<PrototypeScreenshot[]>([]);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creatingRef = useRef(false);

  const gateProjectId = draft.projectId || defaultProjectId;
  const { allowed: gateAllowed, reason: gateReason, loading: gateLoading } = useWorkflowGuard(
    gateProjectId,
    'prototype'
  );

  const sections = useMemo(() => sectionCompletion(draft), [draft]);
  const completion = useMemo(() => overallCompletion(sections), [sections]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setProjects((data ?? []) as ProjectOption[]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refreshScreenshots = useCallback(async (id: string) => {
    const list = await screenshotService.list(id);
    setScreenshots(list);
  }, []);

  const ensurePrototypeRecord = useCallback(async (): Promise<string | null> => {
    if (prototypeId) return prototypeId;
    const name = draft.name.trim();
    if (name.length < 3 || creatingRef.current) return null;

    creatingRef.current = true;
    setSaveState('saving');
    try {
      const created = await createPrototype({
        userId,
        name,
        description: draft.description.trim() || undefined,
        status: 'draft',
        projectId: draft.projectId || null,
        researchId: draft.researchId || draft.projectId || null,
      });
      setPrototypeId(created.id);
      savePrototypeMeta(created.id, draft);
      await refreshScreenshots(created.id);
      setSaveState('saved');
      return created.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create draft record');
      setSaveState('error');
      return null;
    } finally {
      creatingRef.current = false;
    }
  }, [prototypeId, draft, userId, refreshScreenshots]);

  const persistDraft = useCallback(async () => {
    setSaveState('saving');
    setError(null);
    try {
      saveDraft(userId, draftKey, draft);
      if (prototypeId) {
        savePrototypeMeta(prototypeId, draft);
        await prototypeService.update(prototypeId, userId, {
          name: draft.name.trim(),
          description: draft.description.trim(),
          project_id: draft.projectId || undefined,
        });
      } else if (draft.name.trim().length >= 3) {
        await ensurePrototypeRecord();
      }
      setSaveState('saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Autosave failed');
      setSaveState('error');
    }
  }, [draft, draftKey, userId, prototypeId, ensurePrototypeRecord]);

  const patchDraft = useCallback((patch: Partial<PrototypeCreationDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setSaveState('dirty');
  }, []);

  useEffect(() => {
    if (saveState !== 'dirty') return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistDraft();
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft, saveState, persistDraft]);

  const saveNow = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await persistDraft();
  }, [persistDraft]);

  const publish = useCallback(async (): Promise<string | null> => {
    const validation = validateCreationDraft(draft, 'publish');
    if (!validation.valid) {
      setError(Object.values(validation.errors)[0] ?? 'Validation failed');
      return null;
    }
    if (gateProjectId && !gateAllowed) {
      setError(gateReason ?? 'Research gate approval required');
      return null;
    }

    setSaveState('saving');
    setError(null);
    try {
      const id = prototypeId ?? (await ensurePrototypeRecord());
      if (!id) throw new Error('Could not create prototype record');

      const nextDraft = { ...draft, workspaceStage: 'prototype' as const };
      setDraft(nextDraft);
      savePrototypeMeta(id, nextDraft);
      saveDraft(userId, draftKey, nextDraft);

      await prototypeService.update(id, userId, {
        name: draft.name.trim(),
        description: buildDescriptionSummary(nextDraft),
        project_id: draft.projectId || undefined,
        lifecycle_status: 'building',
      });

      clearDraft(userId, draftKey);
      setSaveState('saved');
      return id;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
      setSaveState('error');
      return null;
    }
  }, [
    draft,
    draftKey,
    userId,
    prototypeId,
    ensurePrototypeRecord,
    gateProjectId,
    gateAllowed,
    gateReason,
  ]);

  return {
    draft,
    patchDraft,
    setDraft,
    prototypeId,
    screenshots,
    refreshScreenshots,
    ensurePrototypeRecord,
    projects,
    saveState,
    error,
    setError,
    saveNow,
    publish,
    sections,
    completion,
    gateAllowed,
    gateReason,
    gateLoading,
    gateProjectId,
  };
}

function buildDescriptionSummary(d: PrototypeCreationDraft): string {
  const parts = [
    d.description.trim(),
    d.problemStatement.trim() ? `\n\nProblem: ${d.problemStatement.trim()}` : '',
    d.solutionOverview.trim() ? `\n\nSolution: ${d.solutionOverview.trim()}` : '',
  ];
  return parts.join('').slice(0, 4000);
}
