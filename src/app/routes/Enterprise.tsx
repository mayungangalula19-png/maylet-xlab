import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useEnterpriseHub } from '../../hooks/useEnterpriseHub';
import { INNOVATION_STAGES } from '../../lib/enterprise/enterpriseHub.service';
import {
  formatTimeAgo,
  getFundingReadiness,
  getInnovationStage,
} from '../../lib/innovation/lifecycle';
import type { Project } from '../../types/project.types';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'portfolio', label: 'Project portfolio' },
  { id: 'teams', label: 'Teams' },
  { id: 'vault', label: 'Innovation vault' },
  { id: 'integrations', label: 'Integrations' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const QUICK_LINKS = [
  { label: 'Documents', to: '/documents', desc: 'Enterprise document center' },
  { label: 'Ecosystem', to: '/ecosystem', desc: 'Partners & mentors' },
  { label: 'Commercialization', to: '/commercialization', desc: 'GTM command center' },
  { label: 'Security', to: '/security', desc: 'Security overview' },
  { label: 'Billing', to: '/billing', desc: 'Plan & invoices' },
  { label: 'Support', to: '/support', desc: 'Enterprise support' },
] as const;

function planLabel(plan: string): string {
  const p = plan.toLowerCase();
  if (p === 'enterprise') return 'Enterprise';
  if (p === 'pro') return 'Pro';
  return 'Free';
}

function stageClass(stage: string): string {
  return stage.toLowerCase().replace(/\s+/g, '-');
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function Enterprise() {
  const {
    data,
    loading,
    refreshing,
    error,
    orgSuccess,
    savingOrg,
    refresh,
    saveOrganization,
    setOrgSuccess,
  } = useEnterpriseHub();

  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [showOrgSettings, setShowOrgSettings] = useState(false);
  const [orgName, setOrgName] = useState('');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const portfolioSorted = useMemo(() => {
    if (!data) return [];
    return [...data.projects].sort((a, b) => b.progress - a.progress);
  }, [data]);

  const scrollTo = (id: SectionId) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleOrgSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    const ok = await saveOrganization(orgName);
    if (ok) {
      setShowOrgSettings(false);
    }
  };

  const openOrgSettings = () => {
    if (data) setOrgName(data.profile.organization_name);
    setOrgSuccess(null);
    setShowOrgSettings(true);
  };

  if (loading) {
    return (
      <div className="ent-page">
        <div className="ent-loading" aria-label="Loading enterprise hub" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="ent-page">
        <p className="ent-error">{error ?? 'Unable to load enterprise hub.'}</p>
        <Link to="/dashboard">← Dashboard</Link>
      </div>
    );
  }

  const { profile, subscription, metrics, teams, vault, timeline, maya } = data;
  const maxStage = Math.max(1, ...INNOVATION_STAGES.map((s) => metrics.stageCounts[s]));

  return (
    <div className="ent-page">
      <header className="ent-header">
        <div className="ent-header__top">
          <div>
            <Link to="/dashboard" className="ent-back">
              ← Innovation OS
            </Link>
            <h1>Enterprise Hub</h1>
            <p className="ent-header__org">{profile.organization_name}</p>
          </div>
          <div className="ent-header__actions">
            <span className={`ent-plan ent-plan--${subscription.plan.toLowerCase()}`}>
              {planLabel(subscription.plan)} plan
            </span>
            <button type="button" className="ent-btn ent-btn--ghost" onClick={() => refresh()}>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" className="ent-btn ent-btn--primary" onClick={openOrgSettings}>
              Organization settings
            </button>
          </div>
        </div>
        <p className="ent-header__sub">
          Organization command center — portfolio, teams, vault, and lifecycle governance
          {refreshing && <span className="ent-sync"> · Updating…</span>}
        </p>

        <div className="ent-kpis">
          <div className="ent-kpi">
            <span>Projects</span>
            <strong>{metrics.projectCount}</strong>
          </div>
          <div className="ent-kpi">
            <span>Teams</span>
            <strong>{metrics.teamCount}</strong>
          </div>
          <div className="ent-kpi">
            <span>Members</span>
            <strong>{metrics.memberCount}</strong>
          </div>
          <div className="ent-kpi">
            <span>Vault IP</span>
            <strong>{metrics.vaultCount}</strong>
          </div>
          <div className="ent-kpi">
            <span>Avg progress</span>
            <strong>{metrics.avgProgress}%</strong>
          </div>
          <div className="ent-kpi">
            <span>Funding-ready</span>
            <strong>{metrics.fundingReadyCount}</strong>
          </div>
        </div>

        <div className="ent-funnel">
          {INNOVATION_STAGES.map((stage) => (
            <div key={stage} className="ent-funnel__row">
              <span className="ent-funnel__label">{stage}</span>
              <div className="ent-funnel__bar">
                <div
                  style={{
                    width: `${Math.round((metrics.stageCounts[stage] / maxStage) * 100)}%`,
                  }}
                />
              </div>
              <span className="ent-funnel__count">{metrics.stageCounts[stage]}</span>
            </div>
          ))}
        </div>
      </header>

      {error && <div className="ent-banner ent-banner--error">{error}</div>}
      {orgSuccess && <div className="ent-banner ent-banner--success">{orgSuccess}</div>}

      <div className="ent-layout">
        <nav className="ent-nav" aria-label="Enterprise sections">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`ent-nav__item ${activeSection === s.id ? 'ent-nav__item--active' : ''}`}
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <main className="ent-main">
          <section
            id="overview"
            className="ent-section"
            ref={(el) => {
              sectionRefs.current.overview = el;
            }}
          >
            <h2>Overview</h2>
            <p className="ent-lead">
              Aggregate innovation operations across {metrics.projectCount} project(s) and{' '}
              {metrics.teamCount} team(s).
            </p>
            <div className="ent-stat-grid">
              <div>
                <strong>{metrics.documentCount}</strong>
                <span>Documents</span>
              </div>
              <div>
                <strong>{metrics.experimentCount}</strong>
                <span>Experiments</span>
              </div>
              <div>
                <strong>{metrics.validationCount}</strong>
                <span>Validations</span>
              </div>
              <div>
                <strong>{metrics.pitchCount}</strong>
                <span>Funding pitches</span>
              </div>
            </div>
            {maya.priorityProject && (
              <div className="ent-priority">
                <label>Priority initiative</label>
                <strong>{maya.priorityProject.name}</strong>
                <p>{maya.priorityAction}</p>
                <Link to={`/projects/${maya.priorityProject.id}/edit`} className="ent-link">
                  Open control center →
                </Link>
              </div>
            )}
            {timeline.length > 0 && (
              <>
                <h3 className="ent-subhead">Recent activity</h3>
                <ol className="ent-timeline">
                  {timeline.slice(0, 6).map((ev) => (
                    <li key={ev.id}>
                      <time>{formatTimeAgo(ev.created_at)}</time>
                      <div>
                        <strong>{ev.title}</strong>
                        <span>{ev.type}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>

          <section
            id="portfolio"
            className="ent-section"
            ref={(el) => {
              sectionRefs.current.portfolio = el;
            }}
          >
            <div className="ent-section__head">
              <h2>Project portfolio</h2>
              <Link to="/projects/create" className="ent-btn ent-btn--ghost">
                + New project
              </Link>
            </div>
            {portfolioSorted.length === 0 ? (
              <div className="ent-empty">
                <p>No projects in your enterprise portfolio yet.</p>
                <Link to="/projects/create" className="ent-btn ent-btn--primary">
                  Create first project
                </Link>
              </div>
            ) : (
              <div className="ent-table-wrap">
                <table className="ent-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Stage</th>
                      <th>Progress</th>
                      <th>Funding</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioSorted.map((p: Project) => {
                      const stage = getInnovationStage(p);
                      const funding = getFundingReadiness(p);
                      return (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.name}</strong>
                            <span className="ent-muted">{p.sector}</span>
                          </td>
                          <td>
                            <span className={`ent-stage ent-stage--${stageClass(stage)}`}>
                              {stage}
                            </span>
                          </td>
                          <td>{p.progress}%</td>
                          <td>{funding}%</td>
                          <td className="ent-actions">
                            <Link to={`/projects/${p.id}/edit`}>Control center</Link>
                            <Link to={`/projects/${p.id}`}>Detail</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section
            id="teams"
            className="ent-section"
            ref={(el) => {
              sectionRefs.current.teams = el;
            }}
          >
            <div className="ent-section__head">
              <h2>Teams</h2>
              <Link to="/teams/create" className="ent-btn ent-btn--ghost">
                + Create team
              </Link>
            </div>
            {teams.length === 0 ? (
              <div className="ent-empty">
                <p>No teams yet. Create a team and link it to a project.</p>
                <Link to="/teams/create" className="ent-btn ent-btn--ghost">
                  Create team
                </Link>
              </div>
            ) : (
              <ul className="ent-card-list">
                {teams.map((t) => (
                  <li key={t.id} className="ent-card">
                    <div>
                      <strong>{t.name}</strong>
                      <span className="ent-muted">
                        {t.member_count} members
                        {t.project_name ? ` · ${t.project_name}` : ''}
                      </span>
                    </div>
                    <Link to={`/teams/${t.id}`} className="ent-link">
                      Workspace →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            id="vault"
            className="ent-section"
            ref={(el) => {
              sectionRefs.current.vault = el;
            }}
          >
            <div className="ent-section__head">
              <h2>Innovation vault</h2>
              <Link to="/vault" className="ent-btn ent-btn--ghost">
                Full vault
              </Link>
            </div>
            {vault.length === 0 ? (
              <div className="ent-empty">
                <p>Protected IP and confidential ideas appear here.</p>
                <Link to="/vault/save" className="ent-btn ent-btn--ghost">
                  Protect new IP
                </Link>
              </div>
            ) : (
              <ul className="ent-card-list">
                {vault.map((v) => (
                  <li key={v.id} className="ent-card">
                    <div>
                      <strong>{v.title}</strong>
                      {v.is_confidential && <span className="ent-pill">Confidential</span>}
                      <p className="ent-muted">{v.description ?? 'No description'}</p>
                    </div>
                    <div className="ent-card__actions">
                      <span className="ent-muted">{formatTimeAgo(v.created_at)}</span>
                      <Link to="/enterprise/vault" className="ent-link">
                        Manage →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/enterprise/vault" className="ent-link">
              Enterprise knowledge vault →
            </Link>
          </section>

          <section
            id="integrations"
            className="ent-section"
            ref={(el) => {
              sectionRefs.current.integrations = el;
            }}
          >
            <h2>Platform integrations</h2>
            <p className="ent-lead">
              Jump into lifecycle modules and enterprise services connected to your portfolio.
            </p>
            <div className="ent-links-grid">
              {QUICK_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className="ent-link-card">
                  <strong>{link.label}</strong>
                  <span>{link.desc}</span>
                </Link>
              ))}
            </div>
            <div className="ent-features">
              <div className="ent-feature">
                <strong>SSO & security</strong>
                <p>Audit-ready access controls and security monitoring.</p>
              </div>
              <div className="ent-feature">
                <strong>Private innovation lab</strong>
                <p>Isolated project workspaces with gate enforcement.</p>
              </div>
              <div className="ent-feature">
                <strong>API access</strong>
                <p>Connect internal systems via Admin API keys.</p>
                <Link to="/admin/api-keys" className="ent-link">
                  API keys →
                </Link>
              </div>
              <div className="ent-feature">
                <strong>Dedicated support</strong>
                <p>Priority enterprise onboarding and account guidance.</p>
              </div>
            </div>
          </section>
        </main>

        <aside className="ent-maya" aria-label="MAYA enterprise advisor">
          <strong>MAYA enterprise advisor</strong>
          <div className="ent-maya__block">
            <label>Portfolio intelligence</label>
            <ul>
              {maya.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div className="ent-maya__block">
            <label>Recommended action</label>
            <p>{maya.priorityAction}</p>
          </div>
          <div className="ent-maya__block">
            <label>Lifecycle tree</label>
            <ul className="ent-tree">
              <li>Enterprise · {profile.organization_name}</li>
              <li>
                <span aria-hidden>├</span> Portfolio ({metrics.projectCount})
              </li>
              <li>
                <span aria-hidden>├</span> Teams ({metrics.teamCount})
              </li>
              <li>
                <span aria-hidden>├</span> Vault ({metrics.vaultCount})
              </li>
              <li>
                <span aria-hidden>└</span> Documents ({metrics.documentCount})
              </li>
            </ul>
          </div>
          {subscription.plan !== 'enterprise' && (
            <Link to="/billing" className="ent-maya-btn">
              Upgrade plan
            </Link>
          )}
          <Link to="/ai-assistant" className="ent-maya-btn ent-maya-btn--ghost">
            Open MAYA assistant
          </Link>
        </aside>
      </div>

      {showOrgSettings && (
        <div className="ent-modal" role="dialog" aria-modal="true" aria-labelledby="org-title">
          <div className="ent-modal__card">
            <div className="ent-modal__head">
              <h3 id="org-title">Organization settings</h3>
              <button type="button" className="ent-modal__close" onClick={() => setShowOrgSettings(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleOrgSave}>
              <p className="ent-muted">
                Signed in as <strong>{profile.email}</strong>
              </p>
              <label className="ent-field">
                <span>Organization name *</span>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Innovation Labs"
                  required
                />
              </label>
              <p className="ent-muted">
                Current plan: <strong>{planLabel(subscription.plan)}</strong>
                {' · '}
                <Link to="/billing">Manage billing</Link>
              </p>
              <div className="ent-modal__foot">
                <button type="button" className="ent-btn ent-btn--ghost" onClick={() => setShowOrgSettings(false)}>
                  Cancel
                </button>
                <button type="submit" className="ent-btn ent-btn--primary" disabled={savingOrg}>
                  {savingOrg ? 'Saving…' : 'Save organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .ent-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.25rem 1.5rem 3rem;
          color: #e8e8f0;
        }
        .ent-back { color: #9b7ff0; text-decoration: none; font-size: 0.85rem; }
        .ent-back:hover { text-decoration: underline; }
        .ent-header h1 {
          margin: 0.35rem 0 0.15rem;
          font-size: 1.85rem;
          background: linear-gradient(135deg, #fff, #c4b5fd);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .ent-header__org { margin: 0; font-size: 1rem; color: #2fd4ff; font-weight: 600; }
        .ent-header__sub { margin: 0.5rem 0 0; opacity: 0.65; font-size: 0.88rem; }
        .ent-sync { color: #68d391; }
        .ent-header__top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .ent-header__actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .ent-plan {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.25rem 0.6rem;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .ent-plan--enterprise { background: rgba(124,95,230,0.25); color: #c4b5fd; }
        .ent-plan--pro { background: rgba(47,212,255,0.15); color: #2fd4ff; }
        .ent-plan--free { opacity: 0.7; }
        .ent-kpis {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 0.6rem;
          margin: 1.25rem 0 1rem;
        }
        .ent-kpi {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 0.65rem 0.8rem;
        }
        .ent-kpi span { display: block; font-size: 0.62rem; opacity: 0.55; text-transform: uppercase; letter-spacing: 0.05em; }
        .ent-kpi strong { font-size: 1.15rem; color: #2fd4ff; }
        .ent-funnel { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.5rem; }
        .ent-funnel__row { display: grid; grid-template-columns: 110px 1fr 28px; align-items: center; gap: 0.5rem; font-size: 0.75rem; }
        .ent-funnel__bar { height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
        .ent-funnel__bar div { height: 100%; background: linear-gradient(90deg, #7c5fe6, #2fd4ff); border-radius: 3px; min-width: 2px; }
        .ent-funnel__count { text-align: right; opacity: 0.7; }
        .ent-layout {
          display: grid;
          grid-template-columns: 190px 1fr 250px;
          gap: 1.25rem;
          margin-top: 1rem;
          align-items: start;
        }
        @media (max-width: 1100px) {
          .ent-layout { grid-template-columns: 1fr; }
          .ent-nav { flex-direction: row; flex-wrap: wrap; }
          .ent-maya { order: -1; }
        }
        .ent-nav { position: sticky; top: 1rem; display: flex; flex-direction: column; gap: 0.25rem; }
        .ent-nav__item {
          text-align: left;
          padding: 0.45rem 0.65rem;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.6);
          font-size: 0.75rem;
          cursor: pointer;
        }
        .ent-nav__item--active { background: rgba(124,95,230,0.2); color: #c4b5fd; }
        .ent-main { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
        .ent-section {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.25rem;
          scroll-margin-top: 1rem;
        }
        .ent-section h2 { margin: 0 0 0.35rem; font-size: 1.05rem; color: #c4b5fd; }
        .ent-section__head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
        .ent-section__head h2 { margin: 0; }
        .ent-lead { margin: 0 0 1rem; font-size: 0.85rem; opacity: 0.7; }
        .ent-subhead { margin: 1rem 0 0.5rem; font-size: 0.85rem; opacity: 0.85; }
        .ent-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .ent-stat-grid div { text-align: center; padding: 0.65rem; background: rgba(0,0,0,0.3); border-radius: 10px; }
        .ent-stat-grid strong { display: block; font-size: 1.1rem; color: #2fd4ff; }
        .ent-stat-grid span { font-size: 0.65rem; opacity: 0.55; }
        @media (max-width: 640px) { .ent-stat-grid { grid-template-columns: repeat(2, 1fr); } }
        .ent-priority {
          padding: 0.85rem;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(124,95,230,0.12), rgba(47,212,255,0.06));
          border: 1px solid rgba(124,95,230,0.25);
        }
        .ent-priority label { font-size: 0.65rem; text-transform: uppercase; opacity: 0.55; }
        .ent-priority p { margin: 0.35rem 0; font-size: 0.85rem; opacity: 0.85; }
        .ent-table-wrap { overflow-x: auto; }
        .ent-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .ent-table th, .ent-table td { padding: 0.55rem 0.5rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .ent-table th { font-size: 0.68rem; text-transform: uppercase; opacity: 0.55; }
        .ent-table td strong { display: block; }
        .ent-actions { display: flex; gap: 0.65rem; }
        .ent-actions a, .ent-link { color: #9b7ff0; text-decoration: none; font-size: 0.8rem; }
        .ent-actions a:hover, .ent-link:hover { text-decoration: underline; }
        .ent-stage {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          background: rgba(255,255,255,0.08);
        }
        .ent-muted { display: block; font-size: 0.72rem; opacity: 0.55; }
        .ent-card-list { list-style: none; margin: 0; padding: 0; }
        .ent-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .ent-card__actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }
        .ent-pill {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.1rem 0.4rem;
          border-radius: 6px;
          background: rgba(252,129,129,0.2);
          color: #fc8181;
          margin-left: 0.35rem;
        }
        .ent-empty { padding: 0.85rem; border-radius: 10px; background: rgba(0,0,0,0.25); margin-bottom: 0.65rem; }
        .ent-empty p { margin: 0 0 0.5rem; opacity: 0.75; font-size: 0.85rem; }
        .ent-links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.6rem;
          margin-bottom: 1rem;
        }
        .ent-link-card {
          display: block;
          padding: 0.85rem;
          border-radius: 12px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.08);
          text-decoration: none;
          color: inherit;
          transition: border-color 0.2s;
        }
        .ent-link-card:hover { border-color: rgba(124,95,230,0.4); }
        .ent-link-card strong { display: block; font-size: 0.88rem; color: #2fd4ff; margin-bottom: 0.2rem; }
        .ent-link-card span { font-size: 0.72rem; opacity: 0.6; }
        .ent-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.65rem;
        }
        .ent-feature {
          padding: 0.85rem;
          border-radius: 12px;
          background: rgba(0,0,0,0.25);
          font-size: 0.82rem;
        }
        .ent-feature p { margin: 0.35rem 0 0; opacity: 0.7; font-size: 0.78rem; }
        .ent-timeline { list-style: none; margin: 0; padding: 0; }
        .ent-timeline li {
          display: grid;
          grid-template-columns: 72px 1fr;
          gap: 0.65rem;
          padding: 0.45rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 0.8rem;
        }
        .ent-timeline time { opacity: 0.5; font-size: 0.7rem; }
        .ent-timeline span { display: block; font-size: 0.68rem; opacity: 0.5; }
        .ent-maya {
          position: sticky;
          top: 1rem;
          background: linear-gradient(135deg, rgba(124,95,230,0.12), rgba(47,212,255,0.06));
          border: 1px solid rgba(124,95,230,0.25);
          border-radius: 16px;
          padding: 1.15rem;
          font-size: 0.82rem;
        }
        .ent-maya strong { color: #9b7ff0; display: block; margin-bottom: 0.75rem; }
        .ent-maya__block { margin-bottom: 0.85rem; }
        .ent-maya__block label {
          display: block;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          opacity: 0.55;
          margin-bottom: 0.25rem;
        }
        .ent-maya__block ul, .ent-maya__block p { margin: 0; line-height: 1.5; opacity: 0.85; }
        .ent-maya__block ul { padding-left: 1.1rem; }
        .ent-tree { list-style: none; padding: 0; margin: 0; font-family: ui-monospace, monospace; font-size: 0.75rem; }
        .ent-maya-btn {
          width: 100%;
          margin-top: 0.35rem;
          background: rgba(124,95,230,0.25);
          border: 1px solid rgba(124,95,230,0.4);
          color: #c4b5fd;
          border-radius: 20px;
          padding: 0.45rem 0.85rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          text-align: center;
          display: block;
          box-sizing: border-box;
        }
        .ent-maya-btn--ghost {
          background: transparent;
          border-color: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.75);
        }
        .ent-btn {
          padding: 0.5rem 0.95rem;
          border-radius: 22px;
          font-weight: 600;
          font-size: 0.8rem;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .ent-btn--ghost { background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.12); }
        .ent-btn--primary { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a; }
        .ent-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ent-banner { padding: 0.7rem 1rem; border-radius: 12px; margin-top: 0.75rem; font-size: 0.85rem; }
        .ent-banner--error { background: rgba(252,129,129,0.15); border: 1px solid rgba(252,129,129,0.35); color: #fc8181; }
        .ent-banner--success { background: rgba(72,187,120,0.15); border: 1px solid rgba(72,187,120,0.35); color: #68d391; }
        .ent-modal {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8);
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;
        }
        .ent-modal__card {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          padding: 1.25rem;
        }
        .ent-modal__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .ent-modal__head h3 { margin: 0; color: #c4b5fd; }
        .ent-modal__close { background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; }
        .ent-field { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.85rem; }
        .ent-field span { font-size: 0.75rem; font-weight: 600; }
        .ent-field input, .ent-field textarea {
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.6rem 0.75rem;
          color: #fff;
          font-family: inherit;
        }
        .ent-modal__foot { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }
        .ent-loading {
          width: 44px; height: 44px; margin: 4rem auto;
          border: 3px solid rgba(124,95,230,0.25);
          border-top-color: #9b7ff0;
          border-radius: 50%;
          animation: ent-spin 0.8s linear infinite;
        }
        .ent-error { color: #fc8181; }
        @keyframes ent-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
