import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ExperimentAnalytics } from './ExperimentAnalytics';
import { MayaIntelligencePanel } from './MayaIntelligencePanel';
import type { ExperimentOpsMaya } from '../../../../lib/experiment/experimentOps';
import type { ExperimentActivityItem, ExperimentAnalyticsData } from '../types/experimentOpsAdmin.types';

interface ExperimentRightRailProps {
  maya: ExperimentOpsMaya;
  analytics: ExperimentAnalyticsData;
  activity: ExperimentActivityItem[];
  onOpenAssistant?: () => void;
}

export const ExperimentRightRail = memo(function ExperimentRightRail({
  maya,
  analytics,
  activity,
  onOpenAssistant,
}: ExperimentRightRailProps) {
  return (
    <div className="admin-experiment-right-rail">
      <MayaIntelligencePanel maya={maya} onOpenAssistant={onOpenAssistant} />
      <ExperimentAnalytics data={analytics} variant="sidebar" />
      <div className="admin-experiment-panel admin-experiment-glass admin-experiment-live-panel">
        <div className="admin-experiment-live-head">
          <h4>Live Activity Feed</h4>
          <span className="admin-experiment-live-dot admin-experiment-live-dot--on">● Live</span>
        </div>
        <ul className="admin-experiment-activity-list">
          {activity.length === 0 ? (
            <li className="admin-muted">No recent activity.</li>
          ) : (
            activity.slice(0, 6).map((item) => (
              <li key={item.id}>
                <Link to={`/admin/experiments/${item.experimentId}`} className="admin-experiment-activity-item">
                  <span className="admin-experiment-activity-avatar">
                    {(item.user ?? item.experimentTitle).charAt(0)}
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
