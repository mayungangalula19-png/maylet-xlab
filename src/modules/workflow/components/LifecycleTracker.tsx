import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type {
  InnovationLifecycleRecord,
  WorkflowReadinessScores,
  WorkflowStage,
  WorkflowStageId,
  WorkflowStatus,
} from '../types/workflow.types';
import '../workflow.css';

const PIPELINE_STAGES: WorkflowStageId[] = [
  'idea',
  'research',
  'prototype',
  'experiment',
  'validation',
  'funding',
  'commercialization',
];

const STAGE_ICONS: Record<WorkflowStageId, string> = {
  idea: '💡',
  research: '🔬',
  prototype: '📦',
  experiment: '🧪',
  validation: '✅',
  funding: '💰',
  commercialization: '🚀',
  completed: '🏁',
  archived: '📁',
};

const STAGE_HINTS: Partial<Record<WorkflowStageId, string>> = {
  idea: 'Capture problem, hypothesis, and success criteria.',
  research: 'Literature, interviews, and gate review.',
  prototype: 'Build MVP artifacts and test runs.',
  experiment: 'Structured tests with measurable outcomes.',
  validation: 'Funding gate — evidence-based decision.',
  funding: 'Pitches, grants, and investor readiness.',
  commercialization: 'GTM, partnerships, and scale.',
};

interface Props {
  projectId: string;
  projectName?: string;
  lifecycle: InnovationLifecycleRecord | null;
  stages: WorkflowStage[];
  readiness?: WorkflowReadinessScores | null;
  readinessOverall?: number;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  compact?: boolean;
}

function stageIndex(id: WorkflowStageId): number {
  const idx = PIPELINE_STAGES.indexOf(id);
  return idx >= 0 ? idx : 0;
}

function stageRoute(stageId: WorkflowStageId, projectId: string): string {
  switch (stageId) {
    case 'research':
      return `/research/${projectId}`;
    case 'prototype':
      return `/prototypes?projectId=${projectId}`;
    case 'experiment':
      return `/experiments?projectId=${projectId}`;
    case 'validation':
      return `/validation/new?projectId=${projectId}`;
    case 'funding':
      return `/funding/create?projectId=${projectId}`;
    case 'commercialization':
      return `/commercialization?projectId=${projectId}`;
    default:
      return `/projects/${projectId}`;
  }
}

function scoreForStage(stageId: WorkflowStageId, readiness: WorkflowReadinessScores | null | undefined): number | null {
  if (!readiness) return null;
  switch (stageId) {
    case 'research':
      return readiness.researchScore;
    case 'prototype':
      return readiness.prototypeScore;
    case 'experiment':
      return readiness.experimentScore;
    case 'validation':
      return readiness.validationScore;
    case 'funding':
      return readiness.fundingScore;
    case 'commercialization':
      return readiness.commercializationScore;
    default:
      return null;
  }
}

function formatStatus(status: WorkflowStatus): string {
  return status.replace(/_/g, ' ');
}

function daysInStage(enteredAt: string | undefined): number | null {
  if (!enteredAt) return null;
  const ms = Date.now() - new Date(enteredAt).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function readinessTone(score: number): 'low' | 'mid' | 'high' {
  if (score >= 75) return 'high';
  if (score >= 45) return 'mid';
  return 'low';
}

function TrackerSkeleton() {
  return (
    <div className="wf-tracker wf-tracker--enterprise wf-tracker--loading" aria-busy="true">
      <div className="wf-tracker__skel-head" />
      <div className="wf-tracker__skel-metrics">
        <span /><span /><span />
      </div>
      <div className="wf-tracker__skel-pipeline" />
    </div>
  );
}

export function LifecycleTracker({
  projectId,
  projectName,
  lifecycle,
  stages,
  readiness,
  readinessOverall,
  loading,
  error,
  onRefresh,
  compact = false,
}: Props) {
  const currentId = lifecycle?.currentStageId ?? 'research';
  const currentIdx = stageIndex(currentId);
  const status = lifecycle?.workflowStatus ?? 'in_progress';
  const overall = readinessOverall ?? readiness?.overallScore ?? lifecycle?.overallReadinessScore ?? 0;
  const daysInCurrent = daysInStage(lifecycle?.stageEnteredAt);
  const pipelineProgress = Math.round((currentIdx / Math.max(1, PIPELINE_STAGES.length - 1)) * 100);

  const stageLabel = stages.find((s) => s.id === currentId)?.label ?? currentId;
  const currentMeta = stages.find((s) => s.id === currentId);
  const blockers = readiness?.blockers ?? [];
  const warnings = readiness?.warnings ?? [];

  const stageRows = useMemo(
    () =>
      PIPELINE_STAGES.map((stageId, i) => {
        const meta = stages.find((s) => s.id === stageId);
        const score = scoreForStage(stageId, readiness);
        const minExit = meta?.minReadinessToExit ?? 0;
        const done = i < currentIdx;
        const active = stageId === currentId;
        const upcoming = i > currentIdx;
        const meetsThreshold = score === null || score >= minExit;
        return {
          stageId,
          meta,
          score,
          minExit,
          done,
          active,
          upcoming,
          meetsThreshold,
          hint: STAGE_HINTS[stageId],
        };
      }),
    [stages, readiness, currentId, currentIdx]
  );

  if (loading) return <TrackerSkeleton />;

  return (
    <section
      className={`wf-tracker wf-tracker--enterprise${compact ? ' wf-tracker--compact' : ''}`}
      aria-label="Innovation lifecycle command"
    >
      <header className="wf-tracker__header">
        <div className="wf-tracker__header-main">
          <div className="wf-tracker__eyebrow">Workflow Engine</div>
          <h3 className="wf-tracker__title">
            Innovation Lifecycle
            {projectName ? <span className="wf-tracker__project"> · {projectName}</span> : null}
          </h3>
          <p className="wf-tracker__sub">
            Current stage: <strong>{stageLabel}</strong>
            <span className={`wf-tracker__status wf-tracker__status--${status}`}>{formatStatus(status)}</span>
            {lifecycle?.blocked ? (
              <span className="wf-tracker__status wf-tracker__status--blocked">Blocked</span>
            ) : null}
          </p>
        </div>

        <div className="wf-tracker__header-actions">
          {onRefresh ? (
            <button type="button" className="wf-tracker__btn wf-tracker__btn--ghost" onClick={onRefresh}>
              Refresh
            </button>
          ) : null}
          <Link to="/enterprise" className="wf-tracker__btn wf-tracker__btn--ghost">
            Enterprise
          </Link>
          <div className="wf-tracker__score" title="Overall readiness score">
            <span className={`wf-tracker__score-val wf-tracker__score-val--${readinessTone(overall)}`}>
              {overall}%
            </span>
            <span className="wf-tracker__score-label">Readiness</span>
          </div>
        </div>
      </header>

      {error ? (
        <p className="wf-tracker__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="wf-tracker__metrics" role="group" aria-label="Lifecycle metrics">
        <div className="wf-tracker__metric">
          <span className="wf-tracker__metric-val">{pipelineProgress}%</span>
          <span className="wf-tracker__metric-label">Pipeline progress</span>
        </div>
        <div className="wf-tracker__metric">
          <span className="wf-tracker__metric-val">{daysInCurrent ?? '—'}</span>
          <span className="wf-tracker__metric-label">Days in stage</span>
        </div>
        <div className="wf-tracker__metric">
          <span className="wf-tracker__metric-val">{currentMeta?.minReadinessToExit ?? 0}%</span>
          <span className="wf-tracker__metric-label">Exit threshold</span>
        </div>
        <div className="wf-tracker__metric">
          <span className="wf-tracker__metric-val">{blockers.length}</span>
          <span className="wf-tracker__metric-label">Blockers</span>
        </div>
      </div>

      <div className="wf-tracker__progress-wrap" aria-hidden>
        <div className="wf-tracker__progress-track">
          <div className="wf-tracker__progress-fill" style={{ width: `${pipelineProgress}%` }} />
        </div>
      </div>

      <ol className="wf-tracker__steps" aria-label="Innovation pipeline stages">
        {stageRows.map(({ stageId, meta, score, minExit, done, active, upcoming, meetsThreshold, hint }) => (
          <li
            key={stageId}
            className={[
              'wf-tracker__step',
              done ? 'wf-tracker__step--done' : '',
              active ? 'wf-tracker__step--active' : '',
              upcoming ? 'wf-tracker__step--upcoming' : '',
              !meetsThreshold && (done || active) ? 'wf-tracker__step--warn' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <Link
              to={stageRoute(stageId, projectId)}
              className="wf-tracker__step-link"
              title={hint}
              aria-current={active ? 'step' : undefined}
            >
              <span className="wf-tracker__step-icon" aria-hidden>
                {STAGE_ICONS[stageId]}
              </span>
              <span className="wf-tracker__dot" aria-hidden />
              <span className="wf-tracker__label">{meta?.label ?? stageId}</span>
              {score !== null && !compact ? (
                <span className={`wf-tracker__step-score wf-tracker__step-score--${readinessTone(score)}`}>
                  {score}%
                  {minExit > 0 ? <em> / {minExit}%</em> : null}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ol>

      {(blockers.length > 0 || warnings.length > 0) && !compact ? (
        <div className="wf-tracker__insights">
          {blockers.length > 0 ? (
            <div className="wf-tracker__insight wf-tracker__insight--block">
              <strong>Blockers</strong>
              <ul>
                {blockers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {warnings.length > 0 ? (
            <div className="wf-tracker__insight wf-tracker__insight--warn">
              <strong>Warnings</strong>
              <ul>
                {warnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {lifecycle?.blocked && lifecycle.blockedReason ? (
        <div className="wf-tracker__blocked" role="alert">
          <strong>Workflow blocked</strong>
          <p>{lifecycle.blockedReason}</p>
        </div>
      ) : null}

      {lifecycle?.nextRecommendedAction ? (
        <footer className="wf-tracker__footer">
          <p className="wf-tracker__next">
            <span className="wf-tracker__next-label">Recommended action</span>
            {lifecycle.nextRecommendedAction}
          </p>
          <Link to={stageRoute(currentId, projectId)} className="wf-tracker__btn wf-tracker__btn--primary">
            Open {stageLabel}
          </Link>
        </footer>
      ) : (
        <footer className="wf-tracker__footer wf-tracker__footer--links">
          <Link to={stageRoute(currentId, projectId)} className="wf-tracker__btn wf-tracker__btn--primary">
            Continue {stageLabel}
          </Link>
          <Link to={`/projects/${projectId}`} className="wf-tracker__btn wf-tracker__btn--ghost">
            Project hub
          </Link>
        </footer>
      )}
    </section>
  );
}
