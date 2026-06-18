import { memo } from 'react';
import type { PrototypeAnalyticsData } from '../types/prototypeOpsAdmin.types';

interface PrototypeAnalyticsProps {
  data: PrototypeAnalyticsData;
  variant?: 'full' | 'sidebar';
}

export const PrototypeAnalytics = memo(function PrototypeAnalytics({
  data,
  variant = 'full',
}: PrototypeAnalyticsProps) {
  const isSidebar = variant === 'sidebar';

  return (
    <div
      className={`admin-prototype-analytics admin-prototype-glass ${isSidebar ? 'admin-prototype-analytics-sidebar' : ''}`}
    >
      <h4>Prototype Portfolio Analytics</h4>

      <div className="admin-prototype-analytics-section">
        <span className="admin-prototype-analytics-label">Testing pass rate</span>
        <strong className="admin-prototype-analytics-kpi">{data.testingPassRate}%</strong>
      </div>

      <div className="admin-prototype-analytics-section">
        <span className="admin-prototype-analytics-label">Readiness distribution</span>
        <ul className="admin-prototype-bar-chart">
          {data.readinessDistribution.map((item) => (
            <li key={item.band}>
              <span>{item.band}</span>
              <div className="admin-prototype-bar-track">
                <div
                  className="admin-prototype-bar-fill"
                  style={{
                    width: `${Math.min(100, item.count * 8)}%`,
                  }}
                />
              </div>
              <strong>{item.count}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-prototype-analytics-section">
        <span className="admin-prototype-analytics-label">Funding conversion funnel</span>
        <ul className="admin-prototype-funnel">
          {data.fundingFunnel.map((step) => (
            <li key={step.stage}>
              <span>{step.stage}</span>
              <strong>{step.count}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-prototype-analytics-section">
        <span className="admin-prototype-analytics-label">Commercialization funnel</span>
        <ul className="admin-prototype-funnel">
          {data.commercializationFunnel.map((step) => (
            <li key={step.stage}>
              <span>{step.stage}</span>
              <strong>{step.count}</strong>
            </li>
          ))}
        </ul>
      </div>

      {!isSidebar ? (
        <div className="admin-prototype-analytics-section">
          <span className="admin-prototype-analytics-label">Department performance</span>
          <ul className="admin-prototype-dept-list">
            {data.departmentPerformance.map((d) => (
              <li key={d.department}>
                <span>{d.department}</span>
                <strong>{d.avgReadiness}%</strong>
                <span className="admin-muted">({d.count})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="admin-prototype-analytics-section">
        <span className="admin-prototype-analytics-label">Innovation velocity</span>
        <ul className="admin-prototype-velocity">
          {data.innovationVelocity.slice(-4).map((v) => (
            <li key={v.month}>
              <span>{v.month}</span>
              <span>+{v.created} created</span>
              <span>{v.promoted} promoted</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
