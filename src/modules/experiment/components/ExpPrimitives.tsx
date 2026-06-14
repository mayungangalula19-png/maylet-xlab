import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  PIPELINE_STAGES,
  type ExperimentOpsSnapshot,
  type ExperimentRecord,
  type PipelineStage,
  formatExperimentTimeAgo,
} from '../../../lib/experiment/experimentOps';

export function ExpKpi({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant?: 'accent' | 'good' | 'warn';
}) {
  const cls = variant ? `exp-kpi--${variant}` : '';
  return (
    <div className={`exp-kpi ${cls}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ExpSectionHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="exp-section-head">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export function ExpStageBadge({ stage }: { stage: PipelineStage }) {
  return (
    <span className={`exp-stage exp-stage--${stage.toLowerCase().replace(/\s+/g, '-')}`}>
      {stage}
    </span>
  );
}

export function ExpPipelineBar({
  counts,
}: {
  counts: Record<PipelineStage, number>;
}) {
  const max = Math.max(1, ...PIPELINE_STAGES.map((s) => counts[s]));
  return (
    <div className="exp-pipeline">
      {PIPELINE_STAGES.map((stage) => (
        <div key={stage} className="exp-pipeline__row">
          <span>{stage}</span>
          <div className="exp-pipeline__bar">
            <div style={{ width: `${Math.round((counts[stage] / max) * 100)}%` }} />
          </div>
          <strong>{counts[stage]}</strong>
        </div>
      ))}
    </div>
  );
}

export function ExpKanban({ experiments }: { experiments: ExperimentRecord[] }) {
  return (
    <div className="exp-kanban">
      {PIPELINE_STAGES.map((stage) => {
        const cards = experiments.filter((e) => e.pipelineStage === stage);
        return (
          <div key={stage} className="exp-kanban__col">
            <div className="exp-kanban__head">
              <span>{stage}</span>
              <strong>{cards.length}</strong>
            </div>
            {cards.slice(0, 6).map((e) => (
              <Link key={e.id} to={`/experiments/${e.id}`} className="exp-kanban__card">
                <strong>{e.title}</strong>
                <span>{e.confidenceScore}% · {formatExperimentTimeAgo(e.updated_at)}</span>
              </Link>
            ))}
            {cards.length > 6 && (
              <span className="exp-muted">+{cards.length - 6} more</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ExpExperimentTable({
  rows,
  showProject = true,
  showPrototype = false,
}: {
  rows: ExperimentRecord[];
  showProject?: boolean;
  showPrototype?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="exp-empty">
        <p>No experiments match this view.</p>
        <Link to="/experiments/create" className="exp-btn exp-btn--primary">
          Create experiment
        </Link>
      </div>
    );
  }

  return (
    <div className="exp-table-wrap">
      <table className="exp-table">
        <thead>
          <tr>
            <th>Experiment</th>
            {showProject && <th>Project</th>}
            {showPrototype && <th>Prototype</th>}
            <th>Pipeline</th>
            <th>Confidence</th>
            <th>Evidence</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id}>
              <td>
                <strong>{e.title}</strong>
                <span className="exp-muted">{e.config.category ?? e.type}</span>
              </td>
              {showProject && <td>{e.project_name ?? '—'}</td>}
              {showPrototype && <td>{e.prototype_name ?? '—'}</td>}
              <td>
                <ExpStageBadge stage={e.pipelineStage} />
              </td>
              <td>{e.confidenceScore}%</td>
              <td>{e.evidenceQuality}%</td>
              <td>{formatExperimentTimeAgo(e.updated_at)}</td>
              <td className="exp-actions">
                <Link to={`/experiments/${e.id}`} className="exp-link">
                  Open
                </Link>
                {e.project_id && (
                  <Link to={`/projects/${e.project_id}`} className="exp-link">
                    Project
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExpMayaSidebar({ data }: { data: ExperimentOpsSnapshot }) {
  const { maya } = data;
  const decisionClass =
    maya.predictedValidationOutcome === 'PASS'
      ? 'exp-decision--pass'
      : maya.predictedValidationOutcome === 'FAIL'
        ? 'exp-decision--fail'
        : 'exp-decision--hold';

  return (
    <aside className="exp-maya" aria-label="MAYA experiment engine">
      <div className="exp-maya__head">
        <strong>MAYA Experiment AI</strong>
        <span>{maya.validationReadiness}%</span>
      </div>
      <p className="exp-maya__label">
        Validation readiness · Predicted:{' '}
        <span className={`exp-decision ${decisionClass}`}>{maya.predictedValidationOutcome}</span>
      </p>
      <div className="exp-mini" style={{ marginBottom: '0.5rem' }}>
        <div>
          <span>Success probability</span>
          <strong style={{ color: '#68d391' }}>{maya.successProbability}%</strong>
        </div>
        <div>
          <span>Failure risk</span>
          <strong style={{ color: '#fc8181' }}>{maya.failureRisk}%</strong>
        </div>
      </div>
      <div className="exp-maya__block">
        <label>Analysis</label>
        <ul>
          {maya.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
      {maya.patterns.length > 0 && (
        <div className="exp-maya__block">
          <label>Pattern detection</label>
          <ul>
            {maya.patterns.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      {maya.anomalies.length > 0 && (
        <div className="exp-maya__block">
          <label>Anomalies</label>
          <ul>
            {maya.anomalies.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="exp-maya__block">
        <label>Recommendations</label>
        <ul>
          {maya.improvements.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
      {maya.futureExperiments.length > 0 && (
        <div className="exp-maya__block">
          <label>Suggested future experiments</label>
          <ul>
            {maya.futureExperiments.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="exp-maya__action">{maya.priorityAction}</p>
      <Link to="/ai-assistant" className="exp-maya-btn exp-maya-btn--ghost">
        Open MAYA assistant
      </Link>
    </aside>
  );
}

export function ExpSimpleBarChart({
  labels,
  values,
  title,
}: {
  labels: string[];
  values: number[];
  title: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <div className="exp-chart-card">
      <h3>{title}</h3>
      <div className="exp-bar-chart">
        {labels.map((label, i) => (
          <div key={label} className="exp-bar-chart__col">
            <div
              className="exp-bar-chart__bar"
              style={{ height: `${Math.round((values[i] / max) * 100)}%` }}
              title={`${values[i]}`}
            />
            <span className="exp-bar-chart__label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
