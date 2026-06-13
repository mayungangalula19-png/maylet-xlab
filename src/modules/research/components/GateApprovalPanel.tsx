import { Link } from 'react-router-dom';
import { GATE_DECISION_LABELS } from '../types/gate.types';
import type { GateCheckItem, GateDecision, GateEvaluation } from '../types/gate.types';
import type { GateReviewRecord } from '../types/gate.types';

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
  error: string | null;
  onDecisionChange: (d: GateDecision) => void;
  onV1ScopeChange: (v: string) => void;
  onOutOfScopeChange: (v: string) => void;
  onOpenRisksChange: (v: string) => void;
  onReviewerNameChange: (v: string) => void;
  onToggleSectionC: (id: string) => void;
  onSubmit: () => void;
  onAdvanceToPrototype?: () => void;
  advancing?: boolean;
}

function CheckList({ title, items, onToggle }: { title: string; items: GateCheckItem[]; onToggle?: (id: string) => void }) {
  return (
    <div className="research-gate-section">
      <h3>{title}</h3>
      {items.map((c) => (
        <label key={c.id} className={`research-gate-check research-gate-check--${c.status}`}>
          {onToggle ? (
            <input
              type="checkbox"
              checked={c.status === 'pass'}
              onChange={() => onToggle(c.id)}
            />
          ) : (
            <span className={`research-gate-dot research-gate-dot--${c.status}`} />
          )}
          <span>
            <strong>{c.label}</strong>
            {c.detail ? <span className="research-gate-detail"> — {c.detail}</span> : null}
          </span>
        </label>
      ))}
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
  error,
  onDecisionChange,
  onV1ScopeChange,
  onOutOfScopeChange,
  onOpenRisksChange,
  onReviewerNameChange,
  onToggleSectionC,
  onSubmit,
  onAdvanceToPrototype,
  advancing,
}: Props) {
  if (!evaluation) {
    return <p className="research-empty">Load research data to run gate evaluation.</p>;
  }

  const activeDecision = record?.decision ?? decision;
  const authorized = activeDecision === 'go' || activeDecision === 'conditional_go';

  return (
    <div className="research-gate-panel">
      <div className="research-panel-header">
        <h2>Research → Prototype Gate</h2>
        <span className={`research-gate-badge research-gate-badge--${activeDecision}`}>
          {GATE_DECISION_LABELS[activeDecision]}
        </span>
      </div>

      <p className="research-gate-intro">
        Prototype is authorized only after gate approval. System completion: <strong>{evaluation.systemCompletion}%</strong>
        {evaluation.systemCompletion < 100 ? ' (100% required)' : ''}
      </p>

      {evaluation.blockers.length > 0 && (
        <div className="research-gate-alert research-gate-alert--block">
          {evaluation.blockers.map((b) => <div key={b}>{b}</div>)}
        </div>
      )}
      {evaluation.warnings.length > 0 && (
        <div className="research-gate-alert research-gate-alert--warn">
          {evaluation.warnings.map((w) => <div key={w}>{w}</div>)}
        </div>
      )}

      <CheckList title="A. System Evidence (auto)" items={evaluation.sectionA} />
      <CheckList title="B. Professional Quality (auto)" items={evaluation.sectionB} />
      <CheckList title="C. Decision Readiness (human confirm)" items={sectionC} onToggle={onToggleSectionC} />

      <div className="research-gate-section">
        <h3>D. Approval & Authorization</h3>
        <div className="research-field">
          <label>Gate decision</label>
          <select value={decision} onChange={(e) => onDecisionChange(e.target.value as GateDecision)}>
            <option value="pending">Pending Review</option>
            <option value="go">GO</option>
            <option value="conditional_go">Conditional GO</option>
            <option value="hold">HOLD</option>
            <option value="no_go">NO-GO</option>
          </select>
        </div>
        <div className="research-field">
          <label>Approved V1 prototype scope</label>
          <textarea value={v1Scope} onChange={(e) => onV1ScopeChange(e.target.value)} rows={3} placeholder="What is authorized to build in v1?" />
        </div>
        <div className="research-field">
          <label>Out of scope</label>
          <textarea value={outOfScope} onChange={(e) => onOutOfScopeChange(e.target.value)} rows={2} placeholder="Explicitly excluded from v1" />
        </div>
        <div className="research-field">
          <label>Accepted open risks</label>
          <textarea value={openRisks} onChange={(e) => onOpenRisksChange(e.target.value)} rows={2} />
        </div>
        <div className="research-field">
          <label>Reviewer / approver name</label>
          <input value={reviewerName} onChange={(e) => onReviewerNameChange(e.target.value)} placeholder="Human approver required" />
        </div>
      </div>

      {error ? <p className="research-error">{error}</p> : null}

      <div className="research-gate-actions">
        <button type="button" className="research-btn research-btn--primary" disabled={saving} onClick={onSubmit}>
          {saving ? 'Saving…' : 'Submit gate review'}
        </button>
        <Link to={`/research/${projectId}/playbook`} className="research-btn research-btn--secondary">
          Open playbook
        </Link>
      </div>

      {record?.reviewed_at && (
        <p className="research-gate-meta">
          Last review: {new Date(record.reviewed_at).toLocaleString()}
          {record.reviewer_name ? ` by ${record.reviewer_name}` : ''}
        </p>
      )}

      {authorized && record && (
        <div className="research-gate-prototype-cta">
          <h3>Prototype authorized</h3>
          {record.v1_scope && <p><strong>V1 scope:</strong> {record.v1_scope}</p>}
          <div className="research-gate-actions">
            {onAdvanceToPrototype && (
              <button type="button" className="research-btn research-btn--primary" disabled={advancing} onClick={onAdvanceToPrototype}>
                {advancing ? 'Updating…' : 'Advance project to Prototype'}
              </button>
            )}
            <Link
              to={`/prototypes/new?projectId=${projectId}`}
              className="research-btn research-btn--secondary"
            >
              Create prototype from research
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
