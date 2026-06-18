import { memo } from 'react';
import { AdminBadge } from '../../components/ui/AdminBadge';
import type { Innovator } from '../types/innovatorOps.types';
import { priorityColor, stageLabel } from '../types/innovatorOps.types';
import { formatAdminDate } from '../../utils/adminPage.utils';

interface InnovatorCardProps {
  innovator: Innovator;
  selected?: boolean;
  busy?: boolean;
  onSelect: (id: string) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
}

function scoreColor(score: number): string {
  if (score >= 75) return '#48bb78';
  if (score >= 50) return '#f6c90e';
  return '#fc8181';
}

function isOverdue(nextFollowUpDate: string | null): boolean {
  if (!nextFollowUpDate) return false;
  return nextFollowUpDate < new Date().toISOString().slice(0, 10);
}

export const InnovatorCard = memo(function InnovatorCard({
  innovator,
  selected,
  busy,
  onSelect,
  onDragStart,
}: InnovatorCardProps) {
  const overdue = isOverdue(innovator.nextFollowUpDate);

  return (
    <div
      className={`admin-innovator-card ${busy ? 'admin-innovator-card--busy' : ''} ${selected ? 'admin-innovator-card--selected' : ''}`}
      draggable={!busy}
      onDragStart={(e) => onDragStart?.(e, innovator.id)}
      onClick={() => onSelect(innovator.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(innovator.id)}
      role="button"
      tabIndex={0}
    >
      <div className="admin-innovator-card-head">
        <strong>{innovator.fullName}</strong>
        <span className="admin-innovator-score" style={{ color: scoreColor(innovator.finalScore) }}>
          {innovator.finalScore}
        </span>
      </div>
      <div className="admin-innovator-card-idea">{innovator.ideaTitle}</div>
      <div className="admin-innovator-card-meta">
        <span className="admin-innovator-category-pill">{innovator.category}</span>
        <span className="admin-innovator-priority-pill" style={{ color: priorityColor(innovator.priority) }}>
          {innovator.priority}
        </span>
      </div>
      <div className="admin-innovator-card-footer">
        {overdue ? (
          <span className="admin-innovator-overdue-dot" title="Overdue follow-up">●</span>
        ) : null}
        <AdminBadge variant="info">{stageLabel(innovator.stage)}</AdminBadge>
        <span className="admin-muted">{formatAdminDate(innovator.updatedAt)}</span>
      </div>
    </div>
  );
});
