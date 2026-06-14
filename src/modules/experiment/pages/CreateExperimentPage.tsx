import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { useAuth } from '../../../hooks/useAuth';
import { createExperiment } from '../../../lib/experiment/experiment.service';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface ProjectOption {
  id: string;
  name: string;
  sector: string;
}

interface PrototypeOption {
  id: string;
  name: string;
  version: string | null;
  status: string | null;
}

interface DocumentOption {
  id: string;
  name: string;
  file_type: string | null;
}

interface TeamMemberOption {
  id: string;
  user_id: string;
  role: string;
  display_name: string;
}

interface ExperimentConfig {
  description: string;
  objectives: string;
  success_criteria: string;
  independent_variables: string;
  dependent_variables: string;
  prototype_id: string | null;
  team_member_ids: string[];
  document_ids: string[];
  attachment_notes: string;
  start_date: string;
  end_date: string;
  maya_insights: {
    suggested_hypothesis?: string;
    suggested_kpis?: string[];
    suggested_metrics?: string[];
  };
}

const EMPTY_FORM = {
  project_id: '',
  prototype_id: '',
  name: '',
  description: '',
  objectives: '',
  hypothesis: '',
  success_criteria: '',
  independent_variables: '',
  dependent_variables: '',
  start_date: '',
  end_date: '',
  team_member_ids: [] as string[],
  document_ids: [] as string[],
  attachment_notes: '',
};

const FLOW_STEPS = ['Research', 'Prototype', 'Experiment', 'Validation'] as const;

/* ─── MAYA stubs (client-side, no API) ──────────────────────────────────── */

function suggestHypothesis(
  name: string,
  objectives: string,
  prototypeName: string
): string {
  const subject = name.trim() || 'the prototype';
  const goal = objectives.trim().slice(0, 120) || 'improve user outcomes';
  const proto = prototypeName ? ` using ${prototypeName}` : '';
  return `If we expose ${subject}${proto} to the target segment, then ${goal}, because prior research indicates measurable demand and workflow fit.`;
}

function suggestKpis(objectives: string, successCriteria: string): string[] {
  const base = ['Conversion rate', 'Task completion rate', 'User satisfaction (NPS)'];
  if (/retention|churn/i.test(objectives + successCriteria)) {
    base.push('30-day retention');
  }
  if (/revenue|pricing|willingness/i.test(objectives + successCriteria)) {
    base.push('Willingness-to-pay score');
  }
  if (/time|speed|latency/i.test(objectives + successCriteria)) {
    base.push('Time-on-task reduction (%)');
  }
  return base.slice(0, 5);
}

function suggestMetrics(
  independent: string,
  dependent: string
): string[] {
  const metrics = ['Sample size', 'Confidence level (95%)', 'Statistical significance threshold'];
  if (independent.trim()) metrics.push(`Track IV: ${independent.split('\n')[0].slice(0, 40)}`);
  if (dependent.trim()) metrics.push(`Track DV: ${dependent.split('\n')[0].slice(0, 40)}`);
  return metrics;
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function CreateExperiment() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillProjectId = searchParams.get('projectId') ?? '';

  const [form, setForm] = useState({ ...EMPTY_FORM, project_id: prefillProjectId });
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [prototypes, setPrototypes] = useState<PrototypeOption[]>([]);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mayaApplied, setMayaApplied] = useState<string | null>(null);

  const patch = useCallback((partial: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const selectedPrototype = useMemo(
    () => prototypes.find((p) => p.id === form.prototype_id),
    [prototypes, form.prototype_id]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('id, name, sector')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (cancelled) return;
      if (fetchError) setError(fetchError.message);
      else setProjects(data ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !form.project_id) {
      setPrototypes([]);
      setDocuments([]);
      setTeamMembers([]);
      patch({ prototype_id: '', team_member_ids: [], document_ids: [] });
      return;
    }

    let cancelled = false;
    (async () => {
      const [protoRes, docRes, teamRes] = await Promise.all([
        supabase
          .from('prototypes')
          .select('id, name, version, status')
          .eq('project_id', form.project_id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('documents')
          .select('id, name, file_type')
          .eq('project_id', form.project_id)
          .order('created_at', { ascending: false }),
        supabase.from('teams').select('id').eq('project_id', form.project_id).maybeSingle(),
      ]);

      if (cancelled) return;

      setPrototypes(protoRes.data ?? []);
      setDocuments(docRes.data ?? []);

      const teamId = teamRes.data?.id;
      if (teamId) {
        const { data: members } = await supabase
          .from('team_members')
          .select('id, user_id, role')
          .eq('team_id', teamId);

        if (cancelled) return;

        const enriched: TeamMemberOption[] = await Promise.all(
          (members ?? []).map(async (m) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', m.user_id)
              .maybeSingle();
            return {
              id: m.id,
              user_id: m.user_id,
              role: m.role,
              display_name:
                profile?.full_name || profile?.email || `Member ${m.user_id.slice(0, 6)}`,
            };
          })
        );
        setTeamMembers(enriched);
      } else {
        setTeamMembers([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.project_id, user, patch]);

  const toggleId = (field: 'team_member_ids' | 'document_ids', id: string) => {
    setForm((prev) => {
      const list = prev[field];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      return { ...prev, [field]: next };
    });
  };

  const applyMayaHypothesis = () => {
    const text = suggestHypothesis(form.name, form.objectives, selectedPrototype?.name ?? '');
    patch({ hypothesis: text });
    setMayaApplied('hypothesis');
    window.setTimeout(() => setMayaApplied(null), 2500);
  };

  const applyMayaKpis = () => {
    const kpis = suggestKpis(form.objectives, form.success_criteria);
    const block = kpis.map((k) => `• ${k}`).join('\n');
    const merged = form.success_criteria.trim()
      ? `${form.success_criteria.trim()}\n\nMAYA KPIs:\n${block}`
      : `MAYA KPIs:\n${block}`;
    patch({ success_criteria: merged });
    setMayaApplied('kpis');
    window.setTimeout(() => setMayaApplied(null), 2500);
  };

  const applyMayaMetrics = () => {
    const metrics = suggestMetrics(form.independent_variables, form.dependent_variables);
    const iv = form.independent_variables.trim();
    const dv = form.dependent_variables.trim();
    patch({
      independent_variables: iv
        ? `${iv}\n\nMAYA metrics to track:\n${metrics.slice(0, 2).join('\n')}`
        : `MAYA suggested IVs:\n• Treatment variant\n• Control group\n• Exposure duration`,
      dependent_variables: dv
        ? `${dv}\n\nMAYA metrics:\n${metrics.slice(2).join('\n')}`
        : `MAYA suggested DVs:\n• Primary outcome metric\n• Secondary engagement metric\n• Error / drop-off rate`,
    });
    setMayaApplied('metrics');
    window.setTimeout(() => setMayaApplied(null), 2500);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) return;
    if (!form.project_id) {
      setError('Select a project for this experiment.');
      return;
    }
    if (!form.name.trim()) {
      setError('Experiment name is required.');
      return;
    }
    if (!form.hypothesis.trim()) {
      setError('Hypothesis is required.');
      return;
    }
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      setError('End date must be on or after start date.');
      return;
    }

    const config: ExperimentConfig = {
      description: form.description.trim(),
      objectives: form.objectives.trim(),
      success_criteria: form.success_criteria.trim(),
      independent_variables: form.independent_variables.trim(),
      dependent_variables: form.dependent_variables.trim(),
      prototype_id: form.prototype_id || null,
      team_member_ids: form.team_member_ids,
      document_ids: form.document_ids,
      attachment_notes: form.attachment_notes.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      maya_insights: {
        suggested_hypothesis: suggestHypothesis(
          form.name,
          form.objectives,
          selectedPrototype?.name ?? ''
        ),
        suggested_kpis: suggestKpis(form.objectives, form.success_criteria),
        suggested_metrics: suggestMetrics(form.independent_variables, form.dependent_variables),
      },
    };

    setSubmitting(true);
    try {
      const record = await createExperiment({
        user_id: user.id,
        project_id: form.project_id,
        title: form.name.trim(),
        hypothesis: form.hypothesis.trim(),
        type: 'structured',
        status: 'draft',
        findings: JSON.stringify(config),
        results: form.success_criteria.trim() || null,
        updated_at: new Date().toISOString(),
      });

      navigate(`/experiments/${record.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create experiment');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="cex-page">
        <div className="cex-loading" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="cex-page">
      <header className="cex-header">
        <Link to="/experiments" className="cex-back">
          ← Experiments
        </Link>
        <h1>Create experiment</h1>
        <p>Configure a structured test between prototype and validation.</p>

        <nav className="cex-flow" aria-label="Innovation flow">
          {FLOW_STEPS.map((step) => (
            <span
              key={step}
              className={`cex-flow__step ${step === 'Experiment' ? 'cex-flow__step--active' : ''}`}
            >
              {step}
            </span>
          ))}
        </nav>
      </header>

      {error && <div className="cex-error">{error}</div>}

      <form className="cex-form" onSubmit={handleSubmit}>
        {/* 1–2. Project & prototype */}
        <section className="cex-section">
          <h2>Context</h2>
          <div className="cex-grid">
            <label className="cex-field">
              <span>Project *</span>
              <select
                value={form.project_id}
                onChange={(e) => patch({ project_id: e.target.value })}
                required
              >
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sector})
                  </option>
                ))}
              </select>
            </label>
            <label className="cex-field">
              <span>Prototype</span>
              <select
                value={form.prototype_id}
                onChange={(e) => patch({ prototype_id: e.target.value })}
                disabled={!form.project_id}
              >
                <option value="">No prototype linked</option>
                {prototypes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.version ? ` v${p.version}` : ''}
                    {p.status ? ` · ${p.status}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* 3. Experiment details */}
        <section className="cex-section">
          <h2>Experiment details</h2>
          <label className="cex-field">
            <span>Name *</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="e.g. Hospital triage workflow A/B test"
              required
            />
          </label>
          <label className="cex-field">
            <span>Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="What are you testing and why does it matter?"
            />
          </label>
          <label className="cex-field">
            <span>Objectives</span>
            <textarea
              rows={3}
              value={form.objectives}
              onChange={(e) => patch({ objectives: e.target.value })}
              placeholder="List measurable goals this experiment should achieve…"
            />
          </label>
        </section>

        {/* 4. Hypothesis */}
        <section className="cex-section">
          <div className="cex-section__row">
            <h2>Hypothesis</h2>
            <button type="button" className="cex-maya-btn" onClick={applyMayaHypothesis}>
              ✨ Suggest hypothesis
            </button>
          </div>
          {mayaApplied === 'hypothesis' && (
            <p className="cex-maya-toast">MAYA hypothesis applied.</p>
          )}
          <label className="cex-field">
            <span>Hypothesis statement *</span>
            <textarea
              rows={4}
              value={form.hypothesis}
              onChange={(e) => patch({ hypothesis: e.target.value })}
              placeholder="If [change], then [outcome], because [rationale]…"
              required
            />
          </label>
        </section>

        {/* 5. Success criteria */}
        <section className="cex-section">
          <div className="cex-section__row">
            <h2>Success criteria</h2>
            <button type="button" className="cex-maya-btn" onClick={applyMayaKpis}>
              ✨ Suggest KPIs
            </button>
          </div>
          {mayaApplied === 'kpis' && <p className="cex-maya-toast">MAYA KPIs appended.</p>}
          <label className="cex-field">
            <span>How will you know the experiment succeeded?</span>
            <textarea
              rows={4}
              value={form.success_criteria}
              onChange={(e) => patch({ success_criteria: e.target.value })}
              placeholder="Thresholds, KPIs, and decision rules…"
            />
          </label>
        </section>

        {/* 6. Variables */}
        <section className="cex-section">
          <div className="cex-section__row">
            <h2>Variables</h2>
            <button type="button" className="cex-maya-btn" onClick={applyMayaMetrics}>
              ✨ Suggest metrics
            </button>
          </div>
          {mayaApplied === 'metrics' && <p className="cex-maya-toast">MAYA metrics applied.</p>}
          <div className="cex-grid">
            <label className="cex-field">
              <span>Independent variables</span>
              <textarea
                rows={4}
                value={form.independent_variables}
                onChange={(e) => patch({ independent_variables: e.target.value })}
                placeholder="What you manipulate (features, price, messaging…)…"
              />
            </label>
            <label className="cex-field">
              <span>Dependent variables</span>
              <textarea
                rows={4}
                value={form.dependent_variables}
                onChange={(e) => patch({ dependent_variables: e.target.value })}
                placeholder="What you measure (conversion, time, satisfaction…)…"
              />
            </label>
          </div>
        </section>

        {/* 7. Timeline */}
        <section className="cex-section">
          <h2>Timeline</h2>
          <div className="cex-grid">
            <label className="cex-field">
              <span>Start date</span>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => patch({ start_date: e.target.value })}
              />
            </label>
            <label className="cex-field">
              <span>End date</span>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => patch({ end_date: e.target.value })}
              />
            </label>
          </div>
        </section>

        {/* 8. Team */}
        <section className="cex-section">
          <h2>Team assignment</h2>
          {!form.project_id ? (
            <p className="cex-hint">Select a project to load team members.</p>
          ) : teamMembers.length === 0 ? (
            <p className="cex-hint">No team linked to this project yet.</p>
          ) : (
            <ul className="cex-checklist">
              {teamMembers.map((m) => (
                <li key={m.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={form.team_member_ids.includes(m.id)}
                      onChange={() => toggleId('team_member_ids', m.id)}
                    />
                    <span>
                      {m.display_name} <em>({m.role})</em>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 9. Documents */}
        <section className="cex-section">
          <h2>Document attachments</h2>
          {!form.project_id ? (
            <p className="cex-hint">Select a project to attach existing documents.</p>
          ) : documents.length === 0 ? (
            <p className="cex-hint">
              No documents on this project. Add files in{' '}
              <Link to="/documents">Documents</Link> first.
            </p>
          ) : (
            <ul className="cex-checklist">
              {documents.map((d) => (
                <li key={d.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={form.document_ids.includes(d.id)}
                      onChange={() => toggleId('document_ids', d.id)}
                    />
                    <span>
                      {d.name}
                      {d.file_type ? ` · ${d.file_type}` : ''}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <label className="cex-field" style={{ marginTop: '1rem' }}>
            <span>Attachment notes</span>
            <input
              type="text"
              value={form.attachment_notes}
              onChange={(e) => patch({ attachment_notes: e.target.value })}
              placeholder="Optional links or filenames for external references"
            />
          </label>
        </section>

        {/* MAYA panel */}
        <aside className="cex-maya-panel">
          <strong>MAYA experiment advisor</strong>
          <p>
            Use suggestions to draft hypothesis, KPIs, and metrics. All fields remain editable
            before you create the record.
          </p>
        </aside>

        <footer className="cex-actions">
          <Link to="/experiments" className="cex-btn cex-btn--ghost">
            Cancel
          </Link>
          <button type="submit" className="cex-btn cex-btn--primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create experiment record'}
          </button>
        </footer>
      </form>

      <style>{`
        .cex-page {
          max-width: 880px;
          margin: 0 auto;
          padding: 1.5rem 2rem 3rem;
          color: #e8e8f0;
        }
        .cex-header { margin-bottom: 1.5rem; }
        .cex-back {
          color: #9b7ff0;
          text-decoration: none;
          font-size: 0.88rem;
        }
        .cex-header h1 {
          margin: 0.5rem 0 0.25rem;
          font-size: 1.75rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .cex-header p {
          margin: 0;
          opacity: 0.65;
          font-size: 0.92rem;
        }
        .cex-flow {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1.25rem;
        }
        .cex-flow__step {
          padding: 0.35rem 0.85rem;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.1);
          opacity: 0.55;
        }
        .cex-flow__step--active {
          opacity: 1;
          border-color: rgba(124,95,230,0.5);
          background: rgba(124,95,230,0.2);
          color: #d4c4ff;
        }
        .cex-error {
          background: rgba(252,129,129,0.15);
          border: 1px solid rgba(252,129,129,0.4);
          color: #fc8181;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          font-size: 0.88rem;
        }
        .cex-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .cex-section {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.25rem;
        }
        .cex-section h2 {
          margin: 0 0 1rem;
          font-size: 1rem;
          color: #2fd4ff;
        }
        .cex-section__row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .cex-section__row h2 { margin: 0; }
        .cex-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 640px) {
          .cex-grid { grid-template-columns: 1fr; }
        }
        .cex-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 0.85rem;
        }
        .cex-field span {
          font-size: 0.78rem;
          font-weight: 600;
          opacity: 0.85;
        }
        .cex-field input,
        .cex-field select,
        .cex-field textarea {
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.65rem 0.75rem;
          color: #fff;
          font-family: inherit;
          font-size: 0.88rem;
        }
        .cex-field input:focus,
        .cex-field select:focus,
        .cex-field textarea:focus {
          outline: none;
          border-color: rgba(124,95,230,0.5);
        }
        .cex-hint {
          margin: 0;
          font-size: 0.82rem;
          opacity: 0.55;
        }
        .cex-checklist {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .cex-checklist li {
          padding: 0.45rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .cex-checklist label {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          font-size: 0.88rem;
        }
        .cex-checklist em {
          opacity: 0.5;
          font-style: normal;
          font-size: 0.78rem;
        }
        .cex-maya-btn {
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.4);
          color: #c4b5fd;
          border-radius: 20px;
          padding: 0.35rem 0.85rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        .cex-maya-btn:hover { background: rgba(124,95,230,0.35); }
        .cex-maya-toast {
          margin: 0 0 0.5rem;
          font-size: 0.78rem;
          color: #68d391;
        }
        .cex-maya-panel {
          background: linear-gradient(135deg, rgba(124,95,230,0.12), rgba(47,212,255,0.06));
          border: 1px solid rgba(124,95,230,0.25);
          border-radius: 14px;
          padding: 1rem;
          font-size: 0.85rem;
          line-height: 1.55;
        }
        .cex-maya-panel strong { color: #2fd4ff; }
        .cex-maya-panel p { margin: 0.35rem 0 0; opacity: 0.75; }
        .cex-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 0.5rem;
        }
        .cex-btn {
          padding: 0.65rem 1.25rem;
          border-radius: 30px;
          font-weight: 600;
          font-size: 0.88rem;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }
        .cex-btn--ghost {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .cex-btn--primary {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
        }
        .cex-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .cex-loading {
          width: 40px;
          height: 40px;
          margin: 4rem auto;
          border: 3px solid rgba(124,95,230,0.25);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: cex-spin 0.8s linear infinite;
        }
        @keyframes cex-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
