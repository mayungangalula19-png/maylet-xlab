import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { uploadPrototypeBuild, prototypeService } from '../services/prototypeService';
import {
  loadIngestionWorkspace,
  saveIngestionWorkspace,
} from '../services/prototypeIngestion.storage';
import type {
  IngestionActivity,
  IngestionSectionId,
  PrototypeIngestionWorkspace,
} from '../types/prototypeIngestion.types';
import { emptyIngestionWorkspace, newIngestionId } from '../types/prototypeIngestion.types';
import type { PrototypeFile, PrototypeRecord } from '../types/prototype.types';
import {
  analyzeFigmaUrl,
  analyzeGitHubRepo,
  autoMetadataFromFile,
  computeIngestionKPIs,
  computeIngestionReadiness,
  detectAssetKind,
  runAiIngestionAnalysis,
  syncDbFilesToAssets,
  validateIngestionFile,
} from '../utils/ingestionCenter.utils';
import type { ProjectOption } from './usePrototypeCreation';

export function usePrototypeIngestion(userId: string | undefined, prototypeId?: string) {
  const [prototypes, setPrototypes] = useState<PrototypeRecord[]>([]);
  const [selectedId, setSelectedId] = useState(prototypeId ?? '');
  const [dbFiles, setDbFiles] = useState<PrototypeFile[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<IngestionSectionId>('upload');
  const [workspace, setWorkspace] = useState<PrototypeIngestionWorkspace>(() =>
    userId ? loadIngestionWorkspace(userId, prototypeId) : emptyIngestionWorkspace()
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prototypeId) setSelectedId(prototypeId);
  }, [prototypeId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      prototypeService.list(userId),
      supabase.from('projects').select('id, name').eq('user_id', userId).order('updated_at', { ascending: false }),
    ])
      .then(([list, { data }]) => {
        if (cancelled) return;
        setPrototypes(list);
        setProjects((data ?? []) as ProjectOption[]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setWorkspace(loadIngestionWorkspace(userId, selectedId || undefined));
  }, [userId, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setDbFiles([]);
      return;
    }
    let cancelled = false;
    prototypeService.listFiles(selectedId).then((files) => {
      if (!cancelled) setDbFiles(files);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selectedPrototype = useMemo(
    () => prototypes.find((p) => p.id === selectedId) ?? null,
    [prototypes, selectedId]
  );

  const persist = useCallback(
    (next: PrototypeIngestionWorkspace) => {
      if (!userId) return;
      saveIngestionWorkspace(userId, next, selectedId || undefined);
    },
    [userId, selectedId]
  );

  const patchWorkspace = useCallback(
    (patch: Partial<PrototypeIngestionWorkspace>) => {
      setWorkspace((prev) => {
        const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => persist(next), 800);
        return next;
      });
    },
    [persist]
  );

  const logActivity = useCallback(
    (message: string, type: IngestionActivity['type'] = 'upload') => {
      setWorkspace((prev) => {
        const entry = {
          id: newIngestionId(),
          action: type,
          detail: message,
          createdAt: new Date().toISOString(),
        };
        const next = {
          ...prev,
          activity: [{ id: newIngestionId(), type, message, createdAt: entry.createdAt }, ...prev.activity].slice(0, 50),
          auditLog: [entry, ...prev.auditLog].slice(0, 100),
          updatedAt: entry.createdAt,
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const mergedAssets = useMemo(() => {
    const localIds = new Set(workspace.assets.map((a) => a.prototypeFileId).filter(Boolean));
    const fromDb = syncDbFilesToAssets(dbFiles).filter((a) => !localIds.has(a.id));
    return [...workspace.assets, ...fromDb];
  }, [workspace.assets, dbFiles]);

  const wsWithAssets = useMemo(() => ({ ...workspace, assets: mergedAssets }), [workspace, mergedAssets]);

  const kpis = useMemo(() => computeIngestionKPIs(wsWithAssets), [wsWithAssets]);
  const readiness = useMemo(() => computeIngestionReadiness(wsWithAssets, dbFiles), [wsWithAssets, dbFiles]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!userId || !selectedId) throw new Error('Select a prototype first');
      validateIngestionFile(file);
      const assetId = newIngestionId();
      const pending: (typeof workspace.assets)[0] = {
        id: assetId,
        name: file.name,
        kind: detectAssetKind(file.name),
        mimeType: file.type,
        size: file.size,
        status: 'uploading',
        uploadedAt: new Date().toISOString(),
      };

      setWorkspace((prev) => {
        const next = {
          ...prev,
          assets: [pending, ...prev.assets],
          metadata: {
            ...prev.metadata,
            ...(prev.metadata.name ? {} : autoMetadataFromFile(file.name)),
          },
        };
        persist(next);
        return next;
      });
      setUploading(true);
      logActivity(`Upload started: ${file.name}`, 'upload');

      try {
        const uploaded = await uploadPrototypeBuild(selectedId, file);
        setDbFiles((prev) => [uploaded, ...prev.filter((f) => f.id !== uploaded.id)]);

        setWorkspace((prev) => {
          const next = {
            ...prev,
            assets: prev.assets.map((a) =>
              a.id === assetId
                ? {
                    ...a,
                    status: 'processing' as const,
                    url: uploaded.url,
                    prototypeFileId: uploaded.id,
                  }
                : a
            ),
          };
          persist(next);
          return next;
        });

        await new Promise((r) => setTimeout(r, 600));

        setWorkspace((prev) => {
          const analysis = runAiIngestionAnalysis(prev, selectedPrototype?.name);
          const next = {
            ...prev,
            assets: prev.assets.map((a) =>
              a.id === assetId ? { ...a, status: 'ready' as const } : a
            ),
            aiAnalysis: analysis,
          };
          persist(next);
          return next;
        });

        logActivity(`Upload complete: ${file.name}`, 'processing');
      } catch (err) {
        setWorkspace((prev) => {
          const next = {
            ...prev,
            assets: prev.assets.map((a) => (a.id === assetId ? { ...a, status: 'failed' as const } : a)),
          };
          persist(next);
          return next;
        });
        logActivity(`Upload failed: ${file.name}`, 'upload');
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [userId, selectedId, persist, logActivity, selectedPrototype?.name]
  );

  const importGitHub = useCallback(
    async (repoUrl: string) => {
      const id = newIngestionId();
      const pending = {
        id,
        repoUrl,
        readme: '',
        techStack: [] as string[],
        structure: '',
        summary: '',
        status: 'processing' as const,
        createdAt: new Date().toISOString(),
      };
      setWorkspace((prev) => {
        const next = { ...prev, githubImports: [pending, ...prev.githubImports] };
        persist(next);
        return next;
      });
      logActivity(`GitHub import started: ${repoUrl}`, 'import');

      await new Promise((r) => setTimeout(r, 800));
      const result = analyzeGitHubRepo(repoUrl);

      setWorkspace((prev) => {
        const githubImports = prev.githubImports.map((g) =>
          g.id === id ? { ...g, ...result, status: 'ready' as const } : g
        );
        const next = {
          ...prev,
          githubImports,
          aiAnalysis: runAiIngestionAnalysis({ ...prev, githubImports }, selectedPrototype?.name),
        };
        persist(next);
        return next;
      });
      logActivity(`GitHub import complete: ${repoUrl}`, 'analysis');
    },
    [logActivity, persist, selectedPrototype?.name]
  );

  const importFigma = useCallback(
    async (figmaUrl: string) => {
      const id = newIngestionId();
      const pending = {
        id,
        figmaUrl,
        frameCount: 0,
        screens: [] as string[],
        metadata: '',
        status: 'processing' as const,
        createdAt: new Date().toISOString(),
      };
      setWorkspace((prev) => {
        const next = { ...prev, figmaImports: [pending, ...prev.figmaImports] };
        persist(next);
        return next;
      });
      logActivity(`Figma import started: ${figmaUrl}`, 'import');

      await new Promise((r) => setTimeout(r, 800));
      const result = analyzeFigmaUrl(figmaUrl);

      setWorkspace((prev) => {
        const figmaImports = prev.figmaImports.map((f) =>
          f.id === id ? { ...f, ...result, status: 'ready' as const } : f
        );
        const next = {
          ...prev,
          figmaImports,
          aiAnalysis: runAiIngestionAnalysis({ ...prev, figmaImports }, selectedPrototype?.name),
        };
        persist(next);
        return next;
      });
      logActivity(`Figma import complete: ${figmaUrl}`, 'analysis');
    },
    [logActivity, persist, selectedPrototype?.name]
  );

  const addVersion = useCallback(
    (label: string, notes: string) => {
      patchWorkspace({
        versions: [
          {
            id: newIngestionId(),
            label,
            notes,
            assetCount: mergedAssets.length,
            createdAt: new Date().toISOString(),
          },
          ...workspace.versions,
        ],
      });
      logActivity(`Version recorded: ${label}`, 'version');
    },
    [patchWorkspace, workspace.versions, mergedAssets.length, logActivity]
  );

  const runAnalysis = useCallback(() => {
    const analysis = runAiIngestionAnalysis(wsWithAssets, selectedPrototype?.name);
    patchWorkspace({ aiAnalysis: analysis });
    logActivity('AI ingestion analysis completed', 'analysis');
  }, [wsWithAssets, selectedPrototype?.name, patchWorkspace, logActivity]);

  const saveNow = useCallback(() => {
    if (userId) persist(workspace);
  }, [userId, persist, workspace]);

  return {
    prototypes,
    projects,
    selectedId,
    setSelectedId,
    selectedPrototype,
    dbFiles,
    workspace: wsWithAssets,
    patchWorkspace,
    logActivity,
    kpis,
    readiness,
    uploadFile,
    importGitHub,
    importFigma,
    addVersion,
    runAnalysis,
    activeSection,
    setActiveSection,
    loading,
    uploading,
    saveNow,
  };
}
