import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface DashboardStats {
  totalUsers: number;
  totalProjects: number;
  totalExperiments: number;
  totalPrototypes: number;
  totalVaultItems: number;
  totalFundingPitches: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeUsers: number;
  newUsersThisMonth: number;
  projectsThisMonth: number;
  avgProjectProgress: number;
  totalMentors: number;
  totalInvestors: number;
  totalInnovators: number;
}

interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  plan: string;
  role: string;
  created_at: string;
  last_active: string;
  status: string;
  projects_count: number;
}

interface RecentProject {
  id: string;
  name: string;
  description: string;
  sector: string;
  progress: number;
  status: string;
  user_email: string;
  user_name: string;
  created_at: string;
}

interface SystemActivity {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  target_type: string;
  target_name: string;
  created_at: string;
}

// ============================================================
// SIDEBAR COMPONENT
// ============================================================
const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const mainMenu = [
    { icon: '📊', label: 'Dashboard', route: '/admin', active: true },
    { icon: '👥', label: 'Users', route: '/admin/users' },
    { icon: '💡', label: 'Innovators', route: '/admin/innovators' },
    { icon: '🎓', label: 'Mentors', route: '/admin/mentors' },
    { icon: '💰', label: 'Investors', route: '/admin/investors' },
    { icon: '📁', label: 'Projects', route: '/admin/projects' },
    { icon: '🧪', label: 'Experiments', route: '/admin/experiments' },
    { icon: '📦', label: 'Prototypes', route: '/admin/prototypes' },
    { icon: '🔐', label: 'Innovation Vault', route: '/admin/vault' },
    { icon: '📊', label: 'Subscriptions', route: '/admin/subscriptions' },
    { icon: '💵', label: 'Payments', route: '/admin/payments' },
    { icon: '📈', label: 'Analytics', route: '/admin/analytics' },
    { icon: '🤖', label: 'AI Monitor', route: '/admin/ai-monitor' },
    { icon: '📄', label: 'Reports', route: '/admin/reports' },
    { icon: '🔔', label: 'Notifications', route: '/admin/notifications' },
    { icon: '🛡️', label: 'Security', route: '/admin/security' },
    { icon: '⚖️', label: 'Moderation', route: '/admin/moderation' },
    { icon: '📡', label: 'System Monitor', route: '/admin/system-monitor' },
    { icon: '⚙️', label: 'Settings', route: '/admin/settings' },
  ];

  const userMenu = [
    { icon: '🔔', label: 'Notifications', route: '/notifications' },
    { icon: '⚙️', label: 'Settings', route: '/settings' },
    { icon: '👤', label: 'Profile', route: '/profile' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <button className="mobile-sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">✦</div>
          {!collapsed && (
            <div className="logo-text">
              <div className="logo-title">MAYLET X LAB</div>
              <div className="logo-tagline">Admin Portal</div>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {mainMenu.map((item) => (
            <Link key={item.label} to={item.route} className={`sidebar-link ${item.active ? 'active' : ''}`} title={collapsed ? item.label : undefined}>
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-divider"></div>
        <nav className="sidebar-nav user-nav">
          {userMenu.map((item) => (
            <Link key={item.label} to={item.route} className="sidebar-link" title={collapsed ? item.label : undefined}>
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
          <button onClick={handleLogout} className="sidebar-link logout-link">
            <span className="sidebar-icon">🚪</span>
            {!collapsed && <span className="sidebar-label">Sign Out</span>}
          </button>
        </nav>
      </aside>
      <style>{`
        .sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 98; display: none; }
        .mobile-sidebar-toggle { display: none; position: fixed; top: 1rem; left: 1rem; z-index: 100; background: #7c5fe6; border: none; color: white; font-size: 1.5rem; width: 48px; height: 48px; border-radius: 12px; cursor: pointer; }
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; background: #0a0d1a; color: rgba(255,255,255,0.7); display: flex; flex-direction: column; z-index: 99; transition: width 0.3s ease; overflow-y: auto; overflow-x: hidden; width: 280px; box-shadow: 2px 0 10px rgba(0,0,0,0.3); }
        .sidebar.collapsed { width: 80px; }
        .sidebar-logo { padding: 1.5rem 1rem; display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); position: relative; }
        .logo-icon { font-size: 2rem; font-weight: bold; background: linear-gradient(135deg, #7c5fe6, #2fd4ff); -webkit-background-clip: text; background-clip: text; color: transparent; min-width: 40px; text-align: center; }
        .logo-title { font-weight: 700; font-size: 1rem; color: white; }
        .logo-tagline { font-size: 0.65rem; color: rgba(255,255,255,0.5); }
        .sidebar-toggle { position: absolute; right: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; }
        .sidebar-nav { flex: 1; padding: 1rem 0; }
        .sidebar-link { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.2s; margin: 0.25rem 0.5rem; border-radius: 12px; background: none; border: none; width: calc(100% - 1rem); cursor: pointer; font-size: 0.9rem; }
        .sidebar-link:hover { background: rgba(124,95,230,0.2); color: white; }
        .sidebar-link.active { background: #7c5fe6; color: white; }
        .sidebar-icon { font-size: 1.25rem; min-width: 24px; text-align: center; }
        .sidebar-label { font-size: 0.85rem; white-space: nowrap; }
        .sidebar.collapsed .sidebar-label { display: none; }
        .sidebar.collapsed .sidebar-link { justify-content: center; padding: 0.75rem; }
        .sidebar-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 0.5rem 1rem; }
        .user-nav { margin-bottom: 1rem; }
        .logout-link { color: #fc8181; }
        .logout-link:hover { background: rgba(252,129,129,0.2); color: #fc8181; }
        @media (max-width: 768px) { .mobile-sidebar-toggle { display: block; } .sidebar { transform: translateX(-100%); width: 280px; } .sidebar.mobile-open { transform: translateX(0); } .sidebar-overlay { display: block; } }
      `}</style>
    </>
  );
};

// ============================================================
// STAT CARD COMPONENT
// ============================================================
const StatCard = ({ icon, label, value, trend, color, link, suffix = '' }: { 
  icon: string; 
  label: string; 
  value: number | string; 
  trend?: number; 
  color: string;
  link: string;
  suffix?: string;
}) => (
  <Link to={link} className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="stat-icon" style={{ background: `${color}20` }}>{icon}</div>
    <div className="stat-content">
      <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</div>
      <div className="stat-label">{label}</div>
      {trend !== undefined && (
        <div className={`stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  </Link>
);

// ============================================================
// MAIN ADMIN DASHBOARD COMPONENT
// ============================================================
const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('Admin');
  const [adminRole, setAdminRole] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProjects: 0,
    totalExperiments: 0,
    totalPrototypes: 0,
    totalVaultItems: 0,
    totalFundingPitches: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    projectsThisMonth: 0,
    avgProjectProgress: 0,
    totalMentors: 0,
    totalInvestors: 0,
    totalInnovators: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const navigate = useNavigate();

  // Fetch all dashboard data from Supabase
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Verify admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        navigate('/dashboard');
        return;
      }

      setAdminName(profile.full_name || session.user.email?.split('@')[0] || 'Admin');
      setAdminRole(profile.role);

      // ============================================================
      // FETCH ALL STATS FROM DATABASE
      // ============================================================

      // Total Users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total Projects
      const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Total Experiments
      const { count: totalExperiments } = await supabase
        .from('experiments')
        .select('*', { count: 'exact', head: true });

      // Total Prototypes
      const { count: totalPrototypes } = await supabase
        .from('prototypes')
        .select('*', { count: 'exact', head: true });

      // Total Vault Items
      const { count: totalVaultItems } = await supabase
        .from('vault_items')
        .select('*', { count: 'exact', head: true });

      // Total Funding Pitches
      const { count: totalFundingPitches } = await supabase
        .from('funding_pitches')
        .select('*', { count: 'exact', head: true });

      // Total Revenue
      const { data: payments } = await supabase
        .from('payments')
        .select('amount');
      
      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Monthly Revenue
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Active Users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', sevenDaysAgo.toISOString());

      // New Users This Month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString());

      // Projects This Month
      const { count: projectsThisMonth } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString());

      // Average Project Progress
      const { data: projects } = await supabase
        .from('projects')
        .select('progress');
      
      const avgProjectProgress = projects && projects.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
        : 0;

      // Total Mentors
      const { count: totalMentors } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'mentor');

      // Total Investors
      const { count: totalInvestors } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'investor');

      // Total Innovators
      const { count: totalInnovators } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'innovator');

      setStats({
        totalUsers: totalUsers || 0,
        totalProjects: totalProjects || 0,
        totalExperiments: totalExperiments || 0,
        totalPrototypes: totalPrototypes || 0,
        totalVaultItems: totalVaultItems || 0,
        totalFundingPitches: totalFundingPitches || 0,
        totalRevenue,
        monthlyRevenue,
        activeUsers: activeUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        projectsThisMonth: projectsThisMonth || 0,
        avgProjectProgress,
        totalMentors: totalMentors || 0,
        totalInvestors: totalInvestors || 0,
        totalInnovators: totalInnovators || 0,
      });

      // ============================================================
      // FETCH RECENT USERS
      // ============================================================
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, full_name, email, plan, role, created_at, last_active, status')
        .order('created_at', { ascending: false })
        .limit(10);

      if (usersData) {
        const usersWithProjects = await Promise.all(
          usersData.map(async (user) => {
            const { count: projectsCount } = await supabase
              .from('projects')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);
            
            return {
              id: user.id,
              full_name: user.full_name || user.email?.split('@')[0] || 'Unknown',
              email: user.email || '',
              plan: user.plan || 'free',
              role: user.role || 'user',
              created_at: user.created_at,
              last_active: user.last_active,
              status: user.status || 'pending',
              projects_count: projectsCount || 0,
            };
          })
        );
        setRecentUsers(usersWithProjects);
      }

      // ============================================================
      // FETCH RECENT PROJECTS
      // ============================================================
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, description, sector, progress, status, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (projectsData) {
        const projectsWithUsers = await Promise.all(
          projectsData.map(async (project) => {
            const { data: userData } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('id', project.user_id)
              .single();
            
            return {
              id: project.id,
              name: project.name,
              description: project.description,
              sector: project.sector,
              progress: project.progress,
              status: project.status,
              user_email: userData?.email || 'Unknown',
              user_name: userData?.full_name || userData?.email?.split('@')[0] || 'Unknown',
              created_at: project.created_at,
            };
          })
        );
        setRecentProjects(projectsWithUsers);
      }

      // ============================================================
      // FETCH RECENT ACTIVITIES
      // ============================================================
      const { data: activitiesData } = await supabase
        .from('activities')
        .select('id, user_name, user_email, action, target_type, target_name, created_at')
        .order('created_at', { ascending: false })
        .limit(15);

      setActivities(activitiesData || []);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Initial fetch and real-time subscriptions
  useEffect(() => {
    fetchDashboardData();

    const channels = [
      supabase.channel('admin_projects').on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' }, 
        () => fetchDashboardData()
      ),
      supabase.channel('admin_users').on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        () => fetchDashboardData()
      ),
      supabase.channel('admin_payments').on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payments' }, 
        () => fetchDashboardData()
      ),
      supabase.channel('admin_activities').on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'activities' }, 
        () => fetchDashboardData()
      ),
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [fetchDashboardData]);

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="admin-container">
        <Sidebar />
        <main className="admin-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading Admin Dashboard...</p>
            <p className="loading-sub">Fetching data from Supabase...</p>
          </div>
        </main>
      </div>
    );
  }

  // Calculate percentages
  const activePercentage = stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0;
  const completionRate = stats.totalProjects > 0 ? (stats.projectsThisMonth / stats.totalProjects) * 100 : 0;

  return (
    <div className="admin-container">
      <Sidebar />
      
      <main className="admin-main">
        {/* Header */}
        <div className="admin-header">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
            <p className="welcome-text">
              Welcome back, <strong>{adminName}</strong> ({adminRole})
            </p>
            <p className="subtitle">Here's what's happening in Maylet XLab today.</p>
          </div>
          <div className="header-right">
            <div className="last-updated">
              <span className="update-icon">🕐</span>
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
            <button onClick={() => fetchDashboardData()} className="btn-refresh">
              ⟳ Refresh
            </button>
            <Link to="/admin/reports/generate" className="btn-export">
              📊 Export Report
            </Link>
          </div>
        </div>

        {/* Stats Cards Row 1 */}
        <div className="stats-grid">
          <StatCard icon="👥" label="Total Users" value={stats.totalUsers} trend={12} color="#7c5fe6" link="/admin/users" />
          <StatCard icon="📁" label="Total Projects" value={stats.totalProjects} trend={8} color="#2fd4ff" link="/admin/projects" />
          <StatCard icon="🧪" label="Experiments" value={stats.totalExperiments} trend={15} color="#48bb78" link="/admin/experiments" />
          <StatCard icon="📦" label="Prototypes" value={stats.totalPrototypes} trend={10} color="#f6c90e" link="/admin/prototypes" />
        </div>

        {/* Stats Cards Row 2 */}
        <div className="stats-grid">
          <StatCard icon="🔐" label="Vault Items" value={stats.totalVaultItems} trend={5} color="#fc8181" link="/admin/vault" />
          <StatCard icon="💰" label="Funding Pitches" value={stats.totalFundingPitches} trend={22} color="#9b7ff0" link="/admin/funding" />
          <StatCard icon="💵" label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} trend={stats.monthlyRevenue > 0 ? 16 : 0} color="#48bb78" link="/admin/payments" />
          <StatCard icon="📈" label="Monthly Revenue" value={`$${stats.monthlyRevenue.toLocaleString()}`} trend={12} color="#2fd4ff" link="/admin/analytics" />
        </div>

        {/* Stats Cards Row 3 - Special Roles */}
        <div className="stats-grid">
          <StatCard icon="🎓" label="Mentors" value={stats.totalMentors} trend={8} color="#f6c90e" link="/admin/mentors" />
          <StatCard icon="💰" label="Investors" value={stats.totalInvestors} trend={15} color="#48bb78" link="/admin/investors" />
          <StatCard icon="💡" label="Innovators" value={stats.totalInnovators} trend={18} color="#7c5fe6" link="/admin/innovators" />
          <StatCard icon="📊" label="Avg Progress" value={`${stats.avgProjectProgress}%`} trend={5} color="#2fd4ff" link="/admin/projects" />
        </div>

        {/* User Status & Quick Stats Row */}
        <div className="two-columns">
          {/* User Status Breakdown */}
          <div className="section-card">
            <div className="card-header">
              <h3>👥 User Status</h3>
              <Link to="/admin/users" className="card-link">Manage →</Link>
            </div>
            <div className="status-bars">
              <div className="status-item">
                <div className="status-label">
                  <span>🟢 Active</span>
                  <span>{stats.activeUsers} ({activePercentage.toFixed(1)}%)</span>
                </div>
                <div className="progress-bar">
                  <div className="progress active" style={{ width: `${activePercentage}%` }}></div>
                </div>
              </div>
              <div className="status-item">
                <div className="status-label">
                  <span>⚪ Inactive</span>
                  <span>{stats.totalUsers - stats.activeUsers} ({(100 - activePercentage).toFixed(1)}%)</span>
                </div>
                <div className="progress-bar">
                  <div className="progress inactive" style={{ width: `${100 - activePercentage}%` }}></div>
                </div>
              </div>
            </div>
            <div className="quick-stats">
              <div className="quick-stat">
                <div className="quick-stat-value">{stats.projectsThisMonth}</div>
                <div className="quick-stat-label">Projects this month</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">{completionRate.toFixed(0)}%</div>
                <div className="quick-stat-label">Completion rate</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">{stats.newUsersThisMonth}</div>
                <div className="quick-stat-label">New signups</div>
              </div>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="section-card">
            <div className="card-header">
              <h3>📁 Recent Projects</h3>
              <Link to="/admin/projects" className="card-link">View All →</Link>
            </div>
            <div className="recent-projects-list">
              {recentProjects.slice(0, 5).map((project) => (
                <div key={project.id} className="recent-project-item">
                  <div className="project-icon">
                    {project.sector === 'Agriculture' && '🌾'}
                    {project.sector === 'Health' && '🏥'}
                    {project.sector === 'Education' && '📚'}
                    {project.sector === 'Blockchain' && '🔗'}
                    {project.sector === 'Environment' && '🌍'}
                    {!['Agriculture','Health','Education','Blockchain','Environment'].includes(project.sector) && '💡'}
                  </div>
                  <div className="project-details">
                    <div className="project-title">{project.name}</div>
                    <div className="project-meta">{project.user_name} • {project.sector}</div>
                    <div className="project-progress-bar">
                      <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                    </div>
                  </div>
                  <div className="project-progress-value">{project.progress}%</div>
                  <Link to={`/admin/projects/${project.id}`} className="view-link">View</Link>
                </div>
              ))}
              {recentProjects.length === 0 && <div className="empty-state">No projects found</div>}
            </div>
          </div>
        </div>

        {/* Recent Users Table */}
        <div className="section-card full-width">
          <div className="card-header">
            <h3>📋 Recent Users</h3>
            <Link to="/admin/users" className="card-link">Manage All →</Link>
          </div>
          <div className="table-responsive">
            <table className="data-table">
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
                    <td className="user-cell">
                      <div className="user-avatar">{user.full_name.charAt(0).toUpperCase()}</div>
                      <span>{user.full_name}</span>
                    </td>
                    <td>{user.email}</td>
                    <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                    <td><span className={`plan-badge ${user.plan}`}>{user.plan}</span></td>
                    <td>{user.projects_count}</td>
                    <td><span className={`status-badge ${user.status}`}>{user.status}</span></td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td><Link to={`/admin/users/${user.id}`} className="action-link">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Activity Log */}
        <div className="section-card full-width">
          <div className="card-header">
            <h3>📝 System Activity Log</h3>
            <Link to="/admin/logs" className="card-link">View All →</Link>
          </div>
          <div className="activity-list">
            {activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.target_type}`}>
                  {activity.target_type === 'user' && '👤'}
                  {activity.target_type === 'project' && '📁'}
                  {activity.target_type === 'payment' && '💰'}
                  {activity.target_type === 'system' && '⚙️'}
                  {activity.target_type === 'experiment' && '🧪'}
                  {activity.target_type === 'prototype' && '📦'}
                </div>
                <div className="activity-content">
                  <div className="activity-text">
                    <strong>{activity.user_name}</strong> {activity.action}
                    {activity.target_name && <span className="activity-target"> "{activity.target_name}"</span>}
                  </div>
                  <div className="activity-time">{timeAgo(activity.created_at)}</div>
                </div>
              </div>
            ))}
            {activities.length === 0 && <div className="empty-state">No recent activity</div>}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="quick-nav-section">
          <h3>🔗 Quick Navigation</h3>
          <div className="quick-nav-grid">
            <Link to="/admin/users" className="quick-nav-card">
              <span className="quick-nav-icon">👥</span>
              <span>Users</span>
            </Link>
            <Link to="/admin/projects" className="quick-nav-card">
              <span className="quick-nav-icon">📁</span>
              <span>Projects</span>
            </Link>
            <Link to="/admin/payments" className="quick-nav-card">
              <span className="quick-nav-icon">💵</span>
              <span>Payments</span>
            </Link>
            <Link to="/admin/analytics" className="quick-nav-card">
              <span className="quick-nav-icon">📈</span>
              <span>Analytics</span>
            </Link>
            <Link to="/admin/reports" className="quick-nav-card">
              <span className="quick-nav-icon">📄</span>
              <span>Reports</span>
            </Link>
            <Link to="/admin/settings" className="quick-nav-card">
              <span className="quick-nav-icon">⚙️</span>
              <span>Settings</span>
            </Link>
            <Link to="/admin/ai-monitor" className="quick-nav-card">
              <span className="quick-nav-icon">🤖</span>
              <span>AI Monitor</span>
            </Link>
            <Link to="/admin/security" className="quick-nav-card">
              <span className="quick-nav-icon">🛡️</span>
              <span>Security</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="admin-footer">
          <div className="footer-left">
            <span>© 2025 Maylet XLab. All rights reserved.</span>
          </div>
          <div className="footer-center">
            <span className="system-status online">
              <span className="status-dot"></span> System Online
            </span>
          </div>
          <div className="footer-right">
            <span className="version">v2.0.0</span>
          </div>
        </footer>
      </main>

      <style>{`
        .admin-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        
        .admin-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .admin-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 70vh;
          gap: 1rem;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(124,95,230,0.3);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .loading-sub {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .header-left h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, #ffffff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 0.25rem;
        }
        
        .welcome-text {
          color: rgba(255,255,255,0.8);
          margin-bottom: 0.25rem;
        }
        
        .welcome-text strong {
          color: #7c5fe6;
        }
        
        .subtitle {
          color: rgba(255,255,255,0.5);
          font-size: 0.85rem;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .last-updated {
          background: rgba(0,0,0,0.3);
          padding: 0.5rem 1rem;
          border-radius: 30px;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .btn-refresh, .btn-export {
          padding: 0.5rem 1.2rem;
          border-radius: 30px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .btn-refresh {
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          color: #9b7ff0;
        }
        
        .btn-refresh:hover {
          background: rgba(124,95,230,0.3);
        }
        
        .btn-export {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          color: #0a0d1a;
        }
        
        .btn-export:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(124,95,230,0.4);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .stat-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          text-decoration: none;
          transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.06);
        }
        
        .stat-card:hover {
          transform: translateY(-3px);
          background: rgba(0,0,0,0.6);
          border-color: rgba(124,95,230,0.3);
        }
        
        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        
        .stat-content {
          flex: 1;
        }
        
        .stat-value {
          font-size: 1.6rem;
          font-weight: 700;
          color: white;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
        }
        
        .stat-trend {
          font-size: 0.7rem;
          margin-top: 0.25rem;
        }
        
        .stat-trend.positive { color: #48bb78; }
        .stat-trend.negative { color: #fc8181; }
        
        .section-card {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .full-width {
          grid-column: 1 / -1;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .card-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .card-link {
          color: #7c5fe6;
          text-decoration: none;
          font-size: 0.8rem;
        }
        
        .card-link:hover {
          text-decoration: underline;
        }
        
        .two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        
        @media (max-width: 900px) {
          .two-columns {
            grid-template-columns: 1fr;
          }
        }
        
        .status-bars {
          margin-bottom: 1.5rem;
        }
        
        .status-item {
          margin-bottom: 1rem;
        }
        
        .status-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.7);
        }
        
        .progress-bar {
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .progress.active { background: linear-gradient(90deg, #48bb78, #38a169); }
        .progress.inactive { background: linear-gradient(90deg, #fc8181, #c53030); }
        
        .quick-stats {
          display: flex;
          justify-content: space-around;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .quick-stat {
          text-align: center;
        }
        
        .quick-stat-value {
          font-size: 1.3rem;
          font-weight: 700;
          color: #2fd4ff;
        }
        
        .quick-stat-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        
        .recent-projects-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .recent-project-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          transition: all 0.2s;
        }
        
        .recent-project-item:hover {
          background: rgba(255,255,255,0.06);
        }
        
        .project-icon {
          font-size: 1.5rem;
        }
        
        .project-details {
          flex: 1;
        }
        
        .project-title {
          font-weight: 500;
          font-size: 0.9rem;
        }
        
        .project-meta {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        
        .project-progress-bar {
          width: 100px;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 0.25rem;
        }
        
        .project-progress-bar .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c5fe6, #2fd4ff);
          border-radius: 2px;
        }
        
        .project-progress-value {
          font-size: 0.8rem;
          font-weight: 600;
          color: #2fd4ff;
        }
        
        .view-link {
          color: #7c5fe6;
          text-decoration: none;
          font-size: 0.75rem;
        }
        
        .table-responsive {
          overflow-x: auto;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .data-table th, .data-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .data-table th {
          color: rgba(255,255,255,0.6);
          font-weight: 500;
          font-size: 0.75rem;
        }
        
        .user-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .user-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.8rem;
        }
        
        .role-badge, .plan-badge, .status-badge {
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }
        
        .role-badge.admin, .role-badge.super_admin { background: rgba(124,95,230,0.2); color: #9b7ff0; }
        .role-badge.user { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
        .role-badge.mentor { background: rgba(47,212,255,0.2); color: #2fd4ff; }
        .role-badge.investor { background: rgba(72,187,120,0.2); color: #48bb78; }
        
        .plan-badge.free { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
        .plan-badge.pro { background: rgba(47,212,255,0.2); color: #2fd4ff; }
        .plan-badge.enterprise { background: rgba(124,95,230,0.2); color: #9b7ff0; }
        
        .status-badge.active { background: rgba(72,187,120,0.2); color: #48bb78; }
        .status-badge.inactive { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); }
        .status-badge.pending { background: rgba(246,201,14,0.2); color: #f6c90e; }
        .status-badge.banned { background: rgba(252,129,129,0.2); color: #fc8181; }
        
        .action-link {
          color: #7c5fe6;
          text-decoration: none;
          font-size: 0.75rem;
        }
        
        .action-link:hover {
          text-decoration: underline;
        }
        
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .activity-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
        }
        
        .activity-icon {
          width: 36px;
          height: 36px;
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        
        .activity-icon.user { background: rgba(124,95,230,0.2); }
        .activity-icon.project { background: rgba(47,212,255,0.2); }
        .activity-icon.payment { background: rgba(72,187,120,0.2); }
        .activity-icon.system { background: rgba(246,201,14,0.2); }
        
        .activity-content {
          flex: 1;
        }
        
        .activity-text {
          font-size: 0.8rem;
        }
        
        .activity-target {
          color: #2fd4ff;
        }
        
        .activity-time {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.4);
          margin-top: 0.25rem;
        }
        
        .empty-state {
          text-align: center;
          padding: 2rem;
          color: rgba(255,255,255,0.4);
        }
        
        .quick-nav-section {
          margin-bottom: 1.5rem;
        }
        
        .quick-nav-section h3 {
          margin-bottom: 1rem;
          font-size: 1rem;
        }
        
        .quick-nav-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 0.75rem;
        }
        
        @media (max-width: 1000px) {
          .quick-nav-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        @media (max-width: 500px) {
          .quick-nav-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        .quick-nav-card {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: rgba(255,255,255,0.7);
          transition: all 0.2s;
        }
        
        .quick-nav-card:hover {
          background: rgba(124,95,230,0.15);
          border-color: rgba(124,95,230,0.3);
          transform: translateY(-2px);
        }
        
        .quick-nav-icon {
          font-size: 1.3rem;
        }
        
        .quick-nav-card span:last-child {
          font-size: 0.7rem;
        }
        
        .admin-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1.5rem;
          margin-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .system-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          background: #48bb78;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .version {
          background: rgba(255,255,255,0.05);
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;