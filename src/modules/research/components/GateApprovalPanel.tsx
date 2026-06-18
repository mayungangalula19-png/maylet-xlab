import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GATE_DECISION_LABELS } from '../types/gate.types';
import type { GateCheckItem, GateDecision, GateEvaluation, GateReviewRecord } from '../types/gate.types';
import { canAuthorizePrototype } from '../ai/gateEngine';

const DECISION_OPTIONS: { value: GateDecision; short: string }[] = [
  { value: 'pending', short: 'Pending' },
  { value: 'go', short: 'GO' },
  { value: 'conditional_go', short: 'Conditional GO' },
  { value: 'hold', short: 'HOLD' },
  { value: 'no_go', short: 'NO-GO' },
];

const QUICK_LINKS = [
  { tab: 'problem', label: 'Problem definition' },
  { tab: 'notes', label: 'Research notes' },
  { tab: 'findings', label: 'Findings' },
  { tab: 'literature', label: 'Literature' },
  { tab: 'documents', label: 'Documents' },
] as const;

interface Props {
  projectId: string;
  evaluation: GateEvaluation | null;
  record: GateReviewRecord | null;
  sectionC: GateCheckItem[];
  decision: GateDecision;
  v1Scope: string;
  outOfScope: string;
  openRisks: string;
  reviewerName: string;
  saving: boolean;
  loading?: boolean;
  error: string | null;
  onDecisionChange: (d: GateDecision) => void;
  onV1ScopeChange: (v: string) => void;
  onOutOfScopeChange: (v: string) => void;
  onOpenRisksChange: (v: string) => void;
  onReviewerNameChange: (v: string) => void;
  onToggleSectionC: (id: string) => void;
  onConfirmAllSectionC?: () => void;
  onResetSectionC?: () => void;
  onSubmit: () => void;
  onAdvanceToPrototype?: () => void;
  advancing?: boolean;
}

function sectionStats(items: GateCheckItem[]) {
  const pass = items.filter((i) => i.status === 'pass').length;
  const fail = items.filter((i) => i.status === 'fail').length;
  const pending = items.filter((i) => i.status === 'pending').length;
  return { pass, fail, pending, total: items.length };
}

function statusIcon(status: GateCheckItem['status']): string {
  if (status === 'pass') return '✓';
  if (status === 'fail') return '✕';
  return '○';
}

function formatReviewDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function CheckList({
  title,
  subtitle,
  items,
  auto,
  expanded,
  onToggleExpand,
  onToggle,
  onConfirmAll,
  onReset,
}: {
  title: string;
  subtitle: string;
  items: GateCheckItem[];
  auto?: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggle?: (id: string) => void;
  onConfirmAll?: () => void;
  onReset?: () => void;
}) {
  const stats = sectionStats(items);

  return (
    <div className={`research-gate-section research-gate-section--collapsible${expanded ? ' research-gate-section--open' : ''}`}>
      <button type="button" className="research-gate-section__toggle" onClick={onToggleExpand} aria-expanded={expanded}>
        <div className="research-gate-section__heading">
          <h3>{title}</h3>
          <span className="research-gate-section__subtitle">{subtitle}</span>
        </div>
        <div className="research-gate-section__summary">
          {auto ? <span className="research-gate-section__auto">Auto</span> : null}
          <span className="research-gate-section__counts">
            <span className="research-gate-section__count research-gate-section__count--pass">{stats.pass} pass</span>
            {stats.fail > 0 ? (
              <span className="research-gate-section__count research-gate-section__count--fail">{stats.fail} fail</span>
            ) : null}
            {stats.pending > 0 ? (
              <span className="research-gate-section__count research-gate-section__count--pending">{stats.pending} pending</span>
            ) : null}
          </span>
          <span className="research-gate-section__chevron" aria-hidden>
            {expanded ? '▾' : '▸'}
          </span>
        </div>
      </button>

      {expanded ? (
        <div className="research-gate-section__body">
          {onToggle && (onConfirmAll || onReset) ? (
            <div className="research-gate-section__bulk">
              {onConfirmAll ? (
                <button type="button" className="research-gate-section__bulk-btn" onClick={onConfirmAll}>
                  Confirm all
                </button>
              ) : null}
              {onReset ? (
                <button type="button" className="research-gate-section__bulk-btn" onClick={onReset}>
                  Reset all
                </button>
              ) : null}
            </div>
          ) : null}
          {items.map((c) => (
            <label key={c.id} className={`research-gate-check research-gate-check--${c.status}`}>
              {onToggle ? (
                <input type="checkbox" checked={c.status === 'pass'} onChange={() => onToggle(c.id)} />
              ) : (
                <span className={`research-gate-dot research-gate-dot--${c.status}`} aria-hidden />
              )}
              <span className={`research-gate-check__icon research-gate-check__icon--${c.status}`} aria-hidden>
                {statusIcon(c.status)}
              </span>
              <span className="research-gate-check__text">
                <strong>{c.label}</strong>
                {c.detail ? <span className="research-gate-detail"> — {c.detail}</span> : null}
              </span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function GateApprovalPanel({
  projectId,
  evaluation,
  record,
  sectionC,
  decision,
  v1Scope,
  outOfScope,
  openRisks,
  reviewerName,
  saving,
  loading,
  error,
  onDecisionChange,
  onV1ScopeChange,
  onOutOfScopeChange,
  onOpenRisksChange,
  onReviewerNameChange,
  onToggleSectionC,
  onConfirmAllSectionC,
  onResetSectionC,
  onSubmit,
  onAdvanceToPrototype,
  advancing,
}: Props) {
  const [expanded, setExpanded] = useState({ A: true, B: true, C: true, D: true });
  const [dismissedError, setDismissedError] = useState(false);

  useEffect(() => {
    setDismissedError(false);
  }, [error]);

  const activeDecision = record?.decision ?? decision;
  const authorized = canAuthorizePrototype(activeDecision);
  const scopeRequired = canAuthorizePrototype(decision);

  const statsA = useMemo(() => (evaluation ? sectionStats(evaluation.sectionA) : null), [evaluation]);
  const statsB = useMemo(() => (evaluation ? sectionStats(evaluation.sectionB) : null), [evaluation]);
  const statsC = useMemo(() => sectionStats(sectionC), [sectionC]);

  const visibleError = error && !dismissedError ? error : null;

  if (loading) {
    return (
      <div className="research-gate-panel">
        <div className="research-panel-header">
          <h2>Research → Prototype Gate</h2>
        </div>
        <p className="research-gate-loading">Loading gate review…</p>
      </div>
    );
  }

  if (!evaluation) {
    return <p className="research-empty">Load research data to run gate evaluation.</p>;
  }

  const completionReady = evaluation.systemCompletion >= 100;
  const cReady = statsC.pass === statsC.total;

  return (
    <div className="research-gate-panel">
      <div className="research-panel-header">
        <div>
          <h2>Research → Prototype Gate</h2>
          <p className="research-gate-intro">
            Prototype is authorized only after human gate approval and recorded scope.
          </p>
        </div>
        <span className={`research-gate-badge research-gate-badge--${activeDecision}`}>
          {GATE_DECISION_LABELS[activeDecision]}
        </span>
      </div>

      <div className="research-gate-dashboard">
        <div className="research-gate-dashboard__progress">
          <div className="research-gate-dashboard__progress-head">
            <span>System evidence completion</span>
            <strong className={completionReady ? 'research-gate-dashboard__ready' : ''}>
              {evaluation.systemCompletion}%
            </strong>
          </div>
          <div className="research-progress-bar" role="progressbar" aria-valuenow={evaluation.systemCompletion} aria-valuemin={0} aria-valuemax={100}>
            <div style={{ width: `${evaluation.systemCompletion}%` }} />
          </div>
          {!completionReady ? <span className="research-gate-dashboard__hint">100% required to authorize prototype</span> : null}
        </div>

        <div className="research-gate-dashboard__stats">
          <div className="research-gate-stat">
            <span className="research-gate-stat__label">Section A</span>
            <strong>
              {statsA?.pass}/{statsA?.total}
            </strong>
            <span className="research-gate-stat__sub">System evidence</span>
          </div>
          <div className="research-gate-stat">
            <span className="research-gate-stat__label">Section B</span>
            <strong>
              {statsB?.pass}/{statsB?.total}
            </strong>
            <span className="research-gate-stat__sub">Quality bar</span>
          </div>
          <div className="research-gate-stat">
            <span className="research-gate-stat__label">Section C</span>
            <strong className={cReady ? 'research-gate-dashboard__ready' : ''}>
              {statsC.pass}/{statsC.total}
            </strong>
            <span className="research-gate-stat__sub">Human confirm</span>
          </div>
          <div className="research-gate-stat research-gate-stat--recommend">
            <span className="research-gate-stat__label">Recommended</span>
            <span className={`research-gate-badge research-gate-badge--${evaluation.recommendedDecision}`}>
              {GATE_DECISION_LABELS[evaluation.recommendedDecision]}
            </span>
            {decision !== evaluation.recommendedDecision ? (
              <button
                type="button"
                className="research-gate-stat__apply"
                disabled={saving}
                onClick={() => onDecisionChange(evaluation.recommendedDecision)}
              >
                Apply
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {evaluation.blockers.length > 0 ? (
        <div className="research-gate-alert research-gate-alert--block" role="alert">
          <strong className="research-gate-alert__title">Blockers</strong>
          <ul className="research-gate-alert__list">
            {evaluation.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {evaluation.warnings.length > 0 ? (
        <div className="research-gate-alert research-gate-alert--warn" role="status">
          <strong className="research-gate-alert__title">Warnings</strong>
          <ul className="research-gate-alert__list">
            {evaluation.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {!completionReady ? (
        <div className="research-gate-quicklinks">
          <span className="research-gate-quicklinks__label">Complete research in</span>
          <div className="research-gate-quicklinks__links">
            {QUICK_LINKS.map((link) => (
              <Link key={link.tab} to={`/research/${projectId}?tab=${link.tab}`} className="research-gate-quicklinks__link">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <CheckList
        title="A. System Evidence"
        subtitle="Auto-evaluated from workspace data"
        items={evaluation.sectionA}
        auto
        expanded={expanded.A}
        onToggleExpand={() => setExpanded((s) => ({ ...s, A: !s.A }))}
      />
      <CheckList
        title="B. Professional Quality"
        subtitle="Evidence depth and research rigor"
        items={evaluation.sectionB}
        auto
        expanded={expanded.B}
        onToggleExpand={() => setExpanded((s) => ({ ...s, B: !s.B }))}
      />
      <CheckList
        title="C. Decision Readiness"
        subtitle="Human confirmation required"
        items={sectionC}
        expanded={expanded.C}
        onToggleExpand={() => setExpanded((s) => ({ ...s, C: !s.C }))}
        onToggle={onToggleSectionC}
        onConfirmAll={onConfirmAllSectionC}
        onReset={onResetSectionC}
      />

      <div className={`research-gate-section research-gate-section--collapsible research-gate-section--open research-gate-section--approval`}>
        <button
          type="button"
          className="research-gate-section__toggle"
          onClick={() => setExpanded((s) => ({ ...s, D: !s.D }))}
          aria-expanded={expanded.D}
        >
          <div className="research-gate-section__heading">
            <h3>D. Approval & Authorization</h3>
            <span className="research-gate-section__subtitle">Record decision, scope, and approver</span>
          </div>
          <span className="research-gate-section__chevron" aria-hidden>
            {expanded.D ? '▾' : '▸'}
          </span>
        </button>

        {expanded.D ? (
          <div className="research-gate-section__body">
            <div className="research-field">
              <label>Gate decision</label>
              <div className="research-gate-decisions" role="radiogroup" aria-label="Gate decision">
                {DECISION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={decision === opt.value}
                    className={`research-gate-decision research-gate-decision--${opt.value}${
                      decision === opt.value ? ' research-gate-decision--active' : ''
                    }`}
                    disabled={saving}
                    onClick={() => onDecisionChange(opt.value)}
                  >
                    {opt.short}
                  </button>
                ))}
              </div>
              <p className="research-gate-decision-hint">{GATE_DECISION_LABELS[decision]}</p>
            </div>

            <div className="research-grid-2">
              <div className="research-field">
                <label htmlFor="gate-v1-scope">
                  Approved V1 prototype scope
                  {scopeRequired ? <span className="research-gate-required">Required for GO</span> : null}
                </label>
                <textarea
                  id="gate-v1-scope"
                  value={v1Scope}
                  disabled={saving}
                  onChange={(e) => onV1ScopeChange(e.target.value)}
                  rows={3}
                  placeholder="What is authorized to build in v1?"
                />
              </div>
              <div className="research-field">
                <label htmlFor="gate-out-of-scope">Out of scope</label>
                <textarea
                  id="gate-out-of-scope"
                  value={outOfScope}
                  disabled={saving}
                  onChange={(e) => onOutOfScopeChange(e.target.value)}
                  rows={3}
                  placeholder="Explicitly excluded from v1"
                />
              </div>
            </div>

            <div className="research-grid-2">
              <div className="research-field">
                <label htmlFor="gate-open-risks">Accepted open risks</label>
                <textarea
                  id="gate-open-risks"
                  value={openRisks}
                  disabled={saving}
                  onChange={(e) => onOpenRisksChange(e.target.value)}
                  rows={2}
                  placeholder="Known risks accepted at gate"
                />
              </div>
              <div className="research-field">
                <label htmlFor="gate-reviewer">
                  Reviewer / approver name
                  <span className="research-gate-required">Required</span>
                </label>
                <input
                  id="gate-reviewer"
                  value={reviewerName}
                  disabled={saving}
                  onChange={(e) => onReviewerNameChange(e.target.value)}
                  placeholder="Human approver required"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {visibleError ? (
        <p className="research-gate-error" role="alert">
          {visibleError}
          <button
            type="button"
            className="research-gate-error__dismiss"
            onClick={() => setDismissedError(true)}
          >
            Dismiss
          </button>
        </p>
      ) : null}

      <div className="research-gate-actions">
        <button type="button" className="research-btn research-btn--primary" disabled={saving} onClick={onSubmit}>
          {saving ? 'Saving…' : record ? 'Update gate review' : 'Submit gate review'}
        </button>
        <Link to={`/research/${projectId}/playbook`} className="research-btn research-btn--secondary">
          Open playbook
        </Link>
      </div>

      {record?.reviewed_at ? (
        <p className="research-gate-meta">
          Last review: {formatReviewDate(record.reviewed_at)}
          {record.reviewer_name ? ` · ${record.reviewer_name}` : ''}
          {record.decision ? ` · ${GATE_DECISION_LABELS[record.decision]}` : ''}
        </p>
      ) : null}

      {authorized && record ? (
        <div className="research-gate-prototype-cta">
          <div className="research-gate-prototype-cta__head">
            <span className="research-gate-prototype-cta__icon" aria-hidden>
              ✓
            </span>
            <div>
              <h3>Prototype authorized</h3>
              <p className="research-gate-prototype-cta__sub">Gate review recorded — you may advance the project or start building.</p>
            </div>
          </div>
          {record.v1_scope ? (
            <div className="research-gate-prototype-cta__scope">
              <strong>V1 scope</strong>
              <p>{record.v1_scope}</p>
            </div>
          ) : null}
          {record.out_of_scope ? (
            <div className="research-gate-prototype-cta__scope research-gate-prototype-cta__scope--muted">
              <strong>Out of scope</strong>
              <p>{record.out_of_scope}</p>
            </div>
          ) : null}
          <div className="research-gate-actions">
            {onAdvanceToPrototype ? (
              <button
                type="button"
                className="research-btn research-btn--primary"
                disabled={advancing}
                onClick={onAdvanceToPrototype}
              >
                {advancing ? 'Updating…' : 'Advance project to Prototype'}
              </button>
            ) : null}
            <Link to={`/prototypes/new?projectId=${projectId}`} className="research-btn research-btn--secondary">
              Create prototype from research
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
