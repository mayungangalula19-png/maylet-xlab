// C:\Users\user\maylet-xlab\src\app\routes\Dashboard.tsx
// FULL PRODUCTION CODE – Maylet XLab Dashboard with Supabase
// ALL 20+ LINKS ARE REAL AND CLICKABLE – LOGO ADDED – FULLY RESPONSIVE (MOBILE FRIENDLY)

import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { fetchOwnedTeamIds } from '../../lib/supabase/dbHelpers';
import { useAuthContext } from '../../contexts/AuthContext';
import { getCached, setCached, invalidateCache } from '../../lib/utils/queryCache';
import { EMPTY, formatCount } from '../../lib/innovation/dashboardData';

// ============================================================
// TYPES
// ============================================================
interface Project {
  id: string;
  name: string;
  description: string;
  sector: string;
  progress: number;
  status: 'Idea' | 'Experiment' | 'Prototype' | 'Launched';
  created_at: string;
  user_id: string;
}

interface Activity {
  id: string;
  type: 'experiment' | 'prototype' | 'team' | 'vault' | 'funding';
  title: string;
  project_name: string;
  created_at: string;
  user_name: string;
}

interface DashboardStats {
  totalProjects: number;
  totalExperiments: number;
  totalDocuments: number;
  totalTeamMembers: number;
  totalFundingPitches: number;
  totalVaultEntries: number;
}

// ============================================================
// STAT CARD COMPONENT
// ============================================================
const StatCard = memo(function StatCard({ icon, label, value, route }: {
  icon: string;
  label: string;
  value: number;
  route: string;
}) {
  const display = value > 0 ? value.toLocaleString() : EMPTY.NO_DATA;
  const status = value > 0 ? 'Recorded in database' : EMPTY.COMPLETE_SETUP;

  return (
  <Link to={route} className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <div className="stat-value">{display}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-status">{status}</div>
    </div>
  </Link>
  );
});

// ============================================================
// RECENT PROJECT CARD
// ============================================================
const RecentProjectCard = memo(function RecentProjectCard({ project }: { project: Project }) {
  const getIcon = (sector: string) => {
    if (sector.includes('Agri') || sector.includes('Farming')) return '🌾';
    if (sector.includes('Blockchain')) return '🔗';
    if (sector.includes('Health')) return '🏥';
    if (sector.includes('Education')) return '📚';
    if (sector.includes('Environment')) return '🌍';
    return '💡';
  };

  return (
    <Link to={`/projects/${project.id}`} className="project-card">
      <div className="project-header">
        <span className="project-icon">{getIcon(project.sector)}</span>
        <div className="project-info">
          <div className="project-name">{project.name}</div>
          <div className="project-sector">{project.sector}</div>
        </div>
      </div>
      <div className="project-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
        </div>
        <div className="progress-percent">{project.progress}%</div>
      </div>
      <div className="project-status">
        <span className={`status-badge status-${project.status.toLowerCase()}`}>
          {project.status}
        </span>
        <span className="project-date">{new Date(project.created_at).toLocaleDateString()}</span>
      </div>
    </Link>
  );
});

// ============================================================
// ACTIVITY ITEM
// ============================================================
const ActivityItem = memo(function ActivityItem({ activity }: { activity: Activity }) {
  const iconMap = {
    experiment: '🧪',
    prototype: '📦',
    team: '👥',
    vault: '🔐',
    funding: '💰',
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="activity-item">
      <div className="activity-icon">{iconMap[activity.type] || '📌'}</div>
      <div className="activity-content">
        <div className="activity-title">
          <strong>{activity.user_name}</strong> {activity.title}
        </div>
        <div className="activity-project">{activity.project_name}</div>
        <div className="activity-time">{timeAgo(activity.created_at)}</div>
      </div>
    </div>
  );
});

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================
const Dashboard = () => {
  const { user, loading: authLoading } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalExperiments: 0,
    totalDocuments: 0,
    totalTeamMembers: 0,
    totalFundingPitches: 0,
    totalVaultEntries: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const navigate = useNavigate();

  const userName = user?.user_metadata?.full_name as string | undefined
    || user?.email?.split('@')[0]
    || 'Innovator';
  const userEmail = user?.email || '';

  const fetchDashboardData = useCallback(async (userId: string, skipCache = false) => {
    const cacheKey = `dashboard:${userId}`;
    if (!skipCache) {
      const cached = getCached<{
        stats: DashboardStats;
        recentProjects: Project[];
        activities: Activity[];
      }>(cacheKey);
      if (cached) {
        setStats(cached.stats);
        setRecentProjects(cached.recentProjects);
        setActivities(cached.activities);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const [
        { count: projectsCount },
        { count: experimentsCount },
        { count: documentsCount },
        ownedTeamIds,
        { count: fundingCount },
        { count: vaultCount },
        { data: projects },
        { data: activitiesData },
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('experiments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        fetchOwnedTeamIds(userId),
        supabase.from('funding_pitches').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('vault_entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      ]);

      const nextStats = {
        totalProjects: projectsCount || 0,
        totalExperiments: experimentsCount || 0,
        totalDocuments: documentsCount || 0,
        totalTeamMembers: ownedTeamIds.length,
        totalFundingPitches: fundingCount || 0,
        totalVaultEntries: vaultCount || 0,
      };
      const nextProjects = (projects as Project[]) || [];
      const nextActivities = (activitiesData as Activity[]) || [];

      setStats(nextStats);
      setRecentProjects(nextProjects);
      setActivities(nextActivities);
      setCached(cacheKey, { stats: nextStats, recentProjects: nextProjects, activities: nextActivities });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    fetchDashboardData(user.id);

    let refetchTimer: ReturnType<typeof setTimeout> | undefined;
    const debouncedRefetch = () => {
      clearTimeout(refetchTimer);
      refetchTimer = setTimeout(() => {
        invalidateCache(`dashboard:${user.id}`);
        fetchDashboardData(user.id, true);
      }, 800);
    };

    const channel = supabase.channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, debouncedRefetch)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, debouncedRefetch)
      .subscribe();

    return () => {
      clearTimeout(refetchTimer);
      channel.unsubscribe();
    };
  }, [authLoading, user, navigate, fetchDashboardData]);

  const { inProgressCount, completedCount, onHoldCount, notStartedCount, avgProgress } = useMemo(() => {
    const inProgress = recentProjects.filter(p => p.status !== 'Launched' && p.progress < 100).length;
    const completed = recentProjects.filter(p => p.progress === 100).length;
    const onHold = recentProjects.filter(p => p.status === 'Idea').length;
    const notStarted = recentProjects.filter(p => p.progress === 0).length;
    const avg = recentProjects.length > 0
      ? Math.round(recentProjects.reduce((acc, p) => acc + p.progress, 0) / recentProjects.length)
      : 0;
    return {
      inProgressCount: inProgress,
      completedCount: completed,
      onHoldCount: onHold,
      notStartedCount: notStarted,
      avgProgress: avg,
    };
  }, [recentProjects]);

  if (loading || authLoading) {
    return (
      <div className="dashboard-container">
        <main className="dashboard-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        </main>
        <style>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 70vh;
          }
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(124,95,230,0.3);
            border-top-color: #7c5fe6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <div className="welcome-section">
          <div>
            <h1>Welcome back, {userName}! 🎉</h1>
            <p>Operational overview — all figures from database records.</p>
            <p className="user-email">{userEmail}</p>
          </div>
          <Link to="/projects?create=1" className="new-project-btn">+ New Project</Link>
        </div>

        <div className="stats-grid">
          <StatCard icon="📁" label="Projects" value={stats.totalProjects} route="/projects" />
          <StatCard icon="📄" label="Documents" value={stats.totalDocuments} route="/research" />
          <StatCard icon="🧪" label="Experiments" value={stats.totalExperiments} route="/experiments" />
          <StatCard icon="💰" label="Funding Pitches" value={stats.totalFundingPitches} route="/funding" />
          <StatCard icon="🔐" label="Vault Entries" value={stats.totalVaultEntries} route="/vault" />
          <StatCard icon="👥" label="Team Members" value={stats.totalTeamMembers} route="/teams" />
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-left">
            <div className="card">
              <div className="card-header">
                <h3>📊 Project Progress Overview</h3>
                <Link to="/projects" className="card-link">View all projects →</Link>
              </div>
              <div className="progress-stats">
                <div className="progress-stat">
                  <div className="progress-stat-label">In Progress</div>
                  <div className="progress-stat-value">{inProgressCount} projects</div>
                  <div className="progress-stat-bar">
                    <div className="progress-stat-fill" style={{ width: recentProjects.length ? `${(inProgressCount / recentProjects.length) * 100}%` : '0%' }}></div>
                  </div>
                </div>
                <div className="progress-stat">
                  <div className="progress-stat-label">Completed</div>
                  <div className="progress-stat-value">{completedCount} projects</div>
                  <div className="progress-stat-bar">
                    <div className="progress-stat-fill completed-fill" style={{ width: recentProjects.length ? `${(completedCount / recentProjects.length) * 100}%` : '0%' }}></div>
                  </div>
                </div>
                <div className="progress-stat">
                  <div className="progress-stat-label">On Hold</div>
                  <div className="progress-stat-value">{onHoldCount} projects</div>
                  <div className="progress-stat-bar">
                    <div className="progress-stat-fill onhold-fill" style={{ width: recentProjects.length ? `${(onHoldCount / recentProjects.length) * 100}%` : '0%' }}></div>
                  </div>
                </div>
                <div className="progress-stat">
                  <div className="progress-stat-label">Not Started</div>
                  <div className="progress-stat-value">{notStartedCount} projects</div>
                  <div className="progress-stat-bar">
                    <div className="progress-stat-fill notstarted-fill" style={{ width: recentProjects.length ? `${(notStartedCount / recentProjects.length) * 100}%` : '0%' }}></div>
                  </div>
                </div>
              </div>
              <div className="avg-progress">
                <span>Average recorded progress</span>
                <strong>{recentProjects.length > 0 ? `${avgProgress}%` : EMPTY.NO_DATA}</strong>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>📁 Recent Projects</h3>
                <Link to="/projects" className="card-link">View all →</Link>
              </div>
              <div className="projects-list">
                {recentProjects.length === 0 ? (
                  <p className="empty-state">No projects yet. Create your first project!</p>
                ) : (
                  recentProjects.map((project) => <RecentProjectCard key={project.id} project={project} />)
                )}
              </div>
              {recentProjects.length === 0 && (
                <Link to="/projects?create=1" className="empty-create-btn">+ Create Your First Project</Link>
              )}
            </div>
          </div>

          <div className="dashboard-right">
            <div className="card">
              <div className="card-header">
                <h3>Operational Status</h3>
                <Link to="/projects" className="card-link">Command Center →</Link>
              </div>
              <div className="ops-status-rows">
                <div className="ops-status-row"><span>Research documents</span><strong>{formatCount(stats.totalDocuments)}</strong></div>
                <div className="ops-status-row"><span>Experiments</span><strong>{formatCount(stats.totalExperiments)}</strong></div>
                <div className="ops-status-row"><span>Funding pitches</span><strong>{formatCount(stats.totalFundingPitches)}</strong></div>
                <div className="ops-status-row"><span>Vault entries</span><strong>{formatCount(stats.totalVaultEntries)}</strong></div>
                <div className="ops-status-row"><span>Team members</span><strong>{formatCount(stats.totalTeamMembers)}</strong></div>
              </div>
              {stats.totalProjects === 0 ? (
                <p className="empty-state">{EMPTY.COMPLETE_SETUP}</p>
              ) : (
                <Link to="/ai-assistant/analyze" className="ai-analyze-btn">Run MAYA Analysis →</Link>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3>👥 Team Activity</h3>
                <Link to="/teams" className="card-link">View all →</Link>
              </div>
              <div className="activities-list">
                {activities.length === 0 ? (
                  <p className="empty-state">No recent activity. Start collaborating!</p>
                ) : (
                  activities.map((activity) => <ActivityItem key={activity.id} activity={activity} />)
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Activity Record</h3>
                <Link to="/projects" className="card-link">View timeline →</Link>
              </div>
              {activities.length === 0 ? (
                <p className="empty-state">{EMPTY.NO_DATA}</p>
              ) : (
                <p className="ops-activity-summary">
                  <strong>{activities.length}</strong> recent activities recorded in the database.
                </p>
              )}
            </div>
          </div>
        </div>

        <footer className="dashboard-footer">
          <p>© 2025 Maylet XLab. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/help">Help Center</Link>
            <Link to="/status">System Status</Link>
          </div>
        </footer>
      </main>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0a0a0f, #1a1a2e); color: white; }

        .dashboard-container { display: flex; min-height: 100vh; }
        .dashboard-main {
          flex: 1;
          margin-left: 0;
          padding: 1.5rem 2rem;
          transition: margin-left 0.3s ease;
        }

        /* ========== RESPONSIVE FOR MOBILE ========== */
        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
          .welcome-section {
            flex-direction: column;
            align-items: flex-start;
          }
          .welcome-section h1 {
            font-size: 1.4rem;
          }
          .new-project-btn {
            width: 100%;
            text-align: center;
          }
          .stats-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem;
          }
          .stat-card {
            padding: 0.75rem;
          }
          .stat-value {
            font-size: 1.4rem;
          }
          .dashboard-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .card {
            padding: 1rem;
          }
          .card-header h3 {
            font-size: 1rem;
          }
          .projects-list {
            gap: 0.75rem;
          }
          .project-card {
            padding: 0.75rem;
          }
          .project-name {
            font-size: 0.9rem;
          }
          .progress-stat-value {
            font-size: 0.8rem;
          }
          .ai-message {
            font-size: 0.8rem;
          }
          .footer-links {
            flex-wrap: wrap;
            justify-content: center;
          }
          .dashboard-footer {
            flex-direction: column;
            text-align: center;
            gap: 0.5rem;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Welcome Section */
        .welcome-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .welcome-section h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .welcome-section p {
          color: rgba(255,255,255,0.7);
          margin-top: 0.25rem;
        }
        .user-email {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.4);
        }
        .new-project-btn {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          padding: 0.75rem 1.5rem;
          border-radius: 40px;
          color: #0a0d1a;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          display: inline-block;
        }
        .new-project-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124,95,230,0.4);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          background: rgba(0,0,0,0.7);
          border-color: rgba(124,95,230,0.3);
        }
        .stat-icon { font-size: 2rem; }
        .stat-content { flex: 1; }
        .stat-value { font-size: 1.8rem; font-weight: 700; color: white; }
        .stat-label { font-size: 0.8rem; color: rgba(255,255,255,0.6); }
        .stat-status { font-size: 0.7rem; color: rgba(255,255,255,0.45); }

        /* Dashboard Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        /* Cards */
        .card {
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .card-header h3 { font-size: 1.1rem; }
        .card-link { color: #7c5fe6; text-decoration: none; font-size: 0.8rem; }
        .card-link:hover { text-decoration: underline; }

        /* Progress Stats */
        .progress-stats { margin-bottom: 1rem; }
        .progress-stat { margin-bottom: 0.75rem; }
        .progress-stat-label { font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-bottom: 0.25rem; }
        .progress-stat-value { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.25rem; }
        .progress-stat-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
        .progress-stat-fill { height: 100%; background: linear-gradient(90deg, #7c5fe6, #2fd4ff); border-radius: 3px; }
        .completed-fill { background: linear-gradient(90deg, #48bb78, #38a169); }
        .onhold-fill { background: linear-gradient(90deg, #f6c90e, #ecc30b); }
        .notstarted-fill { background: #fc8181; }
        .avg-progress { display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem; }
        .avg-progress strong { font-size: 1.2rem; color: #2fd4ff; }

        /* Projects List */
        .projects-list { display: flex; flex-direction: column; gap: 1rem; }
        .project-card {
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          padding: 1rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
          display: block;
        }
        .project-card:hover { background: rgba(255,255,255,0.08); transform: translateX(4px); }
        .project-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
        .project-icon { font-size: 1.5rem; }
        .project-name { font-weight: 600; }
        .project-sector { font-size: 0.7rem; color: rgba(255,255,255,0.5); }
        .project-progress { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
        .progress-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #7c5fe6, #2fd4ff); border-radius: 3px; }
        .progress-percent { font-size: 0.75rem; color: rgba(255,255,255,0.7); }
        .project-status { display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; }
        .status-badge { padding: 0.2rem 0.5rem; border-radius: 20px; background: rgba(255,255,255,0.1); }
        .status-idea { background: rgba(246,201,14,0.2); color: #f6c90e; }
        .status-experiment { background: rgba(47,212,255,0.2); color: #2fd4ff; }
        .status-prototype { background: rgba(124,95,230,0.2); color: #7c5fe6; }
        .status-launched { background: rgba(72,187,120,0.2); color: #48bb78; }
        .empty-state { text-align: center; color: rgba(255,255,255,0.5); padding: 2rem; }
        .empty-create-btn {
          display: block;
          text-align: center;
          margin-top: 1rem;
          padding: 0.75rem;
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 12px;
          color: #7c5fe6;
          text-decoration: none;
          transition: all 0.2s;
        }
        .empty-create-btn:hover { background: rgba(124,95,230,0.3); }

        .ops-status-rows { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
        .ops-status-row { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .ops-status-row span { color: rgba(255,255,255,0.6); }
        .ops-activity-summary { font-size: 0.85rem; color: rgba(255,255,255,0.8); }
        .ai-analyze-btn {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(124,95,230,0.3);
          border: 1px solid rgba(124,95,230,0.5);
          border-radius: 30px;
          color: white;
          text-decoration: none;
          font-size: 0.75rem;
          transition: all 0.2s;
        }
        .ai-analyze-btn:hover { background: #7c5fe6; }

        /* Activities */
        .activities-list { display: flex; flex-direction: column; gap: 1rem; }
        .activity-item { display: flex; align-items: flex-start; gap: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .activity-icon { font-size: 1.25rem; }
        .activity-content { flex: 1; }
        .activity-title { font-size: 0.8rem; margin-bottom: 0.2rem; }
        .activity-project { font-size: 0.7rem; color: rgba(255,255,255,0.5); }
        .activity-time { font-size: 0.6rem; color: rgba(255,255,255,0.3); margin-top: 0.2rem; }

        /* Footer */
        .dashboard-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        .footer-links { display: flex; gap: 1.5rem; }
        .footer-links a { color: rgba(255,255,255,0.5); text-decoration: none; }
        .footer-links a:hover { color: white; }
      `}</style>
    </div>
  );
};

export default Dashboard;