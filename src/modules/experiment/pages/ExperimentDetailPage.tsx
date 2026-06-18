import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { useAuth } from '../../../hooks/useAuth';
import {
  PIPELINE_STAGES,
  type ExperimentConfig,
  type ExperimentRecord,
  type PipelineStage,
  buildExperimentDetailMaya,
  computeExperimentConfidence,
  formatExperimentTimeAgo,
  getExperimentPipelineStage,
  normalizeExperimentRow,
} from '../../../lib/experiment/experimentOps';
import { fetchProjectsByIds } from '../../../lib/experiment/experimentOps.service';
import { EXP_DETAIL_STYLES, EXP_STYLES } from '../components/expStyles';

const NAV = [
  { id: 'overview', label: 'Overview', group: 'Workspace' },
  { id: 'hypothesis', label: 'Hypothesis', group: 'Science' },
  { id: 'design', label: 'Test Design', group: 'Science' },
  { id: 'data', label: 'Data Collection', group: 'Evidence' },
  { id: 'results', label: 'Results Analysis', group: 'Evidence' },
  { id: 'integrations', label: 'Integrations', group: 'Platform' },
] as const;

type ViewId = (typeof NAV)[number]['id'];

interface EditState {
  title: string;
  hypothesis: string;
  type: string;
  status: string;
  results: string;
  config: ExperimentConfig;
}

function stageIndex(stage: PipelineStage): number {
  return PIPELINE_STAGES.indexOf(stage);
}

function stageClass(stage: PipelineStage): string {
  return `exp-stage exp-stage--${stage.toLowerCase().replace(/\s+/g, '-')}`;
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const shared = {
    value,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    placeholder,
    className: 'expd-field__input',
  };
  return (
    <label className="expd-field">
      <span>{label}</span>
      {multiline ? <textarea rows={4} {...shared} /> : <input type="text" {...shared} />}
    </label>
  );
}

function PipelineStepper({ stage }: { stage: PipelineStage }) {
  const current = stageIndex(stage);
  return (
    <div className="expd-stepper" aria-label="Experiment pipeline progress">
      {PIPELINE_STAGES.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={s}
            className={`expd-step ${done ? 'expd-step--done' : ''} ${active ? 'expd-step--active' : ''}`}
          >
            <div className="expd-step__dot">{done ? '✓' : i + 1}</div>
            <span>{s}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ExperimentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewId>('overview');
  const [record, setRecord] = useState<ExperimentRecord | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    if (!id || !user) return;
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !data) {
      setError(fetchError?.message ?? 'Experiment not found');
      navigate('/experiments');
      return;
    }

    const row = data as Record<string, unknown>;
    let project: { name?: string; sector?: string } | null = null;
    if (row.project_id) {
      const projectMap = await fetchProjectsByIds([String(row.project_id)]);
      project = projectMap[String(row.project_id)] ?? null;
    }

    const normalized = normalizeExperimentRow(row, project);
    setRecord(normalized);
    setEdit({
      title: normalized.title,
      hypothesis: normalized.hypothesis,
      type: normalized.type,
      status: normalized.status,
      results: normalized.results ?? '',
      config: { ...normalized.config },
    });
    setDirty(false);
    setLoading(false);
  }, [id, user, navigate]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    load();
  }, [authLoading, user, load, navigate]);

  const patch = useCallback((partial: Partial<EditState> & { config?: Partial<ExperimentConfig> }) => {
    setEdit((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      if (partial.config) {
        next.config = { ...prev.config, ...partial.config };
      }
      return next;
    });
    setDirty(true);
  }, []);

  const derived = useMemo(() => {
    if (!edit) return null;
    const confidenceScore = computeExperimentConfidence({
      status: edit.status,
      results: edit.results || null,
      config: edit.config,
    });
    const pipelineStage = getExperimentPipelineStage(
      edit.status,
      edit.results || null,
      edit.config,
      confidenceScore
    );
    return { confidenceScore, pipelineStage, validationReady: pipelineStage === 'Validation Ready' };
  }, [edit]);

  const maya = useMemo(() => {
    if (!record || !edit || !derived) return null;
    const snapshot: ExperimentRecord = {
      ...record,
      title: edit.title,
      hypothesis: edit.hypothesis,
      type: edit.type,
      status: edit.status,
      results: edit.results || null,
      config: edit.config,
      confidenceScore: derived.confidenceScore,
      pipelineStage: derived.pipelineStage,
      validationReady: derived.validationReady,
    };
    return buildExperimentDetailMaya(snapshot);
  }, [record, edit, derived]);

  const save = async () => {
    if (!id || !edit) return;
    setSaving(true);
    setError(null);
    const auditEntry = {
      at: new Date().toISOString(),
      action: 'Updated experiment fields',
    };
    const configWithAudit = {
      ...edit.config,
      audit_log: [...(edit.config.audit_log ?? []), auditEntry],
      version: (edit.config.version ?? 1) + 1,
    };
    const findings = JSON.stringify(configWithAudit);
    const { error: updateError } = await supabase
      .from('experiments')
      .update({
        title: edit.title.trim() || 'Untitled experiment',
        hypothesis: edit.hypothesis,
        type: edit.type,
        status: edit.status,
        results: edit.results.trim() || null,
        findings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    setDirty(false);
    setSaving(false);
    await load();
  };

  const setStatus = async (status: string, configPatch?: Partial<ExperimentConfig>) => {
    if (configPatch) patch({ status, config: configPatch });
    else patch({ status });
    if (!id || !edit) return;
    setSaving(true);
    const nextConfig = configPatch ? { ...edit.config, ...configPatch } : edit.config;
    const { error: updateError } = await supabase
      .from('experiments')
      .update({
        status,
        findings: JSON.stringify(nextConfig),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await load();
  };

  const handleDelete = async () => {
    if (!id || !record) return;
    if (!window.confirm(`Delete "${record.title}"? This cannot be undone.`)) return;
    const { error: deleteError } = await supabase.from('experiments').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    navigate('/experiments');
  };

  const navGroups = useMemo(() => {
    const groups = new Map<string, (typeof NAV)[number][]>();
    for (const item of NAV) {
      const list = groups.get(item.group) ?? [];
      list.push(item);
      groups.set(item.group, list);
    }
    return [...groups.entries()];
  }, []);

  if (loading || !edit || !record || !derived || !maya) {
    return (
      <div className="exp-page">
        <div className="exp-loading" aria-label="Loading experiment" />
        <style>{EXP_STYLES}{EXP_DETAIL_STYLES}</style>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'overview':
        return (
          <>
            <div className="exp-section-head">
              <h2>Experiment overview</h2>
              <span className={stageClass(derived.pipelineStage)}>{derived.pipelineStage}</span>
            </div>
            <PipelineStepper stage={derived.pipelineStage} />
            <div className="exp-kpi-grid">
              <div className="exp-kpi exp-kpi--accent">
                <span>Confidence</span>
                <strong>{derived.confidenceScore}%</strong>
              </div>
              <div className="exp-kpi">
                <span>Evidence quality</span>
                <strong>{record.evidenceQuality}%</strong>
              </div>
              <div className="exp-kpi">
                <span>Data quality</span>
                <strong>{record.dataQuality}%</strong>
              </div>
              <div className="exp-kpi">
                <span>Status</span>
                <strong>{edit.status}</strong>
              </div>
              <div className="exp-kpi">
                <span>Category</span>
                <strong>{edit.config.category ?? edit.type}</strong>
              </div>
              <div className="exp-kpi">
                <span>Updated</span>
                <strong>{formatExperimentTimeAgo(record.updated_at)}</strong>
              </div>
            </div>
            <div className="exp-split">
              <div className="exp-panel">
                <h3>Project context</h3>
                {record.project_name ? (
                  <>
                    <p>
                      <Link to={`/projects/${record.project_id}`} className="exp-link">
                        {record.project_name}
                      </Link>
                    </p>
                    {record.project_sector && (
                      <span className="exp-muted">Sector: {record.project_sector}</span>
                    )}
                  </>
                ) : (
                  <p className="exp-muted">No project linked</p>
                )}
              </div>
              <div className="exp-panel">
                <h3>Schedule</h3>
                <div className="exp-mini">
                  <div>
                    <span>Start</span>
                    <strong>{edit.config.start_date || '—'}</strong>
                  </div>
                  <div>
                    <span>End</span>
                    <strong>{edit.config.end_date || '—'}</strong>
                  </div>
                </div>
              </div>
            </div>
            <Field
              label="Title"
              value={edit.title}
              onChange={(v) => patch({ title: v })}
            />
            {edit.config.description && (
              <div className="exp-panel" style={{ marginTop: '0.75rem' }}>
                <h3>Description</h3>
                <p>{edit.config.description}</p>
              </div>
            )}
          </>
        );
      case 'hypothesis':
        return (
          <>
            <div className="exp-section-head">
              <h2>Hypothesis Lab</h2>
            </div>
            <p className="exp-lead">
              State the testable claim and assumptions that drive this experiment.
            </p>
            <Field
              label="Hypothesis"
              value={edit.hypothesis}
              onChange={(v) => patch({ hypothesis: v })}
              multiline
              placeholder="If we [change], then [outcome], because [rationale]."
            />
            <Field
              label="Objectives"
              value={edit.config.objectives ?? ''}
              onChange={(v) => patch({ config: { objectives: v } })}
              multiline
            />
            <Field
              label="Assumptions"
              value={edit.config.assumptions ?? ''}
              onChange={(v) => patch({ config: { assumptions: v } })}
              multiline
            />
            <Field
              label="Secondary hypotheses"
              value={edit.config.secondary_hypotheses ?? ''}
              onChange={(v) => patch({ config: { secondary_hypotheses: v } })}
              multiline
            />
            <Field
              label="Failure criteria"
              value={edit.config.failure_criteria ?? ''}
              onChange={(v) => patch({ config: { failure_criteria: v } })}
              multiline
            />
          </>
        );
      case 'design':
        return (
          <>
            <div className="exp-section-head">
              <h2>Test Design</h2>
            </div>
            <p className="exp-lead">
              Define variables, success criteria, and protocol attachments.
            </p>
            <div className="exp-split">
              <Field
                label="Independent variables"
                value={edit.config.independent_variables ?? ''}
                onChange={(v) => patch({ config: { independent_variables: v } })}
                multiline
              />
              <Field
                label="Dependent variables"
                value={edit.config.dependent_variables ?? ''}
                onChange={(v) => patch({ config: { dependent_variables: v } })}
                multiline
              />
            </div>
            <Field
              label="Expected outcomes"
              value={edit.config.expected_outcomes ?? ''}
              onChange={(v) => patch({ config: { expected_outcomes: v } })}
              multiline
            />
            <Field
              label="Methodology"
              value={edit.config.methodology ?? ''}
              onChange={(v) => patch({ config: { methodology: v } })}
              multiline
            />
            <div className="exp-split">
              <Field
                label="Constraints"
                value={edit.config.constraints ?? ''}
                onChange={(v) => patch({ config: { constraints: v } })}
                multiline
              />
              <Field
                label="Resources"
                value={edit.config.resources ?? ''}
                onChange={(v) => patch({ config: { resources: v } })}
                multiline
              />
            </div>
            <Field
              label="Risks"
              value={edit.config.risks ?? ''}
              onChange={(v) => patch({ config: { risks: v } })}
              multiline
            />
            <Field
              label="Success criteria"
              value={edit.config.success_criteria ?? ''}
              onChange={(v) => patch({ config: { success_criteria: v } })}
              multiline
            />
            <Field
              label="Attachment notes"
              value={edit.config.attachment_notes ?? ''}
              onChange={(v) => patch({ config: { attachment_notes: v } })}
              multiline
            />
            {edit.config.prototype_id && (
              <p style={{ marginTop: '0.75rem' }}>
                Linked prototype:{' '}
                <Link to={`/prototypes/${edit.config.prototype_id}`} className="exp-link">
                  View prototype
                </Link>
              </p>
            )}
            {edit.config.document_ids && edit.config.document_ids.length > 0 && (
              <p className="exp-muted">
                {edit.config.document_ids.length} document(s) attached in create flow
              </p>
            )}
          </>
        );
      case 'data':
        return (
          <>
            <div className="exp-section-head">
              <h2>Data Collection</h2>
            </div>
            <p className="exp-lead">Record observations and metrics during the test run.</p>
            <Field
              label="Observations"
              value={edit.config.observations ?? ''}
              onChange={(v) => patch({ config: { observations: v } })}
              multiline
              placeholder="Qualitative notes, session logs, participant feedback…"
            />
            <Field
              label="Success criteria"
              value={edit.config.success_criteria ?? ''}
              onChange={(v) => patch({ config: { success_criteria: v } })}
              multiline
            />
            <Field
              label="Metrics"
              value={edit.config.metrics ?? ''}
              onChange={(v) => patch({ config: { metrics: v } })}
              multiline
              placeholder="KPI values, sample sizes, significance thresholds…"
            />
            <Field
              label="CSV imports"
              value={edit.config.csv_imports ?? ''}
              onChange={(v) => patch({ config: { csv_imports: v } })}
              multiline
              placeholder="Imported dataset references or notes…"
            />
          </>
        );
      case 'results':
        return (
          <>
            <div className="exp-section-head">
              <h2>Results Analysis</h2>
            </div>
            <p className="exp-lead">Compare actual outcomes against success criteria.</p>
            <Field
              label="Actual results"
              value={edit.config.actual_results ?? edit.results}
              onChange={(v) => patch({ results: v, config: { actual_results: v } })}
              multiline
            />
            <Field
              label="Key findings"
              value={edit.config.key_findings ?? ''}
              onChange={(v) => patch({ config: { key_findings: v } })}
              multiline
            />
            {edit.config.success_criteria && (
              <div className="exp-panel" style={{ marginTop: '0.75rem' }}>
                <h3>Success criteria (reference)</h3>
                <p>{edit.config.success_criteria}</p>
              </div>
            )}
          </>
        );
      case 'integrations':
        return (
          <>
            <div className="exp-section-head">
              <h2>Lifecycle Integrations</h2>
            </div>
            <div className="exp-links-grid">
              {(
                [
                  {
                    label: 'Operations Center',
                    to: '/experiments',
                    desc: 'Portfolio pipeline and registry',
                  },
                  record.project_id
                    ? {
                        label: 'Project',
                        to: `/projects/${record.project_id}`,
                        desc: record.project_name ?? 'Parent innovation project',
                      }
                    : null,
                  edit.config.prototype_id
                    ? {
                        label: 'Prototype',
                        to: `/prototypes/${edit.config.prototype_id}`,
                        desc: 'Artifact under test',
                      }
                    : null,
                  {
                    label: 'Validation Gate',
                    to: '/validation/new',
                    desc: 'Submit evidence after analysis',
                  },
                  {
                    label: 'Documents',
                    to: record.project_id
                      ? `/documents?projectId=${record.project_id}`
                      : '/documents',
                    desc: 'Protocols and datasets',
                  },
                  { label: 'Enterprise', to: '/enterprise', desc: 'Org-wide experiment analytics' },
                ] as Array<{ label: string; to: string; desc: string } | null>
              )
                .filter((l): l is { label: string; to: string; desc: string } => l !== null)
                .map((l) => (
                  <Link key={l.to} to={l.to} className="exp-link-card">
                    <strong>{l.label}</strong>
                    <span>{l.desc}</span>
                  </Link>
                ))}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const statusActions: { label: string; status: string; config?: Partial<ExperimentConfig>; show: boolean }[] = [
    { label: 'Mark planned', status: 'planned', show: edit.status === 'draft' },
    {
      label: 'Approve test',
      status: 'approved',
      config: { approved: true },
      show: ['draft', 'planned'].includes(edit.status),
    },
    {
      label: 'Start running',
      status: 'active',
      show: ['draft', 'planned', 'approved'].includes(edit.status),
    },
    {
      label: 'Complete test',
      status: 'completed',
      show: ['active', 'running', 'in_progress'].includes(edit.status),
    },
    {
      label: 'Mark reviewed',
      status: edit.status,
      config: { results_reviewed: true },
      show: ['completed', 'done', 'analyzed'].includes(edit.status) && !edit.config.results_reviewed,
    },
    {
      label: 'Approve evidence',
      status: edit.status,
      config: { evidence_approved: true },
      show: Boolean(edit.config.results_reviewed) && !edit.config.evidence_approved,
    },
    {
      label: 'Mark failed',
      status: 'failed',
      show: !['completed', 'failed', 'archived'].includes(edit.status),
    },
  ];

  return (
    <div className="exp-page">
      <header className="exp-header">
        <div className="exp-header__top">
          <div>
            <Link to="/experiments" className="exp-back">
              ← Experiment Operations
            </Link>
            <h1>{edit.title || 'Experiment workspace'}</h1>
            <p className="exp-header__sub">
              {record.project_name ? `${record.project_name} · ` : ''}
              {derived.pipelineStage} · {derived.confidenceScore}% confidence
            </p>
          </div>
          <div className="exp-header__actions">
            <Link to={`/experiments/${id}/edit`} className="exp-btn exp-btn--ghost">
              Full editor
            </Link>
            {statusActions
              .filter((a) => a.show)
              .map((a) => (
                <button
                  key={`${a.label}-${a.status}`}
                  type="button"
                  className="exp-btn exp-btn--ghost"
                  disabled={saving}
                  onClick={() => setStatus(a.status, a.config)}
                >
                  {a.label}
                </button>
              ))}
            <button
              type="button"
              className="exp-btn exp-btn--ghost"
              disabled={saving || !dirty}
              onClick={() => save()}
            >
              {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
            </button>
            {derived.validationReady && (
              <Link to="/validation/new" className="exp-btn exp-btn--primary">
                → Validation gate
              </Link>
            )}
            <button
              type="button"
              className="exp-btn exp-btn--ghost"
              onClick={handleDelete}
              style={{ color: '#fc8181' }}
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      {error && <div className="exp-banner exp-banner--error">{error}</div>}

      <div className="exp-layout">
        <nav className="exp-nav" aria-label="Experiment sections">
          {navGroups.map(([group, items]) => (
            <div key={group} className="exp-nav__group">
              <span className="exp-nav__label">{group}</span>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`exp-nav__item ${view === item.id ? 'exp-nav__item--active' : ''}`}
                  onClick={() => setView(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main className="exp-main">
          <section className="exp-section">{renderView()}</section>
        </main>

        <aside className="exp-maya" aria-label="MAYA experiment advisor">
          <div className="exp-maya__head">
            <strong>MAYA Experiment AI</strong>
            <span>{derived.confidenceScore}%</span>
          </div>
          <p className="exp-maya__label">Confidence score</p>
          <div className="exp-maya__block">
            <label>Analysis</label>
            <ul>
              {maya.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          {maya.improvements.length > 0 && (
            <div className="exp-maya__block">
              <label>Improvements</label>
              <ul>
                {maya.improvements.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="exp-maya__action">{maya.nextAction}</p>
          <Link to="/experiments/create" className="exp-maya-btn exp-maya-btn--ghost">
            + New experiment
          </Link>
        </aside>
      </div>

      <style>{EXP_STYLES}{EXP_DETAIL_STYLES}</style>
    </div>
  );
}
