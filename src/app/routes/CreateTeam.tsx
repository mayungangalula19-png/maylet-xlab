import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { getProjects } from '../../lib/supabase/projects.queries';
import type { Project } from '../../types/project.types';

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
  'Assemble',
  'Research',
  'Prototype',
  'Experiment',
  'Validation',
  'Funding',
] as const;

const TEAM_SIZES = ['Solo', '2–5', '6–10', '10+'] as const;

const WORKING_STYLES = ['Remote', 'Hybrid', 'In-person'] as const;

const ROLES_NEEDED = [
  'Product',
  'Engineering',
  'Design',
  'Research',
  'Marketing',
  'Operations',
  'Finance',
  'Legal',
] as const;

const COMM_CHANNELS = [
  'XLab Messages',
  'Slack',
  'Discord',
  'WhatsApp',
  'Email',
  'Video standups',
] as const;

const EMPTY_FORM = {
  name: '',
  tagline: '',
  focus_area: 'Health',
  description: '',
  purpose: '',
  innovation_focus: '',
  target_outcomes: '',
  project_id: '',
  team_size: '2–5' as (typeof TEAM_SIZES)[number],
  roles_needed: [] as string[],
  working_style: 'Remote' as (typeof WORKING_STYLES)[number],
  timezone: '',
  communication_channels: ['XLab Messages'] as string[],
  skills_needed: '',
  invite_emails: '',
  goals_90_day: '',
  resource_links: '',
  default_invite_role: 'member' as 'admin' | 'member',
};

interface TeamWorkspaceConfig {
  tagline: string;
  focus_area: string;
  innovation_focus: string;
  target_outcomes: string;
  team_size: string;
  roles_needed: string[];
  working_style: string;
  timezone: string;
  communication_channels: string[];
  skills_needed: string;
  goals_90_day: string;
  resource_links: string;
  pending_invites: string[];
  invited_members: { user_id: string; email: string; role: string }[];
  maya_insights: {
    collaboration_score: number;
    risk_level: RiskLevel;
    recruiting_tips: string[];
    next_step: string;
    suggested_description: string;
    suggested_mission: string;
  };
}

type RiskLevel = 'low' | 'medium' | 'high';

/* ─── MAYA stubs ────────────────────────────────────────────────────────── */

function suggestTeamDescription(
  name: string,
  focus: string,
  innovation: string,
  outcomes: string
): string {
  const n = name.trim() || 'This team';
  const inv = innovation.trim().slice(0, 120) || `a focused innovation sprint in ${focus}`;
  const out = outcomes.trim().slice(0, 100) || 'measurable prototype and validation milestones';
  return `${n} brings together builders to pursue ${inv}. We align on ${out} using the Maylet XLab pipeline — from research evidence to funded commercialization.`;
}

function suggestMission(name: string, purpose: string, skills: string): string {
  const team = name.trim() || 'Our team';
  const skillHint = skills.trim().slice(0, 80) || 'cross-functional collaborators';
  const base = purpose.trim();
  if (base.length >= 40) return base;
  return `${team} exists to ship innovation with ${skillHint}. We move fast with clear ownership, shared documentation, and weekly evidence reviews until validation PASS.`;
}

function collaborationScore(
  name: string,
  description: string,
  purpose: string,
  roles: string[],
  skills: string
): number {
  let score = 30;
  if (name.trim().length >= 3) score += 10;
  if (description.trim().length >= 50) score += 15;
  if (purpose.trim().length >= 40) score += 15;
  if (roles.length >= 2) score += 12;
  if (skills.trim().length >= 20) score += 10;
  return Math.min(94, score);
}

function recruitingTips(focus: string, roles: string[], size: string): string[] {
  const roleHint = roles.length ? roles.join(', ') : 'product and engineering';
  return [
    `Lead with your ${focus} problem statement — specificity attracts aligned builders.`,
    `Target ${roleHint} profiles comfortable with ${size} team velocity.`,
    'Share a 2-week onboarding plan and decision rights in your first invite message.',
    'Link an active XLab project so recruits see pipeline context immediately.',
    'Host a 30-minute async intro: mission, milestones, and communication norms.',
  ];
}

function nextStepRecommendation(hasProject: boolean): string {
  if (hasProject) {
    return 'Open Team Workspace, invite members, and assign roles to your linked project.';
  }
  return 'Create or link an innovation project, then invite collaborators from Profiles.';
}

function assessRisk(score: number, inviteCount: number): { level: RiskLevel; note: string } {
  if (score >= 72 && inviteCount >= 1) {
    return { level: 'low', note: 'Strong team charter — ready to recruit and assign work.' };
  }
  if (score >= 52) {
    return { level: 'medium', note: 'Good foundation — clarify roles and add initial invites.' };
  }
  return { level: 'high', note: 'Add mission detail, skills, and at least one collaborator invite.' };
}

function parseEmails(raw: string): string[] {
  return [...new Set(raw.split(/[\n,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function CreateTeam() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillProjectId = searchParams.get('projectId') ?? '';

  const [form, setForm] = useState({ ...EMPTY_FORM, project_id: prefillProjectId });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mayaToast, setMayaToast] = useState<string | null>(null);

  const patch = useCallback((partial: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const inviteList = useMemo(() => parseEmails(form.invite_emails), [form.invite_emails]);

  const score = collaborationScore(
    form.name,
    form.description,
    form.purpose,
    form.roles_needed,
    form.skills_needed
  );

  const risk = assessRisk(score, inviteList.length);

  const tips = useMemo(
    () => recruitingTips(form.focus_area, form.roles_needed, form.team_size),
    [form.focus_area, form.roles_needed, form.team_size]
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
        const list = await getProjects(user.id);
        if (cancelled) return;
        setProjects(list);
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

  const flashMaya = (msg: string) => {
    setMayaToast(msg);
    window.setTimeout(() => setMayaToast(null), 2500);
  };

  const toggleRole = (role: string) => {
    setForm((prev) => {
      const next = prev.roles_needed.includes(role)
        ? prev.roles_needed.filter((r) => r !== role)
        : [...prev.roles_needed, role];
      return { ...prev, roles_needed: next };
    });
  };

  const toggleChannel = (channel: string) => {
    setForm((prev) => {
      const next = prev.communication_channels.includes(channel)
        ? prev.communication_channels.filter((c) => c !== channel)
        : [...prev.communication_channels, channel];
      return { ...prev, communication_channels: next.length ? next : ['XLab Messages'] };
    });
  };

  const applyMayaDescription = () => {
    patch({
      description: suggestTeamDescription(
        form.name,
        form.focus_area,
        form.innovation_focus,
        form.target_outcomes
      ),
    });
    flashMaya('MAYA team description drafted.');
  };

  const applyMayaMission = () => {
    patch({ purpose: suggestMission(form.name, form.purpose, form.skills_needed) });
    flashMaya('MAYA mission statement applied.');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) return;
    if (!form.name.trim()) {
      setError('Team name is required.');
      return;
    }

    const description =
      form.description.trim() ||
      suggestTeamDescription(form.name, form.focus_area, form.innovation_focus, form.target_outcomes);

    const purpose =
      form.purpose.trim() || suggestMission(form.name, '', form.skills_needed);

    const workspace: TeamWorkspaceConfig = {
      tagline: form.tagline.trim(),
      focus_area: form.focus_area,
      innovation_focus: form.innovation_focus.trim(),
      target_outcomes: form.target_outcomes.trim(),
      team_size: form.team_size,
      roles_needed: form.roles_needed,
      working_style: form.working_style,
      timezone: form.timezone.trim(),
      communication_channels: form.communication_channels,
      skills_needed: form.skills_needed.trim(),
      goals_90_day: form.goals_90_day.trim(),
      resource_links: form.resource_links.trim(),
      pending_invites: [],
      invited_members: [],
      maya_insights: {
        collaboration_score: score,
        risk_level: risk.level,
        recruiting_tips: tips,
        next_step: nextStepRecommendation(!!form.project_id),
        suggested_description: suggestTeamDescription(
          form.name,
          form.focus_area,
          form.innovation_focus,
          form.target_outcomes
        ),
        suggested_mission: suggestMission(form.name, form.purpose, form.skills_needed),
      },
    };

    setSubmitting(true);
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: form.name.trim(),
          description,
          purpose,
          project_id: form.project_id || null,
          owner_id: user.id,
          user_id: user.id,
        })
        .select('id')
        .single();

      if (teamError) throw teamError;

      const { error: memberError } = await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: user.id,
        role: 'owner',
        joined_at: new Date().toISOString(),
      });
      if (memberError) throw memberError;

      for (const email of inviteList) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('email', email)
          .maybeSingle();

        if (!profile || profile.id === user.id) {
          workspace.pending_invites.push(email);
          continue;
        }

        const { data: existing } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', team.id)
          .eq('user_id', profile.id)
          .maybeSingle();

        if (existing) continue;

        const { error: inviteError } = await supabase.from('team_members').insert({
          team_id: team.id,
          user_id: profile.id,
          role: form.default_invite_role,
        });

        if (!inviteError) {
          workspace.invited_members.push({
            user_id: profile.id,
            email: profile.email ?? email,
            role: form.default_invite_role,
          });
        } else {
          workspace.pending_invites.push(email);
        }
      }

      await supabase.from('team_activities').insert({
        team_id: team.id,
        user_id: user.id,
        action: 'created team workspace',
        details: workspace,
      });

      if (workspace.invited_members.length) {
        const names = workspace.invited_members.map((m) => m.email).join(', ');
        await supabase.from('team_activities').insert({
          team_id: team.id,
          user_id: user.id,
          action: `invited ${workspace.invited_members.length} member(s)`,
          details: { emails: names, role: form.default_invite_role },
        });
      }

      navigate(`/teams/${team.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="ctm-page">
        <div className="ctm-loading" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="ctm-page">
      <header className="ctm-header">
        <Link to="/teams" className="ctm-back">
          ← Teams
        </Link>
        <h1>Assemble innovation team</h1>
        <p>Define your mission, recruit collaborators, and link pipeline work.</p>
        <nav className="ctm-flow" aria-label="Collaboration pipeline">
          {FLOW_STEPS.map((step) => (
            <span
              key={step}
              className={`ctm-flow__step ${step === 'Assemble' ? 'ctm-flow__step--active' : ''}`}
            >
              {step}
            </span>
          ))}
        </nav>
      </header>

      {error && <div className="ctm-error">{error}</div>}
      {mayaToast && <p className="ctm-maya-toast">{mayaToast}</p>}

      <form className="ctm-form" onSubmit={handleSubmit}>
        <aside className="ctm-maya">
          <strong>MAYA team advisor</strong>
          <div className="ctm-maya__block">
            <label>Collaboration readiness</label>
            <p>
              Score: <strong>{score}%</strong> — {risk.note}
            </p>
            <span className={`ctm-risk ctm-risk--${risk.level}`}>{risk.level} risk</span>
          </div>
          <div className="ctm-maya__block">
            <label>Recommended next step</label>
            <p>{nextStepRecommendation(!!form.project_id)}</p>
          </div>
          <div className="ctm-maya__block">
            <label>Recruiting tips</label>
            <ul>
              {tips.slice(0, 3).map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
          <div className="ctm-maya__actions">
            <button type="button" className="ctm-maya-btn" onClick={applyMayaDescription}>
              ✨ Draft description
            </button>
            <button type="button" className="ctm-maya-btn" onClick={applyMayaMission}>
              ✨ Draft mission
            </button>
          </div>
        </aside>

        <section className="ctm-section">
          <h2>1. Team identity</h2>
          <label className="ctm-field">
            <span>Team name *</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="e.g. MediScan Builders"
              maxLength={80}
              required
            />
          </label>
          <label className="ctm-field">
            <span>Tagline</span>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => patch({ tagline: e.target.value })}
              placeholder="One-line identity for your squad"
            />
          </label>
          <label className="ctm-field">
            <span>Innovation focus area</span>
            <select value={form.focus_area} onChange={(e) => patch({ focus_area: e.target.value })}>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="ctm-section">
          <h2>2. Mission & overview</h2>
          <label className="ctm-field">
            <span>Team description</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="What does this team build? Who is it for?"
            />
          </label>
          <label className="ctm-field">
            <span>Mission / purpose</span>
            <textarea
              rows={3}
              value={form.purpose}
              onChange={(e) => patch({ purpose: e.target.value })}
              placeholder="Why does this team exist? What impact will you make?"
            />
          </label>
        </section>

        <section className="ctm-section">
          <h2>3. Innovation focus</h2>
          <label className="ctm-field">
            <span>What you are building</span>
            <textarea
              rows={3}
              value={form.innovation_focus}
              onChange={(e) => patch({ innovation_focus: e.target.value })}
              placeholder="Product, service, or research initiative this team owns"
            />
          </label>
          <label className="ctm-field">
            <span>Target outcomes</span>
            <textarea
              rows={3}
              value={form.target_outcomes}
              onChange={(e) => patch({ target_outcomes: e.target.value })}
              placeholder="MVP, users, revenue, or validation milestones"
            />
          </label>
        </section>

        <section className="ctm-section">
          <h2>4. Link project</h2>
          <label className="ctm-field">
            <span>XLab project (optional)</span>
            <select value={form.project_id} onChange={(e) => patch({ project_id: e.target.value })}>
              <option value="">No project linked yet</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.sector} · {p.status}
                </option>
              ))}
            </select>
          </label>
          {projects.length === 0 && (
            <p className="ctm-hint">
              No projects yet.{' '}
              <Link to="/projects/create">Create a project</Link> to link pipeline context.
            </p>
          )}
        </section>

        <section className="ctm-section">
          <h2>5. Team structure</h2>
          <label className="ctm-field">
            <span>Target team size</span>
            <select value={form.team_size} onChange={(e) => patch({ team_size: e.target.value as typeof form.team_size })}>
              {TEAM_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="ctm-field">
            <span>Roles needed</span>
            <div className="ctm-chips">
              {ROLES_NEEDED.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`ctm-chip ${form.roles_needed.includes(role) ? 'ctm-chip--on' : ''}`}
                  onClick={() => toggleRole(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="ctm-section">
          <h2>6. Collaboration setup</h2>
          <div className="ctm-grid">
            <label className="ctm-field">
              <span>Working style</span>
              <select
                value={form.working_style}
                onChange={(e) => patch({ working_style: e.target.value as typeof form.working_style })}
              >
                {WORKING_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="ctm-field">
              <span>Timezone / core hours</span>
              <input
                type="text"
                value={form.timezone}
                onChange={(e) => patch({ timezone: e.target.value })}
                placeholder="e.g. EAT (UTC+3), Mon–Fri 9–17"
              />
            </label>
          </div>
          <div className="ctm-field">
            <span>Communication channels</span>
            <div className="ctm-chips">
              {COMM_CHANNELS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={`ctm-chip ${form.communication_channels.includes(ch) ? 'ctm-chip--on' : ''}`}
                  onClick={() => toggleChannel(ch)}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="ctm-section">
          <h2>7. Skills & recruiting</h2>
          <label className="ctm-field">
            <span>Skills & expertise needed</span>
            <textarea
              rows={3}
              value={form.skills_needed}
              onChange={(e) => patch({ skills_needed: e.target.value })}
              placeholder="e.g. React, clinical workflows, grant writing, hardware prototyping"
            />
          </label>
          <label className="ctm-field">
            <span>Invite collaborators (emails)</span>
            <textarea
              rows={3}
              value={form.invite_emails}
              onChange={(e) => patch({ invite_emails: e.target.value })}
              placeholder="Registered XLab emails, comma or newline separated"
            />
          </label>
          <div className="ctm-grid">
            <label className="ctm-field">
              <span>Default invite role</span>
              <select
                value={form.default_invite_role}
                onChange={(e) => patch({ default_invite_role: e.target.value as 'admin' | 'member' })}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div className="ctm-field">
              <span>Pending invites</span>
              <p className="ctm-meta">{inviteList.length} email(s) queued for lookup on create</p>
            </div>
          </div>
        </section>

        <section className="ctm-section">
          <h2>8. Goals & milestones</h2>
          <label className="ctm-field">
            <span>90-day team goals</span>
            <textarea
              rows={4}
              value={form.goals_90_day}
              onChange={(e) => patch({ goals_90_day: e.target.value })}
              placeholder="Sprint outcomes, hiring targets, prototype deadlines, validation prep"
            />
          </label>
        </section>

        <section className="ctm-section">
          <h2>9. Resources & links</h2>
          <label className="ctm-field">
            <span>Shared resources</span>
            <input
              type="text"
              value={form.resource_links}
              onChange={(e) => patch({ resource_links: e.target.value })}
              placeholder="Notion, Drive, Figma, repo URLs (comma-separated)"
            />
          </label>
        </section>

        <section className="ctm-section ctm-section--summary">
          <h2>10. Review & create</h2>
          <dl className="ctm-summary">
            <div>
              <dt>Team</dt>
              <dd>{form.name.trim() || '—'}</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>{form.focus_area}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{form.team_size}</dd>
            </div>
            <div>
              <dt>Project</dt>
              <dd>
                {form.project_id
                  ? projects.find((p) => p.id === form.project_id)?.name ?? 'Linked'
                  : 'None'}
              </dd>
            </div>
            <div>
              <dt>Invites</dt>
              <dd>{inviteList.length}</dd>
            </div>
            <div>
              <dt>Readiness</dt>
              <dd>{score}%</dd>
            </div>
          </dl>
        </section>

        <footer className="ctm-actions">
          <Link to="/teams" className="ctm-btn ctm-btn--ghost">
            Cancel
          </Link>
          <button type="submit" className="ctm-btn ctm-btn--primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create team workspace'}
          </button>
        </footer>
      </form>

      <style>{`
        .ctm-page {
          max-width: 920px;
          margin: 0 auto;
          padding: 1.5rem 2rem 3rem;
          color: #e8e8f0;
        }
        .ctm-header { margin-bottom: 1.25rem; }
        .ctm-back { color: #9b7ff0; text-decoration: none; font-size: 0.88rem; }
        .ctm-header h1 {
          margin: 0.5rem 0 0.25rem;
          font-size: 1.75rem;
          background: linear-gradient(135deg, #fff, #c4b5fd);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .ctm-header p { margin: 0; opacity: 0.65; font-size: 0.92rem; }
        .ctm-flow {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 1rem;
        }
        .ctm-flow__step {
          padding: 0.3rem 0.7rem;
          border-radius: 18px;
          font-size: 0.65rem;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.1);
          opacity: 0.5;
        }
        .ctm-flow__step--active {
          opacity: 1;
          border-color: rgba(196,181,253,0.5);
          background: rgba(124,95,230,0.15);
          color: #c4b5fd;
        }
        .ctm-error {
          background: rgba(252,129,129,0.15);
          border: 1px solid rgba(252,129,129,0.4);
          color: #fc8181;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          font-size: 0.88rem;
        }
        .ctm-maya-toast {
          margin: 0 0 1rem;
          font-size: 0.82rem;
          color: #68d391;
        }
        .ctm-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .ctm-maya {
          background: linear-gradient(135deg, rgba(124,95,230,0.14), rgba(196,181,253,0.06));
          border: 1px solid rgba(124,95,230,0.28);
          border-radius: 16px;
          padding: 1.25rem;
          font-size: 0.85rem;
        }
        .ctm-maya strong { color: #c4b5fd; display: block; margin-bottom: 0.75rem; }
        .ctm-maya__block { margin-bottom: 0.85rem; }
        .ctm-maya__block label {
          display: block;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          opacity: 0.55;
          margin-bottom: 0.25rem;
        }
        .ctm-maya__block p { margin: 0; line-height: 1.5; opacity: 0.85; }
        .ctm-maya__block ul {
          margin: 0;
          padding-left: 1.1rem;
          opacity: 0.8;
          line-height: 1.45;
        }
        .ctm-maya__block li { margin-bottom: 0.35rem; font-size: 0.8rem; }
        .ctm-maya__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
        .ctm-maya-btn {
          background: rgba(124,95,230,0.25);
          border: 1px solid rgba(124,95,230,0.4);
          color: #c4b5fd;
          border-radius: 20px;
          padding: 0.35rem 0.85rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }
        .ctm-risk {
          display: inline-block;
          margin-top: 0.35rem;
          padding: 0.12rem 0.5rem;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .ctm-risk--low { background: rgba(72,187,120,0.2); color: #68d391; }
        .ctm-risk--medium { background: rgba(246,201,14,0.2); color: #f6c90e; }
        .ctm-risk--high { background: rgba(252,129,129,0.2); color: #fc8181; }
        .ctm-section {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.25rem;
        }
        .ctm-section--summary { border-color: rgba(124,95,230,0.25); }
        .ctm-section h2 {
          margin: 0 0 1rem;
          font-size: 1rem;
          color: #c4b5fd;
        }
        .ctm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.85rem;
        }
        @media (max-width: 640px) {
          .ctm-grid { grid-template-columns: 1fr; }
        }
        .ctm-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 0.85rem;
        }
        .ctm-field span { font-size: 0.78rem; font-weight: 600; opacity: 0.85; }
        .ctm-field input,
        .ctm-field select,
        .ctm-field textarea {
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.65rem 0.75rem;
          color: #fff;
          font-family: inherit;
          font-size: 0.88rem;
        }
        .ctm-field input:focus,
        .ctm-field select:focus,
        .ctm-field textarea:focus {
          outline: none;
          border-color: rgba(124,95,230,0.5);
        }
        .ctm-chips { display: flex; flex-wrap: wrap; gap: 0.45rem; }
        .ctm-chip {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.75);
          border-radius: 20px;
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }
        .ctm-chip--on {
          background: rgba(124,95,230,0.28);
          border-color: rgba(196,181,253,0.45);
          color: #e9d5ff;
        }
        .ctm-hint {
          margin: 0;
          font-size: 0.82rem;
          opacity: 0.65;
        }
        .ctm-hint a { color: #9b7ff0; }
        .ctm-meta {
          margin: 0.35rem 0 0;
          font-size: 0.82rem;
          opacity: 0.7;
        }
        .ctm-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin: 0;
        }
        @media (max-width: 640px) {
          .ctm-summary { grid-template-columns: 1fr 1fr; }
        }
        .ctm-summary div {
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
          padding: 0.65rem 0.75rem;
        }
        .ctm-summary dt {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.5;
          margin: 0;
        }
        .ctm-summary dd {
          margin: 0.2rem 0 0;
          font-size: 0.88rem;
          font-weight: 600;
        }
        .ctm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 0.5rem;
        }
        .ctm-btn {
          padding: 0.65rem 1.25rem;
          border-radius: 30px;
          font-weight: 600;
          font-size: 0.88rem;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }
        .ctm-btn--ghost { background: rgba(255,255,255,0.08); color: #fff; }
        .ctm-btn--primary {
          background: linear-gradient(135deg, #7c5fe6, #c4b5fd);
          color: #0a0d1a;
        }
        .ctm-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .ctm-loading {
          width: 40px;
          height: 40px;
          margin: 4rem auto;
          border: 3px solid rgba(124,95,230,0.25);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: ctm-spin 0.8s linear infinite;
        }
        @keyframes ctm-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
