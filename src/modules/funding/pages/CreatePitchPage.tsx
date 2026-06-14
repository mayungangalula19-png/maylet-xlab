import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { useAuth } from '../../../hooks/useAuth';
import { getProjects } from '../../../lib/supabase/projects.queries';
import { getFundingReadiness } from '../../../lib/innovation/lifecycle';
import { createPitch } from '../services/funding.service';
import type { Project } from '../../../types/project.types';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface ValidationSnapshot {
  id: string;
  project_id: string;
  decision: string;
  overall_score: number;
  technical_score: number;
  user_score: number;
  market_score: number;
  financial_score: number;
  promoted_at: string | null;
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

interface PitchWorkspace {
  executive_summary: string;
  problem_statement: string;
  solution: string;
  market_opportunity: string;
  business_model: string;
  use_of_funds: string;
  team_section: string;
  document_ids: string[];
  team_member_ids: string[];
  pitch_deck_url: string;
  attachment_notes: string;
  validation_id: string;
  maya_insights: {
    executive_summary?: string;
    investor_suggestions?: string[];
    funding_readiness?: string;
    risk_assessment?: string;
  };
}

const FLOW_STEPS = ['Validation', 'Funding', 'Commercialization'] as const;

const EMPTY_FORM = {
  project_id: '',
  title: '',
  executive_summary: '',
  problem_statement: '',
  solution: '',
  market_opportunity: '',
  business_model: '',
  funding_amount: 50000,
  equity_offered: 10,
  use_of_funds: '',
  team_section: '',
  pitch_deck_url: '',
  attachment_notes: '',
  document_ids: [] as string[],
  team_member_ids: [] as string[],
};

type RiskLevel = 'low' | 'medium' | 'high';

/* ─── MAYA stubs ────────────────────────────────────────────────────────── */

function generateExecutiveSummary(
  project: Project | null,
  problem: string,
  solution: string,
  market: string
): string {
  const name = project?.name ?? 'Our innovation';
  const sector = project?.sector ?? 'the target market';
  return `${name} addresses a critical gap in ${sector}. ${problem.trim().slice(0, 120) || 'Customers face costly workflow friction.'} Our solution ${solution.trim().slice(0, 100) || 'delivers measurable efficiency gains through a validated product approach'}. ${market.trim().slice(0, 80) || 'The addressable market supports scalable adoption'} with a clear path from validation evidence to funded launch.`;
}

function investorSuggestions(sector: string, amount: number): string[] {
  const suggestions = [
    'Lead with validation PASS scores and user evidence in slide 2.',
    'Quantify TAM/SAM and cite 2–3 comparable raises in your sector.',
    `Target ${sector} angels and grant programs aligned with $${amount.toLocaleString()} checks.`,
    'Include 18-month use-of-funds with milestone-based tranches.',
    'Prepare a 5-minute demo video for investor follow-ups.',
  ];
  return suggestions;
}

function fundingReadinessNote(
  validation: ValidationSnapshot | null,
  project: Project | null
): string {
  if (!validation) return 'Complete validation with a PASS decision to unlock funding pitches.';
  const readiness = project ? getFundingReadiness(project) : validation.overall_score;
  return `Validation PASS (${validation.overall_score}% overall). Platform funding readiness: ${readiness}%. ${validation.promoted_at ? 'Promoted to funding pipeline.' : 'Eligible to create pitch.'}`;
}

function assessRisk(validation: ValidationSnapshot | null, equity: number): { level: RiskLevel; note: string } {
  if (!validation) return { level: 'high', note: 'No validation record — funding blocked.' };
  const avg = (validation.technical_score + validation.market_score + validation.financial_score) / 3;
  if (avg >= 75 && equity <= 20) {
    return { level: 'low', note: 'Strong validation scores and reasonable dilution profile.' };
  }
  if (avg >= 55) {
    return { level: 'medium', note: 'Solid evidence; strengthen financial projections and cap table story.' };
  }
  return { level: 'high', note: 'Validation scores suggest refining evidence before aggressive outreach.' };
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function CreatePitch() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillProjectId = searchParams.get('projectId') ?? '';

  const [form, setForm] = useState({ ...EMPTY_FORM, project_id: prefillProjectId });
  const [passProjects, setPassProjects] = useState<Project[]>([]);
  const [validation, setValidation] = useState<ValidationSnapshot | null>(null);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mayaToast, setMayaToast] = useState<string | null>(null);

  const patch = useCallback((partial: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const selectedProject = useMemo(
    () => passProjects.find((p) => p.id === form.project_id) ?? null,
    [passProjects, form.project_id]
  );

  const risk = useMemo(
    () => assessRisk(validation, form.equity_offered),
    [validation, form.equity_offered]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [projects, valRes] = await Promise.all([
          getProjects(user.id),
          supabase
            .from('validations')
            .select(
              'id, project_id, decision, overall_score, technical_score, user_score, market_score, financial_score, promoted_at'
            )
            .eq('user_id', user.id)
            .eq('decision', 'pass')
            .order('created_at', { ascending: false }),
        ]);

        if (cancelled) return;

        const passIds = new Set((valRes.data ?? []).map((v) => v.project_id as string));
        const eligible = projects.filter((p) => passIds.has(p.id));
        setPassProjects(eligible);

        if (prefillProjectId && eligible.some((p) => p.id === prefillProjectId)) {
          setForm((prev) => ({
            ...prev,
            project_id: prefillProjectId,
            title: eligible.find((p) => p.id === prefillProjectId)?.name ?? prev.title,
          }));
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
      setValidation(null);
      setDocuments([]);
      setTeamMembers([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const [valRes, docRes, teamRes] = await Promise.all([
        supabase
          .from('validations')
          .select(
            'id, project_id, decision, overall_score, technical_score, user_score, market_score, financial_score, promoted_at'
          )
          .eq('project_id', form.project_id)
          .eq('user_id', user.id)
          .eq('decision', 'pass')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('documents')
          .select('id, name, file_type')
          .eq('project_id', form.project_id)
          .order('created_at', { ascending: false }),
        supabase.from('teams').select('id').eq('project_id', form.project_id).maybeSingle(),
      ]);

      if (cancelled) return;

      if (valRes.data) {
        const v = valRes.data;
        setValidation({
          id: v.id,
          project_id: v.project_id,
          decision: v.decision,
          overall_score: Number(v.overall_score ?? 0),
          technical_score: Number(v.technical_score ?? 0),
          user_score: Number(v.user_score ?? 0),
          market_score: Number(v.market_score ?? 0),
          financial_score: Number(v.financial_score ?? 0),
          promoted_at: v.promoted_at,
        });
      } else {
        setValidation(null);
      }

      setDocuments(docRes.data ?? []);

      const teamId = teamRes.data?.id;
      if (teamId) {
        const { data: members } = await supabase
          .from('team_members')
          .select('id, user_id, role')
          .eq('team_id', teamId);

        if (cancelled) return;

        const enriched = await Promise.all(
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

        const names = enriched.map((m) => `• ${m.display_name} (${m.role})`).join('\n');
        if (names && !form.team_section) {
          patch({ team_section: names });
        }
      } else {
        setTeamMembers([]);
      }

      const project = passProjects.find((p) => p.id === form.project_id);
      if (project && !form.title) {
        patch({ title: project.name });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.project_id, user, passProjects, patch, form.team_section, form.title]);

  const toggleId = (field: 'document_ids' | 'team_member_ids', id: string) => {
    setForm((prev) => {
      const list = prev[field];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      return { ...prev, [field]: next };
    });
  };

  const flashMaya = (msg: string) => {
    setMayaToast(msg);
    window.setTimeout(() => setMayaToast(null), 2500);
  };

  const applyMayaSummary = () => {
    patch({
      executive_summary: generateExecutiveSummary(
        selectedProject,
        form.problem_statement,
        form.solution,
        form.market_opportunity
      ),
    });
    flashMaya('Executive summary generated.');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) return;
    if (!form.project_id || !validation) {
      setError('Only projects with validation PASS can create funding pitches.');
      return;
    }
    if (!form.title.trim()) {
      setError('Pitch title is required.');
      return;
    }
    if (!form.executive_summary.trim()) {
      setError('Executive summary is required.');
      return;
    }
    if (form.funding_amount <= 0) {
      setError('Funding amount must be greater than zero.');
      return;
    }

    const workspace: PitchWorkspace = {
      executive_summary: form.executive_summary.trim(),
      problem_statement: form.problem_statement.trim(),
      solution: form.solution.trim(),
      market_opportunity: form.market_opportunity.trim(),
      business_model: form.business_model.trim(),
      use_of_funds: form.use_of_funds.trim(),
      team_section: form.team_section.trim(),
      document_ids: form.document_ids,
      team_member_ids: form.team_member_ids,
      pitch_deck_url: form.pitch_deck_url.trim(),
      attachment_notes: form.attachment_notes.trim(),
      validation_id: validation.id,
      maya_insights: {
        executive_summary: generateExecutiveSummary(
          selectedProject,
          form.problem_statement,
          form.solution,
          form.market_opportunity
        ),
        investor_suggestions: investorSuggestions(
          selectedProject?.sector ?? 'Technology',
          form.funding_amount
        ),
        funding_readiness: fundingReadinessNote(validation, selectedProject),
        risk_assessment: `${risk.level.toUpperCase()}: ${risk.note}`,
      },
    };

    setSubmitting(true);
    try {
      const record = await createPitch({
        user_id: user.id,
        project_id: form.project_id,
        title: form.title.trim(),
        description: form.executive_summary.trim(),
        summary: JSON.stringify(workspace),
        amount: form.funding_amount,
        amount_sought: form.funding_amount,
        equity_offered: form.equity_offered,
        pitch_deck_url: form.pitch_deck_url.trim() || null,
        industry: selectedProject?.sector ?? 'Technology',
        stage: 'mvp',
        status: 'draft',
        updated_at: new Date().toISOString(),
      });

      navigate(`/funding/${record.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pitch');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="cpitch-page">
        <div className="cpitch-loading" aria-label="Loading" />
      </div>
    );
  }

  if (passProjects.length === 0) {
    return (
      <div className="cpitch-page">
        <header className="cpitch-header">
          <Link to="/funding" className="cpitch-back">
            ← Funding Hub
          </Link>
          <h1>Create funding pitch</h1>
        </header>
        <div className="cpitch-gate">
          <h2>Validation required</h2>
          <p>
            Only projects with a <strong>PASS</strong> validation decision can create funding
            pitches. Complete the validation gate first.
          </p>
          <div className="cpitch-actions">
            <Link to="/validation" className="cpitch-btn cpitch-btn--primary">
              Go to Validation
            </Link>
            <Link to="/funding" className="cpitch-btn cpitch-btn--ghost">
              Back to Funding Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cpitch-page">
      <header className="cpitch-header">
        <Link to="/funding" className="cpitch-back">
          ← Funding Hub
        </Link>
        <h1>Create funding pitch</h1>
        <p>Build an investor-ready package from validated innovations.</p>
        <nav className="cpitch-flow" aria-label="Innovation flow">
          {FLOW_STEPS.map((step) => (
            <span
              key={step}
              className={`cpitch-flow__step ${step === 'Funding' ? 'cpitch-flow__step--active' : ''}`}
            >
              {step}
            </span>
          ))}
        </nav>
      </header>

      {error && <div className="cpitch-error">{error}</div>}
      {mayaToast && <p className="cpitch-maya-toast">{mayaToast}</p>}

      <form className="cpitch-form" onSubmit={handleSubmit}>
        {/* 1–2. Project & validation */}
        <section className="cpitch-section">
          <h2>Project & validation</h2>
          <label className="cpitch-field">
            <span>Validated project *</span>
            <select
              value={form.project_id}
              onChange={(e) =>
                patch({
                  project_id: e.target.value,
                  title: passProjects.find((p) => p.id === e.target.value)?.name ?? '',
                })
              }
              required
            >
              <option value="">Select PASS project…</option>
              {passProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sector})
                </option>
              ))}
            </select>
          </label>

          {validation && (
            <div className="cpitch-validation">
              <div className="cpitch-validation__badge">PASS</div>
              <div>
                <strong>Validation status</strong>
                <p>Overall score: {validation.overall_score}%</p>
                <div className="cpitch-scores">
                  <span>Tech {validation.technical_score}%</span>
                  <span>User {validation.user_score}%</span>
                  <span>Market {validation.market_score}%</span>
                  <span>Financial {validation.financial_score}%</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* MAYA sidebar panel - funding analysis */}
        {validation && selectedProject && (
          <aside className="cpitch-maya">
            <strong>MAYA funding advisor</strong>
            <div className="cpitch-maya__block">
              <label>Funding readiness</label>
              <p>{fundingReadinessNote(validation, selectedProject)}</p>
            </div>
            <div className="cpitch-maya__block">
              <label>
                Risk assessment{' '}
                <span className={`cpitch-risk cpitch-risk--${risk.level}`}>{risk.level}</span>
              </label>
              <p>{risk.note}</p>
            </div>
            <div className="cpitch-maya__block">
              <label>Investor pitch suggestions</label>
              <ul>
                {investorSuggestions(selectedProject.sector, form.funding_amount).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <button type="button" className="cpitch-maya-btn" onClick={applyMayaSummary}>
              ✨ Generate executive summary
            </button>
          </aside>
        )}

        {/* 3–7. Pitch content */}
        <section className="cpitch-section">
          <h2>Pitch narrative</h2>
          <label className="cpitch-field">
            <span>Pitch title *</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              required
            />
          </label>
          <label className="cpitch-field">
            <span>Executive summary *</span>
            <textarea
              rows={4}
              value={form.executive_summary}
              onChange={(e) => patch({ executive_summary: e.target.value })}
              placeholder="One-paragraph investor overview…"
              required
            />
          </label>
          <label className="cpitch-field">
            <span>Problem statement</span>
            <textarea
              rows={3}
              value={form.problem_statement}
              onChange={(e) => patch({ problem_statement: e.target.value })}
              placeholder="What pain point are you solving?"
            />
          </label>
          <label className="cpitch-field">
            <span>Solution</span>
            <textarea
              rows={3}
              value={form.solution}
              onChange={(e) => patch({ solution: e.target.value })}
              placeholder="How does your product solve it?"
            />
          </label>
          <label className="cpitch-field">
            <span>Market opportunity</span>
            <textarea
              rows={3}
              value={form.market_opportunity}
              onChange={(e) => patch({ market_opportunity: e.target.value })}
              placeholder="TAM/SAM, growth trends, target segment…"
            />
          </label>
          <label className="cpitch-field">
            <span>Business model</span>
            <textarea
              rows={3}
              value={form.business_model}
              onChange={(e) => patch({ business_model: e.target.value })}
              placeholder="Revenue model, pricing, unit economics…"
            />
          </label>
        </section>

        {/* 8–9. Funding */}
        <section className="cpitch-section">
          <h2>Funding request</h2>
          <div className="cpitch-grid">
            <label className="cpitch-field">
              <span>Amount sought (USD) *</span>
              <input
                type="number"
                min={1000}
                step={1000}
                value={form.funding_amount}
                onChange={(e) => patch({ funding_amount: Number(e.target.value) })}
                required
              />
            </label>
            <label className="cpitch-field">
              <span>Equity offered (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={form.equity_offered}
                onChange={(e) => patch({ equity_offered: Number(e.target.value) })}
              />
            </label>
          </div>
          <label className="cpitch-field">
            <span>Use of funds</span>
            <textarea
              rows={4}
              value={form.use_of_funds}
              onChange={(e) => patch({ use_of_funds: e.target.value })}
              placeholder="Breakdown: product, hiring, GTM, runway months…"
            />
          </label>
        </section>

        {/* 10. Team */}
        <section className="cpitch-section">
          <h2>Team</h2>
          {teamMembers.length > 0 && (
            <ul className="cpitch-checklist">
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
          <label className="cpitch-field">
            <span>Team narrative</span>
            <textarea
              rows={4}
              value={form.team_section}
              onChange={(e) => patch({ team_section: e.target.value })}
              placeholder="Founders, advisors, relevant experience…"
            />
          </label>
        </section>

        {/* 11. Documents */}
        <section className="cpitch-section">
          <h2>Document uploads</h2>
          <label className="cpitch-field">
            <span>Pitch deck URL</span>
            <input
              type="url"
              value={form.pitch_deck_url}
              onChange={(e) => patch({ pitch_deck_url: e.target.value })}
              placeholder="https://…"
            />
          </label>
          {!form.project_id ? (
            <p className="cpitch-hint">Select a project to attach documents.</p>
          ) : documents.length === 0 ? (
            <p className="cpitch-hint">
              No project documents yet. Add files in <Link to="/documents">Documents</Link>.
            </p>
          ) : (
            <ul className="cpitch-checklist">
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
          <label className="cpitch-field">
            <span>Attachment notes</span>
            <input
              type="text"
              value={form.attachment_notes}
              onChange={(e) => patch({ attachment_notes: e.target.value })}
              placeholder="Financial model, cap table, or external links"
            />
          </label>
        </section>

        <footer className="cpitch-actions">
          <Link to="/funding" className="cpitch-btn cpitch-btn--ghost">
            Cancel
          </Link>
          <button
            type="submit"
            className="cpitch-btn cpitch-btn--primary"
            disabled={submitting || !validation}
          >
            {submitting ? 'Creating…' : 'Create pitch record'}
          </button>
        </footer>
      </form>

      <style>{`
        .cpitch-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 1.5rem 2rem 3rem;
          color: #e8e8f0;
        }
        .cpitch-header { margin-bottom: 1.25rem; }
        .cpitch-back { color: #9b7ff0; text-decoration: none; font-size: 0.88rem; }
        .cpitch-header h1 {
          margin: 0.5rem 0 0.25rem;
          font-size: 1.75rem;
          background: linear-gradient(135deg, #fff, #f6c90e);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .cpitch-header p { margin: 0; opacity: 0.65; font-size: 0.92rem; }
        .cpitch-flow {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .cpitch-flow__step {
          padding: 0.35rem 0.85rem;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.1);
          opacity: 0.55;
        }
        .cpitch-flow__step--active {
          opacity: 1;
          border-color: rgba(246,201,14,0.5);
          background: rgba(246,201,14,0.15);
          color: #f6c90e;
        }
        .cpitch-gate {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
        }
        .cpitch-gate h2 { margin: 0 0 0.5rem; color: #f6c90e; }
        .cpitch-gate p { opacity: 0.75; line-height: 1.6; max-width: 480px; margin: 0 auto 1.5rem; }
        .cpitch-error {
          background: rgba(252,129,129,0.15);
          border: 1px solid rgba(252,129,129,0.4);
          color: #fc8181;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          font-size: 0.88rem;
        }
        .cpitch-maya-toast {
          margin: 0 0 1rem;
          font-size: 0.82rem;
          color: #68d391;
        }
        .cpitch-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .cpitch-section {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.25rem;
        }
        .cpitch-section h2 {
          margin: 0 0 1rem;
          font-size: 1rem;
          color: #f6c90e;
        }
        .cpitch-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 640px) { .cpitch-grid { grid-template-columns: 1fr; } }
        .cpitch-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 0.85rem;
        }
        .cpitch-field span { font-size: 0.78rem; font-weight: 600; opacity: 0.85; }
        .cpitch-field input,
        .cpitch-field select,
        .cpitch-field textarea {
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.65rem 0.75rem;
          color: #fff;
          font-family: inherit;
          font-size: 0.88rem;
        }
        .cpitch-validation {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1rem;
          border-radius: 12px;
          background: rgba(72,187,120,0.1);
          border: 1px solid rgba(72,187,120,0.3);
          margin-top: 0.5rem;
        }
        .cpitch-validation__badge {
          background: rgba(72,187,120,0.25);
          color: #68d391;
          font-weight: 800;
          font-size: 0.75rem;
          padding: 0.35rem 0.65rem;
          border-radius: 8px;
        }
        .cpitch-validation p { margin: 0.25rem 0; font-size: 0.85rem; opacity: 0.8; }
        .cpitch-scores {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
          font-size: 0.72rem;
          opacity: 0.7;
        }
        .cpitch-maya {
          background: linear-gradient(135deg, rgba(124,95,230,0.12), rgba(246,201,14,0.06));
          border: 1px solid rgba(124,95,230,0.25);
          border-radius: 16px;
          padding: 1.25rem;
          font-size: 0.85rem;
        }
        .cpitch-maya strong { color: #9b7ff0; display: block; margin-bottom: 0.75rem; }
        .cpitch-maya__block { margin-bottom: 0.85rem; }
        .cpitch-maya__block label {
          display: block;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          opacity: 0.55;
          margin-bottom: 0.25rem;
        }
        .cpitch-maya__block p { margin: 0; line-height: 1.5; opacity: 0.85; }
        .cpitch-maya__block ul {
          margin: 0.25rem 0 0;
          padding-left: 1.1rem;
          line-height: 1.55;
          opacity: 0.85;
        }
        .cpitch-maya-btn {
          background: rgba(124,95,230,0.25);
          border: 1px solid rgba(124,95,230,0.4);
          color: #c4b5fd;
          border-radius: 20px;
          padding: 0.45rem 1rem;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
        }
        .cpitch-risk {
          display: inline-block;
          padding: 0.1rem 0.45rem;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .cpitch-risk--low { background: rgba(72,187,120,0.2); color: #68d391; }
        .cpitch-risk--medium { background: rgba(246,201,14,0.2); color: #f6c90e; }
        .cpitch-risk--high { background: rgba(252,129,129,0.2); color: #fc8181; }
        .cpitch-checklist { list-style: none; margin: 0 0 1rem; padding: 0; }
        .cpitch-checklist li {
          padding: 0.45rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .cpitch-checklist label {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          font-size: 0.88rem;
        }
        .cpitch-checklist em { opacity: 0.5; font-style: normal; font-size: 0.78rem; }
        .cpitch-hint { font-size: 0.82rem; opacity: 0.55; margin: 0; }
        .cpitch-hint a { color: #9b7ff0; }
        .cpitch-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 0.5rem;
        }
        .cpitch-btn {
          padding: 0.65rem 1.25rem;
          border-radius: 30px;
          font-weight: 600;
          font-size: 0.88rem;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }
        .cpitch-btn--ghost { background: rgba(255,255,255,0.08); color: #fff; }
        .cpitch-btn--primary {
          background: linear-gradient(135deg, #7c5fe6, #f6c90e);
          color: #0a0d1a;
        }
        .cpitch-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .cpitch-loading {
          width: 40px;
          height: 40px;
          margin: 4rem auto;
          border: 3px solid rgba(246,201,14,0.25);
          border-top-color: #f6c90e;
          border-radius: 50%;
          animation: cpitch-spin 0.8s linear infinite;
        }
        @keyframes cpitch-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
