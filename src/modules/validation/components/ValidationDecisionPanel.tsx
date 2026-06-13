import type { ValidationDecision } from '../types/validation.types';

const OPTIONS: ValidationDecision[] = ['pass', 'hold', 'fail'];

interface Props {
  decision: ValidationDecision;
  reviewerNotes?: string | null;
  onDecisionChange?: (decision: ValidationDecision) => void;
  readOnly?: boolean;
}

export function ValidationDecisionPanel({
  decision,
  reviewerNotes,
  onDecisionChange,
  readOnly = false,
}: Props) {
  return (
    <section className="val-panel">
      <h2>Decision</h2>
      <div className="val-decision-btns">
        {OPTIONS.map((d) => (
          <button
            key={d}
            type="button"
            className={`val-decision-btn val-decision-btn--${d} ${decision === d ? 'is-active' : ''}`}
            disabled={readOnly || !onDecisionChange}
            onClick={() => onDecisionChange?.(d)}
          >
            {d.toUpperCase()}
          </button>
        ))}
      </div>
      {reviewerNotes && <p className="val-notes">{reviewerNotes}</p>}
      <p className="val-panel__hint">
        PASS → eligible for Funding. HOLD → improve evidence. FAIL → not viable for Funding.
      </p>
    </section>
  );
}
