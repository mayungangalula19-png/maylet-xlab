import { memo } from 'react';
import type { MentorActivityItem } from '../types/mentorOps.types';
import { formatAdminDateTime } from '../../utils/adminPage.utils';

interface ActivityFeedProps {
  events: MentorActivityItem[];
  live: boolean;
  onlineCount: number;
  onSelect?: (mentorId: string) => void;
}

function actionIcon(action: string): string {
  if (action.includes('session')) return '📅';
  if (action.includes('assign')) return '🔗';
  if (action.includes('suspend')) return '⛔';
  if (action.includes('activ')) return '✅';
  if (action.includes('rating')) return '⭐';
  return '⚡';
}

export const ActivityFeed = memo(function ActivityFeed({
  events,
  live,
  onlineCount,
  onSelect,
}: ActivityFeedProps) {
  return (
    <aside className="admin-mentor-activity-feed">
      <div className="admin-mentor-activity-head">
        <h3>Live Activity</h3>
        <span className={`admin-mentor-live-dot ${live ? 'admin-mentor-live-dot--on' : ''}`}>
          {live ? 'Live' : 'Connecting…'}
        </span>
      </div>
      <p className="admin-muted">{onlineCount} mentors available now</p>
      <ul className="admin-mentor-activity-list">
        {events.length === 0 ? (
          <li className="admin-muted">Session completions, assignments, and ratings appear here in real time.</li>
        ) : (
          events.slice(0, 10).map((ev) => (
            <li key={ev.id}>
              <button
                type="button"
                className="admin-mentor-activity-item"
                disabled={!ev.mentorId}
                onClick={() => ev.mentorId && onSelect?.(ev.mentorId)}
              >
                <span>{actionIcon(ev.action)}</span>
                <span className="admin-mentor-activity-body">
                  <strong>{ev.mentorName}</strong>
                  <span>{ev.action.replace(/_/g, ' ')}</span>
                  <span className="admin-muted">{formatAdminDateTime(ev.createdAt)}</span>
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
});
