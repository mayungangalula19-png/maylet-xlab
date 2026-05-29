// C:\Users\user\maylet-xlab\src\app\routes\Projects.tsx
// FULL PROJECTS DASHBOARD - COMPLETE INNOVATION WORKSPACE
// WITH SUPABASE CONNECTION, REAL-TIME UPDATES, AND FULL UI
// FULLY FIXED - NO SYNTAX ERRORS

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

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
  updated_at: string;
  user_id: string;
  team_size: number;
  tasks_completed: number;
  tasks_total: number;
  ai_score?: number;
}

interface ProjectStats {
  total: number;
  inProgress: number;
  completed: number;
  onHold: number;
  avgProgress: number;
}

interface Activity {
  id: string;
  user_name: string;
  action: string;
  project_name: string;
  created_at: string;
  type: 'task' | 'document' | 'team' | 'experiment';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ai' | 'team' | 'funding' | 'system';
  read: boolean;
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
    { icon: '📊', label: 'Dashboard', route: '/dashboard' },
    { icon: '📁', label: 'Projects', route: '/projects', active: true },
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
    { icon: '📈', label: 'Analytics', route: '/analytics' },
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
      
      <button className="mobile-sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        ☰
      </button>

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
            <Link
              key={item.label}
              to={item.route}
              className={`sidebar-link ${item.active ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-divider"></div>

        <nav className="sidebar-nav user-nav">
          {userMenu.map((item) => (
            <Link
              key={item.label}
              to={item.route}
              className="sidebar-link"
              title={collapsed ? item.label : undefined}
            >
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
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 98;
          display: none;
        }
        .mobile-sidebar-toggle {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 100;
          background: #7c5fe6;
          border: none;
          color: white;
          font-size: 1.5rem;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          cursor: pointer;
        }
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          background: #1a1a2e;
          color: rgba(255,255,255,0.7);
          display: flex;
          flex-direction: column;
          z-index: 99;
          transition: width 0.3s ease;
          overflow-y: auto;
          overflow-x: hidden;
          width: 280px;
        }
        .sidebar.collapsed {
          width: 80px;
        }
        .sidebar-logo {
          padding: 1.5rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          position: relative;
        }
        .logo-icon {
          font-size: 2rem;
          font-weight: bold;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          min-width: 40px;
          text-align: center;
        }
        .logo-title {
          font-weight: 700;
          font-size: 1rem;
          color: white;
        }
        .logo-tagline {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
        }
        .sidebar-toggle {
          position: absolute;
          right: 0.5rem;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.7rem;
        }
        .sidebar-nav {
          flex: 1;
          padding: 1rem 0;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          transition: all 0.2s;
          margin: 0.25rem 0.5rem;
          border-radius: 12px;
          background: none;
          border: none;
          width: calc(100% - 1rem);
          cursor: pointer;
          font-size: 1rem;
        }
        .sidebar-link:hover {
          background: rgba(124,95,230,0.2);
          color: white;
        }
        .sidebar-link.active {
          background: #7c5fe6;
          color: white;
        }
        .sidebar-icon {
          font-size: 1.25rem;
          min-width: 24px;
          text-align: center;
        }
        .sidebar-label {
          font-size: 0.9rem;
          white-space: nowrap;
        }
        .sidebar.collapsed .sidebar-label {
          display: none;
        }
        .sidebar.collapsed .sidebar-link {
          justify-content: center;
          padding: 0.75rem;
        }
        .sidebar-divider {
          height: 1px;
          background: rgba(255,255,255,0.1);
          margin: 0.5rem 1rem;
        }
        .user-nav {
          margin-bottom: 1rem;
        }
        .logout-link {
          color: #fc8181;
        }
        .logout-link:hover {
          background: rgba(252,129,129,0.2);
          color: #fc8181;
        }
        @media (max-width: 768px) {
          .mobile-sidebar-toggle {
            display: block;
          }
          .sidebar {
            transform: translateX(-100%);
            width: 280px;
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          .sidebar-overlay {
            display: block;
          }
        }
      `}</style>
    </>
  );
};

// ============================================================
// STAT CARD COMPONENT
// ============================================================
const StatCard = ({ icon, label, value, color, route }: { 
  icon: string; 
  label: string; 
  value: number; 
  color: string;
  route: string;
}) => (
  <Link to={route} className="stat-card">
    <div className="stat-icon" style={{ background: color }}>{icon}</div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </Link>
);

// ============================================================
// PROJECT CARD COMPONENT
// ============================================================
const ProjectCard = ({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const getSectorIcon = (sector: string) => {
    if (sector.includes('Agri')) return '🌾';
    if (sector.includes('Blockchain')) return '🔗';
    if (sector.includes('Health')) return '🏥';
    if (sector.includes('Education')) return '📚';
    if (sector.includes('Environment')) return '🌍';
    return '💡';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Idea': return '#f6c90e';
      case 'Experiment': return '#2fd4ff';
      case 'Prototype': return '#7c5fe6';
      case 'Launched': return '#48bb78';
      default: return 'rgba(255,255,255,0.5)';
    }
  };

  const handleDelete = async () => {
    await onDelete(project.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="project-card">
        <div className="project-card-header">
          <div className="project-icon">{getSectorIcon(project.sector)}</div>
          <div className="project-info">
            <h3 className="project-name">{project.name}</h3>
            <p className="project-sector">{project.sector}</p>
          </div>
          <span className="project-status-badge" style={{ background: getStatusColor(project.status) }}>
            {project.status}
          </span>
        </div>

        <div className="project-description">
          {project.description.length > 100 ? `${project.description.substring(0, 100)}...` : project.description}
        </div>

        <div className="project-progress-section">
          <div className="progress-label">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
          </div>
        </div>

        <div className="project-stats">
          <div className="project-stat">
            <span className="stat-emoji">👥</span>
            <span>{project.team_size} members</span>
          </div>
          <div className="project-stat">
            <span className="stat-emoji">✅</span>
            <span>{project.tasks_completed}/{project.tasks_total} tasks</span>
          </div>
          {project.ai_score && (
            <div className="project-stat">
              <span className="stat-emoji">🤖</span>
              <span>AI Score: {project.ai_score}</span>
            </div>
          )}
        </div>

        <div className="project-actions">
          <Link to={`/projects/${project.id}`} className="btn-view">View Details</Link>
          <Link to={`/projects/${project.id}/edit`} className="btn-edit">Edit</Link>
          <Link to={`/experiments/new?projectId=${project.id}`} className="btn-experiment">Run Experiment</Link>
          <button onClick={() => setShowDeleteDialog(true)} className="btn-delete">Delete</button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="dialog-overlay">
          <div className="dialog-content">
            <h3>Delete Project?</h3>
            <p>Are you sure you want to delete "{project.name}"? This action cannot be undone.</p>
            <div className="dialog-actions">
              <button onClick={() => setShowDeleteDialog(false)} className="btn-cancel">Cancel</button>
              <button onClick={handleDelete} className="btn-confirm-delete">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================
// ACTIVITY ITEM COMPONENT
// ============================================================
const ActivityItem = ({ activity }: { activity: Activity }) => {
  const getIcon = (type: string) => {
    switch(type) {
      case 'task': return '✅';
      case 'document': return '📄';
      case 'team': return '👥';
      case 'experiment': return '🧪';
      default: return '📌';
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="activity-item">
      <div className="activity-icon">{getIcon(activity.type)}</div>
      <div className="activity-content">
        <div className="activity-text">
          <strong>{activity.user_name}</strong> {activity.action} <strong>{activity.project_name}</strong>
        </div>
        <div className="activity-time">{timeAgo(activity.created_at)}</div>
      </div>
    </div>
  );
};

// ============================================================
// NOTIFICATION ITEM COMPONENT
// ============================================================
const NotificationItem = ({ notification }: { notification: Notification }) => {
  const getIcon = (type: string) => {
    switch(type) {
      case 'ai': return '🤖';
      case 'team': return '👥';
      case 'funding': return '💰';
      default: return '🔔';
    }
  };

  return (
    <div className={`notification-item ${!notification.read ? 'unread' : ''}`}>
      <div className="notification-icon">{getIcon(notification.type)}</div>
      <div className="notification-content">
        <div className="notification-title">{notification.title}</div>
        <div className="notification-message">{notification.message}</div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN PROJECTS COMPONENT
// ============================================================
const Projects = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    inProgress: 0,
    completed: 0,
    onHold: 0,
    avgProgress: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  // Fetch projects from Supabase
  const fetchProjects = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    const userId = session.user.id;

    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const total = projectsData?.length || 0;
      const inProgress = projectsData?.filter(p => p.status === 'Experiment' || p.status === 'Prototype').length || 0;
      const completed = projectsData?.filter(p => p.status === 'Launched' || p.progress === 100).length || 0;
      const onHold = projectsData?.filter(p => p.status === 'Idea').length || 0;
      const avgProgress = total > 0 ? Math.round(projectsData.reduce((acc, p) => acc + (p.progress || 0), 0) / total) : 0;

      setStats({ total, inProgress, completed, onHold, avgProgress });
      setProjects(projectsData as Project[] || []);
      setFilteredProjects(projectsData as Project[] || []);

    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      setActivities(data as Activity[] || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      setNotifications(data as Notification[] || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Delete project
  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
      
      // Update local state
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      setFilteredProjects(updatedProjects);
      
      // Recalculate stats
      const total = updatedProjects.length;
      const inProgress = updatedProjects.filter(p => p.status === 'Experiment' || p.status === 'Prototype').length;
      const completed = updatedProjects.filter(p => p.status === 'Launched' || p.progress === 100).length;
      const onHold = updatedProjects.filter(p => p.status === 'Idea').length;
      const avgProgress = total > 0 ? Math.round(updatedProjects.reduce((acc, p) => acc + (p.progress || 0), 0) / total) : 0;
      
      setStats({ total, inProgress, completed, onHold, avgProgress });
      
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  // Filter projects based on search and status
  useEffect(() => {
    let filtered = [...projects];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sector.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(p => p.status === 'Experiment' || p.status === 'Prototype');
      } else if (statusFilter === 'completed') {
        filtered = filtered.filter(p => p.status === 'Launched' || p.progress === 100);
      } else if (statusFilter === 'hold') {
        filtered = filtered.filter(p => p.status === 'Idea');
      }
    }
    
    setFilteredProjects(filtered);
  }, [searchTerm, statusFilter, projects]);

  // Initial data fetch
  useEffect(() => {
    fetchProjects();
    fetchActivities();
    fetchNotifications();

    // Set up real-time subscription for projects
    const projectsChannel = supabase
      .channel('projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchProjects();
      })
      .subscribe();

    // Set up real-time subscription for activities
    const activitiesChannel = supabase
      .channel('activities_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      projectsChannel.unsubscribe();
      activitiesChannel.unsubscribe();
    };
  }, [fetchProjects, fetchActivities, fetchNotifications]);

  if (loading) {
    return (
      <div className="projects-container">
        <Sidebar />
        <main className="projects-main">
          <div className="loading-spinner"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <Sidebar />
      
      <main className="projects-main">
        {/* Header Section */}
        <div className="projects-header">
          <div className="header-left">
            <h1>Projects Dashboard</h1>
            <p>Manage all your innovation projects in one place</p>
          </div>
          <div className="header-right">
            <Link to="/projects/create" className="btn-create">
              + Create New Project
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search projects by name, description, or sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              In Progress
            </button>
            <button 
              className={`filter-tab ${statusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('completed')}
            >
              Completed
            </button>
            <button 
              className={`filter-tab ${statusFilter === 'hold' ? 'active' : ''}`}
              onClick={() => setStatusFilter('hold')}
            >
              On Hold
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <StatCard icon="📁" label="Total Projects" value={stats.total} color="linear-gradient(135deg, #7c5fe6, #2fd4ff)" route="/projects" />
          <StatCard icon="🟢" label="In Progress" value={stats.inProgress} color="linear-gradient(135deg, #2fd4ff, #7c5fe6)" route="/projects?status=active" />
          <StatCard icon="✅" label="Completed" value={stats.completed} color="linear-gradient(135deg, #48bb78, #38a169)" route="/projects?status=completed" />
          <StatCard icon="📊" label="Avg Progress" value={stats.avgProgress} color="linear-gradient(135deg, #f6c90e, #ecc30b)" route="/analytics" />
        </div>

        {/* Two Column Layout */}
        <div className="two-column-layout">
          {/* Left Column - Project Cards */}
          <div className="left-column">
            <div className="section-header">
              <h2>My Projects</h2>
              <span className="project-count">{filteredProjects.length} projects</span>
            </div>
            
            {filteredProjects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <h3>No projects found</h3>
                <p>Create your first project to get started with Maylet XLab</p>
                <Link to="/projects/create" className="btn-create-empty">+ Create New Project</Link>
              </div>
            ) : (
              <div className="projects-grid">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} onDelete={handleDeleteProject} />
                ))}
              </div>
            )}
          </div>

          {/* Right Column - AI Insights, Team Activity, Notifications */}
          <div className="right-column">
            {/* AI Insights Panel */}
            <div className="card ai-insights-card">
              <div className="card-header">
                <h3>🤖 AI Insights</h3>
                <Link to="/ai-assistant" className="card-link">Ask AI →</Link>
              </div>
              <div className="ai-recommendation">
                <p>Your project <strong>"{projects[0]?.name || 'AI Smart Farming'}"</strong> has great potential for impact.</p>
                <p className="ai-tip">💡 Tip: Consider adding IoT sensors to improve data accuracy by 35%.</p>
              </div>
              <div className="ai-scores">
                <div className="ai-score">
                  <span>AI Score</span>
                  <strong>92/100</strong>
                </div>
                <div className="ai-risk">
                  <span>Risk Level</span>
                  <strong className="risk-low">Low</strong>
                </div>
              </div>
              <Link to={`/ai-assistant/analyze?projectId=${projects[0]?.id || ''}`} className="btn-analyze">
                Run Full Analysis →
              </Link>
            </div>

            {/* Team Activity */}
            <div className="card">
              <div className="card-header">
                <h3>👥 Team Activity</h3>
                <Link to="/teams" className="card-link">View All →</Link>
              </div>
              <div className="activities-list">
                {activities.length === 0 ? (
                  <p className="empty-text">No recent activity</p>
                ) : (
                  activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="card">
              <div className="card-header">
                <h3>🔔 Notifications</h3>
                <Link to="/notifications" className="card-link">View All →</Link>
              </div>
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <p className="empty-text">No new notifications</p>
                ) : (
                  notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="projects-footer">
          <p>© 2025 Maylet XLab. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
        </footer>
      </main>

      <style>{`
        /* Main Container */
        .projects-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
        }
        
        .projects-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .projects-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        
        /* Loading Spinner */
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(124,95,230,0.3);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 20% auto;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Header */
        .projects-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .projects-header h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .projects-header p {
          color: rgba(255,255,255,0.6);
          margin-top: 0.25rem;
        }
        
        .btn-create {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          padding: 0.75rem 1.5rem;
          border-radius: 40px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          display: inline-block;
        }
        
        .btn-create:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124,95,230,0.4);
        }
        
        /* Search & Filter */
        .search-filter-bar {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 60px;
          padding: 0.5rem;
          margin-bottom: 2rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .search-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.05);
          border-radius: 40px;
          padding: 0.5rem 1rem;
        }
        
        .search-icon {
          font-size: 1.2rem;
          margin-right: 0.5rem;
        }
        
        .search-input {
          flex: 1;
          background: none;
          border: none;
          color: white;
          font-size: 0.9rem;
          outline: none;
        }
        
        .search-input::placeholder {
          color: rgba(255,255,255,0.4);
        }
        
        .filter-tabs {
          display: flex;
          gap: 0.5rem;
        }
        
        .filter-tab {
          background: rgba(255,255,255,0.05);
          border: none;
          padding: 0.5rem 1.2rem;
          border-radius: 40px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .filter-tab:hover, .filter-tab.active {
          background: #7c5fe6;
          color: white;
        }
        
        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        @media (max-width: 1024px) {
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
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
          background: rgba(0,0,0,0.7);
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
        
        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: white;
        }
        
        .stat-label {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
        }
        
        /* Two Column Layout */
        .two-column-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        @media (max-width: 1024px) {
          .two-column-layout {
            grid-template-columns: 1fr;
          }
        }
        
        /* Left Column */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .section-header h2 {
          font-size: 1.2rem;
        }
        
        .project-count {
          background: rgba(124,95,230,0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          color: #9b7ff0;
        }
        
        .projects-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        /* Project Card */
        .project-card {
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 1.25rem;
          transition: all 0.2s;
        }
        
        .project-card:hover {
          transform: translateY(-2px);
          border-color: rgba(124,95,230,0.3);
        }
        
        .project-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        
        .project-icon {
          font-size: 2rem;
        }
        
        .project-info {
          flex: 1;
        }
        
        .project-name {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }
        
        .project-sector {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          margin: 0;
        }
        
        .project-status-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }
        
        .project-description {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
          line-height: 1.5;
          margin-bottom: 1rem;
        }
        
        .project-progress-section {
          margin-bottom: 1rem;
        }
        
        .progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.25rem;
        }
        
        .progress-bar {
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c5fe6, #2fd4ff);
          border-radius: 3px;
        }
        
        .project-stats {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        
        .project-stat {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .stat-emoji {
          font-size: 0.8rem;
        }
        
        .project-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .btn-view, .btn-edit, .btn-experiment, .btn-delete {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        
        .btn-view {
          background: rgba(47,212,255,0.2);
          color: #2fd4ff;
        }
        
        .btn-view:hover {
          background: rgba(47,212,255,0.3);
        }
        
        .btn-edit {
          background: rgba(124,95,230,0.2);
          color: #7c5fe6;
        }
        
        .btn-edit:hover {
          background: rgba(124,95,230,0.3);
        }
        
        .btn-experiment {
          background: rgba(72,187,120,0.2);
          color: #48bb78;
        }
        
        .btn-experiment:hover {
          background: rgba(72,187,120,0.3);
        }
        
        .btn-delete {
          background: rgba(252,129,129,0.2);
          color: #fc8181;
        }
        
        .btn-delete:hover {
          background: rgba(252,129,129,0.3);
        }
        
        /* Right Column Cards */
        .right-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .card {
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 1.25rem;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .card-header h3 {
          font-size: 1rem;
        }
        
        .card-link {
          color: #7c5fe6;
          text-decoration: none;
          font-size: 0.7rem;
        }
        
        .card-link:hover {
          text-decoration: underline;
        }
        
        /* AI Insights */
        .ai-insights-card {
          background: linear-gradient(135deg, rgba(124,95,230,0.15), rgba(47,212,255,0.08));
          border-color: rgba(124,95,230,0.3);
        }
        
        .ai-recommendation {
          margin-bottom: 1rem;
        }
        
        .ai-recommendation p {
          font-size: 0.8rem;
          line-height: 1.5;
          margin-bottom: 0.5rem;
        }
        
        .ai-tip {
          color: #2fd4ff;
        }
        
        .ai-scores {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .ai-score, .ai-risk {
          flex: 1;
          display: flex;
          justify-content: space-between;
          background: rgba(0,0,0,0.3);
          padding: 0.5rem;
          border-radius: 10px;
        }
        
        .ai-score span, .ai-risk span {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .ai-score strong {
          color: #2fd4ff;
          font-size: 1rem;
        }
        
        .risk-low {
          color: #48bb78;
        }
        
        .btn-analyze {
          display: inline-block;
          width: 100%;
          text-align: center;
          padding: 0.5rem;
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 30px;
          color: white;
          text-decoration: none;
          font-size: 0.75rem;
          transition: all 0.2s;
        }
        
        .btn-analyze:hover {
          background: #7c5fe6;
        }
        
        /* Activities & Notifications */
        .activities-list, .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .activity-item, .notification-item {
          display: flex;
          gap: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .activity-icon, .notification-icon {
          font-size: 1rem;
        }
        
        .activity-content, .notification-content {
          flex: 1;
        }
        
        .activity-text {
          font-size: 0.75rem;
          line-height: 1.4;
        }
        
        .activity-time {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.4);
          margin-top: 0.25rem;
        }
        
        .notification-title {
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .notification-message {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .notification-item.unread {
          background: rgba(124,95,230,0.1);
          margin: -0.5rem -0.5rem 0 -0.5rem;
          padding: 0.5rem;
          border-radius: 10px;
        }
        
        .empty-text {
          text-align: center;
          color: rgba(255,255,255,0.5);
          font-size: 0.8rem;
          padding: 1rem;
        }
        
        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(0,0,0,0.3);
          border-radius: 20px;
        }
        
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .empty-state h3 {
          margin-bottom: 0.5rem;
        }
        
        .empty-state p {
          color: rgba(255,255,255,0.6);
          margin-bottom: 1rem;
        }
        
        .btn-create-empty {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          padding: 0.6rem 1.2rem;
          border-radius: 30px;
          text-decoration: none;
          font-weight: 600;
          display: inline-block;
        }
        
        /* Dialog */
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .dialog-content {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 1.5rem;
          max-width: 400px;
          width: 90%;
        }
        
        .dialog-content h3 {
          margin-bottom: 0.5rem;
        }
        
        .dialog-content p {
          color: rgba(255,255,255,0.7);
          margin-bottom: 1.5rem;
        }
        
        .dialog-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        
        .btn-cancel, .btn-confirm-delete {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }
        
        .btn-cancel {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .btn-confirm-delete {
          background: #fc8181;
          color: #1a1a2e;
        }
        
        /* Footer */
        .projects-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .footer-links {
          display: flex;
          gap: 1.5rem;
        }
        
        .footer-links a {
          color: rgba(255,255,255,0.5);
          text-decoration: none;
        }
        
        .footer-links a:hover {
          color: white;
        }
      `}</style>
    </div>
  );
};

export default Projects;