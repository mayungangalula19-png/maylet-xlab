// C:\Users\user\maylet-xlab\src\app\routes\Analytics.tsx
// PROFESSIONAL ANALYTICS DASHBOARD – Stats, charts, activity timeline

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// ============================================================
// TYPES
// ============================================================
interface DashboardStats {
  totalProjects: number;
  totalExperiments: number;
  totalPrototypes: number;
  totalTeamMembers: number;
  totalFundingPitches: number;
  totalAIAnalyses: number;
}

interface MonthlyActivity {
  month: string;
  projects: number;
  experiments: number;
}

// ============================================================
// SIDEBAR (consistent with other pages)
// ============================================================
const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const mainMenu = [
    { icon: '📊', label: 'Dashboard', route: '/dashboard' },
    { icon: '📁', label: 'Projects', route: '/projects' },
    { icon: '🧪', label: 'Experiments', route: '/experiments' },
    { icon: '🤖', label: 'AI Assistant', route: '/ai-assistant' },
    { icon: '📦', label: 'Prototypes', route: '/prototypes' },
    { icon: '👥', label: 'Teams', route: '/teams' },
    { icon: '📄', label: 'Documents', route: '/documents' },
    { icon: '🔐', label: 'Innovation Vault', route: '/vault' },
    { icon: '💰', label: 'Funding Hub', route: '/funding' },
    { icon: '🎓', label: 'Mentorship', route: '/mentorship' },
    { icon: '🏢', label: 'Enterprise', route: '/enterprise' },
    { icon: '🏆', label: 'Hackathons', route: '/hackathons' },
    { icon: '📚', label: 'Learning Hub', route: '/learning' },
    { icon: '📈', label: 'Analytics', route: '/analytics', active: true },
    { icon: '🛒', label: 'Marketplace', route: '/marketplace' },
    { icon: '💬', label: 'Feedback', route: '/feedback' },
    { icon: '🛠️', label: 'Help & Support', route: '/help' },
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
              <div className="logo-tagline">Innovate. Build. Scale.</div>
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
// ANALYTICS PAGE
// ============================================================
const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalExperiments: 0,
    totalPrototypes: 0,
    totalTeamMembers: 0,
    totalFundingPitches: 0,
    totalAIAnalyses: 0,
  });
  const [monthlyActivity, setMonthlyActivity] = useState<MonthlyActivity[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login');
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const fetchAnalytics = useCallback(async () => {
    if (!userId) return;

    // Fetch counts from different tables
    const [
      { count: projectsCount },
      { count: experimentsCount },
      { count: prototypesCount },
      { count: teamMembersCount },
      { count: fundingPitchesCount },
      { count: aiAnalysesCount },
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('experiments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('prototypes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('funding_pitches').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('ai_analyses').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    setStats({
      totalProjects: projectsCount || 0,
      totalExperiments: experimentsCount || 0,
      totalPrototypes: prototypesCount || 0,
      totalTeamMembers: teamMembersCount || 0,
      totalFundingPitches: fundingPitchesCount || 0,
      totalAIAnalyses: aiAnalysesCount || 0,
    });

    // Fetch monthly activity (last 6 months)
    const today = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }

    const activityData: MonthlyActivity[] = [];
    for (const month of months) {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      const { count: projCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      const { count: expCount } = await supabase
        .from('experiments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      activityData.push({
        month: new Date(month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        projects: projCount || 0,
        experiments: expCount || 0,
      });
    }
    setMonthlyActivity(activityData);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) fetchAnalytics();
  }, [userId, fetchAnalytics]);

  // Bar chart data for monthly activity
  const barChartData = {
    labels: monthlyActivity.map(m => m.month),
    datasets: [
      {
        label: 'Projects',
        data: monthlyActivity.map(m => m.projects),
        backgroundColor: 'rgba(124, 95, 230, 0.6)',
        borderColor: '#7c5fe6',
        borderWidth: 1,
      },
      {
        label: 'Experiments',
        data: monthlyActivity.map(m => m.experiments),
        backgroundColor: 'rgba(47, 212, 255, 0.6)',
        borderColor: '#2fd4ff',
        borderWidth: 1,
      },
    ],
  };

  // Doughnut chart data for distribution
  const doughnutData = {
    labels: ['Projects', 'Experiments', 'Prototypes', 'Team Members', 'Funding Pitches'],
    datasets: [
      {
        data: [
          stats.totalProjects,
          stats.totalExperiments,
          stats.totalPrototypes,
          stats.totalTeamMembers,
          stats.totalFundingPitches,
        ],
        backgroundColor: [
          '#7c5fe6',
          '#2fd4ff',
          '#48bb78',
          '#f6c90e',
          '#fc8181',
        ],
        borderWidth: 0,
      },
    ],
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <Sidebar />
        <main className="analytics-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <Sidebar />
      <main className="analytics-main">
        <div className="analytics-header">
          <h1>📊 Analytics Dashboard</h1>
          <p>Track your innovation journey with real‑time metrics</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon">📁</div><div className="stat-value">{stats.totalProjects}</div><div className="stat-label">Projects</div></div>
          <div className="stat-card"><div className="stat-icon">🧪</div><div className="stat-value">{stats.totalExperiments}</div><div className="stat-label">Experiments</div></div>
          <div className="stat-card"><div className="stat-icon">📦</div><div className="stat-value">{stats.totalPrototypes}</div><div className="stat-label">Prototypes</div></div>
          <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{stats.totalTeamMembers}</div><div className="stat-label">Team Members</div></div>
          <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-value">{stats.totalFundingPitches}</div><div className="stat-label">Funding Pitches</div></div>
          <div className="stat-card"><div className="stat-icon">🤖</div><div className="stat-value">{stats.totalAIAnalyses}</div><div className="stat-label">AI Analyses</div></div>
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          <div className="chart-card">
            <h3>Monthly Activity (Last 6 months)</h3>
            <Bar data={barChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </div>
          <div className="chart-card">
            <h3>Overall Distribution</h3>
            <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>

        {/* Recent Activity Timeline (simulated) */}
        <div className="timeline-card">
          <h3>Recent Activity</h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-title">Latest project created</div>
                <div className="timeline-date">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-title">AI analysis completed</div>
                <div className="timeline-date">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .analytics-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .analytics-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .analytics-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .analytics-header {
          margin-bottom: 2rem;
        }
        .analytics-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .stat-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .stat-icon { font-size: 2rem; }
        .stat-value { font-size: 1.5rem; font-weight: 700; }
        .stat-label { font-size: 0.7rem; color: rgba(255,255,255,0.6); }
        .charts-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 900px) {
          .charts-row {
            grid-template-columns: 1fr;
          }
        }
        .chart-card, .timeline-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1rem;
        }
        .timeline {
          margin-top: 1rem;
        }
        .timeline-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .timeline-dot {
          width: 10px;
          height: 10px;
          background: #2fd4ff;
          border-radius: 50%;
          margin-top: 0.25rem;
        }
        .timeline-content {
          flex: 1;
        }
        .timeline-title {
          font-weight: 600;
        }
        .timeline-date {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        .loading-spinner {
          width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6;
          border-radius: 50%; animation: spin 1s linear infinite; margin: 20% auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Analytics;