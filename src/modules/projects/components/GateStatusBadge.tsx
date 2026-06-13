import { GATE_DECISION_LABELS } from '../../research/types/gate.types';
import type { GateDecision } from '../../research/types/gate.types';

interface Props {
  decision: GateDecision | null | undefined;
  compact?: boolean;
}

export function GateStatusBadge({ decision, compact }: Props) {
  if (!decision || decision === 'pending') {
    return compact ? null : (
      <span className="research-gate-badge research-gate-badge--pending">Gate: Not reviewed</span>
    );
  }

  return (
    <span className={`research-gate-badge research-gate-badge--${decision}`}>
      {compact ? decision.toUpperCase().replace('_', ' ') : GATE_DECISION_LABELS[decision]}
    </span>
  );
}
