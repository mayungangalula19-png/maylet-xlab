import { memo } from 'react';
import { Link } from 'react-router-dom';
import { PrototypeAnalytics } from './PrototypeAnalytics';
import { PrototypeMayaPanel } from './PrototypeMayaPanel';
import type {
  PrototypeActivityItem,
  PrototypeAnalyticsData,
  PrototypeOpsMaya,
} from '../types/prototypeOpsAdmin.types';

interface PrototypeRightRailProps {
  maya: PrototypeOpsMaya;
  analytics: PrototypeAnalyticsData;
  activity: PrototypeActivityItem[];
  onOpenAssistant?: () => void;
}

export const PrototypeRightRail = memo(function PrototypeRightRail({
  maya,
  analytics,
  activity,
  onOpenAssistant,
}: PrototypeRightRailProps) {
  return (
    <div className="admin-prototype-right-rail">
      <PrototypeMayaPanel maya={maya} onOpenAssistant={onOpenAssistant} />
      <PrototypeAnalytics data={analytics} variant="sidebar" />
      <div className="admin-prototype-panel admin-prototype-glass admin-prototype-live-panel">
        <div className="admin-prototype-live-head">
          <h4>Live Activity Feed</h4>
          <span className="admin-prototype-live-dot admin-prototype-live-dot--on">● Live</span>
        </div>
        <ul className="admin-prototype-activity-list">
          {activity.length === 0 ? (
            <li className="admin-muted">No recent activity.</li>
          ) : (
            activity.slice(0, 6).map((item) => (
              <li key={item.id}>
                <Link
                  to={`/admin/prototypes/${item.prototypeId}`}
                  className="admin-prototype-activity-item"
                >
                  <span className="admin-prototype-activity-avatar">
                    {(item.user ?? item.prototypeName).charAt(0)}
                  </span>
                  <div>
                    <strong>{item.user ?? 'System'}</strong>
                    <span>{item.action}</span>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
});
