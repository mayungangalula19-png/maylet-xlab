import { memo } from 'react';
import type { InnovatorActivityFeedItem } from '../types/innovatorOps.types';
import { formatAdminDateTime } from '../../utils/adminPage.utils';

interface InnovatorLiveFeedProps {
  events: InnovatorActivityFeedItem[];
  live: boolean;
  onSelect?: (innovatorId: string) => void;
}

function actionIcon(action: string): string {
  if (action.includes('stage')) return '↔️';
  if (action.includes('review')) return '📝';
  if (action.includes('score')) return '📊';
  if (action.includes('contact')) return '📞';
  return '⚡';
}

export const InnovatorLiveFeed = memo(function InnovatorLiveFeed({
  events,
  live,
  onSelect,
}: InnovatorLiveFeedProps) {
  return (
    <aside className="admin-innovator-live-feed">
      <div className="admin-innovator-live-feed-head">
        <h3>Live Activity</h3>
        <span className={`admin-innovator-live-dot ${live ? 'admin-innovator-live-dot--on' : ''}`}>
          {live ? 'Live' : 'Connecting…'}
        </span>
      </div>
      <ul className="admin-innovator-live-list">
        {events.length === 0 ? (
          <li className="admin-muted">No recent activity. Stage moves and reviews appear here instantly.</li>
        ) : (
          events.slice(0, 10).map((ev) => (
            <li key={ev.id}>
              <button
                type="button"
                className="admin-innovator-live-item"
                onClick={() => onSelect?.(ev.innovatorId)}
              >
                <span className="admin-innovator-live-icon">{actionIcon(ev.action)}</span>
                <span className="admin-innovator-live-body">
                  <strong>{ev.innovatorName}</strong>
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
