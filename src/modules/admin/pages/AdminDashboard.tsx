import { Link } from 'react-router-dom';
import { AdminStatCard } from '../components/dashboard/AdminStatCard';
import { sectorIcon, timeAgo, useAdminDashboard } from '../hooks/useAdminDashboard';

const QUICK_NAV = [
  { to: '/admin/users', icon: '👥', label: 'Users' },
  { to: '/admin/projects', icon: '📁', label: 'Projects' },
  { to: '/admin/payments', icon: '💵', label: 'Payments' },
  { to: '/admin/analytics', icon: '📈', label: 'Analytics' },
  { to: '/admin/reports', icon: '📄', label: 'Reports' },
  { to: '/admin/settings', icon: '⚙️', label: 'Settings' },
  { to: '/admin/ai-monitor', icon: '🤖', label: 'AI Monitor' },
  { to: '/admin/security', icon: '🛡️', label: 'Security' },
] as const;

function monthHint(count: number, noun: string) {
  if (count <= 0) return undefined;
  return `+${count} ${noun} this month`;
}

const AdminDashboard = () => {
  const {
    initialLoading,
    refreshing,
    adminName,
    adminRole,
    stats,
    recentUsers,
    recentProjects,
    activities,
    lastUpdated,
    refresh,
  } = useAdminDashboard();

  if (initialLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading-container">
          <div className="admin-loading-spinner" />
          <p>Loading Admin Dashboard...</p>
          <p className="admin-loading-sub">Fetching data from Supabase...</p>
        </div>
      </div>
    );
  }

  const activePercentage =
    stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0;
  const completionRate =
    stats.totalProjects > 0 ? (stats.projectsThisMonth / stats.totalProjects) * 100 : 0;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-welcome-text">
            Welcome back, <strong>{adminName}</strong> ({adminRole})
          </p>
          <p className="admin-subtitle">Here&apos;s what&apos;s happening in Maylet XLab today.</p>
        </div>
        <div className="admin-header-actions">
          <div className="admin-last-updated">
            <span aria-hidden>🕐</span>
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button
            type="button"
            onClick={() => refresh()}
            className="admin-btn-refresh"
            disabled={refreshing}
          >
            {refreshing ? '⟳ Refreshing…' : '⟳ Refresh'}
          </button>
          <Link to="/admin/analytics/export" className="admin-btn-export">
            📊 Export Report
          </Link>
        </div>
      </header>

      <div className="admin-stats-grid">
        <AdminStatCard
          icon="👥"
          label="Total Users"
          value={stats.totalUsers}
          hint={monthHint(stats.newUsersThisMonth, 'signups')}
          color="#7c5fe6"
          link="/admin/users"
        />
        <AdminStatCard
          icon="📁"
          label="Total Projects"
          value={stats.totalProjects}
          hint={monthHint(stats.projectsThisMonth, 'new')}
          color="#2fd4ff"
          link="/admin/projects"
        />
        <AdminStatCard
          icon="🧪"
          label="Experiments"
          value={stats.totalExperiments}
          color="#48bb78"
          link="/admin/experiments"
        />
        <AdminStatCard
          icon="📦"
          label="Prototypes"
          value={stats.totalPrototypes}
          color="#f6c90e"
          link="/admin/prototypes"
        />
      </div>

      <div className="admin-stats-grid">
        <AdminStatCard
          icon="🔐"
          label="Vault Items"
          value={stats.totalVaultItems}
          color="#fc8181"
          link="/admin/vault"
        />
        <AdminStatCard
          icon="💰"
          label="Funding Pitches"
          value={stats.totalFundingPitches}
          hint={monthHint(stats.fundingPitchesThisMonth, 'pitches')}
          color="#9b7ff0"
          link="/admin/analytics"
        />
        <AdminStatCard
          icon="💵"
          label="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          color="#48bb78"
          link="/admin/payments"
        />
        <AdminStatCard
          icon="📈"
          label="30-Day Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          hint={stats.monthlyRevenue > 0 ? 'Last 30 days' : undefined}
          color="#2fd4ff"
          link="/admin/analytics"
        />
      </div>

      <div className="admin-stats-grid">
        <AdminStatCard
          icon="🎓"
          label="Mentors"
          value={stats.totalMentors}
          color="#f6c90e"
          link="/admin/mentors"
        />
        <AdminStatCard
          icon="💰"
          label="Investors"
          value={stats.totalInvestors}
          color="#48bb78"
          link="/admin/investors"
        />
        <AdminStatCard
          icon="💡"
          label="Innovators"
          value={stats.totalInnovators}
          color="#7c5fe6"
          link="/admin/innovators"
        />
        <AdminStatCard
          icon="📊"
          label="Avg Progress"
          value={`${stats.avgProjectProgress}%`}
          color="#2fd4ff"
          link="/admin/projects"
        />
      </div>

      <div className="admin-two-columns">
        <section className="admin-section-card">
          <div className="admin-card-header">
            <h3>👥 User Status</h3>
            <Link to="/admin/users" className="admin-card-link">
              Manage →
            </Link>
          </div>
          <div className="admin-status-bars">
            <div className="admin-status-item">
              <div className="admin-status-label">
                <span>🟢 Active (7d)</span>
                <span>
                  {stats.activeUsers} ({activePercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="admin-progress-bar">
                <div className="admin-progress active" style={{ width: `${activePercentage}%` }} />
              </div>
            </div>
            <div className="admin-status-item">
              <div className="admin-status-label">
                <span>⚪ Inactive</span>
                <span>
                  {stats.totalUsers - stats.activeUsers} ({(100 - activePercentage).toFixed(1)}%)
                </span>
              </div>
              <div className="admin-progress-bar">
                <div
                  className="admin-progress inactive"
                  style={{ width: `${100 - activePercentage}%` }}
                />
              </div>
            </div>
          </div>
          <div className="admin-quick-stats">
            <div className="admin-quick-stat">
              <div className="admin-quick-stat-value">{stats.projectsThisMonth}</div>
              <div className="admin-quick-stat-label">Projects this month</div>
            </div>
            <div className="admin-quick-stat">
              <div className="admin-quick-stat-value">{completionRate.toFixed(0)}%</div>
              <div className="admin-quick-stat-label">New project share</div>
            </div>
            <div className="admin-quick-stat">
              <div className="admin-quick-stat-value">{stats.newUsersThisMonth}</div>
              <div className="admin-quick-stat-label">New signups</div>
            </div>
          </div>
        </section>

        <section className="admin-section-card">
          <div className="admin-card-header">
            <h3>📁 Recent Projects</h3>
            <Link to="/admin/projects" className="admin-card-link">
              View All →
            </Link>
          </div>
          <div className="admin-recent-projects-list">
            {recentProjects.slice(0, 5).map((project) => (
              <div key={project.id} className="admin-recent-project-item">
                <div className="admin-project-icon">{sectorIcon(project.sector)}</div>
                <div className="admin-project-details">
                  <div className="admin-project-title">{project.name}</div>
                  <div className="admin-project-meta">
                    {project.user_name} • {project.sector}
                  </div>
                  <div className="admin-project-progress-bar">
                    <div
                      className="admin-progress-fill"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="admin-project-progress-value">{project.progress}%</div>
                <Link to={`/admin/projects/${project.id}`} className="admin-view-link">
                  View
                </Link>
              </div>
            ))}
            {recentProjects.length === 0 && (
              <div className="admin-empty-state">No projects found</div>
            )}
          </div>
        </section>
      </div>

      <section className="admin-section-card full-width">
        <div className="admin-card-header">
          <h3>📋 Recent Users</h3>
          <Link to="/admin/users" className="admin-card-link">
            Manage All →
          </Link>
        </div>
        <div className="admin-table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Projects</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id}>
                  <td className="admin-user-cell">
                    <div className="admin-user-avatar">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.full_name}</span>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`admin-role-badge ${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={`admin-plan-badge ${user.plan}`}>{user.plan}</span>
                  </td>
                  <td>{user.projects_count}</td>
                  <td>
                    <span className={`admin-status-badge ${user.status}`}>{user.status}</span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/admin/users/${user.id}`} className="admin-action-link">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section-card full-width">
        <div className="admin-card-header">
          <h3>📝 System Activity Log</h3>
          <Link to="/admin/logs" className="admin-card-link">
            View All →
          </Link>
        </div>
        <div className="admin-activity-list">
          {activities.slice(0, 10).map((activity) => (
            <div key={activity.id} className="admin-activity-item">
              <div className={`admin-activity-icon ${activity.target_type}`}>
                {activity.target_type === 'user' && '👤'}
                {activity.target_type === 'project' && '📁'}
                {activity.target_type === 'payment' && '💰'}
                {activity.target_type === 'system' && '⚙️'}
                {activity.target_type === 'experiment' && '🧪'}
                {activity.target_type === 'prototype' && '📦'}
              </div>
              <div className="admin-activity-content">
                <div className="admin-activity-text">
                  <strong>{activity.user_name}</strong> {activity.action}
                  {activity.target_name ? (
                    <span className="admin-activity-target"> &quot;{activity.target_name}&quot;</span>
                  ) : null}
                </div>
                <div className="admin-activity-time">{timeAgo(activity.created_at)}</div>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="admin-empty-state">No recent activity</div>
          )}
        </div>
      </section>

      <section className="admin-quick-nav-section">
        <h3>🔗 Quick Navigation</h3>
        <div className="admin-quick-nav-grid">
          {QUICK_NAV.map((item) => (
            <Link key={item.to} to={item.to} className="admin-quick-nav-card">
              <span className="admin-quick-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="admin-footer">
        <div>© 2025 Maylet XLab. All rights reserved.</div>
        <div className="admin-system-status">
          <span className="admin-status-dot" />
          System Online
        </div>
        <div className="admin-version">v2.0.0</div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
