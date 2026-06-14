import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { getInnovationStage, getFundingReadiness } from '../../../lib/innovation/lifecycle';
import { evaluateValidation } from '../ai/validationAI.engine';
import {
  gatherValidationEvidence,
  listEligibleProjects,
  createValidation,
  updateValidationDecision,
} from '../services/validationService';
import type {
  ValidationDecision,
  ValidationEvidenceSummary,
  ValidationMayaInsight,
} from '../types/validation.types';
import type { Project } from '../../../types/project.types';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const FLOW_STEPS = ['Prototype', 'Experiment', 'Validation', 'Funding'] as const;

const VALIDATION_SCOPES = [
  { value: 'full', label: 'Full gate review (all dimensions)' },
  { value: 'technical', label: 'Technical readiness focus' },
  { value: 'user', label: 'User evidence focus' },
  { value: 'market', label: 'Market proof focus' },
  { value: 'financial', label: 'Financial readiness focus' },
] as const;

const PRIORITY_DIMENSIONS = ['Technical', 'User', 'Market', 'Financial'] as const;

const EMPTY_FORM = {
  project_id: '',
  validation_scope: 'full' as (typeof VALIDATION_SCOPES)[number]['value'],
  priority_dimensions: ['Technical', 'User', 'Market', 'Financial'] as string[],
  technical_notes: '',
  user_notes: '',
  market_notes: '',
  financial_notes: '',
  reviewer_context: '',
  document_links: '',
  confirm_evidence: false,
};

type RiskLevel = 'low' | 'medium' | 'high';

/* ─── MAYA stubs ────────────────────────────────────────────────────────── */

function suggestTechnicalNotes(evidence: ValidationEvidenceSummary | null): string {
  if (!evidence) return 'Document prototype builds, test pass rates, and experiment outcomes linked to technical hypotheses.';
  const p = evidence.prototypes;
  if (p.count === 0) {
    return 'No prototypes linked — upload an MVP build and run internal test passes before validation.';
  }
  return `${p.count} prototype(s), ${p.withBuildCount} with artifacts, ${Math.round(p.avgTestPassRate * 100)}% avg test pass. Highlight critical defects resolved and performance benchmarks met.`;
}

function suggestUserNotes(evidence: ValidationEvidenceSummary | null): string {
  if (!evidence) return 'Capture interview insights, usability findings, and jobs-to-be-done evidence from target users.';
  const r = evidence.research;
  const e = evidence.experiments;
  return `${r.interviewNotesCount} interview/fieldwork notes, ${e.userTypeCount} user-focused experiment(s). Summarize top 3 user pain confirmations and willingness-to-adopt signals.`;
}

function suggestMarketNotes(evidence: ValidationEvidenceSummary | null): string {
  if (!evidence) return 'Cite TAM/SAM, competitor landscape, and demand signals from literature and market experiments.';
  const r = evidence.research;
  return `${r.literatureCount} literature sources, ${evidence.experiments.marketTypeCount} market experiment(s), ${r.findingsCount} research findings. State segment size and differentiation vs. incumbents.`;
}

function suggestFinancialNotes(project: Project | null, evidence: ValidationEvidenceSummary | null): string {
  const progress = project?.progress ?? 0;
  const completed = evidence?.experiments.completedCount ?? 0;
  return `Project progress ${progress}%. ${completed} completed experiment(s). Outline unit economics assumptions, CAC/LTV hypotheses, and runway impact if funded.`;
}

function evidenceGapSummary(evidence: ValidationEvidenceSummary | null): string[] {
  if (!evidence) return ['Select a project to analyze evidence gaps.'];
  const gaps: string[] = [];
  if (evidence.research.completionPct < 50) gaps.push('Research completion below 50% — expand findings and literature.');
  if (evidence.prototypes.count === 0) gaps.push('No prototypes — build and test an MVP first.');
  if (evidence.experiments.count === 0) gaps.push('No experiments — run structured tests before the funding gate.');
  if (evidence.experiments.userTypeCount === 0) gaps.push('Missing user-validation experiments.');
  if (evidence.experiments.marketTypeCount === 0) gaps.push('Missing market-validation experiments.');
  if (gaps.length === 0) gaps.push('Evidence coverage looks balanced — confirm scores in review panel.');
  return gaps;
}

function assessPreviewRisk(
  decision: ValidationDecision | null,
  overall: number
): { level: RiskLevel; note: string } {
  if (!decision) return { level: 'high', note: 'Select a project to preview readiness.' };
  if (decision === 'pass' && overall >= 75) {
    return { level: 'low', note: 'Project likely to PASS — funding gate may open after review.' };
  }
  if (decision === 'hold' || overall >= 50) {
    return { level: 'medium', note: 'Evidence gaps may yield HOLD — strengthen weak dimensions.' };
  }
  return { level: 'high', note: 'Low readiness — address critical evidence before running validation.' };
}

function decisionLabel(decision: ValidationDecision): string {
  const map: Record<ValidationDecision, string> = {
    pass: 'PASS',
    hold: 'HOLD',
    fail: 'FAIL',
    pending: 'PENDING',
  };
  return map[decision];
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function CreateValidation() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillProjectId = searchParams.get('projectId') ?? '';

  const [form, setForm] = useState({ ...EMPTY_FORM, project_id: prefillProjectId });
  const [eligible, setEligible] = useState<Project[]>([]);
  const [evidence, setEvidence] = useState<ValidationEvidenceSummary | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mayaToast, setMayaToast] = useState<string | null>(null);

  const patch = useCallback((partial: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const selectedProject = useMemo(
    () => eligible.find((p) => p.id === form.project_id) ?? null,
    [eligible, form.project_id]
  );

  const preview = useMemo(() => {
    if (!evidence || !selectedProject) return null;
    return evaluateValidation({
      evidence,
      projectProgress: selectedProject.progress ?? 0,
      projectStatus: selectedProject.status,
    });
  }, [evidence, selectedProject]);

  const risk = assessPreviewRisk(preview?.decision ?? null, preview?.scores.overall ?? 0);
  const gaps = useMemo(() => evidenceGapSummary(evidence), [evidence]);
  const insights: ValidationMayaInsight[] = preview?.maya_insights ?? [];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const list = await listEligibleProjects(user.id);
        if (cancelled) return;
        setEligible(list);
        if (prefillProjectId && list.some((p) => p.id === prefillProjectId)) {
          setForm((prev) => ({ ...prev, project_id: prefillProjectId }));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load projects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate, prefillProjectId]);

  useEffect(() => {
    if (!user || !form.project_id) {
      setEvidence(null);
      return;
    }

    const project = eligible.find((p) => p.id === form.project_id);
    if (!project) return;

    let cancelled = false;
    setEvidenceLoading(true);
    gatherValidationEvidence(form.project_id, user.id, project.name)
      .then((summary) => {
        if (!cancelled) setEvidence(summary);
      })
      .catch(() => {
        if (!cancelled) setEvidence(null);
      })
      .finally(() => {
        if (!cancelled) setEvidenceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.project_id, user, eligible]);

  const flashMaya = (msg: string) => {
    setMayaToast(msg);
    window.setTimeout(() => setMayaToast(null), 2500);
  };

  const toggleDimension = (dim: string) => {
    setForm((prev) => {
      const next = prev.priority_dimensions.includes(dim)
        ? prev.priority_dimensions.filter((d) => d !== dim)
        : [...prev.priority_dimensions, dim];
      return {
        ...prev,
        priority_dimensions: next.length ? next : ['Technical'],
      };
    });
  };

  const applyMayaNotes = (field: keyof typeof EMPTY_FORM) => {
    const map: Partial<typeof EMPTY_FORM> = {};
    if (field === 'technical_notes') map.technical_notes = suggestTechnicalNotes(evidence);
    if (field === 'user_notes') map.user_notes = suggestUserNotes(evidence);
    if (field === 'market_notes') map.market_notes = suggestMarketNotes(evidence);
    if (field === 'financial_notes') {
      map.financial_notes = suggestFinancialNotes(selectedProject, evidence);
    }
    patch(map);
    flashMaya('MAYA notes applied.');
  };

  const buildWorkspaceNotes = (): string | null => {
    const blocks: string[] = [];
    if (form.validation_scope !== 'full') blocks.push(`Scope: ${form.validation_scope}`);
    if (form.priority_dimensions.length < 4) {
      blocks.push(`Priority dimensions: ${form.priority_dimensions.join(', ')}`);
    }
    if (form.technical_notes.trim()) blocks.push(`Technical:\n${form.technical_notes.trim()}`);
    if (form.user_notes.trim()) blocks.push(`User:\n${form.user_notes.trim()}`);
    if (form.market_notes.trim()) blocks.push(`Market:\n${form.market_notes.trim()}`);
    if (form.financial_notes.trim()) blocks.push(`Financial:\n${form.financial_notes.trim()}`);
    if (form.reviewer_context.trim()) blocks.push(`Reviewer context:\n${form.reviewer_context.trim()}`);
    if (form.document_links.trim()) blocks.push(`Links: ${form.document_links.trim()}`);
    return blocks.length ? blocks.join('\n\n') : null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) return;
    if (!form.project_id) {
      setError('Select a project to validate.');
      return;
    }
    if (!form.confirm_evidence) {
      setError('Confirm you have reviewed the evidence snapshot.');
      return;
    }

    setSubmitting(true);
    try {
      const record = await createValidation(form.project_id, user.id);
      const workspaceNotes = buildWorkspaceNotes();

      if (workspaceNotes) {
        const combined = [record.reviewer_notes, '--- Workspace notes ---', workspaceNotes]
          .filter(Boolean)
          .join('\n\n');
        await updateValidationDecision(record.id, user.id, record.decision, combined);
      }

      navigate(`/validation/${record.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run validation');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="cval-page">
        <div className="cval-loading" aria-label="Loading" />
      </div>
    );
  }

  if (eligible.length === 0) {
    return (
      <div className="cval-page">
        <header className="cval-header">
          <Link to="/validation" className="cval-back">
            ← Validation
          </Link>
          <h1>Run validation gate</h1>
          <p>Aggregate Research, Prototype, and Experiment evidence before Funding.</p>
        </header>
        <div className="cval-empty">
          <h2>No eligible projects</h2>
          <p>
            Projects must reach Prototype, Experiment, or Validation stage. Complete research,
            upload a prototype, and run experiments first.
          </p>
          <div className="cval-empty__actions">
            <Link to="/experiments/create" className="cval-btn cval-btn--primary">
              Create experiment
            </Link>
            <Link to="/prototypes" className="cval-btn cval-btn--ghost">
              View prototypes
            </Link>
            <Link to="/projects" className="cval-btn cval-btn--ghost">
              Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cval-page">
      <header className="cval-header">
        <Link to="/validation" className="cval-back">
          ← Validation
        </Link>
        <h1>Run validation gate</h1>
        <p>Aggregate evidence across Research, Prototype, and Experiments for a funding decision.</p>
        <nav className="cval-flow" aria-label="Validation pipeline">
          {FLOW_STEPS.map((step) => (
            <span
              key={step}
              className={`cval-flow__step ${step === 'Validation' ? 'cval-flow__step--active' : ''}`}
            >
              {step}
            </span>
          ))}
        </nav>
      </header>

      {error && <div className="cval-error">{error}</div>}
      {mayaToast && <p className="cval-maya-toast">{mayaToast}</p>}

      <form className="cval-form" onSubmit={handleSubmit}>
        <aside className="cval-maya">
          <strong>MAYA validation advisor</strong>
          {preview ? (
            <>
              <div className="cval-maya__block">
                <label>Predicted outcome</label>
                <p>
                  <span className={`cval-decision cval-decision--${preview.decision}`}>
                    {decisionLabel(preview.decision)}
                  </span>{' '}
                  · Overall <strong>{preview.scores.overall}%</strong>
                </p>
                <span className={`cval-risk cval-risk--${risk.level}`}>{risk.level} risk</span>
                <p className="cval-maya__hint">{risk.note}</p>
              </div>
              <div className="cval-maya__scores">
                <span>T {preview.scores.technical}</span>
                <span>U {preview.scores.user}</span>
                <span>M {preview.scores.market}</span>
                <span>F {preview.scores.financial}</span>
              </div>
              <div className="cval-maya__block">
                <label>Evidence gaps</label>
                <ul>
                  {gaps.slice(0, 3).map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
              {insights.length > 0 && (
                <div className="cval-maya__block">
                  <label>Insights</label>
                  <ul>
                    {insights.slice(0, 2).map((i) => (
                      <li key={i.id}>{i.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="cval-maya__hint">Select a project to preview scores and MAYA insights.</p>
          )}
        </aside>

        <section className="cval-section">
          <h2>1. Project context</h2>
          <label className="cval-field">
            <span>Project *</span>
            <select
              value={form.project_id}
              onChange={(e) => patch({ project_id: e.target.value })}
              required
            >
              <option value="">Select eligible project…</option>
              {eligible.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {getInnovationStage(p)} · {p.progress}%
                </option>
              ))}
            </select>
          </label>
          {selectedProject && (
            <dl className="cval-meta">
              <div>
                <dt>Stage</dt>
                <dd>{getInnovationStage(selectedProject)}</dd>
              </div>
              <div>
                <dt>Progress</dt>
                <dd>{selectedProject.progress}%</dd>
              </div>
              <div>
                <dt>Funding readiness</dt>
                <dd>{getFundingReadiness(selectedProject)}%</dd>
              </div>
            </dl>
          )}
        </section>

        <section className="cval-section">
          <h2>2. Evidence snapshot</h2>
          {evidenceLoading ? (
            <p className="cval-hint">Loading evidence from modules…</p>
          ) : evidence ? (
            <div className="cval-evidence">
              <div className="cval-evidence__col">
                <h3>Research</h3>
                <ul>
                  <li>{evidence.research.findingsCount} findings</li>
                  <li>{evidence.research.notesCount} notes ({evidence.research.interviewNotesCount} interviews)</li>
                  <li>{evidence.research.literatureCount} literature</li>
                  <li>{evidence.research.completionPct}% complete</li>
                </ul>
                {form.project_id && (
                  <Link to={`/research/${form.project_id}`}>Open research →</Link>
                )}
              </div>
              <div className="cval-evidence__col">
                <h3>Prototypes</h3>
                <ul>
                  <li>{evidence.prototypes.count} prototypes</li>
                  <li>{evidence.prototypes.withBuildCount} with builds</li>
                  <li>{Math.round(evidence.prototypes.avgTestPassRate * 100)}% test pass rate</li>
                </ul>
                <Link to={`/prototypes?projectId=${form.project_id}`}>Open prototypes →</Link>
              </div>
              <div className="cval-evidence__col">
                <h3>Experiments</h3>
                <ul>
                  <li>{evidence.experiments.count} experiments</li>
                  <li>{evidence.experiments.completedCount} completed</li>
                  <li>
                    {evidence.experiments.marketTypeCount} market / {evidence.experiments.userTypeCount} user
                  </li>
                </ul>
                <Link to={`/experiments?projectId=${form.project_id}`}>Open experiments →</Link>
              </div>
            </div>
          ) : (
            <p className="cval-hint">Select a project to load read-only evidence summary.</p>
          )}
        </section>

        <section className="cval-section">
          <h2>3. Validation scope</h2>
          <label className="cval-field">
            <span>Review scope</span>
            <select
              value={form.validation_scope}
              onChange={(e) =>
                patch({ validation_scope: e.target.value as typeof form.validation_scope })
              }
            >
              {VALIDATION_SCOPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="cval-field">
            <span>Priority dimensions</span>
            <div className="cval-chips">
              {PRIORITY_DIMENSIONS.map((dim) => (
                <button
                  key={dim}
                  type="button"
                  className={`cval-chip ${form.priority_dimensions.includes(dim) ? 'cval-chip--on' : ''}`}
                  onClick={() => toggleDimension(dim)}
                >
                  {dim}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="cval-section">
          <h2>4. Technical dimension</h2>
          <label className="cval-field">
            <span>Technical evidence notes</span>
            <textarea
              rows={3}
              value={form.technical_notes}
              onChange={(e) => patch({ technical_notes: e.target.value })}
              placeholder="Prototype quality, test results, architecture risks"
            />
          </label>
          <button
            type="button"
            className="cval-maya-btn"
            onClick={() => applyMayaNotes('technical_notes')}
            disabled={!form.project_id}
          >
            ✨ MAYA technical notes
          </button>
        </section>

        <section className="cval-section">
          <h2>5. User validation</h2>
          <label className="cval-field">
            <span>User evidence notes</span>
            <textarea
              rows={3}
              value={form.user_notes}
              onChange={(e) => patch({ user_notes: e.target.value })}
              placeholder="Interviews, usability findings, adoption signals"
            />
          </label>
          <button
            type="button"
            className="cval-maya-btn"
            onClick={() => applyMayaNotes('user_notes')}
            disabled={!form.project_id}
          >
            ✨ MAYA user notes
          </button>
        </section>

        <section className="cval-section">
          <h2>6. Market validation</h2>
          <label className="cval-field">
            <span>Market evidence notes</span>
            <textarea
              rows={3}
              value={form.market_notes}
              onChange={(e) => patch({ market_notes: e.target.value })}
              placeholder="TAM/SAM, competitors, demand experiments"
            />
          </label>
          <button
            type="button"
            className="cval-maya-btn"
            onClick={() => applyMayaNotes('market_notes')}
            disabled={!form.project_id}
          >
            ✨ MAYA market notes
          </button>
        </section>

        <section className="cval-section">
          <h2>7. Financial readiness</h2>
          <label className="cval-field">
            <span>Financial notes</span>
            <textarea
              rows={3}
              value={form.financial_notes}
              onChange={(e) => patch({ financial_notes: e.target.value })}
              placeholder="Unit economics, runway, revenue hypotheses"
            />
          </label>
          <button
            type="button"
            className="cval-maya-btn"
            onClick={() => applyMayaNotes('financial_notes')}
            disabled={!form.project_id}
          >
            ✨ MAYA financial notes
          </button>
        </section>

        <section className="cval-section">
          <h2>8. Reviewer context</h2>
          <label className="cval-field">
            <span>Additional context for auditors</span>
            <textarea
              rows={3}
              value={form.reviewer_context}
              onChange={(e) => patch({ reviewer_context: e.target.value })}
              placeholder="Assumptions, risks accepted, or pending evidence"
            />
          </label>
          <label className="cval-field">
            <span>Supporting links</span>
            <input
              type="text"
              value={form.document_links}
              onChange={(e) => patch({ document_links: e.target.value })}
              placeholder="Deck, financial model, research doc URLs"
            />
          </label>
        </section>

        <section className="cval-section cval-section--summary">
          <h2>9. Review & run</h2>
          <dl className="cval-summary">
            <div>
              <dt>Project</dt>
              <dd>{selectedProject?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>Predicted</dt>
              <dd>{preview ? decisionLabel(preview.decision) : '—'}</dd>
            </div>
            <div>
              <dt>Overall</dt>
              <dd>{preview ? `${preview.scores.overall}%` : '—'}</dd>
            </div>
            <div>
              <dt>Scope</dt>
              <dd>{form.validation_scope}</dd>
            </div>
          </dl>
          <label className="cval-check">
            <input
              type="checkbox"
              checked={form.confirm_evidence}
              onChange={(e) => patch({ confirm_evidence: e.target.checked })}
            />
            <span>I have reviewed the evidence snapshot and understand this runs the validation gate.</span>
          </label>
        </section>

        <footer className="cval-actions">
          <Link to="/validation" className="cval-btn cval-btn--ghost">
            Cancel
          </Link>
          <button
            type="submit"
            className="cval-btn cval-btn--primary"
            disabled={submitting || !form.project_id || !form.confirm_evidence}
          >
            {submitting ? 'Evaluating…' : 'Run validation gate'}
          </button>
        </footer>
      </form>

      <style>{`
        .cval-page {
          max-width: 920px;
          margin: 0 auto;
          padding: 1.5rem 2rem 3rem;
          color: #e8e8f0;
        }
        .cval-header { margin-bottom: 1.25rem; }
        .cval-back { color: #68d391; text-decoration: none; font-size: 0.88rem; }
        .cval-header h1 {
          margin: 0.5rem 0 0.25rem;
          font-size: 1.75rem;
          background: linear-gradient(135deg, #fff, #68d391);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .cval-header p { margin: 0; opacity: 0.65; font-size: 0.92rem; }
        .cval-flow {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 1rem;
        }
        .cval-flow__step {
          padding: 0.3rem 0.7rem;
          border-radius: 18px;
          font-size: 0.65rem;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.1);
          opacity: 0.5;
        }
        .cval-flow__step--active {
          opacity: 1;
          border-color: rgba(104,211,145,0.5);
          background: rgba(104,211,145,0.12);
          color: #68d391;
        }
        .cval-error {
          background: rgba(252,129,129,0.15);
          border: 1px solid rgba(252,129,129,0.4);
          color: #fc8181;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          font-size: 0.88rem;
        }
        .cval-maya-toast {
          margin: 0 0 1rem;
          font-size: 0.82rem;
          color: #68d391;
        }
        .cval-empty {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 2rem;
        }
        .cval-empty h2 { margin: 0 0 0.5rem; color: #68d391; }
        .cval-empty p { margin: 0 0 1.25rem; opacity: 0.75; line-height: 1.5; }
        .cval-empty__actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .cval-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .cval-maya {
          background: linear-gradient(135deg, rgba(72,187,120,0.12), rgba(47,212,255,0.06));
          border: 1px solid rgba(104,211,145,0.28);
          border-radius: 16px;
          padding: 1.25rem;
          font-size: 0.85rem;
        }
        .cval-maya strong { color: #68d391; display: block; margin-bottom: 0.75rem; }
        .cval-maya__block { margin-bottom: 0.85rem; }
        .cval-maya__block label {
          display: block;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          opacity: 0.55;
          margin-bottom: 0.25rem;
        }
        .cval-maya__block p { margin: 0; line-height: 1.5; }
        .cval-maya__block ul {
          margin: 0;
          padding-left: 1.1rem;
          opacity: 0.8;
          line-height: 1.45;
        }
        .cval-maya__block li { margin-bottom: 0.3rem; font-size: 0.8rem; }
        .cval-maya__hint { margin: 0.35rem 0 0; opacity: 0.7; font-size: 0.82rem; }
        .cval-maya__scores {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.85rem;
        }
        .cval-maya__scores span {
          background: rgba(0,0,0,0.35);
          border-radius: 8px;
          padding: 0.25rem 0.5rem;
          font-size: 0.72rem;
          font-weight: 700;
        }
        .cval-decision {
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.85rem;
        }
        .cval-decision--pass { color: #68d391; }
        .cval-decision--hold { color: #f6c90e; }
        .cval-decision--fail { color: #fc8181; }
        .cval-decision--pending { color: #9b7ff0; }
        .cval-risk {
          display: inline-block;
          margin-top: 0.35rem;
          padding: 0.12rem 0.5rem;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .cval-risk--low { background: rgba(72,187,120,0.2); color: #68d391; }
        .cval-risk--medium { background: rgba(246,201,14,0.2); color: #f6c90e; }
        .cval-risk--high { background: rgba(252,129,129,0.2); color: #fc8181; }
        .cval-maya-btn {
          background: rgba(72,187,120,0.2);
          border: 1px solid rgba(104,211,145,0.4);
          color: #68d391;
          border-radius: 20px;
          padding: 0.35rem 0.85rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }
        .cval-maya-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cval-section {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.25rem;
        }
        .cval-section--summary { border-color: rgba(104,211,145,0.25); }
        .cval-section h2 {
          margin: 0 0 1rem;
          font-size: 1rem;
          color: #68d391;
        }
        .cval-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 0.85rem;
        }
        .cval-field span { font-size: 0.78rem; font-weight: 600; opacity: 0.85; }
        .cval-field input,
        .cval-field select,
        .cval-field textarea {
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.65rem 0.75rem;
          color: #fff;
          font-family: inherit;
          font-size: 0.88rem;
        }
        .cval-field input:focus,
        .cval-field select:focus,
        .cval-field textarea:focus {
          outline: none;
          border-color: rgba(104,211,145,0.5);
        }
        .cval-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.65rem;
          margin: 0;
        }
        .cval-meta div {
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
          padding: 0.6rem 0.75rem;
        }
        .cval-meta dt {
          font-size: 0.65rem;
          text-transform: uppercase;
          opacity: 0.5;
          margin: 0;
        }
        .cval-meta dd { margin: 0.2rem 0 0; font-weight: 600; font-size: 0.88rem; }
        .cval-evidence {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        @media (max-width: 720px) {
          .cval-evidence, .cval-meta { grid-template-columns: 1fr; }
        }
        .cval-evidence__col {
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          padding: 0.85rem;
          font-size: 0.82rem;
        }
        .cval-evidence__col h3 {
          margin: 0 0 0.5rem;
          font-size: 0.78rem;
          color: #2fd4ff;
        }
        .cval-evidence__col ul {
          margin: 0 0 0.5rem;
          padding-left: 1.1rem;
          opacity: 0.85;
        }
        .cval-evidence__col a {
          color: #68d391;
          font-size: 0.75rem;
          text-decoration: none;
        }
        .cval-chips { display: flex; flex-wrap: wrap; gap: 0.45rem; }
        .cval-chip {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.75);
          border-radius: 20px;
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }
        .cval-chip--on {
          background: rgba(72,187,120,0.22);
          border-color: rgba(104,211,145,0.45);
          color: #9ae6b4;
        }
        .cval-hint { margin: 0; opacity: 0.65; font-size: 0.85rem; }
        .cval-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.65rem;
          margin: 0 0 1rem;
        }
        @media (max-width: 640px) {
          .cval-summary { grid-template-columns: 1fr 1fr; }
        }
        .cval-summary div {
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
          padding: 0.65rem 0.75rem;
        }
        .cval-summary dt {
          font-size: 0.65rem;
          text-transform: uppercase;
          opacity: 0.5;
          margin: 0;
        }
        .cval-summary dd { margin: 0.2rem 0 0; font-weight: 600; font-size: 0.88rem; }
        .cval-check {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          font-size: 0.85rem;
          opacity: 0.9;
          cursor: pointer;
        }
        .cval-check input { margin-top: 0.2rem; accent-color: #68d391; }
        .cval-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 0.5rem;
        }
        .cval-btn {
          padding: 0.65rem 1.25rem;
          border-radius: 30px;
          font-weight: 600;
          font-size: 0.88rem;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }
        .cval-btn--ghost { background: rgba(255,255,255,0.08); color: #fff; }
        .cval-btn--primary {
          background: linear-gradient(135deg, #48bb78, #2fd4ff);
          color: #0a0d1a;
        }
        .cval-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .cval-loading {
          width: 40px;
          height: 40px;
          margin: 4rem auto;
          border: 3px solid rgba(104,211,145,0.25);
          border-top-color: #68d391;
          border-radius: 50%;
          animation: cval-spin 0.8s linear infinite;
        }
        @keyframes cval-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
