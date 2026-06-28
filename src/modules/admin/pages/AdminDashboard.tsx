// src/modules/admin/pages/AdminDashboard.tsx
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
  // ── Hook ──
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

  // ── Debug: angalia data ──
  console.log('[AdminDashboard] stats:', stats);
  console.log('[AdminDashboard] recentUsers:', recentUsers);
  console.log('[AdminDashboard] recentProjects:', recentProjects);

  // ── Loading state ──
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

  // ── Guard: hakikisha stats zipo ──
  const safeStats = stats || {
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    totalProjects: 0,
    projectsThisMonth: 0,
    totalExperiments: 0,
    totalPrototypes: 0,
    totalVaultItems: 0,
    totalFundingPitches: 0,
    fundingPitchesThisMonth: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalMentors: 0,
    totalInvestors: 0,
    totalInnovators: 0,
    avgProjectProgress: 0,
  };

  const activePercentage =
    safeStats.totalUsers > 0 ? (safeStats.activeUsers / safeStats.totalUsers) * 100 : 0;
  const completionRate =
    safeStats.totalProjects > 0 ? (safeStats.projectsThisMonth / safeStats.totalProjects) * 100 : 0;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-welcome-text">
            Welcome back, <strong>{adminName || 'Admin'}</strong> ({adminRole || 'admin'})
          </p>
          <p className="admin-subtitle">Here&apos;s what&apos;s happening in Maylet XLab today.</p>
        </div>
        <div className="admin-header-actions">
          <div className="admin-last-updated">
            <span aria-hidden>🕐</span>
            <span>Last updated: {lastUpdated?.toLocaleTimeString?.() || 'now'}</span>
          </div>
          <button
            type="button"
            onClick={() => refresh?.()}
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

      {/* ── Stats Row 1 ── */}
      <div className="admin-stats-grid">
        <AdminStatCard
          icon="👥"
          label="Total Users"
          value={safeStats.totalUsers}
          hint={monthHint(safeStats.newUsersThisMonth, 'signups')}
          color="#7c5fe6"
          link="/admin/users"
        />
        <AdminStatCard
          icon="📁"
          label="Total Projects"
          value={safeStats.totalProjects}
          hint={monthHint(safeStats.projectsThisMonth, 'new')}
          color="#2fd4ff"
          link="/admin/projects"
        />
        <AdminStatCard
          icon="🧪"
          label="Experiments"
          value={safeStats.totalExperiments}
          color="#48bb78"
          link="/admin/experiments"
        />
        <AdminStatCard
          icon="📦"
          label="Prototypes"
          value={safeStats.totalPrototypes}
          color="#f6c90e"
          link="/admin/prototypes"
        />
      </div>

      {/* ── Stats Row 2 ── */}
      <div className="admin-stats-grid">
        <AdminStatCard
          icon="🔐"
          label="Vault Items"
          value={safeStats.totalVaultItems}
          color="#fc8181"
          link="/admin/vault"
        />
        <AdminStatCard
          icon="💰"
          label="Funding Pitches"
          value={safeStats.totalFundingPitches}
          hint={monthHint(safeStats.fundingPitchesThisMonth, 'pitches')}
          color="#9b7ff0"
          link="/admin/analytics"
        />
        <AdminStatCard
          icon="💵"
          label="Total Revenue"
          value={`$${safeStats.totalRevenue.toLocaleString()}`}
          color="#48bb78"
          link="/admin/payments"
        />
        <AdminStatCard
          icon="📈"
          label="30-Day Revenue"
          value={`$${safeStats.monthlyRevenue.toLocaleString()}`}
          hint={safeStats.monthlyRevenue > 0 ? 'Last 30 days' : undefined}
          color="#2fd4ff"
          link="/admin/analytics"
        />
      </div>

      {/* ── Stats Row 3 ── */}
      <div className="admin-stats-grid">
        <AdminStatCard
          icon="🎓"
          label="Mentors"
          value={safeStats.totalMentors}
          color="#f6c90e"
          link="/admin/mentors"
        />
        <AdminStatCard
          icon="💰"
          label="Investors"
          value={safeStats.totalInvestors}
          color="#48bb78"
          link="/admin/investors"
        />
        <AdminStatCard
          icon="💡"
          label="Innovators"
          value={safeStats.totalInnovators}
          color="#7c5fe6"
          link="/admin/innovators"
        />
        <AdminStatCard
          icon="📊"
          label="Avg Progress"
          value={`${safeStats.avgProjectProgress}%`}
          color="#2fd4ff"
          link="/admin/projects"
        />
      </div>

      {/* ── Two columns ── */}
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
                  {safeStats.activeUsers} ({activePercentage.toFixed(1)}%)
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
                  {safeStats.totalUsers - safeStats.activeUsers} ({(100 - activePercentage).toFixed(1)}%)
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
              <div className="admin-quick-stat-value">{safeStats.projectsThisMonth}</div>
              <div className="admin-quick-stat-label">Projects this month</div>
            </div>
            <div className="admin-quick-stat">
              <div className="admin-quick-stat-value">{completionRate.toFixed(0)}%</div>
              <div className="admin-quick-stat-label">New project share</div>
            </div>
            <div className="admin-quick-stat">
              <div className="admin-quick-stat-value">{safeStats.newUsersThisMonth}</div>
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
            {recentProjects && recentProjects.length > 0 ? (
              recentProjects.slice(0, 5).map((project) => (
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
              ))
            ) : (
              <div className="admin-empty-state">No projects found</div>
            )}
          </div>
        </section>
      </div>

      {/* ── Recent Users ── */}
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
              {recentUsers && recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="admin-user-cell">
                      <div className="admin-user-avatar">
                        {user.full_name?.charAt(0).toUpperCase() || '?'}
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
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="admin-empty-state">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Activity Log ── */}
      <section className="admin-section-card full-width">
        <div className="admin-card-header">
          <h3>📝 System Activity Log</h3>
          <Link to="/admin/logs" className="admin-card-link">
            View All →
          </Link>
        </div>
        <div className="admin-activity-list">
          {activities && activities.length > 0 ? (
            activities.slice(0, 10).map((activity) => (
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
            ))
          ) : (
            <div className="admin-empty-state">No recent activity</div>
          )}
        </div>
      </section>

      {/* ── Quick Nav ── */}
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