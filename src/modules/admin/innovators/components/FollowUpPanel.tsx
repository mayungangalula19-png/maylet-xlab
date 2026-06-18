import { memo } from 'react';
import type { InnovatorFollowUp } from '../types/innovatorOps.types';
import { formatAdminDate } from '../../utils/adminPage.utils';

interface FollowUpPanelProps {
  followUps: InnovatorFollowUp[];
  onSelect: (id: string) => void;
}

function reasonLabel(reason: InnovatorFollowUp['reason']) {
  switch (reason) {
    case 'overdue':
      return 'Overdue follow-up';
    case 'stale_contact':
      return 'No contact 7+ days';
    case 'pending_evaluation':
      return 'Pending evaluation';
    default:
      return reason;
  }
}

function reasonClass(reason: InnovatorFollowUp['reason']) {
  switch (reason) {
    case 'overdue':
      return 'admin-innovator-followup-item--overdue';
    case 'stale_contact':
      return 'admin-innovator-followup-item--stale';
    default:
      return 'admin-innovator-followup-item--pending';
  }
}

export const FollowUpPanel = memo(function FollowUpPanel({
  followUps,
  onSelect,
}: FollowUpPanelProps) {
  const overdue = followUps.filter((f) => f.reason === 'overdue').length;
  const stale = followUps.filter((f) => f.reason === 'stale_contact').length;
  const pending = followUps.filter((f) => f.reason === 'pending_evaluation').length;

  return (
    <aside className="admin-innovator-followups">
      <h3>Priority Follow-ups</h3>
      <div className="admin-innovator-followup-stats">
        <span className="admin-innovator-followup-stat admin-innovator-followup-stat--overdue">
          {overdue} overdue
        </span>
        <span className="admin-innovator-followup-stat admin-innovator-followup-stat--stale">
          {stale} stale
        </span>
        <span className="admin-innovator-followup-stat admin-innovator-followup-stat--pending">
          {pending} pending
        </span>
      </div>
      <div className="admin-innovator-followup-list">
        {followUps.length === 0 ? (
          <p className="admin-muted">All caught up — no urgent follow-ups.</p>
        ) : (
          followUps.slice(0, 8).map((item) => (
            <button
              key={`${item.innovator.id}-${item.reason}`}
              type="button"
              className={`admin-innovator-followup-item ${reasonClass(item.reason)}`}
              onClick={() => onSelect(item.innovator.id)}
            >
              <div className="admin-innovator-followup-head">
                <strong>{item.innovator.fullName}</strong>
                <span className="admin-innovator-followup-urgency">{Math.round(item.urgencyScore)}</span>
              </div>
              <span className="admin-innovator-followup-reason">{reasonLabel(item.reason)}</span>
              <span className="admin-muted">{item.innovator.ideaTitle}</span>
              {item.innovator.nextFollowUpDate ? (
                <span className="admin-muted">Due {formatAdminDate(item.innovator.nextFollowUpDate)}</span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </aside>
  );
});
