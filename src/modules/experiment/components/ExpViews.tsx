import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  EXPERIMENT_CATEGORIES,
  LIFECYCLE_STAGES,
  PIPELINE_STAGES,
  type ExperimentFilters,
  type ExperimentOpsSnapshot,
  type ExperimentRecord,
  computeExperimentIntelligence,
  computeResultsAnalytics,
  filterExperiments,
  validationGateStatus,
} from '../../../lib/experiment/experimentOps';
import {
  ExpExperimentTable,
  ExpKanban,
  ExpKpi,
  ExpPipelineBar,
  ExpSectionHead,
  ExpSimpleBarChart,
  ExpStageBadge,
} from './ExpPrimitives';

/* ─── Executive Dashboard ─────────────────────────────────────────────────── */

export function ExecutiveView({ data }: { data: ExperimentOpsSnapshot }) {
  const { metrics, maya } = data;
  return (
    <>
      <ExpSectionHead title="Experiment Operations Dashboard">
        <Link to="/experiments/create" className="exp-btn exp-btn--primary">
          + New experiment
        </Link>
      </ExpSectionHead>
      <p className="exp-lead">
        Evidence-generation engine for validation, funding, and commercialization —{' '}
        {metrics.total} experiment(s) across scientific, engineering, product, business, and market
        tests.
      </p>
      <div className="exp-lifecycle" aria-label="Innovation lifecycle">
        {LIFECYCLE_STAGES.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
      <div className="exp-kpi-grid">
        <ExpKpi label="Total" value={metrics.total} variant="accent" />
        <ExpKpi label="Active" value={metrics.active} />
        <ExpKpi label="Planned" value={metrics.planned} />
        <ExpKpi label="Completed" value={metrics.completed} />
        <ExpKpi label="Success rate" value={`${metrics.successRate}%`} variant="good" />
        <ExpKpi label="Failure rate" value={`${metrics.failureRate}%`} variant="warn" />
        <ExpKpi label="Validation ready" value={metrics.validationReady} variant="good" />
        <ExpKpi label="Avg confidence" value={`${metrics.avgConfidence}%`} variant="accent" />
        <ExpKpi label="Evidence quality" value={`${metrics.evidenceQuality}%`} />
        <ExpKpi label="Innovation readiness" value={`${metrics.innovationReadiness}%`} variant="accent" />
      </div>
      <div className="exp-split">
        <div className="exp-panel">
          <h3>Pipeline overview</h3>
          <ExpPipelineBar counts={data.pipelineCounts} />
        </div>
        <div className="exp-panel">
          <h3>Priority experiment</h3>
          {maya.priorityExperiment ? (
            <>
              <strong>{maya.priorityExperiment.title}</strong>
              <p>{maya.priorityAction}</p>
              <Link to={`/experiments/${maya.priorityExperiment.id}`} className="exp-link">
                Open experiment →
              </Link>
            </>
          ) : (
            <p className="exp-muted">No priority experiment assigned.</p>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Pipeline ───────────────────────────────────────────────────────────── */

export function PipelineView({ data }: { data: ExperimentOpsSnapshot }) {
  const bottlenecks = data.bottlenecks.filter((b) => b.severity !== 'low');
  return (
    <>
      <ExpSectionHead title="Experiment Pipeline" />
      <p className="exp-lead">
        Draft → Planned → Approved → Running → Data Collection → Analysis → Review → Validation
        Ready
      </p>
      <ExpKanban experiments={data.experiments} />
      <h3 className="exp-subhead">Stage distribution</h3>
      <ExpPipelineBar counts={data.pipelineCounts} />
      <h3 className="exp-subhead">Stage conversion</h3>
      <div className="exp-mini-stats">
        {PIPELINE_STAGES.slice(0, -1).map((stage, i) => {
          const from = data.pipelineCounts[stage];
          const to = data.pipelineCounts[PIPELINE_STAGES[i + 1]];
          const rate = from > 0 ? Math.round((to / from) * 100) : 0;
          return (
            <div key={stage}>
              <span>
                {stage} → {PIPELINE_STAGES[i + 1]}
              </span>
              <strong>{rate}%</strong>
            </div>
          );
        })}
      </div>
      {bottlenecks.length > 0 && (
        <>
          <h3 className="exp-subhead">Bottlenecks & delays</h3>
          {bottlenecks.map((b) => (
            <div key={b.stage} className={`exp-bottleneck exp-bottleneck--${b.severity}`}>
              <strong>{b.stage}</strong> — {b.count} experiment(s), {b.stalledCount} stalled ≥
              7 days, avg {b.avgDaysStalled}d in stage
            </div>
          ))}
        </>
      )}
    </>
  );
}

/* ─── Registry ───────────────────────────────────────────────────────────── */

export function RegistryView({
  data,
  filters,
  onExport,
}: {
  data: ExperimentOpsSnapshot;
  filters: ExperimentFilters;
  onExport: () => void;
}) {
  const filtered = useMemo(() => filterExperiments(data.experiments, filters), [data.experiments, filters]);

  return (
    <>
      <ExpSectionHead title="Experiment Registry">
        <div className="exp-actions">
          <button type="button" className="exp-btn exp-btn--ghost" onClick={onExport}>
            Export CSV
          </button>
          <Link to="/experiments/create" className="exp-btn exp-btn--primary">
            + Create
          </Link>
        </div>
      </ExpSectionHead>
      <p className="exp-muted" style={{ marginBottom: '0.5rem' }}>
        {filtered.length} of {data.experiments.length} experiments
      </p>
      <ExpExperimentTable rows={filtered} showPrototype />
    </>
  );
}

/* ─── Hypothesis Engine ──────────────────────────────────────────────────── */

export function HypothesisView({ data }: { data: ExperimentOpsSnapshot }) {
  return (
    <>
      <ExpSectionHead title="Hypothesis Engine" />
      <p className="exp-lead">
        Primary and secondary hypotheses, assumptions, expected outcomes, success and failure
        criteria.
      </p>
      <div className="exp-cards">
        {data.experiments.map((e) => (
          <article key={e.id} className="exp-card">
            <div className="exp-card__head">
              <strong>{e.title}</strong>
              <ExpStageBadge stage={e.pipelineStage} />
            </div>
            <label>Primary hypothesis</label>
            <p className="exp-hypothesis">{e.hypothesis || 'No hypothesis recorded.'}</p>
            {e.config.secondary_hypotheses && (
              <div>
                <label>Secondary hypotheses</label>
                <p>{e.config.secondary_hypotheses}</p>
              </div>
            )}
            {e.config.assumptions && (
              <div>
                <label>Assumptions</label>
                <p>{e.config.assumptions}</p>
              </div>
            )}
            {(e.config.expected_outcomes || e.config.success_criteria) && (
              <div>
                <label>Expected outcomes / success criteria</label>
                <p>{e.config.expected_outcomes || e.config.success_criteria}</p>
              </div>
            )}
            {e.config.failure_criteria && (
              <div>
                <label>Failure criteria</label>
                <p>{e.config.failure_criteria}</p>
              </div>
            )}
            <Link to={`/experiments/${e.id}`} className="exp-link">
              Edit experiment →
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}

/* ─── Design Center ──────────────────────────────────────────────────────── */

const CATEGORY_LABELS: Record<string, string> = {
  engineering: 'Engineering',
  scientific: 'Scientific',
  market: 'Market',
  product: 'Product',
  business: 'Business',
  structured: 'Structured',
};

export function DesignView({ data }: { data: ExperimentOpsSnapshot }) {
  return (
    <>
      <ExpSectionHead title="Experiment Design Center" />
      <p className="exp-lead">
        Objectives, methodology, variables, constraints, resources, risks, timeline, and team per
        experiment. Supports {EXPERIMENT_CATEGORIES.join(', ')} experiment types.
      </p>
      <div className="exp-table-wrap">
        <table className="exp-table">
          <thead>
            <tr>
              <th>Experiment</th>
              <th>Category</th>
              <th>Objectives</th>
              <th>Methodology</th>
              <th>Variables</th>
              <th>Risks</th>
              <th>Timeline</th>
              <th>Team</th>
            </tr>
          </thead>
          <tbody>
            {data.experiments.map((e) => (
              <tr key={e.id}>
                <td>
                  <strong>{e.title}</strong>
                  <Link to={`/experiments/${e.id}`} className="exp-link">
                    Open
                  </Link>
                </td>
                <td>{CATEGORY_LABELS[e.config.category ?? e.type] ?? e.type}</td>
                <td className="exp-cell">{e.config.objectives || '—'}</td>
                <td className="exp-cell">{e.config.methodology || '—'}</td>
                <td className="exp-cell">
                  {e.config.independent_variables || e.config.dependent_variables
                    ? `IV/DV defined`
                    : '—'}
                </td>
                <td className="exp-cell">{e.config.risks?.slice(0, 60) || '—'}</td>
                <td>
                  {e.config.start_date && e.config.end_date
                    ? `${e.config.start_date} → ${e.config.end_date}`
                    : '—'}
                </td>
                <td>
                  {e.config.team_member_ids?.length ?? 0} members ·{' '}
                  {e.config.document_ids?.length ?? 0} docs
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ─── Data Collection ─────────────────────────────────────────────────────── */

export function DataCollectionView({ data }: { data: ExperimentOpsSnapshot }) {
  return (
    <>
      <ExpSectionHead title="Data Collection Center" />
      <p className="exp-lead">
        Manual entry, documents, sensor readings, CSV imports — with data quality, completeness, and
        integrity tracking.
      </p>
      <div className="exp-cards">
        {data.experiments.map((e) => (
          <article key={e.id} className="exp-card">
            <div className="exp-card__head">
              <strong>{e.title}</strong>
              <ExpStageBadge stage={e.pipelineStage} />
            </div>
            <div className="exp-kpi-grid" style={{ marginBottom: '0.5rem' }}>
              <ExpKpi label="Data quality" value={`${e.dataQuality}%`} />
              <ExpKpi label="Completeness" value={`${e.dataCompleteness}%`} />
              <ExpKpi label="Integrity" value={e.dataQuality >= 50 ? 'OK' : 'Low'} variant={e.dataQuality >= 50 ? 'good' : 'warn'} />
            </div>
            <div className="exp-mini">
              <div>
                <span>Metrics / KPIs</span>
                <p>{e.config.metrics || 'Not defined'}</p>
              </div>
              <div>
                <span>Observations</span>
                <p>{e.config.observations || 'Pending'}</p>
              </div>
              <div>
                <span>Documents</span>
                <p>{e.config.document_ids?.length ?? 0} attached</p>
              </div>
              <div>
                <span>File uploads</span>
                <p>{e.config.file_uploads?.length ?? 0} files</p>
              </div>
              <div>
                <span>Sensor readings</span>
                <p>{e.config.sensor_readings || '—'}</p>
              </div>
              <div>
                <span>CSV imports</span>
                <p>{e.config.csv_imports || '—'}</p>
              </div>
            </div>
            <Link to={`/experiments/${e.id}`} className="exp-link">
              Record data →
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}

/* ─── Results Analytics ───────────────────────────────────────────────────── */

export function ResultsAnalyticsView({ data }: { data: ExperimentOpsSnapshot }) {
  const withResults = data.experiments.filter(
    (e) =>
      e.results ||
      e.config.observations ||
      ['Analysis', 'Review', 'Validation Ready'].includes(e.pipelineStage)
  );

  const trendLabels = PIPELINE_STAGES.filter((s) => data.pipelineCounts[s] > 0).map((s) =>
    s.slice(0, 6)
  );
  const trendValues = PIPELINE_STAGES.filter((s) => data.pipelineCounts[s] > 0).map(
    (s) => data.pipelineCounts[s]
  );

  return (
    <>
      <ExpSectionHead title="Results Analytics" />
      <p className="exp-lead">
        Expected vs actual outcomes, variance, confidence, statistical significance, and evidence
        strength.
      </p>
      {withResults.length === 0 ? (
        <div className="exp-empty">
          <p>No analyzed results yet. Complete running experiments and record outcomes.</p>
        </div>
      ) : (
        <>
          <div className="exp-chart-row">
            <ExpSimpleBarChart
              title="Pipeline distribution"
              labels={trendLabels}
              values={trendValues}
            />
            <ExpSimpleBarChart
              title="Avg confidence by stage"
              labels={trendLabels}
              values={PIPELINE_STAGES.filter((s) => data.pipelineCounts[s] > 0).map((stage) => {
                const subset = data.experiments.filter((e) => e.pipelineStage === stage);
                return subset.length
                  ? Math.round(subset.reduce((s, e) => s + e.confidenceScore, 0) / subset.length)
                  : 0;
              })}
            />
          </div>
          <div className="exp-cards" style={{ marginTop: '0.75rem' }}>
            {withResults.map((e) => {
              const ra = computeResultsAnalytics(e);
              return (
                <article key={e.id} className="exp-card">
                  <div className="exp-card__head">
                    <strong>{e.title}</strong>
                    <span>{ra.confidenceLevel}% · {ra.evidenceStrength}</span>
                  </div>
                  <div>
                    <label>Expected result</label>
                    <p>{ra.expected || '—'}</p>
                  </div>
                  <div>
                    <label>Actual result</label>
                    <p>{ra.actual || '—'}</p>
                  </div>
                  <div className="exp-mini">
                    <div>
                      <span>Variance</span>
                      <p>{ra.variance !== null ? `${ra.variance > 0 ? '+' : ''}${ra.variance}%` : '—'}</p>
                    </div>
                    <div>
                      <span>Significance</span>
                      <p>{ra.statisticalSignificance}</p>
                    </div>
                  </div>
                  {e.validationReady && (
                    <Link
                      to={`/validation/new?projectId=${e.project_id ?? ''}`}
                      className="exp-btn exp-btn--ghost"
                    >
                      Start validation →
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/* ─── Intelligence ───────────────────────────────────────────────────────── */

export function IntelligenceView({ data }: { data: ExperimentOpsSnapshot }) {
  return (
    <>
      <ExpSectionHead title="Experiment Intelligence" />
      <p className="exp-lead">
        Success probability, failure risk, root cause analysis, key findings, and strategic
        recommendations.
      </p>
      <div className="exp-cards">
        {data.experiments.map((e) => {
          const intel = computeExperimentIntelligence(e);
          return (
            <article key={e.id} className="exp-card">
              <div className="exp-card__head">
                <strong>{e.title}</strong>
                <span>{intel.successProbability}% success</span>
              </div>
              <div className="exp-mini">
                <div>
                  <span>Success probability</span>
                  <p>{intel.successProbability}%</p>
                </div>
                <div>
                  <span>Failure risk</span>
                  <p>{intel.failureRisk}%</p>
                </div>
              </div>
              {intel.rootCauses.length > 0 && (
                <div>
                  <label>Root cause analysis</label>
                  <ul style={{ margin: '0.2rem 0', paddingLeft: '1rem', opacity: 0.85 }}>
                    {intel.rootCauses.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {intel.keyFindings.length > 0 && (
                <div>
                  <label>Key findings</label>
                  <p>{intel.keyFindings.join(' · ')}</p>
                </div>
              )}
              {intel.strategicRecommendations.length > 0 && (
                <div>
                  <label>Strategic recommendations</label>
                  <ul style={{ margin: '0.2rem 0', paddingLeft: '1rem', opacity: 0.85 }}>
                    {intel.strategicRecommendations.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Link to={`/experiments/${e.id}`} className="exp-link">
                Open experiment →
              </Link>
            </article>
          );
        })}
      </div>
    </>
  );
}

/* ─── Prototype Integration ──────────────────────────────────────────────── */

export function PrototypeIntegrationView({ data }: { data: ExperimentOpsSnapshot }) {
  return (
    <>
      <ExpSectionHead title="Prototype Integration" />
      <p className="exp-lead">
        Full experiment history per prototype — Prototype → Experiment 1 → Experiment N.
      </p>
      {data.prototypeTrees.length === 0 ? (
        <div className="exp-empty">
          <p>No experiments linked to prototypes yet.</p>
          <Link to="/experiments/create" className="exp-btn exp-btn--primary">
            Create linked experiment
          </Link>
        </div>
      ) : (
        data.prototypeTrees.map((tree) => (
          <div key={tree.prototypeId} className="exp-tree">
            <div className="exp-tree__head">
              {tree.prototypeId !== 'unlinked' ? (
                <Link to={`/prototypes/${tree.prototypeId}`} className="exp-link">
                  {tree.prototypeName}
                </Link>
              ) : (
                tree.prototypeName
              )}{' '}
              ({tree.experiments.length} experiment{tree.experiments.length !== 1 ? 's' : ''})
            </div>
            {tree.experiments.map((e, i) => (
              <div key={e.id} className="exp-tree__item">
                ├ Experiment {i + 1}:{' '}
                <Link to={`/experiments/${e.id}`} className="exp-link">
                  {e.title}
                </Link>{' '}
                · <ExpStageBadge stage={e.pipelineStage} /> · {e.confidenceScore}%
              </div>
            ))}
          </div>
        ))
      )}
    </>
  );
}

/* ─── Validation Gate ─────────────────────────────────────────────────────── */

export function ValidationGateView({ data }: { data: ExperimentOpsSnapshot }) {
  const candidates = data.experiments.filter(
    (e) => !['Draft', 'Planned'].includes(e.pipelineStage)
  );

  return (
    <>
      <ExpSectionHead title="Validation Gate" />
      <p className="exp-lead">
        Validation cannot start until experiment is completed, results reviewed, evidence approved,
        and confidence threshold is met. Decisions: PASS · HOLD · FAIL.
      </p>
      <div className="exp-cards">
        {candidates.map((e) => {
          const gate = validationGateStatus(e);
          const decisionClass =
            gate.decision === 'PASS'
              ? 'exp-decision--pass'
              : gate.decision === 'FAIL'
                ? 'exp-decision--fail'
                : 'exp-decision--hold';
          return (
            <article key={e.id} className="exp-card">
              <div className="exp-card__head">
                <strong>{e.title}</strong>
                <span className={`exp-decision ${decisionClass}`}>{gate.decision}</span>
              </div>
              <ul className="exp-checklist">
                {gate.checks.map((c) => (
                  <li key={c.label} className={c.met ? 'exp-check--ok' : ''}>
                    {c.label}
                  </li>
                ))}
              </ul>
              {gate.canStart ? (
                <Link
                  to={`/validation/new?projectId=${e.project_id ?? ''}`}
                  className="exp-btn exp-btn--primary"
                >
                  Proceed to Validation
                </Link>
              ) : (
                <Link to={`/experiments/${e.id}`} className="exp-link">
                  Complete evidence →
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

/* ─── Analytics Center ─────────────────────────────────────────────────────── */

export function AnalyticsCenterView({
  data,
  onExport,
}: {
  data: ExperimentOpsSnapshot;
  onExport: () => void;
}) {
  const byProject = useMemo(() => {
    const names = [...new Set(data.experiments.map((e) => e.project_name ?? 'Unlinked'))];
    return names.map((name) => {
      const subset = data.experiments.filter((e) => (e.project_name ?? 'Unlinked') === name);
      return {
        name,
        count: subset.length,
        avgConfidence: Math.round(
          subset.reduce((s, e) => s + e.confidenceScore, 0) / subset.length
        ),
        ready: subset.filter((e) => e.validationReady).length,
        failed: subset.filter((e) => e.status === 'failed').length,
      };
    });
  }, [data.experiments]);

  const byType = useMemo(() => {
    const types = [...new Set(data.experiments.map((e) => e.config.category ?? e.type))];
    return types.map((t) => ({
      type: t,
      count: data.experiments.filter((e) => (e.config.category ?? e.type) === t).length,
    }));
  }, [data.experiments]);

  return (
    <>
      <ExpSectionHead title="Analytics Center">
        <button type="button" className="exp-btn exp-btn--ghost" onClick={onExport}>
          Export CSV
        </button>
      </ExpSectionHead>
      <div className="exp-kpi-grid">
        <ExpKpi label="Success rate" value={`${data.metrics.successRate}%`} variant="good" />
        <ExpKpi label="Failure rate" value={`${data.metrics.failureRate}%`} variant="warn" />
        <ExpKpi label="Avg confidence" value={`${data.metrics.avgConfidence}%`} variant="accent" />
        <ExpKpi label="Innovation readiness" value={`${data.metrics.innovationReadiness}%`} />
      </div>
      <div className="exp-chart-row">
        <ExpSimpleBarChart
          title="Success trends (by project count)"
          labels={byProject.map((p) => p.name.slice(0, 8))}
          values={byProject.map((p) => p.count)}
        />
        <ExpSimpleBarChart
          title="Failure trends (failed per project)"
          labels={byProject.map((p) => p.name.slice(0, 8))}
          values={byProject.map((p) => p.failed)}
        />
      </div>
      <h3 className="exp-subhead">Performance by project</h3>
      <div className="exp-table-wrap">
        <table className="exp-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Experiments</th>
              <th>Avg confidence</th>
              <th>Validation ready</th>
              <th>Failed</th>
            </tr>
          </thead>
          <tbody>
            {byProject.map((p) => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>{p.count}</td>
                <td>{p.avgConfidence}%</td>
                <td>{p.ready}</td>
                <td>{p.failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="exp-subhead">Experiment category distribution</h3>
      <ExpSimpleBarChart
        title="By category"
        labels={byType.map((t) => t.type.slice(0, 10))}
        values={byType.map((t) => t.count)}
      />
    </>
  );
}

/* ─── Documentation Center ─────────────────────────────────────────────────── */

export function DocumentationView({ data }: { data: ExperimentOpsSnapshot }) {
  return (
    <>
      <ExpSectionHead title="Documentation Center" />
      <p className="exp-lead">
        Research documents, experiment notes, photos, videos, results reports, and technical
        reports linked to experiments.
      </p>
      <div className="exp-cards">
        {data.experiments.map((e) => (
          <article key={e.id} className="exp-card">
            <strong>{e.title}</strong>
            <div className="exp-mini">
              <div>
                <span>Documents</span>
                <p>{e.config.document_ids?.length ?? 0} linked</p>
              </div>
              <div>
                <span>File uploads</span>
                <p>{e.config.file_uploads?.length ?? 0}</p>
              </div>
              <div>
                <span>Notes</span>
                <p>{e.config.attachment_notes?.slice(0, 80) || '—'}</p>
              </div>
              <div>
                <span>Results report</span>
                <p>{e.results ? 'Recorded' : 'Pending'}</p>
              </div>
            </div>
            <div className="exp-actions">
              <Link to="/documents" className="exp-link">
                Document center
              </Link>
              <Link to={`/experiments/${e.id}`} className="exp-link">
                Experiment notes →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

/* ─── Enterprise ─────────────────────────────────────────────────────────── */

export function EnterpriseView({ data }: { data: ExperimentOpsSnapshot }) {
  const departments = useMemo(() => {
    const deps = new Map<string, ExperimentRecord[]>();
    for (const e of data.experiments) {
      const dep = e.config.department || e.project_sector || 'General';
      const list = deps.get(dep) ?? [];
      list.push(e);
      deps.set(dep, list);
    }
    return [...deps.entries()];
  }, [data.experiments]);

  return (
    <>
      <ExpSectionHead title="Enterprise Experiment Operations" />
      <p className="exp-lead">
        Multi-team experiments, department portfolios, approval workflows, audit logs, and version
        history.
      </p>
      <div className="exp-kpi-grid">
        <ExpKpi label="Departments" value={departments.length} />
        <ExpKpi label="Multi-team tests" value={data.experiments.filter((e) => (e.config.team_member_ids?.length ?? 0) > 1).length} />
        <ExpKpi label="Approved" value={data.pipelineCounts.Approved} />
        <ExpKpi label="Org readiness" value={`${data.metrics.innovationReadiness}%`} variant="accent" />
      </div>
      <h3 className="exp-subhead">Department experiments</h3>
      <div className="exp-table-wrap">
        <table className="exp-table">
          <thead>
            <tr>
              <th>Department / Sector</th>
              <th>Experiments</th>
              <th>Avg confidence</th>
              <th>Validation ready</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(([dep, exps]) => (
              <tr key={dep}>
                <td>{dep}</td>
                <td>{exps.length}</td>
                <td>
                  {Math.round(exps.reduce((s, e) => s + e.confidenceScore, 0) / exps.length)}%
                </td>
                <td>{exps.filter((e) => e.validationReady).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="exp-subhead">Recent audit activity</h3>
      <div className="exp-cards">
        {data.experiments
          .filter((e) => e.config.audit_log?.length)
          .slice(0, 6)
          .map((e) => (
            <article key={e.id} className="exp-card">
              <strong>{e.title}</strong>
              <p className="exp-muted">v{e.config.version ?? 1}</p>
              <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.76rem', opacity: 0.85 }}>
                {(e.config.audit_log ?? []).slice(-3).map((entry) => (
                  <li key={`${entry.at}-${entry.action}`}>
                    {entry.action} · {entry.at.slice(0, 10)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        {data.experiments.every((e) => !e.config.audit_log?.length) && (
          <p className="exp-muted">Audit logs populate as experiments are updated in the detail workspace.</p>
        )}
      </div>
      <Link to="/enterprise" className="exp-link">
        Enterprise Innovation Command Center →
      </Link>
    </>
  );
}

/* ─── Integrations ───────────────────────────────────────────────────────── */

export function IntegrationsView() {
  const links = [
    { label: 'Projects', to: '/projects', desc: 'Link experiments to innovation projects' },
    { label: 'Research', to: '/research', desc: 'Research evidence feeding hypotheses' },
    { label: 'Prototypes', to: '/prototypes', desc: 'Prototype under test' },
    { label: 'Validation', to: '/validation', desc: 'Gate decisions after experiments' },
    { label: 'Documents', to: '/documents', desc: 'Protocols, datasets, reports' },
    { label: 'Enterprise', to: '/enterprise', desc: 'Org-wide experiment analytics' },
  ];
  return (
    <>
      <ExpSectionHead title="Lifecycle Integrations" />
      <div className="exp-links-grid">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="exp-link-card">
            <strong>{l.label}</strong>
            <span>{l.desc}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
