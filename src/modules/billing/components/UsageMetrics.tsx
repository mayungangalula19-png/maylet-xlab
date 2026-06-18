import type { UsageMetric } from '../types/billing.types';

export function UsageMetrics({ metrics }: { metrics: UsageMetric[] }) {
  return (
    <div className="billing-usage-grid">
      {metrics.map((m) => {
        const unlimited = m.limit < 0;
        const pct = unlimited ? 12 : m.limit === 0 ? 0 : Math.min(100, (m.used / m.limit) * 100);
        return (
          <div key={m.key} className="billing-usage-card">
            <div className="billing-usage-head">
              <span>{m.label}</span>
              <strong>
                {m.used}
                {unlimited ? '' : ` / ${m.limit}`} {m.unit}
              </strong>
            </div>
            <div className="billing-usage-bar">
              <div className="billing-usage-fill" style={{ width: `${unlimited ? 12 : pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
