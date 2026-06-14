import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { getProjects } from '../../../lib/supabase/projects.queries';
import { getInnovationStage } from '../../../lib/innovation/lifecycle';
import { getCommercializationBreakdown } from '../../../lib/innovation/recommendations';
import { getFundingReadiness } from '../../../lib/innovation/lifecycle';
import type { Project } from '../../../types/project.types';
import {
  type CommercializationWorkspaceState,
  fetchCommercializationWorkspace,
  upsertCommercializationWorkspace,
  readLocalCommercializationWorkspace,
  writeLocalCommercializationWorkspace,
  rowToWorkspaceState,
} from '../services/commercialization.service';
import '../../projects/components/command-center.css';

/* ─── Types ─────────────────────────────────────────────────────────────── */

type FundingStatus = 'none' | 'seeking' | 'committed' | 'secured';
type RevenueModel = CommercializationWorkspaceState['revenueModel'];
type LaunchStatus = CommercializationWorkspaceState['launch']['status'];
type RiskLevel = CommercializationWorkspaceState['mayaInsights']['riskLevel'];
type WorkspaceState = CommercializationWorkspaceState;

interface ReadyProject {
  project: Project;
  breakdown: ReturnType<typeof getCommercializationBreakdown>;
  fundingStatus: FundingStatus;
  validated: boolean;
}

/* ─── Constants ─────────────────────────────────────────────────────────── */

const PIPELINE = [
  'Idea',
  'Research',
  'Prototype',
  'Experiment',
  'Validation',
  'Funding',
  'Commercialization',
] as const;

const REVENUE_MODELS: {
  id: RevenueModel;
  label: string;
  icon: string;
  description: string;
}[] = [
  { id: 'saas', label: 'SaaS', icon: '☁️', description: 'Cloud product with tiered plans' },
  { id: 'subscription', label: 'Subscription', icon: '🔄', description: 'Recurring membership or access' },
  { id: 'licensing', label: 'Licensing', icon: '📜', description: 'IP, patents, or white-label rights' },
  { id: 'api', label: 'API usage', icon: '🔌', description: 'Pay-per-call or usage-based API' },
];

const LAUNCH_CHECKLIST = [
  { id: 'gtm', label: 'Go-to-market strategy defined' },
  { id: 'pricing', label: 'Pricing model finalized' },
  { id: 'distribution', label: 'Distribution plan ready' },
  { id: 'revenue', label: 'Revenue model selected' },
  { id: 'maya', label: 'MAYA risk review completed' },
] as const;

const FUNDING_LABELS: Record<FundingStatus, string> = {
  none: 'Not funded',
  seeking: 'Seeking',
  committed: 'Committed',
  secured: 'Secured',
};

const FUNDING_COLORS: Record<FundingStatus, string> = {
  none: '#fc8181',
  seeking: '#f6c90e',
  committed: '#2fd4ff',
  secured: '#48bb78',
};

const LAUNCH_LABELS: Record<LaunchStatus, string> = {
  draft: 'Draft',
  preparing: 'Preparing',
  scheduled: 'Scheduled',
  launched: 'Launched',
};

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function deriveFundingStatus(project: Project): FundingStatus {
  const readiness = getFundingReadiness(project);
  if (project.status === 'Launched') return 'secured';
  if (readiness >= 80) return 'secured';
  if (readiness >= 55) return 'committed';
  if (readiness >= 35) return 'seeking';
  return 'none';
}

function isValidated(project: Project): boolean {
  const stage = getInnovationStage(project);
  const stageIndex = PIPELINE.indexOf(stage as (typeof PIPELINE)[number]);
  const validationIndex = PIPELINE.indexOf('Validation');
  return stageIndex >= validationIndex || project.progress >= 65;
}

function isEligibleForCommercialization(project: Project): boolean {
  const stage = getInnovationStage(project);
  const stageOk =
    stage === 'Funding' ||
    stage === 'Commercialization' ||
    project.status === 'Launched';
  const funding = deriveFundingStatus(project);
  return isValidated(project) && stageOk && (funding === 'committed' || funding === 'secured');
}

function defaultMarketStrategy(project: Project | null): WorkspaceState['marketStrategy'] {
  const sector = project?.sector || 'innovation';
  return {
    targetUsers: project
      ? `Early adopters and teams in ${sector} seeking validated solutions`
      : '',
    marketSize: project ? `Regional ${sector} market — TAM estimate pending` : '',
    competitors: '',
    positioning: project
      ? `${project.name}: evidence-backed innovation from the Maylet XLab pipeline`
      : '',
  };
}

function defaultPackaging(project: Project | null): WorkspaceState['packaging'] {
  return {
    productName: project?.name ?? '',
    pricingModel: 'tiered',
    distributionPlan: '',
  };
}

function scoreRevenueFit(project: Project, model: RevenueModel): number {
  const text = `${project.name} ${project.description} ${project.sector}`.toLowerCase();
  const rules: Record<RevenueModel, string[]> = {
    saas: ['platform', 'app', 'software', 'dashboard', 'tool', 'cloud'],
    subscription: ['hub', 'learning', 'community', 'service', 'membership'],
    licensing: ['research', 'patent', 'ip', 'license', 'enterprise'],
    api: ['api', 'integration', 'data', 'developer', 'sdk'],
  };
  const hits = rules[model].filter((kw) => text.includes(kw)).length;
  return Math.min(98, 40 + hits * 18 + Math.round(project.progress * 0.2));
}

function pickRecommendedRevenueModel(project: Project): RevenueModel {
  const scores = REVENUE_MODELS.map((m) => ({
    id: m.id,
    score: scoreRevenueFit(project, m.id),
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.id ?? 'saas';
}

function generateMayaInsights(
  project: Project,
  breakdown: ReturnType<typeof getCommercializationBreakdown>,
  strategy: WorkspaceState['marketStrategy'],
  packaging: WorkspaceState['packaging'],
  revenueModel: RevenueModel,
  fundingStatus: FundingStatus
): WorkspaceState['mayaInsights'] {
  const score = breakdown.commercializationScore;
  const sector = project.sector || 'your sector';

  let riskLevel: RiskLevel = 'high';
  if (score >= 80 && fundingStatus === 'secured') riskLevel = 'low';
  else if (score >= 65) riskLevel = 'medium';

  const priceHints: Record<string, string> = {
    tiered: '$29/mo starter · $79/mo pro · custom enterprise',
    freemium: 'Free tier + $19/mo premium conversion target',
    usage: 'Usage-based with $0.01–0.05 per unit at scale',
    enterprise: 'Annual contracts starting at $12k–$48k',
  };

  const weeks = score >= 85 ? '2–3' : score >= 70 ? '4–6' : '8–12';

  return {
    marketPrediction: strategy.marketSize
      ? `Demand in ${sector} is trending up. ${strategy.targetUsers || 'Target segment'} shows strong fit based on validation signals.`
      : `Growing demand in ${sector}. Complete market strategy fields for a sharper forecast.`,
    pricingSuggestion: `${packaging.pricingModel || 'Tiered'} model recommended. ${priceHints[packaging.pricingModel] ?? priceHints.tiered} — aligned with ${REVENUE_MODELS.find((r) => r.id === revenueModel)?.label ?? 'SaaS'}.`,
    riskLevel,
    riskNote:
      riskLevel === 'low'
        ? 'Strong validation and funding signals. Focus on execution velocity.'
        : riskLevel === 'medium'
          ? 'Address gaps in GTM and customer validation before full launch.'
          : 'High uncertainty — strengthen validation evidence and funding commitment.',
    launchRecommendation: `Launch window: ${weeks} weeks. Prioritize ${strategy.positioning ? 'positioning rollout' : 'positioning definition'} and ${packaging.distributionPlan ? 'distribution execution' : 'channel planning'}.`,
  };
}

function defaultLaunchState(): WorkspaceState['launch'] {
  return {
    status: 'draft',
    checklist: Object.fromEntries(LAUNCH_CHECKLIST.map((c) => [c.id, false])),
  };
}

function buildDefaultWorkspaceState(project: Project): WorkspaceState {
  const breakdown = getCommercializationBreakdown(project);
  const strategy = defaultMarketStrategy(project);
  const packaging = defaultPackaging(project);
  const revenueModel = pickRecommendedRevenueModel(project);
  const fundingStatus = deriveFundingStatus(project);

  return {
    marketStrategy: strategy,
    packaging,
    revenueModel,
    mayaInsights: generateMayaInsights(
      project,
      breakdown,
      strategy,
      packaging,
      revenueModel,
      fundingStatus
    ),
    launch: defaultLaunchState(),
  };
}

function mergeWorkspaceState(
  defaults: WorkspaceState,
  partial: Partial<WorkspaceState>
): WorkspaceState {
  return {
    marketStrategy: { ...defaults.marketStrategy, ...partial.marketStrategy },
    packaging: { ...defaults.packaging, ...partial.packaging },
    revenueModel: partial.revenueModel ?? defaults.revenueModel,
    mayaInsights: partial.mayaInsights ?? defaults.mayaInsights,
    launch: { ...defaults.launch, ...partial.launch },
  };
}

function checklistProgress(checklist: Record<string, boolean>): number {
  const done = LAUNCH_CHECKLIST.filter((c) => checklist[c.id]).length;
  return Math.round((done / LAUNCH_CHECKLIST.length) * 100);
}

function canLaunch(
  breakdown: ReturnType<typeof getCommercializationBreakdown>,
  workspace: WorkspaceState
): boolean {
  const allChecked = LAUNCH_CHECKLIST.every((c) => workspace.launch.checklist[c.id]);
  const packagingOk =
    workspace.packaging.productName.trim().length > 0 &&
    workspace.packaging.distributionPlan.trim().length > 0;
  return breakdown.commercializationScore >= 75 && allChecked && packagingOk;
}

/* ─── Subcomponents ─────────────────────────────────────────────────────── */

function PipelineBanner() {
  return (
    <div className="icc-glass icc-pipeline-overview">
      <h3>Innovation pipeline — final stage</h3>
      <div className="icc-lifecycle-bar" style={{ marginBottom: '0.75rem' }}>
        <div className="icc-lifecycle-track">
          {PIPELINE.map((stage, i) => (
            <div
              key={stage}
              className={`icc-lifecycle-seg ${i < PIPELINE.length - 1 ? 'icc-lifecycle-seg--done' : 'icc-lifecycle-seg--active'}`}
              title={stage}
            />
          ))}
        </div>
      </div>
      <div className="icc-pipeline-stages">
        {PIPELINE.map((stage, i) => (
          <div
            key={stage}
            className="icc-pipeline-stage"
            style={
              i === PIPELINE.length - 1
                ? { borderColor: 'rgba(246, 201, 14, 0.5)', background: 'rgba(246, 201, 14, 0.1)' }
                : undefined
            }
          >
            <div className="icc-pipeline-count" style={i === PIPELINE.length - 1 ? { color: '#f6c90e' } : undefined}>
              {i < PIPELINE.length - 1 ? '✓' : '🚀'}
            </div>
            <div className="icc-pipeline-name">{stage}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="comm-field">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */

export default function Commercialization() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [workspaces, setWorkspaces] = useState<Record<string, WorkspaceState>>({});
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    getProjects(user.id)
      .then((list) => {
        setProjects(list);
        const eligible = list.filter(isEligibleForCommercialization);
        if (eligible.length && !selectedId) {
          setSelectedId(eligible[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id, selectedId]);

  const readyProjects: ReadyProject[] = useMemo(
    () =>
      projects
        .filter(isEligibleForCommercialization)
        .map((project) => ({
          project,
          breakdown: getCommercializationBreakdown(project),
          fundingStatus: deriveFundingStatus(project),
          validated: isValidated(project),
        }))
        .sort((a, b) => b.breakdown.commercializationScore - a.breakdown.commercializationScore),
    [projects]
  );

  const overview = useMemo(() => {
    const marketReady = readyProjects.filter((r) => r.breakdown.commercializationScore >= 70).length;
    const launchReady = readyProjects.filter(
      (r) => r.breakdown.commercializationScore >= 85 && r.fundingStatus === 'secured'
    ).length;

    let systemTotal = 0;
    let systemCount = 0;
    for (const r of readyProjects) {
      const ws = workspaces[r.project.id] ?? buildDefaultWorkspaceState(r.project);
      const checklistPct = checklistProgress(ws.launch.checklist);
      systemTotal +=
        (r.breakdown.commercializationScore + getFundingReadiness(r.project) + checklistPct) / 3;
      systemCount += 1;
    }
    const systemReadiness = systemCount ? Math.round(systemTotal / systemCount) : 0;

    return { marketReady, launchReady, systemReadiness };
  }, [readyProjects, workspaces]);

  const selected = readyProjects.find((r) => r.project.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected || !user?.id) return;
    const projectId = selected.project.id;

    let cancelled = false;
    setWorkspaceLoading(true);
    setPersistError(null);

    (async () => {
      const defaults = buildDefaultWorkspaceState(selected.project);
      const { data: row, error } = await fetchCommercializationWorkspace(projectId);

      if (cancelled) return;

      let state: WorkspaceState;
      if (row) {
        state = rowToWorkspaceState(row);
      } else {
        const local = readLocalCommercializationWorkspace(projectId);
        state = local ? mergeWorkspaceState(defaults, local) : defaults;
      }

      writeLocalCommercializationWorkspace(projectId, state);
      setWorkspaces((prev) => ({ ...prev, [projectId]: state }));
      if (error) setPersistError(error);
      setWorkspaceLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [selected?.project.id, user?.id]);

  const workspace = selected ? workspaces[selected.project.id] : null;

  const updateWorkspace = useCallback(
    (projectId: string, patch: Partial<WorkspaceState>) => {
      setWorkspaces((prev) => {
        const base = prev[projectId];
        if (!base) return prev;
        const next: WorkspaceState = {
          marketStrategy: patch.marketStrategy ?? base.marketStrategy,
          packaging: patch.packaging ?? base.packaging,
          revenueModel: patch.revenueModel ?? base.revenueModel,
          mayaInsights: patch.mayaInsights ?? base.mayaInsights,
          launch: patch.launch ?? base.launch,
        };
        writeLocalCommercializationWorkspace(projectId, next);

        if (user?.id) {
          clearTimeout(saveTimers.current[projectId]);
          saveTimers.current[projectId] = setTimeout(() => {
            void upsertCommercializationWorkspace(projectId, user.id, next).then(({ error }) => {
              if (error) setPersistError(error);
            });
          }, 600);
        }

        return { ...prev, [projectId]: next };
      });
    },
    [user?.id]
  );

  const regenerateMaya = useCallback(() => {
    if (!selected || !workspace) return;
    const insights = generateMayaInsights(
      selected.project,
      selected.breakdown,
      workspace.marketStrategy,
      workspace.packaging,
      workspace.revenueModel,
      selected.fundingStatus
    );
    updateWorkspace(selected.project.id, { mayaInsights: insights });
  }, [selected, workspace, updateWorkspace]);

  const handleLaunch = useCallback(async () => {
    if (!selected || !workspace || !user?.id) return;
    if (!canLaunch(selected.breakdown, workspace)) return;

    const launchedAt = new Date().toISOString();
    const nextWorkspace: WorkspaceState = {
      ...workspace,
      launch: { ...workspace.launch, status: 'launched', launchedAt },
    };

    writeLocalCommercializationWorkspace(selected.project.id, nextWorkspace);
    setWorkspaces((prev) => ({ ...prev, [selected.project.id]: nextWorkspace }));

    const { error } = await upsertCommercializationWorkspace(
      selected.project.id,
      user.id,
      nextWorkspace
    );
    if (error) setPersistError(error);

    setLaunchMessage(`${nextWorkspace.packaging.productName || selected.project.name} marked as launched.`);
    window.setTimeout(() => setLaunchMessage(null), 5000);
  }, [selected, workspace, user?.id]);

  return (
    <div className="icc-page">
      <header className="icc-header">
        <div>
          <span className="icc-badge">Final stage · Launch command</span>
          <h1>Commercialization</h1>
          <p>
            Package validated, funded innovations for market — strategy, revenue models, MAYA guidance,
            and launch tracking.
          </p>
        </div>
        <div className="icc-quick-actions" style={{ marginBottom: 0 }}>
          <Link to="/funding" className="icc-quick-btn">Funding hub</Link>
          <Link to="/validation" className="icc-quick-btn">Validation</Link>
          <Link to="/enterprise" className="icc-quick-btn icc-quick-btn--primary">Enterprise</Link>
        </div>
      </header>

      <PipelineBanner />

      {/* 1. Dashboard overview */}
      <section className="icc-dashboard-section">
        <div className="icc-section-header">
          <span className="icc-section-number">1</span>
          <div>
            <h2 className="icc-section-title">Dashboard overview</h2>
            <p className="icc-section-subtitle">Market-ready portfolio and system launch readiness</p>
          </div>
        </div>
        <div className="icc-kpi-grid">
          <div className="icc-glass icc-kpi">
            <div className="icc-kpi-value" style={{ color: '#48bb78' }}>{overview.marketReady}</div>
            <div className="icc-kpi-label">Market-ready innovations</div>
            <div className="icc-kpi-accent" style={{ background: '#48bb78' }} />
          </div>
          <div className="icc-glass icc-kpi">
            <div className="icc-kpi-value" style={{ color: '#2fd4ff' }}>{overview.launchReady}</div>
            <div className="icc-kpi-label">Launch-ready products</div>
            <div className="icc-kpi-accent" style={{ background: '#2fd4ff' }} />
          </div>
          <div className="icc-glass icc-kpi">
            <div className="icc-kpi-value" style={{ color: '#9b7ff0' }}>{overview.systemReadiness}%</div>
            <div className="icc-kpi-label">System readiness</div>
            <div className="icc-kpi-accent" style={{ background: '#9b7ff0' }} />
          </div>
        </div>
      </section>

      {/* 2. Ready innovations */}
      <section className="icc-dashboard-section">
        <div className="icc-section-header">
          <span className="icc-section-number">2</span>
          <div>
            <h2 className="icc-section-title">Ready innovations</h2>
            <p className="icc-section-subtitle">Validated and funded projects eligible for commercialization</p>
          </div>
        </div>

        {loading ? (
          <p>Loading commercialization portfolio…</p>
        ) : readyProjects.length === 0 ? (
          <div className="icc-glass icc-widget">
            <h3>No projects ready for commercialization</h3>
            <p className="icc-widget-empty-text">
              Projects must complete validation and secure funding before entering this stage.
              Run <code>scripts/seed-commercialization-eligible-project.sql</code> in Supabase to
              bump a test project, or advance work in Validation and Funding.
            </p>
            <div className="icc-quick-actions" style={{ padding: 0 }}>
              <Link to="/validation" className="icc-quick-btn icc-quick-btn--primary">Validation center</Link>
              <Link to="/funding" className="icc-quick-btn">Funding hub</Link>
            </div>
          </div>
        ) : (
          <div className="icc-glass icc-project-table-wrap">
            <table className="icc-project-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Readiness</th>
                  <th>Funding</th>
                  <th>Stage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {readyProjects.map(({ project, breakdown, fundingStatus }) => (
                  <tr key={project.id}>
                    <td>
                      <Link to={`/projects/${project.id}`} className="icc-table-project">
                        {project.name}
                      </Link>
                      <span className="icc-table-sector">{project.sector || 'General'}</span>
                    </td>
                    <td>
                      <div className="icc-table-progress">
                        <div className="icc-bar-track">
                          <div
                            className="icc-bar-fill"
                            style={{ width: `${breakdown.commercializationScore}%` }}
                          />
                        </div>
                        <strong style={{ fontSize: '0.7rem' }}>{breakdown.commercializationScore}%</strong>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: FUNDING_COLORS[fundingStatus], fontSize: '0.75rem', fontWeight: 600 }}>
                        {FUNDING_LABELS[fundingStatus]}
                      </span>
                    </td>
                    <td>
                      <span className="icc-table-stage">{getInnovationStage(project)}</span>
                    </td>
                    <td>
                      <div className="icc-table-actions">
                        <button
                          type="button"
                          className="icc-table-btn icc-table-btn--maya"
                          onClick={() => setSelectedId(project.id)}
                        >
                          {selectedId === project.id ? 'Selected' : 'Configure →'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Selected project workspace */}
      {selected && workspace && (
        <>
          {persistError && (
            <div className="icc-glass icc-widget" style={{ marginBottom: '1rem', borderColor: 'rgba(252,129,129,0.4)' }}>
              <p style={{ margin: 0, color: '#fc8181', fontSize: '0.85rem' }}>{persistError}</p>
            </div>
          )}
          {workspaceLoading && (
            <p style={{ opacity: 0.7, marginBottom: '1rem' }}>Loading workspace…</p>
          )}
          <div className="icc-glass icc-widget" style={{ marginBottom: '1.5rem' }}>
            <div className="icc-widget-header">
              <h3>Workspace: {selected.project.name}</h3>
              <Link to={`/projects/${selected.project.id}`} className="icc-widget-link">
                Open project →
              </Link>
            </div>
            <div className="icc-comm-score">
              <span>Commercialization score</span>
              <strong>{selected.breakdown.commercializationScore}%</strong>
            </div>
          </div>

          {/* 3 + 4: Market strategy & Product packaging */}
          <div className="icc-command-row">
            <section className="icc-glass icc-widget">
              <div className="icc-section-header" style={{ marginBottom: '0.75rem' }}>
                <span className="icc-section-number">3</span>
                <div>
                  <h2 className="icc-section-title">Market strategy</h2>
                  <p className="icc-section-subtitle">Audience, size, competition, positioning</p>
                </div>
              </div>
              <FieldGroup label="Target users" id="comm-target-users">
                <textarea
                  id="comm-target-users"
                  rows={2}
                  value={workspace.marketStrategy.targetUsers}
                  onChange={(e) =>
                    updateWorkspace(selected.project.id, {
                      marketStrategy: { ...workspace.marketStrategy, targetUsers: e.target.value },
                    })
                  }
                />
              </FieldGroup>
              <FieldGroup label="Market size (TAM / SAM / SOM)" id="comm-market-size">
                <input
                  id="comm-market-size"
                  type="text"
                  value={workspace.marketStrategy.marketSize}
                  onChange={(e) =>
                    updateWorkspace(selected.project.id, {
                      marketStrategy: { ...workspace.marketStrategy, marketSize: e.target.value },
                    })
                  }
                />
              </FieldGroup>
              <FieldGroup label="Competitors (comma-separated)" id="comm-competitors">
                <input
                  id="comm-competitors"
                  type="text"
                  value={workspace.marketStrategy.competitors}
                  onChange={(e) =>
                    updateWorkspace(selected.project.id, {
                      marketStrategy: { ...workspace.marketStrategy, competitors: e.target.value },
                    })
                  }
                />
              </FieldGroup>
              <FieldGroup label="Positioning" id="comm-positioning">
                <textarea
                  id="comm-positioning"
                  rows={2}
                  value={workspace.marketStrategy.positioning}
                  onChange={(e) =>
                    updateWorkspace(selected.project.id, {
                      marketStrategy: { ...workspace.marketStrategy, positioning: e.target.value },
                    })
                  }
                />
              </FieldGroup>
            </section>

            <section className="icc-glass icc-widget">
              <div className="icc-section-header" style={{ marginBottom: '0.75rem' }}>
                <span className="icc-section-number">4</span>
                <div>
                  <h2 className="icc-section-title">Product packaging</h2>
                  <p className="icc-section-subtitle">Launch-facing name, pricing, distribution</p>
                </div>
              </div>
              <FieldGroup label="Product name" id="comm-product-name">
                <input
                  id="comm-product-name"
                  type="text"
                  value={workspace.packaging.productName}
                  onChange={(e) =>
                    updateWorkspace(selected.project.id, {
                      packaging: { ...workspace.packaging, productName: e.target.value },
                    })
                  }
                />
              </FieldGroup>
              <FieldGroup label="Pricing model" id="comm-pricing-model">
                <select
                  id="comm-pricing-model"
                  value={workspace.packaging.pricingModel}
                  onChange={(e) =>
                    updateWorkspace(selected.project.id, {
                      packaging: { ...workspace.packaging, pricingModel: e.target.value },
                    })
                  }
                >
                  <option value="tiered">Tiered plans</option>
                  <option value="freemium">Freemium</option>
                  <option value="usage">Usage-based</option>
                  <option value="enterprise">Enterprise annual</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Distribution plan" id="comm-distribution">
                <textarea
                  id="comm-distribution"
                  rows={3}
                  placeholder="Channels, partners, regions…"
                  value={workspace.packaging.distributionPlan}
                  onChange={(e) =>
                    updateWorkspace(selected.project.id, {
                      packaging: { ...workspace.packaging, distributionPlan: e.target.value },
                    })
                  }
                />
              </FieldGroup>
            </section>
          </div>

          {/* 5. Revenue models */}
          <section className="icc-dashboard-section">
            <div className="icc-section-header">
              <span className="icc-section-number">5</span>
              <div>
                <h2 className="icc-section-title">Revenue models</h2>
                <p className="icc-section-subtitle">Select the primary monetization path</p>
              </div>
            </div>
            <div className="comm-revenue-grid">
              {REVENUE_MODELS.map((model) => {
                const fit = scoreRevenueFit(selected.project, model.id);
                const active = workspace.revenueModel === model.id;
                const recommended = pickRecommendedRevenueModel(selected.project) === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    className={`icc-glass comm-revenue-card ${active ? 'comm-revenue-card--active' : ''}`}
                    onClick={() => updateWorkspace(selected.project.id, { revenueModel: model.id })}
                  >
                    <div className="comm-revenue-card__head">
                      <span>{model.icon}</span>
                      <strong>{model.label}</strong>
                      {recommended && <span className="comm-tag">Recommended</span>}
                    </div>
                    <p>{model.description}</p>
                    <div className="icc-comm-bar-track">
                      <div className="icc-comm-bar-fill" style={{ width: `${fit}%` }} />
                    </div>
                    <div className="icc-comm-label">
                      <span>Fit score</span>
                      <strong>{fit}%</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 6. MAYA AI */}
          <section className="icc-dashboard-section">
            <div className="icc-section-header">
              <span className="icc-section-number">6</span>
              <div>
                <h2 className="icc-section-title">MAYA commercialization advisor</h2>
                <p className="icc-section-subtitle">Market prediction, pricing, risk, and launch timing</p>
              </div>
            </div>
            <div className="icc-glass icc-widget">
              <div className="icc-maya-scores">
                <div className="icc-maya-score-item">
                  <span>Market prediction</span>
                  <p className="icc-maya-summary">{workspace.mayaInsights.marketPrediction}</p>
                </div>
                <div className="icc-maya-score-item">
                  <span>Pricing suggestion</span>
                  <p className="icc-maya-summary">{workspace.mayaInsights.pricingSuggestion}</p>
                </div>
                <div className="icc-maya-score-item">
                  <span>Risk analysis</span>
                  <strong className={`icc-risk-${workspace.mayaInsights.riskLevel}`}>
                    {workspace.mayaInsights.riskLevel.toUpperCase()}
                  </strong>
                  <p className="icc-maya-summary">{workspace.mayaInsights.riskNote}</p>
                </div>
                <div className="icc-maya-score-item">
                  <span>Launch recommendation</span>
                  <p className="icc-maya-summary">{workspace.mayaInsights.launchRecommendation}</p>
                </div>
              </div>
              <button type="button" className="icc-quick-btn" onClick={regenerateMaya}>
                Regenerate insights
              </button>
              {/* BACKEND: supabase.functions.invoke('maya-commercialization', { body }) */}
            </div>
          </section>

          {/* 7. Launch system */}
          <section className="icc-dashboard-section">
            <div className="icc-section-header">
              <span className="icc-section-number">7</span>
              <div>
                <h2 className="icc-section-title">Launch system</h2>
                <p className="icc-section-subtitle">Checklist, status tracking, and launch action</p>
              </div>
            </div>
            <div className="icc-glass icc-widget">
              <div className="icc-widget-header">
                <h3>
                  Status:{' '}
                  <span style={{ color: workspace.launch.status === 'launched' ? '#48bb78' : '#f6c90e' }}>
                    {LAUNCH_LABELS[workspace.launch.status]}
                  </span>
                </h3>
                {workspace.launch.launchedAt && (
                  <span className="icc-executive-meta">
                    Launched {new Date(workspace.launch.launchedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {launchMessage && (
                <p className="comm-launch-success">{launchMessage}</p>
              )}

              <ul className="icc-onboarding-list">
                {LAUNCH_CHECKLIST.map((item) => (
                  <li key={item.id}>
                    <label className="comm-check-item">
                      <input
                        type="checkbox"
                        checked={workspace.launch.checklist[item.id] ?? false}
                        disabled={workspace.launch.status === 'launched'}
                        onChange={(e) => {
                          const checklist = {
                            ...workspace.launch.checklist,
                            [item.id]: e.target.checked,
                          };
                          const done = LAUNCH_CHECKLIST.filter((c) => checklist[c.id]).length;
                          let status: LaunchStatus = workspace.launch.status;
                          if (workspace.launch.status !== 'launched') {
                            if (done === 0) status = 'draft';
                            else if (done < LAUNCH_CHECKLIST.length) status = 'preparing';
                            else status = 'scheduled';
                          }
                          updateWorkspace(selected.project.id, {
                            launch: { ...workspace.launch, checklist, status },
                          });
                        }}
                      />
                      {item.label}
                    </label>
                  </li>
                ))}
              </ul>

              <div className="icc-comm-score" style={{ marginTop: '1rem' }}>
                <span>Launch checklist</span>
                <strong>{checklistProgress(workspace.launch.checklist)}%</strong>
              </div>

              <div className="icc-quick-actions" style={{ padding: 0, marginTop: '1rem' }}>
                {workspace.launch.status !== 'launched' && (
                  <button
                    type="button"
                    className="icc-quick-btn icc-quick-btn--primary"
                    disabled={!canLaunch(selected.breakdown, workspace)}
                    title={
                      !canLaunch(selected.breakdown, workspace)
                        ? 'Requires 75%+ readiness, complete checklist, and distribution plan'
                        : 'Launch this product'
                    }
                    onClick={handleLaunch}
                  >
                    Launch product
                  </button>
                )}
                {workspace.launch.status === 'launched' && (
                  <Link to="/marketplace" className="icc-quick-btn icc-quick-btn--primary">
                    View marketplace →
                  </Link>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      <style>{`
        .comm-field { margin-bottom: 0.85rem; }
        .comm-field label {
          display: block;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.55);
          margin-bottom: 0.35rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .comm-field input,
        .comm-field textarea,
        .comm-field select {
          width: 100%;
          padding: 0.55rem 0.65rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.25);
          color: #fff;
          font-family: inherit;
          font-size: 0.85rem;
        }
        .comm-field textarea { resize: vertical; min-height: 60px; }
        .comm-revenue-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
        }
        .comm-revenue-card {
          padding: 1rem;
          text-align: left;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .comm-revenue-card--active {
          border-color: rgba(124,95,230,0.55);
          box-shadow: 0 0 0 1px rgba(124,95,230,0.25);
        }
        .comm-revenue-card p {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.55);
          margin: 0.35rem 0 0.65rem;
          line-height: 1.4;
        }
        .comm-revenue-card__head {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
        }
        .comm-tag {
          font-size: 0.55rem;
          padding: 0.1rem 0.4rem;
          border-radius: 10px;
          background: rgba(72,187,120,0.2);
          color: #68d391;
          margin-left: auto;
        }
        .comm-check-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 0.5rem;
          margin-bottom: 0.35rem;
          border-radius: 8px;
          background: rgba(0,0,0,0.2);
          font-size: 0.75rem;
          cursor: pointer;
        }
        .comm-launch-success {
          color: #68d391;
          font-size: 0.85rem;
          margin: 0 0 0.75rem;
        }
        .icc-table-btn {
          border: none;
          cursor: pointer;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
