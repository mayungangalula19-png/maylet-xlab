import { Link } from 'react-router-dom';
import type { SystemAlert } from '../../../lib/innovation/recommendations';
import type { Notification } from '../../../types/project.types';

interface Props {
  notifications: Notification[];
  systemAlerts: SystemAlert[];
}

function NotificationItem({ notification }: { notification: Notification }) {
  const route =
    notification.type === 'funding'
      ? '/funding'
      : notification.type === 'team'
        ? '/teams'
        : notification.type === 'ai'
          ? '/ai-assistant'
          : '/notifications';

  return (
    <Link
      to={route}
      className={`icc-alert-item icc-clickable ${!notification.read ? 'icc-alert-item--unread' : ''}`}
    >
      <span className="icc-alert-badge">Alert</span>
      <div>
        <div className="icc-alert-title">{notification.title}</div>
        <div className="icc-alert-message">{notification.message}</div>
      </div>
    </Link>
  );
}

function SystemAlertItem({ alert }: { alert: SystemAlert }) {
  return (
    <Link
      to={alert.route}
      className={`icc-alert-item icc-clickable icc-alert-item--${alert.priority}`}
    >
      <span className="icc-alert-badge">{alert.priority === 'high' ? 'Action' : 'Tip'}</span>
      <div>
        <div className="icc-alert-title">{alert.title}</div>
        <div className="icc-alert-message">{alert.message}</div>
      </div>
    </Link>
  );
}

export function InnovationAlertsPanel({ notifications, systemAlerts }: Props) {
  const hasNotifications = notifications.length > 0;

  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Alerts & Recommendations</h3>
        <Link to="/notifications" className="icc-widget-link">View All</Link>
      </div>
      <div className="icc-alerts-list">
        {hasNotifications
          ? notifications.map((n) => <NotificationItem key={n.id} notification={n} />)
          : systemAlerts.map((a) => <SystemAlertItem key={a.id} alert={a} />)}
      </div>
    </div>
  );
}
