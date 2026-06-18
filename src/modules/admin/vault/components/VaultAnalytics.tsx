import { memo } from 'react';
import type { VaultAnalyticsData } from '../types/vaultOpsAdmin.types';

interface VaultAnalyticsProps {
  data: VaultAnalyticsData;
  variant?: 'full' | 'sidebar';
}

export const VaultAnalytics = memo(function VaultAnalytics({
  data,
  variant = 'full',
}: VaultAnalyticsProps) {
  const compact = variant === 'sidebar';

  return (
    <div className={`admin-vault-analytics admin-vault-glass ${compact ? 'admin-vault-analytics--sidebar' : ''}`}>
      <h4>Vault Analytics</h4>

      <div className="admin-vault-analytics-block">
        <span className="admin-muted">Knowledge growth</span>
        <ul className="admin-vault-mini-chart">
          {data.knowledgeGrowth.slice(-4).map((k) => (
            <li key={k.month}>
              <span>{k.month}</span>
              <strong>+{k.count}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-vault-analytics-block">
        <span className="admin-muted">Document activity</span>
        <ul className="admin-vault-mini-chart">
          {data.documentActivity.slice(-4).map((d) => (
            <li key={d.month}>
              <span>{d.month}</span>
              <span>{d.views} views · {d.downloads} dl</span>
            </li>
          ))}
        </ul>
      </div>

      {!compact ? (
        <div className="admin-vault-analytics-block">
          <span className="admin-muted">Research output by department</span>
          <ul className="admin-vault-mini-chart">
            {data.researchOutput.slice(0, 5).map((r) => (
              <li key={r.department}>
                <span>{r.department}</span>
                <strong>{r.count}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="admin-vault-analytics-block">
        <span className="admin-muted">Top asset types</span>
        <ul className="admin-vault-mini-chart">
          {data.assetUtilization.slice(0, 5).map((a) => (
            <li key={a.type}>
              <span>{a.type.replace(/_/g, ' ')}</span>
              <strong>{a.count}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
