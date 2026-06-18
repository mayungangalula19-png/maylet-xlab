import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import type { ProjectOption, SaveState } from './usePrototypeCreation';
import { loadPrototypeMeta, savePrototypeMeta } from '../services/prototypeCreation.storage';
import { prototypeService } from '../services/prototypeService';
import type { PrototypeBuilderMeta, BuilderActivity } from '../types/prototypeBuilder.types';
import { emptyBuilderMeta, newBuilderId } from '../types/prototypeBuilder.types';
import type { PrototypeRecord } from '../types/prototype.types';
import { usePrototype } from './usePrototype';

interface Options {
  userId: string;
  prototypeId: string;
}

export function usePrototypeBuilder({ userId, prototypeId }: Options) {
  const proto = usePrototype(userId, prototypeId);
  const [meta, setMeta] = useState<PrototypeBuilderMeta>(() => emptyBuilderMeta());
  const [metaReady, setMetaReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [metaError, setMetaError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hydrateFromPrototype = useCallback(
    (p: PrototypeRecord): PrototypeBuilderMeta => {
      const stored = loadPrototypeMeta(prototypeId);
      const base = emptyBuilderMeta({
        name: p.name,
        description: p.description ?? '',
        projectId: p.project_id ?? '',
        researchId: p.research_id ?? p.project_id ?? '',
        workspaceStage:
          stored?.workspaceStage ??
          (p.lifecycle_status === 'building'
            ? 'prototype'
            : p.lifecycle_status === 'testing'
              ? 'testing'
              : p.lifecycle_status === 'success'
                ? 'validation'
                : 'draft'),
      });
      return { ...base, ...stored, name: p.name, version: 1 };
    },
    [prototypeId]
  );

  useEffect(() => {
    if (!proto.prototype) return;
    setMeta(hydrateFromPrototype(proto.prototype));
    setMetaReady(true);
  }, [proto.prototype, hydrateFromPrototype]);

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

  const persistMeta = useCallback(async () => {
    setSaveState('saving');
    setMetaError(null);
    try {
      savePrototypeMeta(prototypeId, meta);
      await prototypeService.update(prototypeId, userId, {
        name: meta.name.trim(),
        description: meta.description.trim(),
        project_id: meta.projectId || undefined,
      });
      setSaveState('saved');
    } catch (e) {
      setMetaError(e instanceof Error ? e.message : 'Autosave failed');
      setSaveState('error');
    }
  }, [meta, prototypeId, userId]);

  const patchMeta = useCallback((patch: Partial<PrototypeBuilderMeta>) => {
    setMeta((prev) => ({
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
    setSaveState('dirty');
  }, []);

  const logActivity = useCallback((message: string, type: BuilderActivity['type'] = 'edit') => {
    setMeta((prev) => ({
      ...prev,
      activity: [
        { id: newBuilderId(), type, message, createdAt: new Date().toISOString() },
        ...prev.activity,
      ].slice(0, 50),
      updatedAt: new Date().toISOString(),
    }));
    setSaveState('dirty');
  }, []);

  useEffect(() => {
    if (!metaReady || saveState !== 'dirty') return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistMeta();
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [meta, metaReady, saveState, persistMeta]);

  const saveNow = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await persistMeta();
  }, [persistMeta]);

  const completion = useMemo(() => {
    const checks = [
      !!meta.name.trim(),
      !!meta.description.trim(),
      meta.userFlow.length > 0,
      meta.features.length > 0,
      !!meta.frontendStack.trim() || !!meta.backendStack.trim(),
      meta.experiments.length > 0,
      !!meta.documentation.trim(),
      meta.attachments.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [meta]);

  return {
    ...proto,
    meta,
    patchMeta,
    logActivity,
    projects,
    saveState,
    metaError,
    setMetaError,
    saveNow,
    completion,
    metaReady,
  };
}