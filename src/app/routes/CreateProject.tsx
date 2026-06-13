import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { createProject } from '../../lib/supabase/projects.queries';
import {
  PIPELINE_STAGES,
  type PipelineStage,
} from '../../types/project.types';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const SECTORS = [
  'Agriculture',
  'Health',
  'Education',
  'FinTech',
  'Environment',
  'Blockchain',
  'AI/ML',
  'IoT',
  'E-commerce',
  'Logistics',
  'Tourism',
  'Cybersecurity',
  'Gaming',
  'Other',
] as const;

const FLOW_STEPS = [
  'Idea',
  'Research',
  'Prototype',
  'Experiment',
  'Validation',
  'Funding',
  'Commercialization',
] as const;

const EMPTY_FORM = {
  name: '',
  tagline: '',
  sector: 'Health',
  problem_statement: '',
  vision: '',
  target_users: '',
  innovation_goals: '',
  initial_stage: 'Idea' as PipelineStage,
  team_id: '',
  document_links: '',
};

interface TeamOption {
  id: string;
  name: string;
}

type RiskLevel = 'low' | 'medium' | 'high';

/* ─── MAYA stubs ────────────────────────────────────────────────────────── */

function suggestDescription(
  name: string,
  problem: string,
  vision: string,
  sector: string
): string {
  const n = name.trim() || 'This innovation';
  const p = problem.trim().slice(0, 140) || 'a meaningful workflow gap in the target market';
  const v = vision.trim().slice(0, 120) || 'a scalable product approach validated through the XLab pipeline';
  return `${n} tackles ${p}. We will deliver ${v} for ${sector} innovators, progressing from research evidence to prototype and validation before funding.`;
}

function suggestProblem(name: string, sector: string, targetUsers: string): string {
  const users = targetUsers.trim() || 'target customers';
  return `${users} in ${sector} face friction that ${name.trim() || 'current solutions'} do not solve efficiently — leading to lost time, higher cost, and limited adoption of new tools.`;
}

function innovationScore(
  name: string,
  problem: string,
  goals: string,
  stage: PipelineStage
): number {
  let score = 35;
  if (name.trim().length >= 4) score += 12;
  if (problem.trim().length >= 40) score += 18;
  if (goals.trim().length >= 30) score += 15;
  if (stage !== 'Idea') score += 10;
  return Math.min(92, score);
}

function nextStepRecommendation(stage: PipelineStage): string {
  const map: Record<PipelineStage, string> = {
    Idea: 'Open Research Center and capture problem evidence + literature review.',
    Analysis: 'Complete analysis checklist and link findings to the project.',
    Experiment: 'Design a structured experiment with measurable hypotheses.',
    Prototype: 'Upload an MVP in Prototype Builder and run internal tests.',
    Funding: 'Ensure validation PASS before creating a funding pitch.',
    Launched: 'Move into Commercialization command center for GTM planning.',
  };
  return map[stage];
}

function assessRisk(score: number): { level: RiskLevel; note: string } {
  if (score >= 70) return { level: 'low', note: 'Strong framing — ready to enter the research phase.' };
  if (score >= 50) return { level: 'medium', note: 'Good start — sharpen problem evidence and measurable goals.' };
  return { level: 'high', note: 'Add more detail to problem, users, and goals before advancing.' };
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function CreateProject() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillTeamId = searchParams.get('teamId') ?? '';

  const [form, setForm] = useState({ ...EMPTY_FORM, team_id: prefillTeamId });
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mayaToast, setMayaToast] = useState<string | null>(null);

  const patch = useCallback((partial: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const score = innovationScore(
    form.name,
    form.problem_statement,
    form.innovation_goals,
    form.initial_stage
  );
  const risk = assessRisk(score);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('teams')
        .select('id, name')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false });

      if (!cancelled) {
        setTeams(data ?? []);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate]);

  const flashMaya = (msg: string) => {
    setMayaToast(msg);
    window.setTimeout(() => setMayaToast(null), 2500);
  };

  const applyMayaDescription = () => {
    patch({
      vision: suggestDescription(
        form.name,
        form.problem_statement,
        form.vision,
        form.sector
      ),
    });
    flashMaya('MAYA description drafted in vision field.');
  };

  const applyMayaProblem = () => {
    patch({
      problem_statement: suggestProblem(form.name, form.sector, form.target_users),
    });
    flashMaya('MAYA problem statement applied.');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) return;
    if (!form.name.trim()) {
      setError('Project name is required.');
      return;
    }

    const description =
      form.vision.trim() ||
      suggestDescription(form.name, form.problem_statement, '', form.sector);

    setSubmitting(true);
    try {
      const project = await createProject({
        name: form.name.trim(),
        description,
        sector: form.sector,
        initialStage: form.initial_stage,
        userId: user.id,
        metadata: {
          tagline: form.tagline.trim(),
          problem_statement: form.problem_statement.trim(),
          target_users: form.target_users.trim(),
          innovation_goals: form.innovation_goals.trim(),
          document_links: form.document_links.trim(),
          team_id: form.team_id || undefined,
          maya_insights: {
            innovation_score: score,
            risk_level: risk.level,
            next_step: nextStepRecommendation(form.initial_stage),
            suggested_description: suggestDescription(
              form.name,
              form.problem_statement,
              form.vision,
              form.sector
            ),
          },
        },
      });

      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="cpj-page">
        <div className="cpj-loading" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="cpj-page">
      <header className="cpj-header">
        <Link to="/projects" className="cpj-back">
          ← Projects
        </Link>
        <h1>Start innovation project</h1>
        <p>Define your idea and enter the Maylet XLab pipeline.</p>
        <nav className="cpj-flow" aria-label="Innovation pipeline">
          {FLOW_STEPS.map((step) => (
            <span
              key={step}
              className={`cpj-flow__step ${step === 'Idea' ? 'cpj-flow__step--active' : ''}`}
            >
              {step}
            </span>
          ))}
        </nav>
      </header>

      {error && <div className="cpj-error">{error}</div>}
      {mayaToast && <p className="cpj-maya-toast">{mayaToast}</p>}

      <form className="cpj-form" onSubmit={handleSubmit}>
        <aside className="cpj-maya">
          <strong>MAYA project advisor</strong>
          <div className="cpj-maya__block">
            <label>Innovation readiness</label>
            <p>
              Score: <strong>{score}%</strong> — {risk.note}
            </p>
            <span className={`cpj-risk cpj-risk--${risk.level}`}>{risk.level} risk</span>
          </div>
          <div className="cpj-maya__block">
            <label>Recommended next step</label>
            <p>{nextStepRecommendation(form.initial_stage)}</p>
          </div>
          <div className="cpj-maya__actions">
            <button type="button" className="cpj-maya-btn" onClick={applyMayaDescription}>
              ✨ Generate description
            </button>
            <button type="button" className="cpj-maya-btn" onClick={applyMayaProblem}>
              ✨ Suggest problem
            </button>
          </div>
        </aside>

        <section className="cpj-section">
          <h2>Project identity</h2>
          <label className="cpj-field">
            <span>Project name *</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="e.g. MediScan AI"
              maxLength={120}
              required
            />
          </label>
          <label className="cpj-field">
            <span>Tagline</span>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => patch({ tagline: e.target.value })}
              placeholder="One-line pitch for your innovation"
            />
          </label>
          <label className="cpj-field">
            <span>Sector</span>
            <select value={form.sector} onChange={(e) => patch({ sector: e.target.value })}>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="cpj-section">
          <h2>Problem & vision</h2>
          <label className="cpj-field">
            <span>Problem statement</span>
            <textarea
              rows={3}
              value={form.problem_statement}
              onChange={(e) => patch({ problem_statement: e.target.value })}
              placeholder="What pain point are you solving?"
            />
          </label>
          <label className="cpj-field">
            <span>Solution / vision</span>
            <textarea
              rows={4}
              value={form.vision}
              onChange={(e) => patch({ vision: e.target.value })}
              placeholder="How will your innovation solve the problem?"
            />
          </label>
          <label className="cpj-field">
            <span>Target users</span>
            <textarea
              rows={2}
              value={form.target_users}
              onChange={(e) => patch({ target_users: e.target.value })}
              placeholder="Who benefits first? (personas, segments, geography)"
            />
          </label>
        </section>

        <section className="cpj-section">
          <h2>Innovation goals</h2>
          <label className="cpj-field">
            <span>Goals & success metrics</span>
            <textarea
              rows={4}
              value={form.innovation_goals}
              onChange={(e) => patch({ innovation_goals: e.target.value })}
              placeholder="What must be true in 90 days? (MVP, users, revenue, impact)"
            />
          </label>
          <label className="cpj-field">
            <span>Initial pipeline stage</span>
            <select
              value={form.initial_stage}
              onChange={(e) => patch({ initial_stage: e.target.value as PipelineStage })}
            >
              {PIPELINE_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="cpj-section">
          <h2>Team & documents</h2>
          {teams.length > 0 && (
            <label className="cpj-field">
              <span>Link team (optional)</span>
              <select value={form.team_id} onChange={(e) => patch({ team_id: e.target.value })}>
                <option value="">No team linked</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="cpj-field">
            <span>Supporting links</span>
            <input
              type="text"
              value={form.document_links}
              onChange={(e) => patch({ document_links: e.target.value })}
              placeholder="Notion, Drive, or research doc URLs (comma-separated)"
            />
          </label>
        </section>

        <footer className="cpj-actions">
          <Link to="/projects" className="cpj-btn cpj-btn--ghost">
            Cancel
          </Link>
          <button type="submit" className="cpj-btn cpj-btn--primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create project record'}
          </button>
        </footer>
      </form>

      <style>{`
        .cpj-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 1.5rem 2rem 3rem;
          color: #e8e8f0;
        }
        .cpj-header { margin-bottom: 1.25rem; }
        .cpj-back { color: #9b7ff0; text-decoration: none; font-size: 0.88rem; }
        .cpj-header h1 {
          margin: 0.5rem 0 0.25rem;
          font-size: 1.75rem;
          background: linear-gradient(135deg, #fff, #2fd4ff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .cpj-header p { margin: 0; opacity: 0.65; font-size: 0.92rem; }
        .cpj-flow {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 1rem;
        }
        .cpj-flow__step {
          padding: 0.3rem 0.7rem;
          border-radius: 18px;
          font-size: 0.65rem;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.1);
          opacity: 0.5;
        }
        .cpj-flow__step--active {
          opacity: 1;
          border-color: rgba(47,212,255,0.5);
          background: rgba(47,212,255,0.12);
          color: #2fd4ff;
        }
        .cpj-error {
          background: rgba(252,129,129,0.15);
          border: 1px solid rgba(252,129,129,0.4);
          color: #fc8181;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          font-size: 0.88rem;
        }
        .cpj-maya-toast {
          margin: 0 0 1rem;
          font-size: 0.82rem;
          color: #68d391;
        }
        .cpj-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .cpj-maya {
          background: linear-gradient(135deg, rgba(124,95,230,0.12), rgba(47,212,255,0.06));
          border: 1px solid rgba(124,95,230,0.25);
          border-radius: 16px;
          padding: 1.25rem;
          font-size: 0.85rem;
        }
        .cpj-maya strong { color: #9b7ff0; display: block; margin-bottom: 0.75rem; }
        .cpj-maya__block { margin-bottom: 0.85rem; }
        .cpj-maya__block label {
          display: block;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          opacity: 0.55;
          margin-bottom: 0.25rem;
        }
        .cpj-maya__block p { margin: 0; line-height: 1.5; opacity: 0.85; }
        .cpj-maya__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
        .cpj-maya-btn {
          background: rgba(124,95,230,0.25);
          border: 1px solid rgba(124,95,230,0.4);
          color: #c4b5fd;
          border-radius: 20px;
          padding: 0.35rem 0.85rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }
        .cpj-risk {
          display: inline-block;
          margin-top: 0.35rem;
          padding: 0.12rem 0.5rem;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .cpj-risk--low { background: rgba(72,187,120,0.2); color: #68d391; }
        .cpj-risk--medium { background: rgba(246,201,14,0.2); color: #f6c90e; }
        .cpj-risk--high { background: rgba(252,129,129,0.2); color: #fc8181; }
        .cpj-section {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.25rem;
        }
        .cpj-section h2 {
          margin: 0 0 1rem;
          font-size: 1rem;
          color: #2fd4ff;
        }
        .cpj-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 0.85rem;
        }
        .cpj-field span { font-size: 0.78rem; font-weight: 600; opacity: 0.85; }
        .cpj-field input,
        .cpj-field select,
        .cpj-field textarea {
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.65rem 0.75rem;
          color: #fff;
          font-family: inherit;
          font-size: 0.88rem;
        }
        .cpj-field input:focus,
        .cpj-field select:focus,
        .cpj-field textarea:focus {
          outline: none;
          border-color: rgba(124,95,230,0.5);
        }
        .cpj-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 0.5rem;
        }
        .cpj-btn {
          padding: 0.65rem 1.25rem;
          border-radius: 30px;
          font-weight: 600;
          font-size: 0.88rem;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }
        .cpj-btn--ghost { background: rgba(255,255,255,0.08); color: #fff; }
        .cpj-btn--primary {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
        }
        .cpj-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .cpj-loading {
          width: 40px;
          height: 40px;
          margin: 4rem auto;
          border: 3px solid rgba(47,212,255,0.25);
          border-top-color: #2fd4ff;
          border-radius: 50%;
          animation: cpj-spin 0.8s linear infinite;
        }
        @keyframes cpj-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
