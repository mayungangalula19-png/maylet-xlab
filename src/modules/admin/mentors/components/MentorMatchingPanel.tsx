import { memo } from 'react';
import type { MatchCandidate } from '../types/mentorOps.types';
import { matchTierLabel } from '../types/mentorOps.types';

interface MentorMatchingPanelProps {
  matches: MatchCandidate[];
  loading?: boolean;
  onAssign: (innovatorId: string, matchScore: number) => void;
  actionLoading?: boolean;
}

function tierClass(tier: MatchCandidate['tier']) {
  switch (tier) {
    case 'strong':
      return 'admin-match-tier--strong';
    case 'medium':
      return 'admin-match-tier--medium';
    default:
      return 'admin-match-tier--weak';
  }
}

export const MentorMatchingPanel = memo(function MentorMatchingPanel({
  matches,
  loading,
  onAssign,
  actionLoading,
}: MentorMatchingPanelProps) {
  return (
    <section className="admin-mentor-matching">
      <h4>Mentor–Innovator Matching</h4>
      <p className="admin-muted">Ranked by industry, expertise, innovation stage, and location.</p>
      {loading ? (
        <p className="admin-muted">Computing matches…</p>
      ) : matches.length === 0 ? (
        <p className="admin-muted">No innovators available for matching.</p>
      ) : (
        <div className="admin-match-list">
          {matches.slice(0, 8).map((m) => (
            <div key={m.innovatorId} className={`admin-match-item ${tierClass(m.tier)}`}>
              <div className="admin-match-head">
                <strong>{m.innovatorName}</strong>
                <span className="admin-match-score">{m.matchScore}%</span>
              </div>
              <span className="admin-muted">{m.ideaTitle}</span>
              <div className="admin-match-meta">
                <span>{m.category}</span>
                <span>{matchTierLabel(m.tier)}</span>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--primary admin-btn--xs"
                disabled={actionLoading}
                onClick={() => onAssign(m.innovatorId, m.matchScore)}
              >
                Assign Mentor
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
});
