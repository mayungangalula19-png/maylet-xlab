import { memo } from 'react';
import { Link } from 'react-router-dom';
import { VaultAnalytics } from './VaultAnalytics';
import { VaultMayaPanel } from './VaultMayaPanel';
import type { VaultActivityItem, VaultAnalyticsData, VaultOpsMaya } from '../types/vaultOpsAdmin.types';

interface VaultRightRailProps {
  maya: VaultOpsMaya;
  analytics: VaultAnalyticsData;
  activity: VaultActivityItem[];
  onOpenAssistant?: () => void;
}

export const VaultRightRail = memo(function VaultRightRail({
  maya,
  analytics,
  activity,
  onOpenAssistant,
}: VaultRightRailProps) {
  return (
    <div className="admin-vault-right-rail">
      <VaultMayaPanel maya={maya} onOpenAssistant={onOpenAssistant} />
      <VaultAnalytics data={analytics} variant="sidebar" />
      <div className="admin-vault-panel admin-vault-glass admin-vault-live-panel">
        <div className="admin-vault-live-head">
          <h4>Live Activity</h4>
          <span className="admin-vault-live-dot">● Live</span>
        </div>
        <ul className="admin-vault-activity-list">
          {activity.slice(0, 6).map((item) => (
            <li key={item.id}>
              <div className="admin-vault-activity-item">
                <span className="admin-vault-activity-avatar">
                  {(item.user ?? item.assetTitle).charAt(0)}
                </span>
                <div>
                  <strong>{item.user ?? 'System'}</strong>
                  <span>{item.action}</span>
                  <Link to="/admin/vault" className="admin-muted">
                    {item.assetTitle.slice(0, 32)}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
