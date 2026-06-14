import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useEnterpriseHub } from '../../../hooks/useEnterpriseHub';
import { INNOVATION_STAGES } from '../services/enterpriseHub.service';
import {
  formatTimeAgo,
  getCommercializationReadiness,
  getFundingReadiness,
  getInnovationStage,
} from '../../../lib/innovation/lifecycle';
import type { EnterpriseHubSnapshot, EnterpriseSearchResult } from '../../../types/enterpriseHub.types';
import type { Project } from '../../../types/project.types';

/* ─── Navigation & constants ─────────────────────────────────────────────── */

const NAV = [
  { id: 'executive', label: 'Executive Dashboard', group: 'Command' },
  { id: 'departments', label: 'Departments', group: 'Organization' },
  { id: 'teams', label: 'Teams & Roles', group: 'Organization' },
  { id: 'portfolio', label: 'Innovation Portfolio', group: 'Portfolio' },
  { id: 'research', label: 'Research Center', group: 'Portfolio' },
  { id: 'prototypes', label: 'Prototype Ops', group: 'Portfolio' },
  { id: 'experiments', label: 'Experiment Center', group: 'Portfolio' },
  { id: 'validation', label: 'Validation Center', group: 'Portfolio' },
  { id: 'funding', label: 'Funding Command', group: 'Portfolio' },
  { id: 'commercialization', label: 'Commercialization', group: 'Portfolio' },
  { id: 'documents', label: 'Document Center', group: 'Assets' },
  { id: 'ecosystem', label: 'Ecosystem Network', group: 'Network' },
  { id: 'analytics', label: 'Analytics & Reports', group: 'Intelligence' },
  { id: 'collaboration', label: 'Collaboration', group: 'Network' },
  { id: 'integrations', label: 'Integrations', group: 'Platform' },
] as const;

type ViewId = (typeof NAV)[number]['id'];

const ENTERPRISE_ROLES = [
  'Enterprise Admin',
  'Director',
  'Innovation Manager',
  'Research Lead',
  'Engineer',
  'Researcher',
  'Reviewer',
  'Mentor',
  'Investor',
  'Observer',
] as const;

const INTEGRATIONS = [
  { label: 'Dashboard', to: '/dashboard', desc: 'Innovation OS home' },
  { label: 'Projects', to: '/projects', desc: 'Full project pipeline' },
  { label: 'Research', to: '/research', desc: 'Research programs' },
  { label: 'Prototypes', to: '/prototypes', desc: 'Prototype operations' },
  { label: 'Experiments', to: '/experiments', desc: 'Experiment lab' },
  { label: 'Validation', to: '/validation', desc: 'Gate decisions' },
  { label: 'Funding', to: '/funding', desc: 'Grants & investors' },
  { label: 'Commercialization', to: '/commercialization', desc: 'GTM command' },
  { label: 'Documents', to: '/documents', desc: 'Enterprise repository' },
  { label: 'Ecosystem', to: '/ecosystem', desc: 'Partners & mentors' },
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

function riskColor(level: string): string {
  if (level === 'low') return '#68d391';
  if (level === 'medium') return '#f6ad55';
  return '#fc8181';
}

function exportPortfolioCsv(projects: Project[]) {
  const header = 'Project,Sector,Stage,Progress,Funding Readiness,Commercialization\n';
  const rows = projects
    .map((p) => {
      const stage = getInnovationStage(p);
      const funding = getFundingReadiness(p);
      const comm = getCommercializationReadiness(p);
      return `"${p.name}","${p.sector}","${stage}",${p.progress},${funding},${comm}`;
    })
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `enterprise-portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Sub-components (file-local) ────────────────────────────────────────── */

function KpiCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`eos-kpi ${accent ? 'eos-kpi--accent' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="eos-section-head">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="eos-empty">
      <p>{message}</p>
      {action}
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="eos-table-wrap">
      <table className="eos-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PipelineFunnel({ data }: { data: EnterpriseHubSnapshot }) {
  const max = Math.max(1, ...INNOVATION_STAGES.map((s) => data.metrics.stageCounts[s]));
  return (
    <div className="eos-funnel">
      {INNOVATION_STAGES.map((stage) => (
        <div key={stage} className="eos-funnel__row">
          <span>{stage}</span>
          <div className="eos-funnel__bar">
            <div style={{ width: `${Math.round((data.metrics.stageCounts[stage] / max) * 100)}%` }} />
          </div>
          <strong>{data.metrics.stageCounts[stage]}</strong>
        </div>
      ))}
    </div>
  );
}

/* ─── View renderers ─────────────────────────────────────────────────────── */

function ExecutiveView({ data }: { data: EnterpriseHubSnapshot }) {
  const { metrics, maya, analytics } = data;
  return (
    <>
      <SectionHead title="Executive Dashboard">
        <Link to="/projects/create" className="eos-btn eos-btn--primary">
          + New initiative
        </Link>
      </SectionHead>
      <p className="eos-lead">
        Organization-wide innovation command center — {metrics.projectCount} initiatives across{' '}
        {metrics.departmentCount} active departments.
      </p>
      <div className="eos-kpi-grid eos-kpi-grid--exec">
        <KpiCard label="Total innovations" value={metrics.projectCount} accent />
        <KpiCard label="Active research" value={metrics.activeResearch} />
        <KpiCard label="Active prototypes" value={metrics.activePrototypes} />
        <KpiCard label="Experiments running" value={metrics.experimentsRunning} />
        <KpiCard label="Validations pending" value={metrics.validationsPending} />
        <KpiCard label="Funding secured" value={metrics.fundingSecured} />
        <KpiCard label="Commercialized" value={metrics.commercializedProducts} />
        <KpiCard label="Departments" value={metrics.departmentCount} />
        <KpiCard label="Team members" value={metrics.memberCount} />
        <KpiCard label="Health score" value={`${metrics.innovationHealthScore}`} accent />
      </div>
      <div className="eos-split">
        <div className="eos-panel">
          <h3>Innovation pipeline</h3>
          <PipelineFunnel data={data} />
          <div className="eos-mini-stats">
            <div>
              <span>Velocity</span>
              <strong>{analytics.pipeline.velocity}%</strong>
            </div>
            <div>
              <span>Success rate</span>
              <strong>{analytics.pipeline.successRate}%</strong>
            </div>
            <div>
              <span>Bottleneck</span>
              <strong>{analytics.pipeline.bottleneck ?? '—'}</strong>
            </div>
          </div>
        </div>
        <div className="eos-panel">
          <h3>Priority initiative</h3>
          {maya.priorityProject ? (
            <>
              <strong className="eos-highlight-title">{maya.priorityProject.name}</strong>
              <p>{maya.priorityAction}</p>
              <Link to={`/projects/${maya.priorityProject.id}/edit`} className="eos-link">
                Open control center →
              </Link>
            </>
          ) : (
            <p className="eos-muted">No priority initiative assigned.</p>
          )}
          {data.timeline.length > 0 && (
            <>
              <h4>Recent activity</h4>
              <ol className="eos-timeline">
                {data.timeline.slice(0, 5).map((ev) => (
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
        </div>
      </div>
    </>
  );
}

function DepartmentsView({ data }: { data: EnterpriseHubSnapshot }) {
  return (
    <>
      <SectionHead title="Departments" />
      <p className="eos-lead">
        Engineering, Research, ICT, Agriculture, Health, Energy, Manufacturing, and Business — mapped from
        portfolio sectors and team assignments.
      </p>
      <div className="eos-dept-grid">
        {data.departments.map((d) => (
          <div key={d.id} className="eos-dept-card">
            <div className="eos-dept-card__head">
              <strong>{d.id}</strong>
              <span>{d.avgProgress}% avg</span>
            </div>
            <div className="eos-dept-metrics">
              <div>
                <span>Projects</span>
                <strong>{d.projectCount}</strong>
              </div>
              <div>
                <span>Research</span>
                <strong>{d.researchCount}</strong>
              </div>
              <div>
                <span>Members</span>
                <strong>{d.memberCount}</strong>
              </div>
              <div>
                <span>Prototypes</span>
                <strong>{d.activePrototypes}</strong>
              </div>
              <div>
                <span>Experiments</span>
                <strong>{d.runningExperiments}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TeamsView({ data }: { data: EnterpriseHubSnapshot }) {
  return (
    <>
      <SectionHead title="Teams & Roles">
        <Link to="/teams/create" className="eos-btn eos-btn--ghost">
          + Create team
        </Link>
      </SectionHead>
      <div className="eos-role-pills">
        {ENTERPRISE_ROLES.map((r) => (
          <span key={r} className="eos-pill">
            {r}
          </span>
        ))}
      </div>
      {data.teams.length === 0 ? (
        <EmptyState
          message="No teams yet. Create teams and assign department-linked projects."
          action={
            <Link to="/teams/create" className="eos-btn eos-btn--ghost">
              Create team
            </Link>
          }
        />
      ) : (
        <DataTable
          headers={['Team', 'Department', 'Project', 'Members', 'Actions']}
          rows={data.teams.map((t) => [
            <strong key="n">{t.name}</strong>,
            t.department,
            t.project_name ?? '—',
            t.member_count,
            <Link key="a" to={`/teams/${t.id}`} className="eos-link">
              Workspace →
            </Link>,
          ])}
        />
      )}
      {data.members.length > 0 && (
        <>
          <h3 className="eos-subhead">Team roster</h3>
          <DataTable
            headers={['Name', 'Enterprise role', 'Team', 'Department']}
            rows={data.members.map((m) => [
              m.full_name,
              m.enterprise_role,
              m.team_name,
              m.department,
            ])}
          />
        </>
      )}
    </>
  );
}

function PortfolioView({ data, onExport }: { data: EnterpriseHubSnapshot; onExport: () => void }) {
  const sorted = [...data.projects].sort((a, b) => b.progress - a.progress);
  const health =
    data.projects.length > 0
      ? Math.round(
          data.projects.reduce((s, p) => s + getFundingReadiness(p), 0) / data.projects.length
        )
      : 0;

  return (
    <>
      <SectionHead title="Innovation Portfolio">
        <div className="eos-actions">
          <button type="button" className="eos-btn eos-btn--ghost" onClick={onExport}>
            Export CSV
          </button>
          <Link to="/projects/create" className="eos-btn eos-btn--primary">
            + New project
          </Link>
        </div>
      </SectionHead>
      <div className="eos-mini-stats">
        <div>
          <span>Portfolio health</span>
          <strong>{health}%</strong>
        </div>
        <div>
          <span>Funding-ready</span>
          <strong>{data.metrics.fundingReadyCount}</strong>
        </div>
        <div>
          <span>Avg progress</span>
          <strong>{data.metrics.avgProgress}%</strong>
        </div>
      </div>
      {sorted.length === 0 ? (
        <EmptyState
          message="No innovations in the portfolio."
          action={
            <Link to="/projects/create" className="eos-btn eos-btn--primary">
              Create first project
            </Link>
          }
        />
      ) : (
        <DataTable
          headers={['Project', 'Sector', 'Stage', 'Progress', 'Funding', 'Actions']}
          rows={sorted.map((p) => {
            const stage = getInnovationStage(p);
            return [
              <div key="p">
                <strong>{p.name}</strong>
              </div>,
              p.sector,
              <span key="s" className={`eos-stage eos-stage--${stageClass(stage)}`}>
                {stage}
              </span>,
              `${p.progress}%`,
              `${getFundingReadiness(p)}%`,
              <span key="a" className="eos-actions">
                <Link to={`/projects/${p.id}/edit`} className="eos-link">
                  Control center
                </Link>
                <Link to={`/projects/${p.id}`} className="eos-link">
                  Detail
                </Link>
              </span>,
            ];
          })}
        />
      )}
    </>
  );
}

function ResearchView({ data }: { data: EnterpriseHubSnapshot }) {
  return (
    <>
      <SectionHead title="Research Intelligence Center">
        <Link to="/research" className="eos-btn eos-btn--ghost">
          Research hub →
        </Link>
      </SectionHead>
      <div className="eos-mini-stats">
        <div>
          <span>Research programs</span>
          <strong>{data.metrics.activeResearch}</strong>
        </div>
        <div>
          <span>Knowledge assets</span>
          <strong>{data.metrics.researchAssetCount}</strong>
        </div>
      </div>
      {data.researchAssets.length === 0 ? (
        <EmptyState message="No research profiles, notes, literature, or findings yet." />
      ) : (
        <DataTable
          headers={['Asset', 'Type', 'Project', 'Created']}
          rows={data.researchAssets.map((r) => [
            r.title,
            r.asset_type,
            r.project_name ? (
              <Link to={`/research/${r.project_id}`} className="eos-link">
                {r.project_name}
              </Link>
            ) : (
              '—'
            ),
            formatTimeAgo(r.created_at),
          ])}
        />
      )}
    </>
  );
}

function PrototypesView({ data }: { data: EnterpriseHubSnapshot }) {
  return (
    <>
      <SectionHead title="Prototype Operations Center">
        <Link to="/prototypes" className="eos-btn eos-btn--ghost">
          All prototypes →
        </Link>
      </SectionHead>
      {data.prototypes.length === 0 ? (
        <EmptyState message="No prototypes in the organization portfolio." />
      ) : (
        <DataTable
          headers={['Prototype', 'Version', 'Status', 'Project', 'Actions']}
          rows={data.prototypes.map((p) => [
            p.name,
            p.version,
            p.status,
            p.project_name ?? '—',
            <Link key="a" to="/prototypes" className="eos-link">
              Open →
            </Link>,
          ])}
        />
      )}
    </>
  );
}

function ExperimentsView({ data }: { data: EnterpriseHubSnapshot }) {
  return (
    <>
      <SectionHead title="Experiment Center">
        <Link to="/experiments" className="eos-btn eos-btn--ghost">
          All experiments →
        </Link>
      </SectionHead>
      <div className="eos-mini-stats">
        <div>
          <span>Running</span>
          <strong>{data.metrics.experimentsRunning}</strong>
        </div>
        <div>
          <span>Completion rate</span>
          <strong>{data.analytics.experimentCompletionRate}%</strong>
        </div>
      </div>
      {data.experiments.length === 0 ? (
        <EmptyState message="No experiments recorded." />
      ) : (
        <DataTable
          headers={['Experiment', 'Status', 'Project', 'Hypothesis', 'Actions']}
          rows={data.experiments.map((e) => [
            e.title,
            e.status,
            e.project_name ?? '—',
            <span key="h" className="eos-muted">
              {e.hypothesis.slice(0, 60)}
              {e.hypothesis.length > 60 ? '…' : ''}
            </span>,
            <Link key="a" to={`/experiments/${e.id}`} className="eos-link">
              Detail →
            </Link>,
          ])}
        />
      )}
    </>
  );
}

function ValidationView({ data }: { data: EnterpriseHubSnapshot }) {
  return (
    <>
      <SectionHead title="Validation Center">
        <Link to="/validation" className="eos-btn eos-btn--ghost">
          Validation hub →
        </Link>
      </SectionHead>
      <div className="eos-mini-stats">
        <div>
          <span>PASS</span>
          <strong>{data.analytics.validationPassRate}%</strong>
        </div>
        <div>
          <span>HOLD</span>
          <strong>{data.analytics.validationHoldRate}%</strong>
        </div>
        <div>
          <span>FAIL</span>
          <strong>{data.analytics.validationFailRate}%</strong>
        </div>
        <div>
          <span>Pending</span>
          <strong>{data.metrics.validationsPending}</strong>
        </div>
      </div>
      {data.validations.length === 0 ? (
        <EmptyState message="No validation gate reviews yet." />
      ) : (
        <DataTable
          headers={['Project', 'Decision', 'Score', 'Reviewed']}
          rows={data.validations.map((v) => [
            v.project_name ?? '—',
            <span key="d" className={`eos-decision eos-decision--${v.decision}`}>
              {v.decision.toUpperCase()}
            </span>,
            `${v.overall_score}%`,
            formatTimeAgo(v.created_at),
          ])}
        />
      )}
    </>
  );
}

function FundingView({ data }: { data: EnterpriseHubSnapshot }) {
  return (
    <>
      <SectionHead title="Funding Command Center">
        <Link to="/funding" className="eos-btn eos-btn--ghost">
          Funding hub →
        </Link>
      </SectionHead>
      <div className="eos-mini-stats">
        <div>
          <span>Applications</span>
          <strong>{data.funding.length}</strong>
        </div>
        <div>
          <span>Secured</span>
          <strong>{data.metrics.fundingSecured}</strong>
        </div>
        <div>
          <span>Approval rate</span>
          <strong>{data.analytics.fundingApprovalRate}%</strong>
        </div>
      </div>
      {data.funding.length === 0 ? (
        <EmptyState message="No funding applications or pitches yet." />
      ) : (
        <DataTable
          headers={['Pitch', 'Status', 'Amount', 'Project', 'Actions']}
          rows={data.funding.map((f) => [
            f.title,
            f.status,
            f.amount_sought != null ? `$${f.amount_sought.toLocaleString()}` : '—',
            f.project_name ?? '—',
            <Link key="a" to={`/funding/${f.id}`} className="eos-link">
              Detail →
            </Link>,
          ])}
        />
      )}
    </>
  );
}

function CommercializationView({ data }: { data: EnterpriseHubSnapshot }) {
  const launched = data.projects.filter(
    (p) => p.status === 'Launched' || getInnovationStage(p) === 'Commercialization'
  );

  return (
    <>
      <SectionHead title="Commercialization Center">
        <Link to="/commercialization" className="eos-btn eos-btn--ghost">
          GTM command →
        </Link>
      </SectionHead>
      <div className="eos-mini-stats">
        <div>
          <span>Market-ready</span>
          <strong>{launched.length}</strong>
        </div>
        <div>
          <span>Forecast</span>
          <strong>{data.maya.commercializationForecast}%</strong>
        </div>
      </div>
      {launched.length === 0 ? (
        <EmptyState message="No commercialized products yet." />
      ) : (
        <DataTable
          headers={['Product', 'Sector', 'Progress', 'Readiness', 'Actions']}
          rows={launched.map((p) => [
            p.name,
            p.sector,
            `${p.progress}%`,
            `${getCommercializationReadiness(p)}%`,
            <Link key="a" to={`/projects/${p.id}/edit`} className="eos-link">
              Control center →
            </Link>,
          ])}
        />
      )}
    </>
  );
}

function DocumentsView({ data }: { data: EnterpriseHubSnapshot }) {
  return (
    <>
      <SectionHead title="Enterprise Document Center">
        <Link to="/documents" className="eos-btn eos-btn--ghost">
          Full repository →
        </Link>
      </SectionHead>
      {data.documents.length === 0 ? (
        <EmptyState message="No documents uploaded across projects." />
      ) : (
        <DataTable
          headers={['Document', 'Type', 'Category', 'Project', 'Uploaded']}
          rows={data.documents.map((d) => [
            d.name,
            d.file_type ?? '—',
            d.category ?? 'general',
            d.project_name ?? '—',
            formatTimeAgo(d.created_at),
          ])}
        />
      )}
    </>
  );
}

function EcosystemView() {
  return (
    <>
      <SectionHead title="Ecosystem Network" />
      <p className="eos-lead">
        Universities, research institutes, investors, mentors, industry partners, and startup collaborators.
      </p>
      <div className="eos-links-grid">
        <Link to="/ecosystem" className="eos-link-card">
          <strong>Ecosystem Hub</strong>
          <span>Partners, mentors, investors, and collaboration directory</span>
        </Link>
        <Link to="/mentorship" className="eos-link-card">
          <strong>Mentorship</strong>
          <span>Mentor matching and advisory programs</span>
        </Link>
        <Link to="/marketplace" className="eos-link-card">
          <strong>Marketplace</strong>
          <span>Innovation listings and industry partners</span>
        </Link>
        <Link to="/hackathons" className="eos-link-card">
          <strong>Hackathons</strong>
          <span>Innovation challenges and demo days</span>
        </Link>
      </div>
    </>
  );
}

function AnalyticsView({ data }: { data: EnterpriseHubSnapshot }) {
  const { analytics } = data;
  return (
    <>
      <SectionHead title="Analytics & Reporting">
        <button
          type="button"
          className="eos-btn eos-btn--ghost"
          onClick={() => exportPortfolioCsv(data.projects)}
        >
          Export portfolio CSV
        </button>
      </SectionHead>
      <div className="eos-analytics-grid">
        <div className="eos-panel">
          <h3>Pipeline analytics</h3>
          <PipelineFunnel data={data} />
          <ul className="eos-list">
            {analytics.pipeline.conversionRates.map((c) => (
              <li key={`${c.from}-${c.to}`}>
                {c.from} → {c.to}: <strong>{c.rate}%</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="eos-panel">
          <h3>Performance summary</h3>
          <div className="eos-mini-stats eos-mini-stats--col">
            <div>
              <span>Experiment completion</span>
              <strong>{analytics.experimentCompletionRate}%</strong>
            </div>
            <div>
              <span>Funding approval</span>
              <strong>{analytics.fundingApprovalRate}%</strong>
            </div>
            <div>
              <span>Top department</span>
              <strong>{analytics.departmentLeader ?? '—'}</strong>
            </div>
            <div>
              <span>Top team</span>
              <strong>{analytics.topPerformingTeam ?? '—'}</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CollaborationView({ data }: { data: EnterpriseHubSnapshot }) {
  return (
    <>
      <SectionHead title="Collaboration Center" />
      <p className="eos-lead">Cross-team collaboration, shared projects, and enterprise notifications.</p>
      <div className="eos-split">
        <div className="eos-panel">
          <h3>Shared teams ({data.teams.length})</h3>
          {data.teams.slice(0, 6).map((t) => (
            <div key={t.id} className="eos-list-row">
              <strong>{t.name}</strong>
              <Link to={`/teams/${t.id}`} className="eos-link">
                Workspace →
              </Link>
            </div>
          ))}
        </div>
        <div className="eos-panel">
          <h3>Notifications</h3>
          {data.notifications.length === 0 ? (
            <p className="eos-muted">No enterprise notifications.</p>
          ) : (
            <ul className="eos-notif-list">
              {data.notifications.map((n) => (
                <li key={n.id} className={n.read ? '' : 'eos-notif--unread'}>
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                  <time>{formatTimeAgo(n.created_at)}</time>
                </li>
              ))}
            </ul>
          )}
          <Link to="/notifications" className="eos-link">
            All notifications →
          </Link>
        </div>
      </div>
      <h3 className="eos-subhead">Activity stream</h3>
      {data.timeline.length === 0 ? (
        <EmptyState message="No recent collaboration activity." />
      ) : (
        <ol className="eos-timeline">
          {data.timeline.map((ev) => (
            <li key={ev.id}>
              <time>{formatTimeAgo(ev.created_at)}</time>
              <div>
                <strong>{ev.title}</strong>
                <span>{ev.type}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function IntegrationsView() {
  return (
    <>
      <SectionHead title="Platform Integrations" />
      <p className="eos-lead">Connected lifecycle modules across the Maylet XLab Innovation Operating System.</p>
      <div className="eos-links-grid">
        {INTEGRATIONS.map((link) => (
          <Link key={link.to} to={link.to} className="eos-link-card">
            <strong>{link.label}</strong>
            <span>{link.desc}</span>
          </Link>
        ))}
      </div>
      <div className="eos-features">
        <div className="eos-feature">
          <strong>Enterprise vault</strong>
          <p>Protected IP and knowledge assets.</p>
          <Link to="/enterprise/vault" className="eos-link">
            Knowledge vault →
          </Link>
        </div>
        <div className="eos-feature">
          <strong>Security & compliance</strong>
          <p>Audit-ready access controls.</p>
          <Link to="/security" className="eos-link">
            Security →
          </Link>
        </div>
        <div className="eos-feature">
          <strong>MAYA AI</strong>
          <p>Strategic innovation intelligence.</p>
          <Link to="/ai-assistant" className="eos-link">
            AI assistant →
          </Link>
        </div>
      </div>
    </>
  );
}

function MayaSidebar({ data }: { data: EnterpriseHubSnapshot }) {
  const { maya, metrics, profile, subscription } = data;
  return (
    <aside className="eos-maya" aria-label="MAYA Enterprise AI">
      <div className="eos-maya__head">
        <strong>MAYA Enterprise AI</strong>
        <span className="eos-maya__score" style={{ color: riskColor(maya.riskLevel) }}>
          {maya.healthScore}/100
        </span>
      </div>
      <div className="eos-score-grid">
        <div>
          <span>Innovation</span>
          <strong>{maya.innovationPerformance}%</strong>
        </div>
        <div>
          <span>Funding</span>
          <strong>{maya.fundingReadiness}%</strong>
        </div>
        <div>
          <span>Commercial</span>
          <strong>{maya.commercializationForecast}%</strong>
        </div>
        <div>
          <span>Risk</span>
          <strong style={{ color: riskColor(maya.riskLevel) }}>{maya.riskLevel}</strong>
        </div>
      </div>
      <div className="eos-maya__block">
        <label>Strategic recommendations</label>
        <ul>
          {maya.recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
      {maya.risks.length > 0 && (
        <div className="eos-maya__block">
          <label>Risk detection</label>
          <ul>
            {maya.risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="eos-maya__block">
        <label>Department insights</label>
        <ul>
          {maya.departmentInsights.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
      <div className="eos-maya__block">
        <label>Growth opportunities</label>
        <ul>
          {maya.opportunities.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </div>
      <div className="eos-maya__block">
        <label>Org tree</label>
        <ul className="eos-tree">
          <li>{profile.organization_name}</li>
          <li>
            <span aria-hidden>├</span> {metrics.departmentCount} departments
          </li>
          <li>
            <span aria-hidden>├</span> {metrics.projectCount} innovations
          </li>
          <li>
            <span aria-hidden>├</span> {metrics.teamCount} teams
          </li>
          <li>
            <span aria-hidden>└</span> {metrics.memberCount} members
          </li>
        </ul>
      </div>
      <p className="eos-maya__action">{maya.priorityAction}</p>
      {subscription.plan !== 'enterprise' && (
        <Link to="/billing" className="eos-maya-btn">
          Upgrade plan
        </Link>
      )}
      <Link to="/ai-assistant" className="eos-maya-btn eos-maya-btn--ghost">
        Open MAYA assistant
      </Link>
    </aside>
  );
}

/* ─── Main page ────────────────────────────────────────────────────────────── */

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

  const [view, setView] = useState<ViewId>('executive');
  const [search, setSearch] = useState('');
  const [showOrgSettings, setShowOrgSettings] = useState(false);
  const [orgName, setOrgName] = useState('');

  const searchResults = useMemo(() => {
    if (!data || !search.trim()) return [];
    const q = search.toLowerCase();
    return data.searchIndex
      .filter(
        (r: EnterpriseSearchResult) =>
          r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [data, search]);

  const navGroups = useMemo(() => {
    const groups = new Map<string, Array<(typeof NAV)[number]>>();
    for (const item of NAV) {
      const list = groups.get(item.group) ?? [];
      list.push(item);
      groups.set(item.group, list);
    }
    return [...groups.entries()];
  }, []);

  const handleOrgSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    const ok = await saveOrganization(orgName);
    if (ok) setShowOrgSettings(false);
  };

  const openOrgSettings = () => {
    if (data) setOrgName(data.profile.organization_name);
    setOrgSuccess(null);
    setShowOrgSettings(true);
  };

  if (loading) {
    return (
      <div className="eos-page">
        <div className="eos-loading" aria-label="Loading enterprise command center" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="eos-page">
        <p className="eos-error">{error ?? 'Unable to load enterprise command center.'}</p>
        <Link to="/dashboard">← Dashboard</Link>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'executive':
        return <ExecutiveView data={data} />;
      case 'departments':
        return <DepartmentsView data={data} />;
      case 'teams':
        return <TeamsView data={data} />;
      case 'portfolio':
        return <PortfolioView data={data} onExport={() => exportPortfolioCsv(data.projects)} />;
      case 'research':
        return <ResearchView data={data} />;
      case 'prototypes':
        return <PrototypesView data={data} />;
      case 'experiments':
        return <ExperimentsView data={data} />;
      case 'validation':
        return <ValidationView data={data} />;
      case 'funding':
        return <FundingView data={data} />;
      case 'commercialization':
        return <CommercializationView data={data} />;
      case 'documents':
        return <DocumentsView data={data} />;
      case 'ecosystem':
        return <EcosystemView />;
      case 'analytics':
        return <AnalyticsView data={data} />;
      case 'collaboration':
        return <CollaborationView data={data} />;
      case 'integrations':
        return <IntegrationsView />;
      default:
        return <ExecutiveView data={data} />;
    }
  };

  return (
    <div className="eos-page">
      <header className="eos-header">
        <div className="eos-header__top">
          <div>
            <Link to="/dashboard" className="eos-back">
              ← Innovation OS
            </Link>
            <h1>Enterprise Command Center</h1>
            <p className="eos-header__org">{data.profile.organization_name}</p>
          </div>
          <div className="eos-header__actions">
            <span className={`eos-plan eos-plan--${data.subscription.plan.toLowerCase()}`}>
              {planLabel(data.subscription.plan)}
            </span>
            <button type="button" className="eos-btn eos-btn--ghost" onClick={() => refresh()}>
              {refreshing ? 'Syncing…' : 'Refresh'}
            </button>
            <button type="button" className="eos-btn eos-btn--primary" onClick={openOrgSettings}>
              Organization
            </button>
          </div>
        </div>
        <p className="eos-header__sub">
          Executive innovation operating system — research to commercialization across your organization
          {refreshing && <span className="eos-sync"> · Live sync</span>}
        </p>
        <div className="eos-search">
          <input
            type="search"
            placeholder="Search projects, research, teams, documents, funding…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Global enterprise search"
          />
          {searchResults.length > 0 && (
            <ul className="eos-search-results">
              {searchResults.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <Link to={r.route} onClick={() => setSearch('')}>
                    <strong>{r.title}</strong>
                    <span>
                      {r.type} · {r.subtitle}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {error && <div className="eos-banner eos-banner--error">{error}</div>}
      {orgSuccess && <div className="eos-banner eos-banner--success">{orgSuccess}</div>}

      <div className="eos-layout">
        <nav className="eos-nav" aria-label="Enterprise command center">
          {navGroups.map(([group, items]) => (
            <div key={group} className="eos-nav__group">
              <span className="eos-nav__label">{group}</span>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`eos-nav__item ${view === item.id ? 'eos-nav__item--active' : ''}`}
                  onClick={() => setView(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main className="eos-main">
          <section className="eos-section">{renderView()}</section>
        </main>

        <MayaSidebar data={data} />
      </div>

      {showOrgSettings && (
        <div className="eos-modal" role="dialog" aria-modal="true">
          <div className="eos-modal__card">
            <div className="eos-modal__head">
              <h3>Organization settings</h3>
              <button type="button" className="eos-modal__close" onClick={() => setShowOrgSettings(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleOrgSave}>
              <p className="eos-muted">
                Signed in as <strong>{data.profile.email}</strong>
              </p>
              <label className="eos-field">
                <span>Organization name</span>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="University, corporation, or innovation hub"
                  required
                />
              </label>
              <div className="eos-modal__foot">
                <button type="button" className="eos-btn eos-btn--ghost" onClick={() => setShowOrgSettings(false)}>
                  Cancel
                </button>
                <button type="submit" className="eos-btn eos-btn--primary" disabled={savingOrg}>
                  {savingOrg ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .eos-page { max-width: 1520px; margin: 0 auto; padding: 1rem 1.25rem 3rem; color: #e8e8f0; }
        .eos-back { color: #9b7ff0; text-decoration: none; font-size: 0.82rem; }
        .eos-header h1 {
          margin: 0.3rem 0 0.1rem; font-size: 1.75rem;
          background: linear-gradient(135deg, #fff 0%, #a78bfa 50%, #2fd4ff 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .eos-header__org { margin: 0; color: #2fd4ff; font-weight: 600; font-size: 0.95rem; }
        .eos-header__sub { margin: 0.4rem 0 0; opacity: 0.6; font-size: 0.84rem; }
        .eos-sync { color: #68d391; }
        .eos-header__top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; }
        .eos-header__actions { display: flex; gap: 0.45rem; align-items: center; flex-wrap: wrap; }
        .eos-plan { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 0.2rem 0.55rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.12); }
        .eos-plan--enterprise { background: rgba(124,95,230,0.2); color: #c4b5fd; }
        .eos-search { position: relative; margin-top: 0.85rem; }
        .eos-search input {
          width: 100%; max-width: 520px; padding: 0.55rem 0.85rem; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.35); color: #fff;
        }
        .eos-search-results {
          position: absolute; top: 100%; left: 0; width: min(520px, 100%); margin: 0.35rem 0 0; padding: 0.35rem;
          list-style: none; background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; z-index: 20;
        }
        .eos-search-results a { display: block; padding: 0.45rem 0.55rem; text-decoration: none; color: inherit; border-radius: 6px; }
        .eos-search-results a:hover { background: rgba(124,95,230,0.15); }
        .eos-search-results strong { display: block; font-size: 0.82rem; }
        .eos-search-results span { font-size: 0.7rem; opacity: 0.55; }
        .eos-layout { display: grid; grid-template-columns: 210px 1fr 270px; gap: 1rem; margin-top: 1rem; align-items: start; }
        @media (max-width: 1200px) { .eos-layout { grid-template-columns: 1fr; } .eos-maya { order: -1; } }
        .eos-nav { position: sticky; top: 0.75rem; max-height: calc(100vh - 1.5rem); overflow-y: auto; }
        .eos-nav__group { margin-bottom: 0.65rem; }
        .eos-nav__label { display: block; font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.4; padding: 0 0.5rem; margin-bottom: 0.2rem; }
        .eos-nav__item {
          display: block; width: 100%; text-align: left; padding: 0.38rem 0.55rem; border: none; border-radius: 7px;
          background: transparent; color: rgba(255,255,255,0.62); font-size: 0.72rem; cursor: pointer;
        }
        .eos-nav__item--active { background: rgba(124,95,230,0.22); color: #d8b4fe; }
        .eos-main { min-width: 0; }
        .eos-section { background: rgba(0,0,0,0.32); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 1.1rem 1.2rem; }
        .eos-section h2 { margin: 0; font-size: 1.05rem; color: #c4b5fd; }
        .eos-section-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.65rem; }
        .eos-lead { margin: 0 0 0.85rem; font-size: 0.84rem; opacity: 0.68; line-height: 1.5; }
        .eos-subhead { margin: 1rem 0 0.5rem; font-size: 0.88rem; }
        .eos-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.5rem; margin-bottom: 1rem; }
        .eos-kpi-grid--exec { grid-template-columns: repeat(auto-fit, minmax(115px, 1fr)); }
        .eos-kpi { background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.55rem 0.65rem; }
        .eos-kpi--accent { border-color: rgba(124,95,230,0.35); background: rgba(124,95,230,0.08); }
        .eos-kpi span { display: block; font-size: 0.58rem; text-transform: uppercase; opacity: 0.5; letter-spacing: 0.04em; }
        .eos-kpi strong { font-size: 1.1rem; color: #2fd4ff; }
        .eos-split { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        @media (max-width: 800px) { .eos-split { grid-template-columns: 1fr; } }
        .eos-panel { background: rgba(0,0,0,0.22); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 0.85rem; }
        .eos-panel h3, .eos-panel h4 { margin: 0 0 0.5rem; font-size: 0.88rem; }
        .eos-funnel { display: flex; flex-direction: column; gap: 0.3rem; }
        .eos-funnel__row { display: grid; grid-template-columns: 100px 1fr 24px; align-items: center; gap: 0.4rem; font-size: 0.72rem; }
        .eos-funnel__bar { height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
        .eos-funnel__bar div { height: 100%; background: linear-gradient(90deg, #7c3aed, #2563eb, #2fd4ff); border-radius: 3px; }
        .eos-mini-stats { display: flex; flex-wrap: wrap; gap: 0.65rem; margin: 0.65rem 0; }
        .eos-mini-stats--col { flex-direction: column; }
        .eos-mini-stats > div span { display: block; font-size: 0.62rem; opacity: 0.5; text-transform: uppercase; }
        .eos-mini-stats > div strong { color: #2fd4ff; }
        .eos-dept-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.6rem; }
        .eos-dept-card { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.75rem; }
        .eos-dept-card__head { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
        .eos-dept-card__head strong { color: #c4b5fd; }
        .eos-dept-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.35rem; font-size: 0.72rem; }
        .eos-dept-metrics span { display: block; opacity: 0.5; font-size: 0.6rem; }
        .eos-role-pills { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.85rem; }
        .eos-pill { font-size: 0.62rem; padding: 0.15rem 0.45rem; border-radius: 20px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); }
        .eos-table-wrap { overflow-x: auto; margin-top: 0.5rem; }
        .eos-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        .eos-table th, .eos-table td { padding: 0.5rem 0.45rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .eos-table th { font-size: 0.65rem; text-transform: uppercase; opacity: 0.5; }
        .eos-stage { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; padding: 0.12rem 0.4rem; border-radius: 5px; background: rgba(255,255,255,0.08); }
        .eos-decision { font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.35rem; border-radius: 4px; }
        .eos-decision--pass { background: rgba(104,211,145,0.2); color: #68d391; }
        .eos-decision--hold { background: rgba(246,173,85,0.2); color: #f6ad55; }
        .eos-decision--fail { background: rgba(252,129,129,0.2); color: #fc8181; }
        .eos-decision--pending { background: rgba(255,255,255,0.08); }
        .eos-actions { display: flex; gap: 0.55rem; flex-wrap: wrap; }
        .eos-link { color: #9b7ff0; text-decoration: none; font-size: 0.78rem; }
        .eos-link:hover { text-decoration: underline; }
        .eos-empty { padding: 1rem; text-align: center; background: rgba(0,0,0,0.2); border-radius: 10px; }
        .eos-empty p { margin: 0 0 0.5rem; opacity: 0.7; font-size: 0.84rem; }
        .eos-links-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.55rem; }
        .eos-link-card { display: block; padding: 0.8rem; border-radius: 10px; background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.07); text-decoration: none; color: inherit; }
        .eos-link-card strong { display: block; color: #2fd4ff; margin-bottom: 0.15rem; font-size: 0.85rem; }
        .eos-link-card span { font-size: 0.72rem; opacity: 0.6; }
        .eos-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.55rem; margin-top: 0.85rem; }
        .eos-feature { padding: 0.75rem; border-radius: 10px; background: rgba(0,0,0,0.22); font-size: 0.8rem; }
        .eos-feature p { margin: 0.3rem 0; opacity: 0.65; font-size: 0.75rem; }
        .eos-analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        @media (max-width: 800px) { .eos-analytics-grid { grid-template-columns: 1fr; } }
        .eos-list { margin: 0; padding-left: 1rem; font-size: 0.78rem; line-height: 1.6; }
        .eos-list-row { display: flex; justify-content: space-between; padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.8rem; }
        .eos-notif-list { list-style: none; margin: 0; padding: 0; }
        .eos-notif-list li { padding: 0.45rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.78rem; }
        .eos-notif--unread { border-left: 2px solid #9b7ff0; padding-left: 0.45rem; }
        .eos-notif-list p { margin: 0.15rem 0; opacity: 0.65; }
        .eos-notif-list time { font-size: 0.65rem; opacity: 0.45; }
        .eos-timeline { list-style: none; margin: 0; padding: 0; }
        .eos-timeline li { display: grid; grid-template-columns: 68px 1fr; gap: 0.5rem; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.78rem; }
        .eos-timeline time { opacity: 0.45; font-size: 0.68rem; }
        .eos-timeline span { display: block; font-size: 0.65rem; opacity: 0.45; }
        .eos-muted { opacity: 0.55; font-size: 0.78rem; }
        .eos-highlight-title { display: block; margin-bottom: 0.35rem; color: #e8e8f0; }
        .eos-maya {
          position: sticky; top: 0.75rem; padding: 1rem; border-radius: 14px;
          background: linear-gradient(160deg, rgba(124,95,230,0.14), rgba(37,99,235,0.08));
          border: 1px solid rgba(124,95,230,0.28); font-size: 0.78rem;
        }
        .eos-maya__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; }
        .eos-maya__head strong { color: #c4b5fd; }
        .eos-maya__score { font-size: 1.1rem; font-weight: 700; }
        .eos-score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; margin-bottom: 0.75rem; }
        .eos-score-grid span { display: block; font-size: 0.58rem; opacity: 0.5; text-transform: uppercase; }
        .eos-score-grid strong { font-size: 0.95rem; color: #2fd4ff; }
        .eos-maya__block { margin-bottom: 0.65rem; }
        .eos-maya__block label { display: block; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.5; margin-bottom: 0.2rem; }
        .eos-maya__block ul { margin: 0; padding-left: 1rem; line-height: 1.45; opacity: 0.85; }
        .eos-tree { list-style: none; padding: 0; font-family: ui-monospace, monospace; font-size: 0.7rem; }
        .eos-maya__action { margin: 0.5rem 0; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 8px; font-size: 0.75rem; opacity: 0.85; }
        .eos-maya-btn { display: block; width: 100%; margin-top: 0.35rem; padding: 0.42rem; border-radius: 20px; text-align: center; text-decoration: none; font-size: 0.72rem; font-weight: 600;
          background: rgba(124,95,230,0.25); border: 1px solid rgba(124,95,230,0.4); color: #c4b5fd; box-sizing: border-box; }
        .eos-maya-btn--ghost { background: transparent; border-color: rgba(255,255,255,0.12); color: rgba(255,255,255,0.7); }
        .eos-btn { padding: 0.42rem 0.85rem; border-radius: 20px; font-weight: 600; font-size: 0.76rem; border: none; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
        .eos-btn--ghost { background: rgba(255,255,255,0.07); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
        .eos-btn--primary { background: linear-gradient(135deg, #7c3aed, #2563eb); color: #fff; }
        .eos-btn:disabled { opacity: 0.5; }
        .eos-banner { padding: 0.6rem 0.85rem; border-radius: 10px; margin-top: 0.65rem; font-size: 0.82rem; }
        .eos-banner--error { background: rgba(252,129,129,0.12); color: #fc8181; border: 1px solid rgba(252,129,129,0.3); }
        .eos-banner--success { background: rgba(104,211,145,0.12); color: #68d391; border: 1px solid rgba(104,211,145,0.3); }
        .eos-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
        .eos-modal__card { width: min(440px, 100%); background: #14142a; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 1.1rem; }
        .eos-modal__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; }
        .eos-modal__head h3 { margin: 0; color: #c4b5fd; }
        .eos-modal__close { background: none; border: none; color: #fff; font-size: 1.4rem; cursor: pointer; }
        .eos-field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
        .eos-field span { font-size: 0.72rem; font-weight: 600; }
        .eos-field input { padding: 0.5rem 0.65rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.3); color: #fff; }
        .eos-modal__foot { display: flex; justify-content: flex-end; gap: 0.45rem; }
        .eos-loading { width: 40px; height: 40px; margin: 4rem auto; border: 3px solid rgba(124,95,230,0.2); border-top-color: #9b7ff0; border-radius: 50%; animation: eos-spin 0.8s linear infinite; }
        .eos-error { color: #fc8181; }
        @keyframes eos-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
