import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { useWorkflowGuard } from '../../workflow';
import '../../workflow/workflow.css';
import { createPrototype } from '../services/prototypeService';
import type { CreatedPrototype } from '../types/prototype.types';

export interface ProjectOption {
  id: string;
  name: string;
}

export interface ResearchOption {
  id: string;
  label: string;
  projectId: string;
}

interface Props {
  userId: string;
  defaultProjectId?: string;
  defaultResearchId?: string;
  onSuccess?: (created: CreatedPrototype) => void;
  onCancel?: () => void;
}

export function CreatePrototypeForm({
  userId,
  defaultProjectId,
  defaultResearchId,
  onSuccess,
  onCancel,
}: Props) {
  const navigate = useNavigate();
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');
  const gateProjectId = projectId || defaultProjectId || undefined;
  const { allowed: gateAllowed, reason: gateReason, loading: gateLoading } = useWorkflowGuard(
    gateProjectId,
    'prototype'
  );
  const [researchId, setResearchId] = useState(defaultResearchId ?? '');
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [researchOptions, setResearchOptions] = useState<ResearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          setError('Failed to load projects');
          return;
        }
        const list = (data ?? []) as ProjectOption[];
        setProjects(list);
        setResearchOptions(
          list.map((p) => ({
            id: p.id,
            label: p.name,
            projectId: p.id,
          }))
        );
      });
    return () => {
      cancelled = true;
      if (navTimerRef.current) window.clearTimeout(navTimerRef.current);
    };
  }, [userId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Prototype name is required');
      return;
    }
    if (gateProjectId && !gateAllowed) {
      setError(gateReason ?? 'Research gate approval required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await createPrototype({
        userId,
        name: trimmed,
        description: description.trim() || undefined,
        status: 'draft',
        projectId: projectId || null,
        researchId: researchId || null,
      });

      setSuccess(`Prototype "${created.name}" created successfully`);
      onSuccess?.(created);

      navTimerRef.current = window.setTimeout(() => {
        navigate(`/prototypes/${created.id}/workspace`);
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prototype');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="proto-create-form" onSubmit={handleSubmit}>
      <h3 className="proto-create-form__title">Create Prototype</h3>
      <p className="proto-create-form__hint">Start a new innovation build from research or a project.</p>

      {gateProjectId && !gateLoading && !gateAllowed ? (
        <div className="wf-guard-banner wf-guard-banner--block" role="alert">
          {gateReason}{' '}
          <Link to={`/research/${gateProjectId}?tab=gate`}>Complete gate review →</Link>
        </div>
      ) : null}

      <div className="proto-field">
        <label htmlFor="proto-name">Prototype name *</label>
        <input
          id="proto-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. SMS Irrigation Alert MVP"
          required
          disabled={loading}
        />
      </div>

      <div className="proto-field">
        <label htmlFor="proto-desc">Description</label>
        <textarea
          id="proto-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What will this prototype validate?"
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="proto-field">
        <label htmlFor="proto-research">Linked research (optional)</label>
        <select
          id="proto-research"
          value={researchId}
          onChange={(e) => {
            const id = e.target.value;
            setResearchId(id);
            if (id) {
              const match = researchOptions.find((r) => r.id === id);
              if (match) setProjectId(match.projectId);
            }
          }}
          disabled={loading}
        >
          <option value="">None</option>
          {researchOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="proto-field">
        <label htmlFor="proto-project">Project (optional)</label>
        <select
          id="proto-project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={loading}
        >
          <option value="">None</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="proto-error">{error}</p> : null}
      {success ? <p className="proto-create-form__success">{success}</p> : null}

      <div className="proto-create-form__actions">
        {onCancel ? (
          <button type="button" className="proto-btn proto-btn--ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          className="proto-btn proto-btn--primary"
          disabled={loading || gateLoading || !name.trim() || Boolean(gateProjectId && !gateAllowed)}
        >
          {loading ? 'Creating…' : 'Create prototype'}
        </button>
      </div>
    </form>
  );
}
