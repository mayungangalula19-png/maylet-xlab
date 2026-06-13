import { useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProjectControlCenter } from '../../hooks/useProjectControlCenter';
import { formatTimeAgo, INNOVATION_STAGES, type InnovationStage } from '../../lib/innovation/lifecycle';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const FLOW_STEPS = [
  'Idea',
  'Research',
  'Prototype',
  'Experiment',
  'Validation',
  'Funding',
  'Commercialization',
] as const;

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

const CATEGORIES = [
  'Product Innovation',
  'Social Impact',
  'Deep Tech',
  'Platform',
  'Hardware',
  'Service',
  'Research Spin-out',
  'Other',
] as const;

const MEMBER_ROLES = ['owner', 'admin', 'member', 'developer', 'designer', 'marketer', 'viewer'] as const;

const SECTIONS = [
  { id: 'info', label: 'Project information' },
  { id: 'stage', label: 'Innovation stage' },
  { id: 'team', label: 'Team management' },
  { id: 'research', label: 'Research' },
  { id: 'prototype', label: 'Prototype' },
  { id: 'experiment', label: 'Experiment' },
  { id: 'validation', label: 'Validation' },
  { id: 'funding', label: 'Funding readiness' },
  { id: 'commercialization', label: 'Commercialization' },
  { id: 'documents', label: 'Documents' },
  { id: 'timeline', label: 'Timeline' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const MODULE_ROUTES: Record<string, (id: string) => string> = {
  Research: (id) => `/research/${id}`,
  Prototype: (id) => `/prototypes?projectId=${id}`,
  Experiment: (id) => `/experiments?projectId=${id}`,
  Validation: (id) => `/validation/new?projectId=${id}`,
  Funding: (id) => `/funding/create?projectId=${id}`,
  Commercialization: (id) => `/commercialization?projectId=${id}`,
};

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function EditProject() {
  const { id } = useParams<{ id: string }>();
  const {
    project,
    workspace,
    assets,
    evaluation,
    form,
    patchForm,
    patchWorkspace,
    handleStageChange,
    loading,
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
    inviteMember,
    removeProject,
  } = useProjectControlCenter(id);

  const [activeSection, setActiveSection] = useState<SectionId>('info');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [mayaToast, setMayaToast] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollToSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const flashMaya = (msg: string) => {
    setMayaToast(msg);
    window.setTimeout(() => setMayaToast(null), 2600);
  };

  const handleSave = async (e?: FormEvent) => {
    e?.preventDefault();
    await save();
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setError(null);
    try {
      const result = await inviteMember(inviteEmail, inviteRole);
      setInviteEmail('');
      if (result.type === 'pending') {
        flashMaya(`Invite queued for ${result.email} — they can join when registered.`);
      } else {
        flashMaya(`Invited ${result.name}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Delete this project and unlink lifecycle assets? This cannot be undone.'
      )
    ) {
      return;
    }
    await removeProject();
  };

  if (loading) {
    return (
      <div className="epc-page">
        <div className="epc-loading" aria-label="Loading project control center" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="epc-page">
        <div className="epc-error">{error}</div>
        <Link to="/projects" className="epc-link">
          ← Back to projects
        </Link>
      </div>
    );
  }

  if (!project || !assets) return null;

  const currentStageIndex = INNOVATION_STAGES.indexOf(form.stage);

  return (
    <div className="epc-page">
      <header className="epc-header">
        <div className="epc-header__top">
          <Link to={`/projects/${id}`} className="epc-back">
            ← Project workspace
          </Link>
          <div className="epc-header__actions">
            <Link to={`/projects/${id}`} className="epc-btn epc-btn--ghost">
              View detail
            </Link>
            <button
              type="button"
              className="epc-btn epc-btn--primary"
              disabled={saving}
              onClick={() => handleSave()}
            >
              {saving ? 'Saving…' : 'Save control center'}
            </button>
          </div>
        </div>
        <h1>Project control center</h1>
        <p className="epc-header__sub">
          Parent container for the full innovation lifecycle — {project.name}
          {syncing && <span className="epc-sync"> · Syncing linked assets…</span>}
        </p>

        <nav className="epc-pipeline" aria-label="Innovation lifecycle">
          {FLOW_STEPS.map((step, i) => {
            const stageKey = step as InnovationStage;
            const active = form.stage === stageKey;
            const done = i < currentStageIndex;
            return (
              <button
                key={step}
                type="button"
                className={`epc-pipeline__step ${active ? 'epc-pipeline__step--active' : ''} ${done ? 'epc-pipeline__step--done' : ''}`}
                onClick={() => handleStageChange(stageKey)}
              >
                <span className="epc-pipeline__idx">{i + 1}</span>
                {step}
              </button>
            );
          })}
        </nav>

        <div className="epc-kpis">
          <div className="epc-kpi">
            <span>Progress</span>
            <strong>{form.progress}%</strong>
          </div>
          <div className="epc-kpi">
            <span>Innovation score</span>
            <strong>{maya.score}</strong>
          </div>
          <div className="epc-kpi">
            <span>Funding readiness</span>
            <strong>{fundingReady}%</strong>
          </div>
          <div className="epc-kpi">
            <span>Commercialization</span>
            <strong>{commercialReady}%</strong>
          </div>
          <div className="epc-kpi">
            <span>Team</span>
            <strong>{assets.teamMembers.length}</strong>
          </div>
          <div className="epc-kpi">
            <span>Linked assets</span>
            <strong>
              {assets.prototypes.length +
                assets.experiments.length +
                assets.validations.length +
                assets.pitches.length}
            </strong>
          </div>
        </div>
      </header>

      {error && <div className="epc-banner epc-banner--error">{error}</div>}
      {success && <div className="epc-banner epc-banner--success">{success}</div>}
      {mayaToast && <p className="epc-maya-toast">{mayaToast}</p>}

      <div className="epc-layout">
        <nav className="epc-nav" aria-label="Control center sections">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`epc-nav__item ${activeSection === s.id ? 'epc-nav__item--active' : ''}`}
              onClick={() => scrollToSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <form className="epc-main" onSubmit={handleSave}>
          {/* 1. Project Information */}
          <section
            id="info"
            className="epc-section"
            ref={(el) => {
              sectionRefs.current.info = el;
            }}
          >
            <h2>Project information</h2>
            <p className="epc-section__lead">
              Core identity and classification for this innovation parent record.
            </p>
            <div className="epc-grid epc-grid--2">
              <label className="epc-field">
                <span>Name *</span>
                <input
                  value={form.name}
                  onChange={(e) => patchForm({ name: e.target.value })}
                  required
                  maxLength={120}
                />
              </label>
              <label className="epc-field">
                <span>Tagline</span>
                <input
                  value={workspace.tagline}
                  onChange={(e) => patchWorkspace({ tagline: e.target.value })}
                  placeholder="One-line pitch"
                />
              </label>
              <label className="epc-field epc-field--full">
                <span>Description</span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => patchForm({ description: e.target.value })}
                  placeholder="Problem, solution, and target outcome"
                />
              </label>
              <label className="epc-field">
                <span>Category</span>
                <select
                  value={workspace.category}
                  onChange={(e) => patchWorkspace({ category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="epc-field">
                <span>Industry / sector</span>
                <select value={form.sector} onChange={(e) => patchForm({ sector: e.target.value })}>
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="epc-field epc-field--full">
                <span>Tags</span>
                <input
                  value={form.tagsInput}
                  onChange={(e) => patchForm({ tagsInput: e.target.value })}
                  placeholder="comma-separated, e.g. healthtech, B2B, MVP"
                />
              </label>
              <label className="epc-field epc-field--full">
                <span>Problem statement</span>
                <textarea
                  rows={2}
                  value={workspace.problem_statement}
                  onChange={(e) => patchWorkspace({ problem_statement: e.target.value })}
                />
              </label>
              <label className="epc-field">
                <span>Target users</span>
                <input
                  value={workspace.target_users}
                  onChange={(e) => patchWorkspace({ target_users: e.target.value })}
                />
              </label>
              <label className="epc-field">
                <span>Innovation goals</span>
                <input
                  value={workspace.innovation_goals}
                  onChange={(e) => patchWorkspace({ innovation_goals: e.target.value })}
                />
              </label>
            </div>
          </section>

          {/* 2. Innovation Stage Management */}
          <section
            id="stage"
            className="epc-section"
            ref={(el) => {
              sectionRefs.current.stage = el;
            }}
          >
            <h2>Innovation stage management</h2>
            <p className="epc-section__lead">
              Current lifecycle position, progress tracking, and gate readiness.
            </p>
            <div className="epc-stage-bar">
              <label className="epc-field">
                <span>Current stage</span>
                <select
                  value={form.stage}
                  onChange={(e) => handleStageChange(e.target.value as InnovationStage)}
                >
                  {INNOVATION_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="epc-field">
                <span>Progress: {form.progress}%</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.progress}
                  onChange={(e) => patchForm({ progress: Number(e.target.value) })}
                />
              </label>
            </div>
            <div className="epc-progress-track">
              <div className="epc-progress-track__fill" style={{ width: `${form.progress}%` }} />
            </div>
            {metrics && (
              <p className="epc-muted">
                Readiness {metrics.readinessScore}% · Risk{' '}
                <span className={`epc-risk epc-risk--${metrics.riskLevel}`}>
                  {metrics.riskLevel}
                </span>
              </p>
            )}
            <h3 className="epc-subhead">Stage gates</h3>
            <ul className="epc-gates">
              {stageGates.map((gate) => (
                <li key={gate.stage} className={`epc-gate epc-gate--${gate.status}`}>
                  <div className="epc-gate__head">
                    <strong>{gate.stage}</strong>
                    <span className="epc-gate__badge">{gate.status.replace('_', ' ')}</span>
                  </div>
                  <p>{gate.detail}</p>
                  {MODULE_ROUTES[gate.stage] && (
                    <Link to={MODULE_ROUTES[gate.stage](id!)} className="epc-link">
                      Open {gate.stage} workspace →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Team Management */}
          <section
            id="team"
            className="epc-section"
            ref={(el) => {
              sectionRefs.current.team = el;
            }}
          >
            <h2>Team management</h2>
            <p className="epc-section__lead">Members, roles, and invitations for this project.</p>
            {!assets.teamId ? (
              <div className="epc-empty">
                <p>No team linked to this project yet.</p>
                <Link to={`/teams/create?projectId=${id}`} className="epc-btn epc-btn--ghost">
                  Create project team
                </Link>
              </div>
            ) : (
              <>
                <ul className="epc-member-list">
                  {assets.teamMembers.map((m) => (
                    <li key={m.id} className="epc-member">
                      <div>
                        <strong>{m.full_name}</strong>
                        <span className="epc-muted">{m.email}</span>
                      </div>
                      <span className="epc-role">{m.role}</span>
                    </li>
                  ))}
                </ul>
                <div className="epc-invite">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                  />
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                    {MEMBER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="epc-btn epc-btn--ghost" onClick={handleInvite}>
                    Send invite
                  </button>
                </div>
                {workspace.pending_invites.length > 0 && (
                  <p className="epc-muted">
                    Pending: {workspace.pending_invites.join(', ')}
                  </p>
                )}
                <Link to={`/teams/${assets.teamId}`} className="epc-link">
                  Open team workspace →
                </Link>
              </>
            )}
          </section>

          {/* 4. Research Integration */}
          <section
            id="research"
            className="epc-section"
            ref={(el) => {
              sectionRefs.current.research = el;
            }}
          >
            <h2>Research integration</h2>
            <div className="epc-module-stats">
              <div>
                <strong>{assets.researchCompletion}%</strong>
                <span>Completion</span>
              </div>
              <div>
                <strong>{assets.researchNotes}</strong>
                <span>Notes</span>
              </div>
              <div>
                <strong>{assets.researchFindings}</strong>
                <span>Findings</span>
              </div>
              <div>
                <strong>{assets.researchDocs}</strong>
                <span>Documents</span>
              </div>
            </div>
            <Link to={`/research/${id}`} className="epc-btn epc-btn--ghost">
              Open research center
            </Link>
          </section>

          {/* 5. Prototype Integration */}
          <section
            id="prototype"
            className="epc-section"
            ref={(el) => {
              sectionRefs.current.prototype = el;
            }}
          >
            <h2>Prototype integration</h2>
            {assets.prototypes.length === 0 ? (
              <div className="epc-empty">
                <p>No prototypes linked.</p>
                <Link to={`/prototypes/new?projectId=${id}`} className="epc-btn epc-btn--ghost">
                  Create prototype
                </Link>
              </div>
            ) : (
              <ul className="epc-asset-list">
                {assets.prototypes.map((p) => (
                  <li key={p.id}>
                    <Link to={`/prototypes/${p.id}`}>{p.name}</Link>
                    <span className="epc-pill">{p.lifecycle_status}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to={`/prototypes?projectId=${id}`} className="epc-link">
              All prototypes →
            </Link>
          </section>

          {/* 6. Experiment Integration */}
          <section
            id="experiment"
            className="epc-section"
            ref={(el) => {
              sectionRefs.current.experiment = el;
            }}
          >
            <h2>Experiment integration</h2>
            {assets.experiments.length === 0 ? (
              <div className="epc-empty">
                <p>No experiments recorded.</p>
                <Link to={`/experiments/create?projectId=${id}`} className="epc-btn epc-btn--ghost">
                  Design experiment
                </Link>
              </div>
            ) : (
              <ul className="epc-asset-list">
                {assets.experiments.map((e) => (
                  <li key={e.id}>
                    <Link to={`/experiments/${e.id}`}>{e.title}</Link>
                    <span className="epc-pill">{e.status ?? 'draft'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 7. Validation Integration */}
          <section
            id="validation"
            className="epc-section"
            ref={(el) => {
              sectionRefs.current.validation = el;
            }}
          >
            <h2>Validation integration</h2>
            {assets.validations.length === 0 ? (
              <div className="epc-empty">
                <p>Validation gate not submitted.</p>
                <Link to={`/validation/new?projectId=${id}`} className="epc-btn epc-btn--ghost">
                  Start validation gate
                </Link>
              </div>
            ) : (
              <ul className="epc-asset-list">
                {assets.validations.map((v) => (
                  <li key={v.id}>
                    <Link to={`/validation/${v.id}`}>
                      Gate review · {v.overall_score}% overall
                    </Link>
                    <span className={`epc-pill epc-pill--${v.decision}`}>{v.decision}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 8. Funding Readiness */}
          <section
            id="funding"
            className="epc-section"
            ref={(el) => {
              sectionRefs.current.funding = el;
            }}
          >
            <h2>Funding readiness</h2>
            <div className="epc-readiness">
              <div className="epc-readiness__meter">
                <div style={{ width: `${fundingReady}%` }} />
              </div>
              <span>{fundingReady}% ready for funding workspace</span>
            </div>
            {assets.pitches.length === 0 ? (
              <div className="epc-empty">
                <p>No pitches created.</p>
                <Link to={`/funding/create?projectId=${id}`} className="epc-btn epc-btn--ghost">
                  Create pitch
                </Link>
              </div>
            ) : (
              <ul className="epc-asset-list">
                {assets.pitches.map((p) => (
                  <li key={p.id}>
                    <Link to={`/funding/${p.id}`}>{p.title}</Link>
                    <span className="epc-pill">
                      {p.status ?? 'draft'}
                      {p.amount_sought ? ` · $${p.amount_sought.toLocaleString()}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 9. Commercialization Readiness */}
          <section
            id="commercialization"
            className="epc-section"
            ref={(el) => {
              sectionRefs.current.commercialization = el;
            }}
          >
            <h2>Commercialization readiness</h2>
            <div className="epc-readiness">
              <div className="epc-readiness__meter epc-readiness__meter--commercial">
                <div style={{ width: `${commercialReady}%` }} />
              </div>
              <span>{commercialReady}% GTM readiness</span>
            </div>
            <p className="epc-muted">
              Execute go-to-market, partnerships, and scale once funding and validation gates pass.
            </p>
            <Link to={`/commercialization?projectId=${id}`} className="epc-btn epc-btn--ghost">
              Open commercialization command center
            </Link>
          </section>

          {/* 10. Documents */}
          <section
            id="documents"
            className="epc-section"
            ref={(el) => {
              sectionRefs.current.documents = el;
            }}
          >
            <h2>Documents</h2>
            {assets.documents.length === 0 ? (
              <div className="epc-empty">
                <p>No documents attached to this project.</p>
                <Link to={`/documents?projectId=${id}`} className="epc-btn epc-btn--ghost">
                  Upload in document center
                </Link>
              </div>
            ) : (
              <ul className="epc-asset-list">
                {assets.documents.map((d) => (
                  <li key={d.id}>
                    <span>{d.name}</span>
                    <span className="epc-muted">
                      {d.file_type ?? 'file'} · {formatTimeAgo(d.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link to={`/documents?projectId=${id}`} className="epc-link">
              Enterprise document center →
            </Link>
          </section>

          {/* 11. Timeline */}
          <section
            id="timeline"
            className="epc-section"
            ref={(el) => {
              sectionRefs.current.timeline = el;
            }}
          >
            <h2>Timeline</h2>
            {assets.timeline.length === 0 ? (
              <p className="epc-muted">Activity will appear here as you work across modules.</p>
            ) : (
              <ol className="epc-timeline">
                {assets.timeline.map((ev) => (
                  <li key={ev.id}>
                    <time>{formatTimeAgo(ev.created_at)}</time>
                    <div>
                      <strong>{ev.title}</strong>
                      <span className="epc-muted">{ev.type}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <footer className="epc-footer">
            <button type="button" className="epc-btn epc-btn--danger" onClick={handleDelete}>
              Delete project
            </button>
            <button type="submit" className="epc-btn epc-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save all changes'}
            </button>
          </footer>
        </form>

        {/* 12. MAYA AI Insights */}
        <aside className="epc-maya" aria-label="MAYA AI insights">
          <strong>MAYA AI insights</strong>
          <div className="epc-maya__score">
            <span>Innovation score</span>
            <strong>{maya.score}</strong>
            <span className={`epc-risk epc-risk--${maya.risk}`}>{maya.risk} risk</span>
          </div>
          <div className="epc-maya__block">
            <label>Evidence-based readiness</label>
            {maya.evidenceSummary ? (
              <p>{maya.evidenceSummary}</p>
            ) : (
              <p className="epc-muted">Gathering validation evidence from linked modules…</p>
            )}
            {maya.dimensionScores && (
              <ul className="epc-dimensions">
                <li>Technical {maya.dimensionScores.technical}%</li>
                <li>User {maya.dimensionScores.user}%</li>
                <li>Market {maya.dimensionScores.market}%</li>
                <li>Financial {maya.dimensionScores.financial}%</li>
              </ul>
            )}
            {evaluation && (
              <span className={`epc-pill epc-pill--${evaluation.decision}`}>
                Simulated gate: {evaluation.decision}
              </span>
            )}
          </div>
          <div className="epc-maya__block">
            <label>Recommended next action</label>
            <p>{maya.next}</p>
          </div>
          <div className="epc-maya__block">
            <label>Lifecycle intelligence</label>
            <ul>
              {maya.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div className="epc-maya__block">
            <label>Module tree</label>
            <ul className="epc-tree">
              <li>Project · {form.name || 'Untitled'}</li>
              {FLOW_STEPS.slice(1).map((mod, index) => (
                <li key={mod}>
                  <span aria-hidden>{index === FLOW_STEPS.length - 2 ? '└' : '├'}</span>
                  <Link to={MODULE_ROUTES[mod]?.(id!) ?? '#'}>{mod}</Link>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            className="epc-maya-btn"
            onClick={() => {
              patchForm({
                description:
                  form.description.trim() ||
                  `${form.name} advances ${workspace.problem_statement || 'a key market gap'} through the Maylet XLab pipeline toward ${form.stage}.`,
              });
              flashMaya('MAYA refreshed project narrative in description.');
            }}
          >
            ✨ Refresh narrative
          </button>
        </aside>
      </div>

      <style>{`
        .epc-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.25rem 1.5rem 3rem;
          color: #e8e8f0;
        }
        .epc-header__top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .epc-back, .epc-link {
          color: #9b7ff0;
          text-decoration: none;
          font-size: 0.85rem;
        }
        .epc-back:hover, .epc-link:hover { text-decoration: underline; }
        .epc-header h1 {
          margin: 0.35rem 0 0.2rem;
          font-size: 1.85rem;
          background: linear-gradient(135deg, #fff, #2fd4ff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .epc-header__sub { margin: 0; opacity: 0.65; font-size: 0.9rem; }
        .epc-sync { color: #68d391; font-size: 0.78rem; }
        .epc-header__actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .epc-pipeline {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin: 1.25rem 0 1rem;
        }
        .epc-pipeline__step {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.7rem;
          border-radius: 20px;
          font-size: 0.68rem;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.3);
          color: rgba(255,255,255,0.55);
          cursor: pointer;
        }
        .epc-pipeline__step--active {
          border-color: rgba(47,212,255,0.55);
          background: rgba(47,212,255,0.14);
          color: #2fd4ff;
        }
        .epc-pipeline__step--done { color: rgba(104,211,145,0.85); }
        .epc-pipeline__idx {
          width: 1.1rem;
          height: 1.1rem;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
        }
        .epc-kpis {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.65rem;
        }
        .epc-kpi {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 0.65rem 0.85rem;
        }
        .epc-kpi span { display: block; font-size: 0.65rem; opacity: 0.55; text-transform: uppercase; letter-spacing: 0.05em; }
        .epc-kpi strong { font-size: 1.15rem; color: #2fd4ff; }
        .epc-layout {
          display: grid;
          grid-template-columns: 200px 1fr 260px;
          gap: 1.25rem;
          margin-top: 1.25rem;
          align-items: start;
        }
        @media (max-width: 1100px) {
          .epc-layout { grid-template-columns: 1fr; }
          .epc-nav { display: flex; flex-wrap: wrap; gap: 0.35rem; }
          .epc-nav__item { flex: 1 1 auto; text-align: center; }
          .epc-maya { order: -1; }
        }
        .epc-nav {
          position: sticky;
          top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .epc-nav__item {
          text-align: left;
          padding: 0.45rem 0.65rem;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.6);
          font-size: 0.75rem;
          cursor: pointer;
        }
        .epc-nav__item--active {
          background: rgba(124,95,230,0.2);
          color: #c4b5fd;
        }
        .epc-main { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
        .epc-section {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.25rem;
          scroll-margin-top: 1rem;
        }
        .epc-section h2 { margin: 0 0 0.35rem; font-size: 1.05rem; color: #2fd4ff; }
        .epc-section__lead { margin: 0 0 1rem; font-size: 0.82rem; opacity: 0.65; }
        .epc-subhead { margin: 1rem 0 0.5rem; font-size: 0.85rem; opacity: 0.8; }
        .epc-grid { display: grid; gap: 0.85rem; }
        .epc-grid--2 { grid-template-columns: 1fr 1fr; }
        @media (max-width: 640px) { .epc-grid--2 { grid-template-columns: 1fr; } }
        .epc-field { display: flex; flex-direction: column; gap: 0.3rem; }
        .epc-field--full { grid-column: 1 / -1; }
        .epc-field span { font-size: 0.75rem; font-weight: 600; opacity: 0.85; }
        .epc-field input, .epc-field select, .epc-field textarea {
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.6rem 0.75rem;
          color: #fff;
          font-family: inherit;
          font-size: 0.88rem;
        }
        .epc-field input:focus, .epc-field select:focus, .epc-field textarea:focus {
          outline: none;
          border-color: rgba(124,95,230,0.5);
        }
        .epc-stage-bar { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 640px) { .epc-stage-bar { grid-template-columns: 1fr; } }
        .epc-progress-track {
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
          margin: 0.75rem 0;
        }
        .epc-progress-track__fill {
          height: 100%;
          background: linear-gradient(90deg, #7c5fe6, #2fd4ff);
          border-radius: 4px;
          transition: width 0.3s;
        }
        .epc-gates { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
        .epc-gate {
          padding: 0.75rem;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.25);
        }
        .epc-gate__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
        .epc-gate__badge {
          font-size: 0.62rem;
          text-transform: uppercase;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          background: rgba(255,255,255,0.08);
        }
        .epc-gate--passed .epc-gate__badge { background: rgba(72,187,120,0.25); color: #68d391; }
        .epc-gate--in_progress .epc-gate__badge { background: rgba(246,201,14,0.2); color: #f6c90e; }
        .epc-gate--ready .epc-gate__badge { background: rgba(47,212,255,0.2); color: #2fd4ff; }
        .epc-gate p { margin: 0 0 0.35rem; font-size: 0.8rem; opacity: 0.75; }
        .epc-member-list, .epc-asset-list { list-style: none; margin: 0 0 0.75rem; padding: 0; }
        .epc-member, .epc-asset-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-size: 0.85rem;
        }
        .epc-role, .epc-pill {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          background: rgba(124,95,230,0.2);
          color: #c4b5fd;
        }
        .epc-pill--pass { background: rgba(72,187,120,0.25); color: #68d391; }
        .epc-pill--fail { background: rgba(252,129,129,0.2); color: #fc8181; }
        .epc-invite { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem; }
        .epc-invite input, .epc-invite select {
          flex: 1;
          min-width: 140px;
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.55rem 0.65rem;
          color: #fff;
        }
        .epc-module-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .epc-module-stats div {
          text-align: center;
          padding: 0.65rem;
          border-radius: 10px;
          background: rgba(0,0,0,0.3);
        }
        .epc-module-stats strong { display: block; font-size: 1.1rem; color: #2fd4ff; }
        .epc-module-stats span { font-size: 0.65rem; opacity: 0.55; }
        .epc-readiness { margin-bottom: 0.75rem; }
        .epc-readiness__meter {
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.35rem;
        }
        .epc-readiness__meter div {
          height: 100%;
          background: linear-gradient(90deg, #f6c90e, #48bb78);
          border-radius: 4px;
        }
        .epc-readiness__meter--commercial div {
          background: linear-gradient(90deg, #7c5fe6, #2fd4ff);
        }
        .epc-timeline { list-style: none; margin: 0; padding: 0; }
        .epc-timeline li {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 0.75rem;
          padding: 0.55rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-size: 0.82rem;
        }
        .epc-timeline time { opacity: 0.5; font-size: 0.72rem; }
        .epc-empty {
          padding: 0.75rem;
          border-radius: 10px;
          background: rgba(0,0,0,0.25);
          margin-bottom: 0.65rem;
        }
        .epc-empty p { margin: 0 0 0.5rem; font-size: 0.85rem; opacity: 0.75; }
        .epc-muted { font-size: 0.78rem; opacity: 0.55; }
        .epc-maya {
          position: sticky;
          top: 1rem;
          background: linear-gradient(135deg, rgba(124,95,230,0.12), rgba(47,212,255,0.06));
          border: 1px solid rgba(124,95,230,0.25);
          border-radius: 16px;
          padding: 1.15rem;
          font-size: 0.82rem;
        }
        .epc-maya strong { color: #9b7ff0; display: block; margin-bottom: 0.75rem; }
        .epc-maya__score {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.85rem;
        }
        .epc-maya__score strong { font-size: 1.5rem; color: #2fd4ff; }
        .epc-maya__block { margin-bottom: 0.85rem; }
        .epc-maya__block label {
          display: block;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          opacity: 0.55;
          margin-bottom: 0.25rem;
        }
        .epc-maya__block p, .epc-maya__block ul { margin: 0; line-height: 1.5; opacity: 0.85; }
        .epc-maya__block ul { padding-left: 1.1rem; }
        .epc-dimensions {
          list-style: none;
          padding: 0;
          margin: 0.5rem 0 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.25rem;
          font-size: 0.72rem;
          opacity: 0.85;
        }
        .epc-tree { list-style: none; padding: 0; margin: 0; font-family: ui-monospace, monospace; font-size: 0.75rem; }
        .epc-tree li { padding: 0.15rem 0; }
        .epc-maya-btn {
          width: 100%;
          margin-top: 0.5rem;
          background: rgba(124,95,230,0.25);
          border: 1px solid rgba(124,95,230,0.4);
          color: #c4b5fd;
          border-radius: 20px;
          padding: 0.4rem 0.85rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }
        .epc-risk {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.12rem 0.45rem;
          border-radius: 6px;
        }
        .epc-risk--low { background: rgba(72,187,120,0.2); color: #68d391; }
        .epc-risk--medium { background: rgba(246,201,14,0.2); color: #f6c90e; }
        .epc-risk--high { background: rgba(252,129,129,0.2); color: #fc8181; }
        .epc-btn {
          padding: 0.55rem 1rem;
          border-radius: 24px;
          font-weight: 600;
          font-size: 0.82rem;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .epc-btn--ghost { background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.12); }
        .epc-btn--primary { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a; }
        .epc-btn--danger { background: rgba(252,129,129,0.15); color: #fc8181; border: 1px solid rgba(252,129,129,0.35); }
        .epc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .epc-footer {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding-top: 0.5rem;
        }
        .epc-banner {
          padding: 0.7rem 1rem;
          border-radius: 12px;
          margin-top: 1rem;
          font-size: 0.85rem;
        }
        .epc-banner--error { background: rgba(252,129,129,0.15); border: 1px solid rgba(252,129,129,0.35); color: #fc8181; }
        .epc-banner--success { background: rgba(72,187,120,0.15); border: 1px solid rgba(72,187,120,0.35); color: #68d391; }
        .epc-maya-toast { color: #68d391; font-size: 0.82rem; margin-top: 0.5rem; }
        .epc-loading {
          width: 44px;
          height: 44px;
          margin: 4rem auto;
          border: 3px solid rgba(47,212,255,0.25);
          border-top-color: #2fd4ff;
          border-radius: 50%;
          animation: epc-spin 0.8s linear infinite;
        }
        .epc-error { color: #fc8181; margin: 2rem 0; }
        @keyframes epc-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
