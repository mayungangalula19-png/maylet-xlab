import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { useAuth } from './useAuth';
import { deleteProject } from '../../../lib/supabase/projects.queries';
import { logActivity } from '../../../lib/supabase/dbHelpers';
import {
  buildMayaInsights,
  computeStageGates,
  innovationStageToProgress,
  loadProjectControlAssets,
  loadProjectControlCenter,
  loadValidationEvidence,
  evaluateProjectEvidence,
  saveProjectControlCenter,
} from '../../projects/services/projectControlCenter';
import {
  getCommercializationReadiness,
  getFundingReadiness,
  getInnovationMetrics,
  type InnovationStage,
} from '../../../lib/innovation/lifecycle';
import type { Project } from '../../../types/project.types';
import type {
  ControlCenterFormState,
  MayaControlInsights,
  ProjectControlAssets,
  ProjectWorkspaceMeta,
  ValidationEvaluationResult,
  ValidationEvidenceSummary,
} from '../../../types/projectWorkspace.types';
import { EMPTY_PROJECT_WORKSPACE } from '../../../types/projectWorkspace.types';

const REALTIME_TABLES = [
  'activities',
  'prototypes',
  'experiments',
  'validations',
  'funding_pitches',
  'documents',
] as const;

export function useProjectControlCenter(projectId: string | undefined) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [workspace, setWorkspace] = useState<ProjectWorkspaceMeta>(EMPTY_PROJECT_WORKSPACE);
  const [assets, setAssets] = useState<ProjectControlAssets | null>(null);
  const [evidence, setEvidence] = useState<ValidationEvidenceSummary | null>(null);
  const [evaluation, setEvaluation] = useState<ValidationEvaluationResult | null>(null);
  const [form, setForm] = useState<ControlCenterFormState>({
    name: '',
    description: '',
    sector: 'Health',
    stage: 'Idea',
    progress: 0,
    tagsInput: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patchForm = useCallback((partial: Partial<ControlCenterFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const patchWorkspace = useCallback((partial: Partial<ProjectWorkspaceMeta>) => {
    setWorkspace((prev) => ({ ...prev, ...partial }));
  }, []);

  const metrics = useMemo(
    () => (project ? getInnovationMetrics(project) : null),
    [project]
  );

  const stageGates = useMemo(
    () => (assets ? computeStageGates(assets) : []),
    [assets]
  );

  const maya: MayaControlInsights = useMemo(
    () =>
      project && assets
        ? buildMayaInsights(project, assets, workspace, evaluation)
        : {
            score: 0,
            risk: 'high',
            bullets: [],
            next: '',
            evidenceSummary: null,
            dimensionScores: null,
          },
    [project, assets, workspace, evaluation]
  );

  const fundingReady = project ? getFundingReadiness(project) : 0;
  const commercialReady = project ? getCommercializationReadiness(project) : 0;

  const refreshAssets = useCallback(async () => {
    if (!projectId || !user || !project) return;
    setSyncing(true);
    try {
      const [loadedAssets, loadedEvidence] = await Promise.all([
        loadProjectControlAssets(projectId, user.id),
        loadValidationEvidence(projectId, user.id, project.name).catch(() => null),
      ]);
      setAssets(loadedAssets);
      setEvidence(loadedEvidence);
      if (loadedEvidence) {
        setEvaluation(evaluateProjectEvidence(loadedEvidence, project));
      }
    } finally {
      setSyncing(false);
    }
  }, [projectId, user, project]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      void refreshAssets();
    }, 400);
  }, [refreshAssets]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (!projectId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadProjectControlCenter(projectId, user.id);
        if (cancelled) return;

        setProject(data.project);
        setWorkspace(data.workspace);
        setAssets(data.assets);
        setEvidence(data.evidence);
        setEvaluation(data.evaluation);
        setForm({
          name: data.project.name,
          description: data.project.description,
          sector: data.project.sector,
          stage: data.stage,
          progress: data.project.progress,
          tagsInput: data.workspace.tags.join(', '),
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load project');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, user, authLoading, navigate]);

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase.channel(`pcc_${projectId}`);

    for (const table of REALTIME_TABLES) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `project_id=eq.${projectId}`,
        },
        () => scheduleRefresh()
      );
    }

    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${projectId}`,
      },
      () => scheduleRefresh()
    );

    channel.subscribe();

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [projectId, scheduleRefresh]);

  const handleStageChange = useCallback((stage: InnovationStage) => {
    patchForm({ stage, progress: innovationStageToProgress(stage) });
  }, [patchForm]);

  const save = useCallback(async () => {
    if (!user || !projectId || !project) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const tags = form.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const workspacePayload: ProjectWorkspaceMeta = { ...workspace, tags };

    try {
      const updated = await saveProjectControlCenter({
        projectId,
        userId: user.id,
        name: form.name,
        description: form.description,
        sector: form.sector,
        stage: form.stage,
        progress: form.progress,
        workspace: workspacePayload,
        maya,
      });

      setProject(updated);
      setWorkspace(workspacePayload);
      setSuccess('Project control center saved.');
      window.setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  }, [user, projectId, project, form, workspace, maya]);

  const inviteMember = useCallback(
    async (email: string, role: string) => {
      if (!user || !projectId || !assets?.teamId || !email.trim()) {
        throw new Error('Team must be linked before sending invites.');
      }

      const normalized = email.trim().toLowerCase();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', normalized)
        .maybeSingle();

      if (!profile) {
        patchWorkspace({ pending_invites: [...workspace.pending_invites, normalized] });
        await refreshAssets();
        return { type: 'pending' as const, email: normalized };
      }

      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', assets.teamId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existing) throw new Error('This user is already on the project team.');

      const { error: insertErr } = await supabase.from('team_members').insert({
        team_id: assets.teamId,
        user_id: profile.id,
        role,
      });
      if (insertErr) throw insertErr;

      await logActivity({
        user_id: user.id,
        project_id: projectId,
        type: 'team',
        title: `Invited ${profile.full_name ?? normalized} to project team`,
        metadata: { role },
      });

      await refreshAssets();
      return {
        type: 'invited' as const,
        name: profile.full_name ?? normalized,
        email: normalized,
      };
    },
    [user, projectId, assets?.teamId, workspace.pending_invites, patchWorkspace, refreshAssets]
  );

  const removeProject = useCallback(async () => {
    if (!user || !projectId) return;
    setSaving(true);
    try {
      await deleteProject(projectId, user.id);
      navigate('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setSaving(false);
    }
  }, [user, projectId, navigate]);

  return {
    project,
    workspace,
    assets,
    evidence,
    evaluation,
    form,
    patchForm,
    patchWorkspace,
    handleStageChange,
    loading: authLoading || loading,
    saving,
    syncing,
    error,
    success,
    setError,
    metrics,
    stageGates,
    maya,
    fundingReady,
    commercialReady,
    save,
    refreshAssets,
    inviteMember,
    removeProject,
  };
}
