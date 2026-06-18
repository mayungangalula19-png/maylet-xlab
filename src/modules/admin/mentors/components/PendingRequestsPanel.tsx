import { memo } from 'react';
import { formatAdminDate } from '../../utils/adminPage.utils';

interface PendingRequestsPanelProps {
  items: Array<{ id: string; mentorName: string; message: string; requestedDate: string }>;
}

export const PendingRequestsPanel = memo(function PendingRequestsPanel({
  items,
}: PendingRequestsPanelProps) {
  if (items.length === 0) return null;

  return (
    <aside className="admin-mentor-pending-requests">
      <h3>Pending Match Requests</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.mentorName}</strong>
            <span className="admin-muted">{item.message.slice(0, 80)}{item.message.length > 80 ? '…' : ''}</span>
            <span className="admin-muted">{formatAdminDate(item.requestedDate)}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
});
