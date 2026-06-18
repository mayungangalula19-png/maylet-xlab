import { AdminStatCard } from '../dashboard/AdminStatCard';
import { formatAdminCurrency } from '../../utils/adminPage.utils';
import type { AdminAnalyticsSnapshot } from '../../types/adminAnalytics.types';

interface AdminAnalyticsViewProps {
  snapshot: AdminAnalyticsSnapshot;
}

export function AdminAnalyticsView({ snapshot }: AdminAnalyticsViewProps) {
  const { totals, projects_by_status, projects_by_sector, users_by_role, revenue_by_month, growth_series } =
    snapshot;

  const maxGrowth = Math.max(
    1,
    ...growth_series.map((p) => Math.max(p.signups, p.projects))
  );
  const maxRevenue = Math.max(1, ...revenue_by_month.map((m) => m.amount));

  return (
    <div className="admin-analytics">
      <div className="admin-stats-grid">
        <AdminStatCard icon="👥" label="Users" value={totals.users} color="#7c5fe6" link="/admin/users" />
        <AdminStatCard icon="📁" label="Projects" value={totals.projects} color="#2fd4ff" link="/admin/projects" />
        <AdminStatCard
          icon="💵"
          label="Total revenue"
          value={formatAdminCurrency(totals.total_revenue)}
          color="#48bb78"
          link="/admin/payments"
        />
        <AdminStatCard
          icon="📈"
          label="Revenue (30d)"
          value={formatAdminCurrency(totals.revenue_30d)}
          color="#2fd4ff"
          link="/admin/payments"
        />
      </div>

      <div className="admin-stats-grid">
        <AdminStatCard icon="🧪" label="Experiments" value={totals.experiments} color="#48bb78" link="/admin/experiments" />
        <AdminStatCard icon="📦" label="Prototypes" value={totals.prototypes} color="#f6c90e" link="/admin/prototypes" />
        <AdminStatCard
          icon="🔐"
          label="Vault items"
          value={totals.vault_items}
          color="#fc8181"
          link="/admin/vault"
        />
        <AdminStatCard
          icon="📊"
          label="Avg progress"
          value={`${totals.avg_project_progress}%`}
          color="#9b7ff0"
          link="/admin/projects"
        />
      </div>

      <div className="admin-two-columns">
        <section className="admin-section-card">
          <h3>Project status</h3>
          <BreakdownList items={projects_by_status} emptyLabel="No projects yet." />
        </section>

        <section className="admin-section-card">
          <h3>Users by role</h3>
          <BreakdownList items={users_by_role} emptyLabel="No user roles recorded." />
        </section>
      </div>

      <section className="admin-section-card">
        <h3>Top sectors</h3>
        <BreakdownList items={projects_by_sector} emptyLabel="No sector data yet." />
      </section>

      <div className="admin-two-columns">
        <section className="admin-section-card">
          <h3>Revenue (last 6 months)</h3>
          {revenue_by_month.length === 0 ? (
            <p className="admin-empty-state">No payment data yet.</p>
          ) : (
            <div className="admin-analytics-bars">
              {revenue_by_month.map((month) => (
                <div key={month.month} className="admin-analytics-bar-row">
                  <span className="admin-analytics-bar-label">{month.month}</span>
                  <div className="admin-analytics-bar-track">
                    <div
                      className="admin-analytics-bar-fill admin-analytics-bar-fill--revenue"
                      style={{ width: `${(month.amount / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="admin-analytics-bar-value">{formatAdminCurrency(month.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-section-card">
          <h3>Growth ({snapshot.range_days} days)</h3>
          {growth_series.length === 0 ? (
            <p className="admin-empty-state">No growth data in this range.</p>
          ) : (
            <>
              <div className="admin-analytics-legend">
                <span className="admin-analytics-legend-item admin-analytics-legend-item--signups">Signups</span>
                <span className="admin-analytics-legend-item admin-analytics-legend-item--projects">Projects</span>
              </div>
              <div className="admin-analytics-growth">
                {growth_series.slice(-14).map((point) => (
                  <div key={point.date} className="admin-analytics-growth-day" title={point.date}>
                    <div
                      className="admin-analytics-growth-bar admin-analytics-growth-bar--signups"
                      style={{ height: `${(point.signups / maxGrowth) * 100}%` }}
                    />
                    <div
                      className="admin-analytics-growth-bar admin-analytics-growth-bar--projects"
                      style={{ height: `${(point.projects / maxGrowth) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
              <p className="admin-form-hint">Last 14 days shown · MTD signups: {totals.new_users_mtd}</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function BreakdownList({
  items,
  emptyLabel,
}: {
  items: Record<string, number>;
  emptyLabel: string;
}) {
  const entries = Object.entries(items).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return <p className="admin-empty-state">{emptyLabel}</p>;
  }

  const max = Math.max(1, ...entries.map(([, count]) => count));

  return (
    <div className="admin-analytics-breakdown">
      {entries.map(([label, count]) => (
        <div key={label} className="admin-analytics-bar-row">
          <span className="admin-analytics-bar-label">{label}</span>
          <div className="admin-analytics-bar-track">
            <div
              className="admin-analytics-bar-fill"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="admin-analytics-bar-value">{count}</span>
        </div>
      ))}
    </div>
  );
}
