import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase/client';
import { invokeMayaChat } from '../../../lib/maya/mayaChat.service';

/* ─── Constants ─────────────────────────────────────────────────────── */

const CONFIG_VERSION = 1;

const WORKFLOW_STAGES = [
  'Draft',
  'Submitted',
  'Under Review',
  'Interview',
  'Approved',
  'Rejected',
  'Funded',
] as const;

type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

const NAV_SECTIONS = [
  { id: 'overview', label: 'Funding Overview', icon: '📋' },
  { id: 'requirements', label: 'Requirements', icon: '✅' },
  { id: 'eligibility', label: 'Eligibility Checker', icon: '🎯' },
  { id: 'tracker', label: 'Application Tracker', icon: '📊' },
  { id: 'projects', label: 'Linked Projects', icon: '📁' },
  { id: 'documents', label: 'Required Documents', icon: '📄' },
  { id: 'funder', label: 'Funder Profile', icon: '🏦' },
  { id: 'analytics', label: 'Funding Analytics', icon: '📈' },
  { id: 'integrations', label: 'Integrations', icon: '🔗' },
] as const;

type SectionId = (typeof NAV_SECTIONS)[number]['id'];

const INTEGRATIONS = [
  { id: 'hub', label: 'Funding Hub', route: '/funding', icon: '💰' },
  { id: 'projects', label: 'Projects', route: '/projects', icon: '📁' },
  { id: 'validation', label: 'Validation', route: '/validation', icon: '✅' },
  { id: 'documents', label: 'Documents', route: '/documents', icon: '📄' },
  { id: 'commercialization', label: 'Commercialization', route: '/commercialization', icon: '🚀' },
] as const;

const DEFAULT_REQUIREMENTS = [
  { id: 'biz-plan', label: 'Business plan & executive summary', met: false },
  { id: 'financials', label: 'Financial projections (3–5 years)', met: false },
  { id: 'pitch-deck', label: 'Investor pitch deck', met: false },
  { id: 'validation', label: 'Validation evidence package', met: false },
  { id: 'team', label: 'Team bios & org chart', met: false },
  { id: 'market', label: 'Market & competitive analysis', met: false },
];

const DEFAULT_ELIGIBILITY = [
  { id: 'incorporated', label: 'Registered legal entity', required: true },
  { id: 'stage', label: 'Stage matches funder mandate', required: true },
  { id: 'geo', label: 'Geographic eligibility', required: true },
  { id: 'sector', label: 'Sector / industry alignment', required: true },
  { id: 'validation-score', label: 'Validation score ≥ 70', required: false },
  { id: 'revenue', label: 'Revenue or traction threshold', required: false },
];

const DEFAULT_DOCUMENTS = [
  { id: 'deck', name: 'Pitch deck', status: 'missing' as DocStatus },
  { id: 'financial-model', name: 'Financial model', status: 'missing' as DocStatus },
  { id: 'cap-table', name: 'Cap table', status: 'missing' as DocStatus },
  { id: 'validation-report', name: 'Validation report', status: 'missing' as DocStatus },
  { id: 'incorporation', name: 'Incorporation documents', status: 'missing' as DocStatus },
];

type DocStatus = 'missing' | 'draft' | 'ready' | 'submitted';

type OpportunityType = 'grant' | 'vc' | 'angel' | 'accelerator' | 'investment_program';

interface RequirementItem {
  id: string;
  label: string;
  met: boolean;
  notes?: string;
}

interface EligibilityCriterion {
  id: string;
  label: string;
  required: boolean;
}

interface TimelineEvent {
  stage: WorkflowStage;
  date?: string;
  notes?: string;
}

interface FunderProfile {
  name: string;
  organization: string;
  type: OpportunityType;
  focus: string[];
  min_investment?: number;
  max_investment?: number;
  website?: string;
  contact_email?: string;
  description?: string;
}

interface DocumentRequirement {
  id: string;
  name: string;
  status: DocStatus;
  file_url?: string;
}

interface FundingConfig {
  v: number;
  description: string;
  organization: string;
  opportunity_type: OpportunityType;
  deadline: string;
  equity_offered: number;
  industry: string;
  stage: string;
  pitch_deck_url: string;
  requirements: RequirementItem[];
  eligibility_criteria: EligibilityCriterion[];
  eligibility_checks: Record<string, boolean>;
  application_timeline: TimelineEvent[];
  funder_profile: FunderProfile;
  documents_required: DocumentRequirement[];
  application_notes: string;
}

interface FundingRow {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  summary: string | null;
  amount_sought: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  sector: string | null;
  progress: number | null;
  status: string | null;
}

interface ValidationRow {
  id: string;
  overall_score: number;
  decision: string;
  technical_score: number;
  market_score: number;
  financial_score: number;
  updated_at: string;
}

interface DocumentRow {
  id: string;
  name: string;
  file_url: string | null;
  file_type: string | null;
  created_at: string;
}

interface MayaInsights {
  matchScore: number;
  readiness: string;
  risks: string[];
  recommendations: string[];
  investorMatches: string[];
  aiSummary?: string;
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

function workflowFromStatus(status: string): WorkflowStage {
  const map: Record<string, WorkflowStage> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    interview: 'Interview',
    approved: 'Approved',
    rejected: 'Rejected',
    declined: 'Rejected',
    funded: 'Funded',
  };
  return map[status.toLowerCase()] ?? 'Draft';
}

function statusFromWorkflow(stage: WorkflowStage): string {
  const map: Record<WorkflowStage, string> = {
    Draft: 'draft',
    Submitted: 'submitted',
    'Under Review': 'under_review',
    Interview: 'interview',
    Approved: 'approved',
    Rejected: 'rejected',
    Funded: 'funded',
  };
  return map[stage];
}

function defaultConfig(partial?: Partial<FundingConfig>): FundingConfig {
  return {
    v: CONFIG_VERSION,
    description: '',
    organization: '',
    opportunity_type: 'grant',
    deadline: '',
    equity_offered: 0,
    industry: 'Technology',
    stage: 'mvp',
    pitch_deck_url: '',
    requirements: DEFAULT_REQUIREMENTS.map((r) => ({ ...r })),
    eligibility_criteria: DEFAULT_ELIGIBILITY.map((e) => ({ ...e })),
    eligibility_checks: {},
    application_timeline: WORKFLOW_STAGES.map((stage) => ({ stage })),
    funder_profile: {
      name: '',
      organization: '',
      type: 'grant',
      focus: [],
    },
    documents_required: DEFAULT_DOCUMENTS.map((d) => ({ ...d })),
    application_notes: '',
    ...partial,
  };
}

function parseConfig(row: FundingRow & Record<string, unknown>): FundingConfig {
  const raw = row.summary;
  if (raw?.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as Partial<FundingConfig>;
      return defaultConfig({
        ...parsed,
        description: parsed.description ?? (typeof raw === 'string' && !raw.startsWith('{') ? raw : ''),
      });
    } catch {
      /* fall through */
    }
  }

  const legacyDesc =
    (row.description as string | undefined) ??
    (typeof raw === 'string' && !raw.startsWith('{') ? raw : '') ??
    '';

  return defaultConfig({
    description: legacyDesc,
    organization: (row.organization as string) ?? '',
    equity_offered: Number(row.equity_offered ?? 0),
    industry: (row.industry as string) ?? 'Technology',
    stage: (row.stage as string) ?? 'mvp',
    pitch_deck_url: (row.pitch_deck_url as string) ?? '',
    deadline: (row.deadline as string) ?? '',
  });
}

function serializeConfig(config: FundingConfig): string {
  return JSON.stringify({ ...config, v: CONFIG_VERSION });
}

function formatMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function computeInsights(
  config: FundingConfig,
  amount: number | null,
  workflow: WorkflowStage,
  validation: ValidationRow | null,
  project: ProjectRow | null
): MayaInsights {
  const reqMet = config.requirements.filter((r) => r.met).length;
  const reqTotal = config.requirements.length || 1;
  const reqPct = (reqMet / reqTotal) * 100;

  const requiredChecks = config.eligibility_criteria.filter((c) => c.required);
  const requiredMet = requiredChecks.filter((c) => config.eligibility_checks[c.id]).length;
  const eligPct =
    requiredChecks.length > 0 ? (requiredMet / requiredChecks.length) * 100 : 50;

  const docReady = config.documents_required.filter(
    (d) => d.status === 'ready' || d.status === 'submitted'
  ).length;
  const docPct =
    config.documents_required.length > 0
      ? (docReady / config.documents_required.length) * 100
      : 0;

  const valScore = validation?.overall_score ?? 0;
  const valPct = validation ? valScore : project?.progress ?? 0;

  const workflowIdx = WORKFLOW_STAGES.indexOf(workflow);
  const pipelinePct = ((workflowIdx + 1) / WORKFLOW_STAGES.length) * 100;

  const matchScore = Math.round(
    reqPct * 0.25 + eligPct * 0.2 + docPct * 0.2 + valPct * 0.25 + pipelinePct * 0.1
  );

  const risks: string[] = [];
  if (!validation) risks.push('No validation record linked — funders expect evidence before capital.');
  else if (validation.decision !== 'pass') {
    risks.push(`Validation decision is "${validation.decision}" — address gaps before submission.`);
  }
  if (valScore < 70) risks.push('Overall validation score below 70 — strengthen technical & market proof.');
  if (docPct < 60) risks.push('Required documents incomplete — high rejection risk.');
  if (requiredMet < requiredChecks.length) {
    risks.push('Mandatory eligibility criteria not satisfied.');
  }
  const deadlineDays = daysUntil(config.deadline);
  if (deadlineDays != null && deadlineDays < 14 && deadlineDays >= 0) {
    risks.push(`Deadline in ${deadlineDays} days — accelerate document preparation.`);
  }
  if (workflow === 'Rejected') risks.push('Application was rejected — review funder feedback and pivot strategy.');

  const recommendations: string[] = [];
  if (!config.pitch_deck_url && !config.funder_profile.website) {
    recommendations.push('Upload pitch deck and complete funder profile for stronger positioning.');
  }
  if (validation && validation.market_score < 75) {
    recommendations.push('Improve market validation scores with customer interviews or pilot data.');
  }
  if (reqPct < 80) {
    recommendations.push('Close open funding requirements before moving to Submitted status.');
  }
  if (project && (project.progress ?? 0) < 50) {
    recommendations.push('Advance linked project maturity to strengthen investment narrative.');
  }
  recommendations.push('Schedule a mock investor interview while status is Under Review.');

  const investorMatches: string[] = [];
  const type = config.opportunity_type;
  if (type === 'grant') investorMatches.push('Government innovation grants', 'Sector-specific R&D funds');
  if (type === 'vc') investorMatches.push('Seed/Series A VC aligned with ' + (config.industry || 'your sector'));
  if (type === 'angel') investorMatches.push('Angel syndicates in ' + (config.industry || 'Technology'));
  if (type === 'accelerator') investorMatches.push('Top-tier accelerators with demo-day pathways');
  if (amount && amount < 250000) investorMatches.push('Micro-grant & angel pre-seed programs');
  if (amount && amount >= 1000000) investorMatches.push('Growth equity & institutional co-investors');

  let readiness: string;
  if (matchScore >= 80) readiness = 'Investment-ready — strong alignment across validation, docs, and eligibility.';
  else if (matchScore >= 60) readiness = 'Approaching readiness — close document gaps and validation items.';
  else if (matchScore >= 40) readiness = 'Early stage — build evidence and complete eligibility checklist.';
  else readiness = 'Not ready — complete validation gate and core requirements first.';

  return {
    matchScore: Math.min(100, Math.max(0, matchScore)),
    readiness,
    risks: risks.slice(0, 5),
    recommendations: recommendations.slice(0, 5),
    investorMatches: investorMatches.slice(0, 4),
  };
}

function workflowColor(stage: WorkflowStage): string {
  const colors: Record<WorkflowStage, string> = {
    Draft: '#f6c90e',
    Submitted: '#2fd4ff',
    'Under Review': '#9b7ff0',
    Interview: '#7c5fe6',
    Approved: '#68d391',
    Rejected: '#fc8181',
    Funded: '#48bb78',
  };
  return colors[stage];
}

/* ─── UI primitives ─────────────────────────────────────────────────── */

function Kpi({ label, value, accent }: { label: string; value: ReactNode; accent?: 'good' | 'warn' | 'accent' }) {
  return (
    <div className={`fund-kpi${accent ? ` fund-kpi--${accent}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StageBadge({ stage }: { stage: WorkflowStage }) {
  return (
    <span className="fund-stage" style={{ background: `${workflowColor(stage)}22`, color: workflowColor(stage) }}>
      {stage}
    </span>
  );
}

/* ─── Main workspace ────────────────────────────────────────────────── */

export default function FundingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [row, setRow] = useState<FundingRow | null>(null);
  const [config, setConfig] = useState<FundingConfig>(() => defaultConfig());
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowStage>('Draft');

  const [project, setProject] = useState<ProjectRow | null>(null);
  const [validation, setValidation] = useState<ValidationRow | null>(null);
  const [projectDocs, setProjectDocs] = useState<DocumentRow[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectRow[]>([]);

  const [section, setSection] = useState<SectionId>('overview');
  const [mayaLoading, setMayaLoading] = useState(false);
  const [mayaAiText, setMayaAiText] = useState<string | null>(null);

  const insights = useMemo(
    () => computeInsights(config, amount, workflow, validation, project),
    [config, amount, workflow, validation, project]
  );

  const deadlineDays = daysUntil(config.deadline);

  const load = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    setError(null);

    const { data: pitch, error: pitchErr } = await supabase
      .from('funding_pitches')
      .select('*')
      .eq('id', id)
      .single();

    if (pitchErr || !pitch) {
      navigate('/funding');
      return;
    }
    if (pitch.user_id !== user.id) {
      navigate('/funding');
      return;
    }

    const typed = pitch as FundingRow & Record<string, unknown>;
    const parsed = parseConfig(typed);
    const legacyAmount =
      typed.amount_sought ?? (typed.amount as number | undefined) ?? null;

    setRow(typed);
    setConfig(parsed);
    setTitle(typed.title);
    setAmount(legacyAmount != null ? Number(legacyAmount) : null);
    setWorkflow(workflowFromStatus(typed.status));

    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, description, sector, progress, status')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    setAllProjects((projects as ProjectRow[]) ?? []);

    if (typed.project_id) {
      const linked =
        (projects as ProjectRow[] | null)?.find((p) => p.id === typed.project_id) ?? null;
      setProject(linked);

      const { data: val } = await supabase
        .from('validations')
        .select('id, overall_score, decision, technical_score, market_score, financial_score, updated_at')
        .eq('project_id', typed.project_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setValidation((val as ValidationRow) ?? null);

      const { data: docs } = await supabase
        .from('documents')
        .select('id, name, file_url, file_type, created_at')
        .eq('project_id', typed.project_id)
        .order('created_at', { ascending: false });

      setProjectDocs((docs as DocumentRow[]) ?? []);
    } else {
      setProject(null);
      setValidation(null);
      setProjectDocs([]);
    }

    setLoading(false);
  }, [id, user, navigate]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
    if (user) load();
  }, [authLoading, user, navigate, load]);

  const persist = async (patch?: {
    nextConfig?: FundingConfig;
    nextTitle?: string;
    nextAmount?: number | null;
    nextWorkflow?: WorkflowStage;
    nextProjectId?: string | null;
  }) => {
    if (!row || !user) return;
    setSaving(true);
    setError(null);

    const cfg = patch?.nextConfig ?? config;
    const nextTitle = patch?.nextTitle ?? title;
    const nextAmount = patch?.nextAmount !== undefined ? patch.nextAmount : amount;
    const nextWorkflow = patch?.nextWorkflow ?? workflow;
    const projectId =
      patch?.nextProjectId !== undefined ? patch.nextProjectId : row.project_id;

    const { error: updErr } = await supabase
      .from('funding_pitches')
      .update({
        title: nextTitle,
        summary: serializeConfig(cfg),
        amount_sought: nextAmount,
        status: statusFromWorkflow(nextWorkflow),
        project_id: projectId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (updErr) {
      setError(updErr.message);
      setSaving(false);
      return;
    }

    setConfig(cfg);
    setTitle(nextTitle);
    setAmount(nextAmount);
    setWorkflow(nextWorkflow);
    setRow((prev) =>
      prev
        ? {
            ...prev,
            title: nextTitle,
            summary: serializeConfig(cfg),
            amount_sought: nextAmount,
            status: statusFromWorkflow(nextWorkflow),
            project_id: projectId,
            updated_at: new Date().toISOString(),
          }
        : null
    );

    if (patch?.nextProjectId !== undefined) {
      const linked = allProjects.find((p) => p.id === projectId) ?? null;
      setProject(linked);
    }

    setToast('Workspace saved');
    setTimeout(() => setToast(null), 2500);
    setSaving(false);
  };

  const advanceWorkflow = (stage: WorkflowStage) => {
    setWorkflow(stage);
    const timeline = config.application_timeline.map((t) =>
      t.stage === stage ? { ...t, date: new Date().toISOString().slice(0, 10) } : t
    );
    const nextConfig = { ...config, application_timeline: timeline };
    setConfig(nextConfig);
    void persist({ nextWorkflow: stage, nextConfig });
  };

  const runMayaAnalysis = async () => {
    setMayaLoading(true);
    setMayaAiText(null);
    try {
      const prompt = `You are MAYA, funding intelligence for Maylet XLab. Analyze this funding opportunity in 4 short paragraphs:
Title: ${title}
Organization: ${config.organization || config.funder_profile.organization}
Amount: ${formatMoney(amount)}
Type: ${config.opportunity_type}
Stage: ${config.stage}
Workflow: ${workflow}
Match score: ${insights.matchScore}%
Validation: ${validation ? `${validation.overall_score}/100 (${validation.decision})` : 'none'}
Risks: ${insights.risks.join('; ')}
Give: readiness verdict, top 3 risks, top 3 actions, investor fit summary. Be concise and actionable.`;

      const text = await invokeMayaChat([{ role: 'user', content: prompt }]);
      setMayaAiText(text);
    } catch (e) {
      setMayaAiText(
        e instanceof Error ? e.message : 'MAYA analysis unavailable. Check API configuration.'
      );
    } finally {
      setMayaLoading(false);
    }
  };

  const linkProject = async (projectId: string) => {
    const linked = allProjects.find((p) => p.id === projectId) ?? null;
    setProject(linked);
    await persist({ nextProjectId: projectId || null });

    if (projectId) {
      const { data: val } = await supabase
        .from('validations')
        .select('id, overall_score, decision, technical_score, market_score, financial_score, updated_at')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setValidation((val as ValidationRow) ?? null);

      const { data: docs } = await supabase
        .from('documents')
        .select('id, name, file_url, file_type, created_at')
        .eq('project_id', projectId);
      setProjectDocs((docs as DocumentRow[]) ?? []);
    }
  };

  const reqPct = Math.round(
    (config.requirements.filter((r) => r.met).length / (config.requirements.length || 1)) * 100
  );
  const docPct = Math.round(
    (config.documents_required.filter((d) => d.status === 'ready' || d.status === 'submitted').length /
      (config.documents_required.length || 1)) *
      100
  );

  if (authLoading || loading || !row) {
    return (
      <div className="fund-page">
        <div className="fund-spinner" />
        <style>{FUND_STYLES}</style>
      </div>
    );
  }

  return (
    <div className="fund-page">
      <header className="fund-header">
        <div className="fund-header__top">
          <div>
            <Link to="/funding" className="fund-back">
              ← Funding Hub
            </Link>
            <h1>{title}</h1>
            <p className="fund-header__sub">
              Funding Opportunity Workspace · {config.organization || config.funder_profile.organization || 'Opportunity'}
            </p>
            <div className="fund-lifecycle">
              <span>Validation</span>
              <span>Funding</span>
              <span>Commercialization</span>
            </div>
          </div>
          <div className="fund-header__actions">
            <Link to={`/funding/${id}/edit`} className="fund-btn fund-btn--ghost">
              Full editor
            </Link>
            <StageBadge stage={workflow} />
            <button type="button" className="fund-btn fund-btn--ghost" onClick={() => void persist()} disabled={saving}>
              {saving ? 'Saving…' : 'Save workspace'}
            </button>
          </div>
        </div>
      </header>

      {error && <div className="fund-banner fund-banner--error">{error}</div>}
      {toast && <div className="fund-banner fund-banner--ok">{toast}</div>}

      <div className="fund-layout">
        <nav className="fund-nav">
          {NAV_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`fund-nav__item${section === s.id ? ' fund-nav__item--active' : ''}`}
              onClick={() => setSection(s.id)}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </nav>

        <main className="fund-main">
          {section === 'overview' && (
            <section className="fund-section">
              <div className="fund-section-head">
                <h2>Funding Overview</h2>
              </div>
              <div className="fund-kpi-grid">
                <Kpi label="Amount sought" value={formatMoney(amount)} accent="accent" />
                <Kpi label="Status" value={<StageBadge stage={workflow} />} />
                <Kpi
                  label="Deadline"
                  value={
                    config.deadline
                      ? `${new Date(config.deadline).toLocaleDateString()}${deadlineDays != null ? ` (${deadlineDays}d)` : ''}`
                      : 'Not set'
                  }
                  accent={deadlineDays != null && deadlineDays < 14 ? 'warn' : undefined}
                />
                <Kpi label="Match score" value={`${insights.matchScore}%`} accent="good" />
              </div>
              <form
                className="fund-form"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  void persist();
                }}
              >
                <div className="fund-form__row">
                  <label>
                    Title
                    <input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </label>
                  <label>
                    Organization / Program
                    <input
                      value={config.organization}
                      onChange={(e) => setConfig({ ...config, organization: e.target.value })}
                    />
                  </label>
                </div>
                <div className="fund-form__row">
                  <label>
                    Amount sought (USD)
                    <input
                      type="number"
                      min={0}
                      value={amount ?? ''}
                      onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : null)}
                    />
                  </label>
                  <label>
                    Application deadline
                    <input
                      type="date"
                      value={config.deadline?.slice(0, 10) ?? ''}
                      onChange={(e) => setConfig({ ...config, deadline: e.target.value })}
                    />
                  </label>
                </div>
                <div className="fund-form__row">
                  <label>
                    Opportunity type
                    <select
                      value={config.opportunity_type}
                      onChange={(e) =>
                        setConfig({ ...config, opportunity_type: e.target.value as OpportunityType })
                      }
                    >
                      <option value="grant">Grant</option>
                      <option value="vc">Venture Capital</option>
                      <option value="angel">Angel Investor</option>
                      <option value="accelerator">Accelerator</option>
                      <option value="investment_program">Investment Program</option>
                    </select>
                  </label>
                  <label>
                    Industry
                    <input
                      value={config.industry}
                      onChange={(e) => setConfig({ ...config, industry: e.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Description
                  <textarea
                    rows={4}
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  />
                </label>
                <label>
                  Application notes
                  <textarea
                    rows={3}
                    value={config.application_notes}
                    onChange={(e) => setConfig({ ...config, application_notes: e.target.value })}
                    placeholder="Internal notes on strategy, contacts, follow-ups…"
                  />
                </label>
              </form>
            </section>
          )}

          {section === 'requirements' && (
            <section className="fund-section">
              <div className="fund-section-head">
                <h2>Funding Requirements</h2>
                <span className="fund-pill">{reqPct}% complete</span>
              </div>
              <p className="fund-lead">
                Track funder-mandated deliverables. Complete each item before advancing to Submitted status.
              </p>
              <ul className="fund-checklist">
                {config.requirements.map((req, idx) => (
                  <li key={req.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={req.met}
                        onChange={(e) => {
                          const next = [...config.requirements];
                          next[idx] = { ...req, met: e.target.checked };
                          setConfig({ ...config, requirements: next });
                        }}
                      />
                      <span>{req.label}</span>
                    </label>
                    <input
                      className="fund-checklist__notes"
                      placeholder="Notes…"
                      value={req.notes ?? ''}
                      onChange={(e) => {
                        const next = [...config.requirements];
                        next[idx] = { ...req, notes: e.target.value };
                        setConfig({ ...config, requirements: next });
                      }}
                    />
                  </li>
                ))}
              </ul>
              <button type="button" className="fund-btn" onClick={() => void persist()}>
                Save requirements
              </button>
            </section>
          )}

          {section === 'eligibility' && (
            <section className="fund-section">
              <div className="fund-section-head">
                <h2>Eligibility Checker</h2>
              </div>
              <p className="fund-lead">
                Self-assess against program criteria. Required items must pass before a competitive submission.
              </p>
              <div className="fund-elig-score">
                <strong>
                  {config.eligibility_criteria.filter((c) => c.required && config.eligibility_checks[c.id]).length}
                  /{config.eligibility_criteria.filter((c) => c.required).length}
                </strong>
                <span>required criteria met</span>
              </div>
              <ul className="fund-checklist">
                {config.eligibility_criteria.map((crit) => {
                  const checked = config.eligibility_checks[crit.id] ?? false;
                  return (
                    <li key={crit.id} className={crit.required ? 'fund-checklist--required' : ''}>
                      <label>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              eligibility_checks: {
                                ...config.eligibility_checks,
                                [crit.id]: e.target.checked,
                              },
                            })
                          }
                        />
                        <span>
                          {crit.label}
                          {crit.required && <em className="fund-req-tag">Required</em>}
                        </span>
                      </label>
                      {crit.id === 'validation-score' && validation && (
                        <span className="fund-hint">Current: {validation.overall_score}/100</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                className="fund-btn fund-btn--ghost"
                onClick={() => {
                  const auto: Record<string, boolean> = { ...config.eligibility_checks };
                  if (validation && validation.overall_score >= 70) auto['validation-score'] = true;
                  if (project && (project.progress ?? 0) >= 40) auto['stage'] = true;
                  if (config.industry) auto['sector'] = true;
                  setConfig({ ...config, eligibility_checks: auto });
                }}
              >
                Auto-check from project data
              </button>
            </section>
          )}

          {section === 'tracker' && (
            <section className="fund-section">
              <div className="fund-section-head">
                <h2>Application Tracker</h2>
              </div>
              <div className="fund-stepper">
                {WORKFLOW_STAGES.map((stage, i) => {
                  const active = WORKFLOW_STAGES.indexOf(workflow) >= i;
                  const current = workflow === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      className={`fund-step${active ? ' fund-step--active' : ''}${current ? ' fund-step--current' : ''}`}
                      onClick={() => advanceWorkflow(stage)}
                      title={`Set status to ${stage}`}
                    >
                      <span className="fund-step__dot" style={{ borderColor: workflowColor(stage) }} />
                      <span className="fund-step__label">{stage}</span>
                    </button>
                  );
                })}
              </div>
              <h3 className="fund-subhead">Timeline</h3>
              <div className="fund-timeline">
                {config.application_timeline.map((ev) => (
                  <div key={ev.stage} className="fund-timeline__row">
                    <StageBadge stage={ev.stage} />
                    <input
                      type="date"
                      value={ev.date?.slice(0, 10) ?? ''}
                      onChange={(e) => {
                        const next = config.application_timeline.map((t) =>
                          t.stage === ev.stage ? { ...t, date: e.target.value } : t
                        );
                        setConfig({ ...config, application_timeline: next });
                      }}
                    />
                    <input
                      placeholder="Notes"
                      value={ev.notes ?? ''}
                      onChange={(e) => {
                        const next = config.application_timeline.map((t) =>
                          t.stage === ev.stage ? { ...t, notes: e.target.value } : t
                        );
                        setConfig({ ...config, application_timeline: next });
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="fund-actions">
                {workflow === 'Draft' && (
                  <button type="button" className="fund-btn" onClick={() => advanceWorkflow('Submitted')}>
                    Submit application
                  </button>
                )}
                <button type="button" className="fund-btn fund-btn--ghost" onClick={() => void persist()}>
                  Save tracker
                </button>
              </div>
            </section>
          )}

          {section === 'projects' && (
            <section className="fund-section">
              <div className="fund-section-head">
                <h2>Linked Projects</h2>
              </div>
              <label className="fund-select-label">
                Link project
                <select
                  value={row.project_id ?? ''}
                  onChange={(e) => void linkProject(e.target.value)}
                >
                  <option value="">— None —</option>
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              {project ? (
                <div className="fund-card">
                  <div className="fund-card__head">
                    <strong>{project.name}</strong>
                    <span className="fund-pill">{project.status ?? 'active'}</span>
                  </div>
                  <p>{project.description ?? 'No description'}</p>
                  <div className="fund-mini">
                    <div>
                      <span>Sector</span>
                      <strong>{project.sector ?? '—'}</strong>
                    </div>
                    <div>
                      <span>Progress</span>
                      <strong>{project.progress ?? 0}%</strong>
                    </div>
                  </div>
                  <div className="fund-actions">
                    <Link to={`/projects/${project.id}`} className="fund-link">
                      Open project →
                    </Link>
                    <Link to={`/validation?projectId=${project.id}`} className="fund-link">
                      Validation gate →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="fund-empty">
                  <p>No project linked. Connect a validated project to strengthen funding readiness.</p>
                  <Link to="/projects" className="fund-btn fund-btn--ghost">
                    Browse projects
                  </Link>
                </div>
              )}
              {validation && (
                <div className="fund-panel fund-panel--good">
                  <h3>Latest validation</h3>
                  <div className="fund-kpi-grid">
                    <Kpi label="Overall" value={`${validation.overall_score}/100`} accent="good" />
                    <Kpi label="Decision" value={validation.decision} />
                    <Kpi label="Market" value={validation.market_score} />
                    <Kpi label="Financial" value={validation.financial_score} />
                  </div>
                </div>
              )}
            </section>
          )}

          {section === 'documents' && (
            <section className="fund-section">
              <div className="fund-section-head">
                <h2>Required Documents</h2>
                <span className="fund-pill">{docPct}% ready</span>
              </div>
              <table className="fund-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Status</th>
                    <th>Project file</th>
                  </tr>
                </thead>
                <tbody>
                  {config.documents_required.map((doc, idx) => {
                    const match = projectDocs.find((d) =>
                      d.name.toLowerCase().includes(doc.name.split(' ')[0].toLowerCase())
                    );
                    return (
                      <tr key={doc.id}>
                        <td><strong>{doc.name}</strong></td>
                        <td>
                          <select
                            value={doc.status}
                            onChange={(e) => {
                              const next = [...config.documents_required];
                              next[idx] = { ...doc, status: e.target.value as DocStatus };
                              setConfig({ ...config, documents_required: next });
                            }}
                          >
                            <option value="missing">Missing</option>
                            <option value="draft">Draft</option>
                            <option value="ready">Ready</option>
                            <option value="submitted">Submitted</option>
                          </select>
                        </td>
                        <td>
                          {match ? (
                            <a href={match.file_url ?? '#'} target="_blank" rel="noreferrer" className="fund-link">
                              {match.name}
                            </a>
                          ) : (
                            <span className="fund-muted">Not in project vault</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {config.pitch_deck_url && (
                <p className="fund-lead">
                  Pitch deck:{' '}
                  <a href={config.pitch_deck_url} target="_blank" rel="noreferrer" className="fund-link">
                    View deck
                  </a>
                </p>
              )}
              <label>
                Pitch deck URL
                <input
                  value={config.pitch_deck_url}
                  onChange={(e) => setConfig({ ...config, pitch_deck_url: e.target.value })}
                  placeholder="https://…"
                />
              </label>
              <button type="button" className="fund-btn" onClick={() => void persist()}>
                Save documents
              </button>
            </section>
          )}

          {section === 'funder' && (
            <section className="fund-section">
              <div className="fund-section-head">
                <h2>Investor / Funder Profile</h2>
              </div>
              <div className="fund-form">
                <div className="fund-form__row">
                  <label>
                    Funder name
                    <input
                      value={config.funder_profile.name}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          funder_profile: { ...config.funder_profile, name: e.target.value },
                        })
                      }
                    />
                  </label>
                  <label>
                    Organization
                    <input
                      value={config.funder_profile.organization}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          funder_profile: { ...config.funder_profile, organization: e.target.value },
                        })
                      }
                    />
                  </label>
                </div>
                <div className="fund-form__row">
                  <label>
                    Type
                    <select
                      value={config.funder_profile.type}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          funder_profile: {
                            ...config.funder_profile,
                            type: e.target.value as OpportunityType,
                          },
                        })
                      }
                    >
                      <option value="grant">Grant</option>
                      <option value="vc">VC</option>
                      <option value="angel">Angel</option>
                      <option value="accelerator">Accelerator</option>
                      <option value="investment_program">Program</option>
                    </select>
                  </label>
                  <label>
                    Focus sectors (comma-separated)
                    <input
                      value={config.funder_profile.focus.join(', ')}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          funder_profile: {
                            ...config.funder_profile,
                            focus: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                    />
                  </label>
                </div>
                <div className="fund-form__row">
                  <label>
                    Min investment
                    <input
                      type="number"
                      value={config.funder_profile.min_investment ?? ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          funder_profile: {
                            ...config.funder_profile,
                            min_investment: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </label>
                  <label>
                    Max investment
                    <input
                      type="number"
                      value={config.funder_profile.max_investment ?? ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          funder_profile: {
                            ...config.funder_profile,
                            max_investment: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </label>
                </div>
                <div className="fund-form__row">
                  <label>
                    Website
                    <input
                      value={config.funder_profile.website ?? ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          funder_profile: { ...config.funder_profile, website: e.target.value },
                        })
                      }
                    />
                  </label>
                  <label>
                    Contact email
                    <input
                      type="email"
                      value={config.funder_profile.contact_email ?? ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          funder_profile: { ...config.funder_profile, contact_email: e.target.value },
                        })
                      }
                    />
                  </label>
                </div>
                <label>
                  About the funder
                  <textarea
                    rows={4}
                    value={config.funder_profile.description ?? ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        funder_profile: { ...config.funder_profile, description: e.target.value },
                      })
                    }
                  />
                </label>
              </div>
              <button type="button" className="fund-btn" onClick={() => void persist()}>
                Save funder profile
              </button>
            </section>
          )}

          {section === 'analytics' && (
            <section className="fund-section">
              <div className="fund-section-head">
                <h2>Funding Analytics</h2>
              </div>
              <div className="fund-kpi-grid">
                <Kpi label="Match score" value={`${insights.matchScore}%`} accent="accent" />
                <Kpi label="Requirements" value={`${reqPct}%`} />
                <Kpi label="Documents" value={`${docPct}%`} />
                <Kpi
                  label="Validation"
                  value={validation ? `${validation.overall_score}%` : 'N/A'}
                  accent={validation && validation.overall_score >= 70 ? 'good' : 'warn'}
                />
              </div>
              <div className="fund-bars">
                {[
                  { label: 'Requirements', pct: reqPct },
                  { label: 'Eligibility', pct: Math.round(insights.matchScore * 0.9) },
                  { label: 'Documents', pct: docPct },
                  { label: 'Pipeline', pct: Math.round(((WORKFLOW_STAGES.indexOf(workflow) + 1) / WORKFLOW_STAGES.length) * 100) },
                ].map((bar) => (
                  <div key={bar.label} className="fund-bar-row">
                    <span>{bar.label}</span>
                    <div className="fund-bar">
                      <div style={{ width: `${bar.pct}%` }} />
                    </div>
                    <strong>{bar.pct}%</strong>
                  </div>
                ))}
              </div>
              <div className="fund-split">
                <div className="fund-panel">
                  <h3>Risk indicators</h3>
                  <ul className="fund-list">
                    {insights.risks.length ? insights.risks.map((r) => <li key={r}>{r}</li>) : <li className="fund-muted">No critical risks detected</li>}
                  </ul>
                </div>
                <div className="fund-panel">
                  <h3>Improvement actions</h3>
                  <ul className="fund-list">
                    {insights.recommendations.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {section === 'integrations' && (
            <section className="fund-section">
              <div className="fund-section-head">
                <h2>Lifecycle Integrations</h2>
              </div>
              <p className="fund-lead">
                Funding sits between Validation and Commercialization. Jump to connected modules for evidence,
                documents, and go-to-market planning.
              </p>
              <div className="fund-cards">
                {INTEGRATIONS.map((int) => (
                  <Link key={int.id} to={int.route} className="fund-card fund-card--link">
                    <span className="fund-card__icon">{int.icon}</span>
                    <strong>{int.label}</strong>
                    <span className="fund-muted">Open module →</span>
                  </Link>
                ))}
              </div>
              {project && (
                <div className="fund-panel">
                  <h3>Project shortcuts</h3>
                  <div className="fund-actions">
                    <Link to={`/projects/${project.id}`} className="fund-link">Project detail</Link>
                    <Link to={`/experiments?projectId=${project.id}`} className="fund-link">Experiments</Link>
                    <Link to={`/commercialization?projectId=${project.id}`} className="fund-link">Commercialization</Link>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>

        <aside className="fund-maya">
          <div className="fund-maya__head">
            <span>✨ MAYA</span>
            <small>Funding Intelligence</small>
          </div>
          <div className="fund-maya__score">
            <strong>{insights.matchScore}</strong>
            <span>Funding match score</span>
          </div>
          <p className="fund-maya__readiness">{insights.readiness}</p>
          <h4>Risks</h4>
          <ul className="fund-list fund-list--compact">
            {insights.risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <h4>Recommendations</h4>
          <ul className="fund-list fund-list--compact">
            {insights.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <h4>Investor matching</h4>
          <ul className="fund-list fund-list--compact">
            {insights.investorMatches.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <button
            type="button"
            className="fund-btn fund-btn--maya"
            onClick={() => void runMayaAnalysis()}
            disabled={mayaLoading}
          >
            {mayaLoading ? 'Analyzing…' : 'Run AI deep analysis'}
          </button>
          {mayaAiText && <div className="fund-maya__ai">{mayaAiText}</div>}
        </aside>
      </div>

      <style>{FUND_STYLES}</style>
    </div>
  );
}

/* ─── Styles ────────────────────────────────────────────────────────── */

const FUND_STYLES = `
  .fund-page {
    min-height: 100vh;
    padding: 1rem 1.25rem 3rem;
    max-width: 1560px;
    margin: 0 auto;
    color: #e8e8f0;
    background: linear-gradient(160deg, #0a0a0f 0%, #0f1020 45%, #12182a 100%);
  }
  .fund-spinner {
    width: 48px; height: 48px; margin: 20vh auto;
    border: 3px solid rgba(124,95,230,0.25); border-top-color: #7c5fe6;
    border-radius: 50%; animation: fund-spin 0.9s linear infinite;
  }
  @keyframes fund-spin { to { transform: rotate(360deg); } }
  .fund-back { color: #9b7ff0; text-decoration: none; font-size: 0.82rem; }
  .fund-header h1 {
    margin: 0.35rem 0 0.15rem; font-size: 1.65rem;
    background: linear-gradient(135deg, #fff, #2fd4ff);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .fund-header__sub { margin: 0; opacity: 0.62; font-size: 0.84rem; }
  .fund-header__top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; }
  .fund-header__actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
  .fund-lifecycle { display: flex; gap: 0.25rem; margin-top: 0.45rem; font-size: 0.62rem; opacity: 0.5; }
  .fund-lifecycle span::after { content: '→'; margin: 0 0.35rem; }
  .fund-lifecycle span:last-child::after { content: ''; }
  .fund-banner { padding: 0.65rem 0.85rem; border-radius: 10px; margin: 0.75rem 0; font-size: 0.84rem; }
  .fund-banner--error { background: rgba(252,129,129,0.15); border: 1px solid #fc8181; color: #fc8181; }
  .fund-banner--ok { background: rgba(104,211,145,0.12); border: 1px solid #68d391; color: #68d391; }
  .fund-layout { display: grid; grid-template-columns: 200px 1fr 270px; gap: 1rem; margin-top: 1rem; align-items: start; }
  @media (max-width: 1100px) { .fund-layout { grid-template-columns: 1fr; } .fund-maya { order: -1; } }
  .fund-nav { position: sticky; top: 0.75rem; display: flex; flex-direction: column; gap: 0.2rem; }
  .fund-nav__item {
    text-align: left; padding: 0.4rem 0.55rem; border: none; border-radius: 8px;
    background: transparent; color: rgba(255,255,255,0.62); font-size: 0.72rem; cursor: pointer;
  }
  .fund-nav__item--active { background: rgba(47,212,255,0.14); color: #2fd4ff; }
  .fund-section {
    background: rgba(0,0,0,0.32); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 1.1rem 1.2rem;
  }
  .fund-section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.5rem; }
  .fund-section h2 { margin: 0; font-size: 1.05rem; color: #2fd4ff; }
  .fund-subhead { margin: 1rem 0 0.5rem; font-size: 0.88rem; }
  .fund-lead { margin: 0 0 0.85rem; font-size: 0.84rem; opacity: 0.68; line-height: 1.5; }
  .fund-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.5rem; margin-bottom: 1rem; }
  .fund-kpi { background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.55rem 0.65rem; }
  .fund-kpi--accent { border-color: rgba(47,212,255,0.35); }
  .fund-kpi--good { border-color: rgba(104,211,145,0.35); }
  .fund-kpi--warn { border-color: rgba(252,129,129,0.35); }
  .fund-kpi span { display: block; font-size: 0.56rem; text-transform: uppercase; opacity: 0.5; }
  .fund-kpi strong { font-size: 1rem; color: #2fd4ff; }
  .fund-kpi--good strong { color: #68d391; }
  .fund-kpi--warn strong { color: #fc8181; }
  .fund-form label { display: block; font-size: 0.72rem; margin-bottom: 0.65rem; opacity: 0.85; }
  .fund-form input, .fund-form textarea, .fund-form select, .fund-select-label select, .fund-table select {
    display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.65rem;
    border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.35); color: #fff; font-size: 0.84rem;
  }
  .fund-form__row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  @media (max-width: 700px) { .fund-form__row { grid-template-columns: 1fr; } }
  .fund-btn {
    padding: 0.45rem 0.9rem; border-radius: 8px; border: none; cursor: pointer; font-size: 0.8rem; font-weight: 600;
    background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a;
  }
  .fund-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .fund-btn--ghost { background: rgba(255,255,255,0.08); color: #fff; font-weight: 500; text-decoration: none; display: inline-block; }
  .fund-btn--maya { width: 100%; margin-top: 0.5rem; }
  .fund-stage { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; padding: 0.15rem 0.45rem; border-radius: 6px; white-space: nowrap; }
  .fund-pill { font-size: 0.68rem; padding: 0.2rem 0.55rem; border-radius: 20px; background: rgba(47,212,255,0.12); color: #2fd4ff; }
  .fund-checklist { list-style: none; padding: 0; margin: 0 0 1rem; }
  .fund-checklist li { padding: 0.55rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .fund-checklist label { display: flex; align-items: flex-start; gap: 0.5rem; cursor: pointer; font-size: 0.84rem; }
  .fund-checklist__notes { margin-top: 0.35rem; margin-left: 1.5rem; width: calc(100% - 1.5rem); padding: 0.35rem 0.5rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.25); color: #fff; font-size: 0.78rem; }
  .fund-req-tag { margin-left: 0.35rem; font-size: 0.6rem; color: #f6c90e; font-style: normal; }
  .fund-hint { display: block; margin-left: 1.5rem; font-size: 0.72rem; opacity: 0.55; }
  .fund-elig-score { text-align: center; padding: 0.75rem; margin-bottom: 1rem; background: rgba(47,212,255,0.08); border-radius: 10px; }
  .fund-elig-score strong { display: block; font-size: 1.6rem; color: #2fd4ff; }
  .fund-stepper { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1rem; }
  .fund-step { flex: 1; min-width: 90px; padding: 0.5rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; background: rgba(0,0,0,0.2); cursor: pointer; color: rgba(255,255,255,0.5); }
  .fund-step--active { border-color: rgba(47,212,255,0.35); color: #fff; }
  .fund-step--current { background: rgba(47,212,255,0.1); }
  .fund-step__dot { display: block; width: 8px; height: 8px; border-radius: 50%; border: 2px solid; margin-bottom: 0.25rem; }
  .fund-step__label { font-size: 0.62rem; font-weight: 600; }
  .fund-timeline { display: flex; flex-direction: column; gap: 0.45rem; }
  .fund-timeline__row { display: grid; grid-template-columns: 120px 130px 1fr; gap: 0.45rem; align-items: center; }
  @media (max-width: 700px) { .fund-timeline__row { grid-template-columns: 1fr; } }
  .fund-timeline input { padding: 0.35rem 0.5rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: #fff; font-size: 0.78rem; }
  .fund-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
  .fund-card { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.85rem; margin-top: 0.75rem; }
  .fund-card--link { text-decoration: none; color: inherit; display: block; transition: border-color 0.15s; }
  .fund-card--link:hover { border-color: rgba(47,212,255,0.35); }
  .fund-card__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
  .fund-card__icon { font-size: 1.4rem; display: block; margin-bottom: 0.35rem; }
  .fund-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.65rem; }
  .fund-mini { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0.5rem 0; font-size: 0.78rem; }
  .fund-mini span { display: block; opacity: 0.5; font-size: 0.62rem; text-transform: uppercase; }
  .fund-panel { background: rgba(0,0,0,0.22); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 0.85rem; margin-top: 0.75rem; }
  .fund-panel--good { border-color: rgba(104,211,145,0.25); }
  .fund-panel h3 { margin: 0 0 0.5rem; font-size: 0.88rem; }
  .fund-empty { text-align: center; padding: 1.5rem; background: rgba(0,0,0,0.2); border-radius: 10px; margin-top: 0.75rem; }
  .fund-empty p { opacity: 0.7; margin-bottom: 0.75rem; }
  .fund-link { color: #9b7ff0; text-decoration: none; font-size: 0.8rem; }
  .fund-link:hover { text-decoration: underline; }
  .fund-muted { opacity: 0.5; font-size: 0.78rem; }
  .fund-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 0.75rem; }
  .fund-table th, .fund-table td { padding: 0.5rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .fund-table th { font-size: 0.65rem; text-transform: uppercase; opacity: 0.5; }
  .fund-split { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.75rem; }
  @media (max-width: 800px) { .fund-split { grid-template-columns: 1fr; } }
  .fund-bars { margin: 0.75rem 0; }
  .fund-bar-row { display: grid; grid-template-columns: 100px 1fr 36px; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; font-size: 0.76rem; }
  .fund-bar { height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
  .fund-bar div { height: 100%; background: linear-gradient(90deg, #7c5fe6, #2fd4ff); border-radius: 4px; }
  .fund-list { margin: 0; padding-left: 1.1rem; font-size: 0.78rem; line-height: 1.45; opacity: 0.88; }
  .fund-list--compact { padding-left: 1rem; margin-bottom: 0.65rem; }
  .fund-list li { margin-bottom: 0.3rem; }
  .fund-maya {
    position: sticky; top: 0.75rem;
    background: rgba(0,0,0,0.38); border: 1px solid rgba(155,127,240,0.25);
    border-radius: 14px; padding: 1rem; max-height: calc(100vh - 1.5rem); overflow-y: auto;
  }
  .fund-maya__head span { font-weight: 700; color: #9b7ff0; }
  .fund-maya__head small { display: block; opacity: 0.5; font-size: 0.68rem; }
  .fund-maya__score { text-align: center; margin: 0.75rem 0; }
  .fund-maya__score strong { display: block; font-size: 2.2rem; color: #2fd4ff; line-height: 1; }
  .fund-maya__score span { font-size: 0.68rem; opacity: 0.55; text-transform: uppercase; }
  .fund-maya__readiness { font-size: 0.78rem; opacity: 0.8; line-height: 1.45; margin-bottom: 0.75rem; }
  .fund-maya h4 { margin: 0.5rem 0 0.25rem; font-size: 0.72rem; text-transform: uppercase; opacity: 0.55; letter-spacing: 0.04em; }
  .fund-maya__ai { margin-top: 0.75rem; padding: 0.65rem; background: rgba(0,0,0,0.3); border-radius: 8px; font-size: 0.76rem; line-height: 1.5; white-space: pre-wrap; max-height: 220px; overflow-y: auto; }
  .fund-select-label { display: block; font-size: 0.72rem; margin-bottom: 0.75rem; }
`;
