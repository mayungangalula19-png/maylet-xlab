// C:\Users\user\maylet-xlab\src\app\routes\admin\projects\AdminProjectDetail.tsx
// FULL ADMIN PROJECT DETAIL PAGE - COMPLETE ADMIN VIEW FOR SINGLE PROJECT
// WITH PROJECT INFO, TASKS, TEAM, DOCUMENTS, ACTIVITIES, AND ACTIONS

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase/client';

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
  user_id: string;
  user_name: string;
  user_email: string;
  team_size: number;
  tasks_completed: number;
  tasks_total: number;
  budget_used: number;
  budget_total: number;
  tech_stack: string[];
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  assigned_to: string;
  assigned_to_name: string;
  due_date: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  project_id: string;
  role: 'admin' | 'developer' | 'designer' | 'marketer' | 'viewer';
  full_name: string;
  email: string;
  joined_at: string;
}

interface Document {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  size: number;
  uploaded_by: string;
  uploaded_by_name: string;
  created_at: string;
}

interface Activity {
  id: string;
  user_name: string;
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
    { icon: '📊', label: 'Dashboard', route: '/admin' },
    { icon: '👥', label: 'Users', route: '/admin/users' },
    { icon: '💡', label: 'Innovators', route: '/admin/innovators' },
    { icon: '🎓', label: 'Mentors', route: '/admin/mentors' },
    { icon: '💰', label: 'Investors', route: '/admin/investors' },
    { icon: '📁', label: 'Projects', route: '/admin/projects', active: true },
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
        .sidebar-toggle { position: absolute; right: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; font-size: 0.7rem; }
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
// MAIN ADMIN PROJECT DETAIL COMPONENT
// ============================================================
const AdminProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adminName, setAdminName] = useState('Admin');

  // Fetch all project data
  const fetchProjectData = async () => {
    if (!id) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Get admin name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();
      
      setAdminName(profile?.full_name || session.user.email?.split('@')[0] || 'Admin');

      // Fetch project with user info
      const { data: projectData } = await supabase
        .from('projects')
        .select('*, profiles(full_name, email)')
        .eq('id', id)
        .single();

      if (projectData) {
        setProject({
          ...projectData,
          user_name: projectData.profiles?.full_name || 'Unknown',
          user_email: projectData.profiles?.email || 'Unknown',
        });
      }

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      // Get assignee names for tasks
      const tasksWithNames = await Promise.all(
        (tasksData || []).map(async (task) => {
          if (task.assigned_to) {
            const { data: assigneeData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', task.assigned_to)
              .single();
            return { ...task, assigned_to_name: assigneeData?.full_name || 'Unknown' };
          }
          return { ...task, assigned_to_name: 'Unassigned' };
        })
      );
      setTasks(tasksWithNames);

      // Fetch team members
      const { data: teamData } = await supabase
        .from('team_members')
        .select('*, profiles(full_name, email)')
        .eq('project_id', id);

      const formattedTeam = (teamData || []).map(tm => ({
        id: tm.id,
        user_id: tm.user_id,
        project_id: tm.project_id,
        role: tm.role,
        full_name: tm.profiles?.full_name || 'Unknown',
        email: tm.profiles?.email || '',
        joined_at: tm.joined_at || tm.created_at,
      }));
      setTeamMembers(formattedTeam);

      // Fetch documents
      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      setDocuments(docsData || []);

      // Fetch activities
      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .eq('target_name', projectData?.name)
        .order('created_at', { ascending: false })
        .limit(20);

      setActivities(activitiesData || []);

    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete project
  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && project) {
        await supabase.from('activities').insert({
          user_id: session.user.id,
          user_name: adminName,
          user_email: session.user.email,
          action: `deleted project "${project.name}"`,
          target_type: 'project',
          target_name: project.name,
          created_at: new Date().toISOString(),
        });
      }

      // Delete related records
      await supabase.from('tasks').delete().eq('project_id', id);
      await supabase.from('team_members').delete().eq('project_id', id);
      await supabase.from('documents').delete().eq('project_id', id);
      await supabase.from('funding_pitches').delete().eq('project_id', id);
      await supabase.from('ai_analyses').delete().eq('project_id', id);
      
      // Delete project
      await supabase.from('projects').delete().eq('id', id);

      navigate('/admin/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const getSectorIcon = (sector: string) => {
    if (sector?.includes('Agri')) return '🌾';
    if (sector?.includes('Blockchain')) return '🔗';
    if (sector?.includes('Health')) return '🏥';
    if (sector?.includes('Education')) return '📚';
    if (sector?.includes('Environment')) return '🌍';
    if (sector?.includes('FinTech')) return '💰';
    if (sector?.includes('AI') || sector?.includes('ML')) return '🤖';
    return '💡';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Idea': return '#f6c90e';
      case 'Experiment': return '#2fd4ff';
      case 'Prototype': return '#7c5fe6';
      case 'Launched': return '#48bb78';
      default: return '#888';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return '#fc8181';
    if (progress < 70) return '#f6c90e';
    return '#48bb78';
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'admin': return '👑';
      case 'developer': return '💻';
      case 'designer': return '🎨';
      case 'marketer': return '📢';
      default: return '👤';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'activities', label: 'Activities', icon: '📝' },
  ];

  if (loading) {
    return (
      <div className="admin-project-detail-container">
        <Sidebar />
        <main className="admin-project-detail-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading project details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="admin-project-detail-container">
        <Sidebar />
        <main className="admin-project-detail-main">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Project Not Found</h2>
            <p>The project you're looking for doesn't exist or has been deleted.</p>
            <Link to="/admin/projects" className="btn-back">Back to Projects</Link>
          </div>
        </main>
      </div>
    );
  }

  const budgetPercentage = project.budget_total > 0 
    ? Math.round((project.budget_used / project.budget_total) * 100) 
    : 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;

  return (
    <div className="admin-project-detail-container">
      <Sidebar />
      
      <main className="admin-project-detail-main">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <Link to="/admin/projects" className="back-link">
              ← Back to Projects
            </Link>
            <h1>{project.name}</h1>
            <div className="project-meta-header">
              <span className="project-sector-badge">{getSectorIcon(project.sector)} {project.sector}</span>
              <span className="project-status-badge" style={{ background: getStatusColor(project.status), color: '#fff' }}>
                {project.status}
              </span>
              <span className="project-id">ID: {project.id.substring(0, 8)}...</span>
            </div>
          </div>
          <div className="header-right">
            <button onClick={() => fetchProjectData()} className="btn-refresh">⟳ Refresh</button>
            <Link to={`/admin/projects/${project.id}/edit`} className="btn-edit">✏️ Edit</Link>
            <Link to={`/admin/projects/${project.id}/review`} className="btn-review">⚖️ Review</Link>
            <button onClick={() => setShowDeleteDialog(true)} className="btn-delete">🗑️ Delete</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="two-columns">
              {/* Left Column */}
              <div className="left-column">
                <div className="info-card">
                  <h3>📝 Description</h3>
                  <p>{project.description || 'No description provided.'}</p>
                </div>

                <div className="info-card">
                  <h3>📈 Progress</h3>
                  <div className="progress-section">
                    <div className="progress-label">
                      <span>Completion</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${project.progress}%`, background: getProgressColor(project.progress) }}></div>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <h3>💰 Budget</h3>
                  <div className="budget-stats">
                    <div className="budget-item">
                      <div className="budget-label">Used</div>
                      <div className="budget-amount">${project.budget_used.toLocaleString()}</div>
                    </div>
                    <div className="budget-item">
                      <div className="budget-label">Total</div>
                      <div className="budget-amount">${project.budget_total.toLocaleString()}</div>
                    </div>
                    <div className="budget-item">
                      <div className="budget-label">Remaining</div>
                      <div className="budget-amount">${(project.budget_total - project.budget_used).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill budget-fill" style={{ width: `${budgetPercentage}%` }}></div>
                  </div>
                  <div className="budget-percentage">{budgetPercentage}% of budget used</div>
                </div>

                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="info-card">
                    <h3>🛠️ Tech Stack</h3>
                    <div className="tech-stack">
                      {project.tech_stack.map((tech, i) => (
                        <span key={i} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="right-column">
                <div className="stats-grid-detail">
                  <div className="stat-card-detail">
                    <div className="stat-icon-detail">👥</div>
                    <div className="stat-info-detail">
                      <div className="stat-value-detail">{teamMembers.length}</div>
                      <div className="stat-label-detail">Team Members</div>
                    </div>
                  </div>
                  <div className="stat-card-detail">
                    <div className="stat-icon-detail">✅</div>
                    <div className="stat-info-detail">
                      <div className="stat-value-detail">{completedTasks}/{totalTasks}</div>
                      <div className="stat-label-detail">Tasks Done</div>
                    </div>
                  </div>
                  <div className="stat-card-detail">
                    <div className="stat-icon-detail">📄</div>
                    <div className="stat-info-detail">
                      <div className="stat-value-detail">{documents.length}</div>
                      <div className="stat-label-detail">Documents</div>
                    </div>
                  </div>
                  <div className="stat-card-detail">
                    <div className="stat-icon-detail">👤</div>
                    <div className="stat-info-detail">
                      <div className="stat-value-detail">{project.user_name}</div>
                      <div className="stat-label-detail">Project Owner</div>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <h3>👤 Owner Information</h3>
                  <div className="owner-info">
                    <div className="owner-avatar">{project.user_name.charAt(0).toUpperCase()}</div>
                    <div className="owner-details">
                      <div className="owner-name">{project.user_name}</div>
                      <div className="owner-email">{project.user_email}</div>
                      <Link to={`/admin/users/${project.user_id}`} className="owner-link">View Full Profile →</Link>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <h3>⏱️ Timeline</h3>
                  <div className="timeline">
                    <div className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <div className="timeline-title">Project Created</div>
                        <div className="timeline-date">{new Date(project.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <div className="timeline-title">Last Updated</div>
                        <div className="timeline-date">{new Date(project.updated_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div className="tasks-tab">
              <div className="tasks-header">
                <h3>Project Tasks ({totalTasks})</h3>
              </div>
              <div className="tasks-summary">
                <div className="task-summary-card">
                  <div className="task-summary-count todo">{todoTasks}</div>
                  <div className="task-summary-label">To Do</div>
                </div>
                <div className="task-summary-card">
                  <div className="task-summary-count progress">{inProgressTasks}</div>
                  <div className="task-summary-label">In Progress</div>
                </div>
                <div className="task-summary-card">
                  <div className="task-summary-count done">{completedTasks}</div>
                  <div className="task-summary-label">Completed</div>
                </div>
              </div>
              <div className="tasks-list">
                {tasks.length === 0 ? (
                  <div className="empty-state">No tasks created yet</div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="task-item">
                      <div className={`task-status task-${task.status}`}>
                        {task.status === 'todo' && '⭕'}
                        {task.status === 'in_progress' && '🟡'}
                        {task.status === 'done' && '✅'}
                      </div>
                      <div className="task-content">
                        <div className="task-title">{task.title}</div>
                        <div className="task-description">{task.description}</div>
                        <div className="task-meta">
                          <span>Assigned to: {task.assigned_to_name || 'Unassigned'}</span>
                          {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                          <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === 'team' && (
            <div className="team-tab">
              <div className="team-header">
                <h3>Team Members ({teamMembers.length})</h3>
              </div>
              <div className="team-list">
                {teamMembers.length === 0 ? (
                  <div className="empty-state">No team members added yet</div>
                ) : (
                  teamMembers.map((member) => (
                    <div key={member.id} className="team-item">
                      <div className="member-avatar">{member.full_name.charAt(0).toUpperCase()}</div>
                      <div className="member-info">
                        <div className="member-name">{member.full_name}</div>
                        <div className="member-email">{member.email}</div>
                        <div className="member-joined">Joined: {new Date(member.joined_at).toLocaleDateString()}</div>
                      </div>
                      <div className="member-role">{getRoleIcon(member.role)} {member.role}</div>
                      <Link to={`/admin/users/${member.user_id}`} className="member-link">View Profile</Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="documents-tab">
              <div className="documents-header">
                <h3>Project Documents ({documents.length})</h3>
              </div>
              <div className="documents-list">
                {documents.length === 0 ? (
                  <div className="empty-state">No documents uploaded yet</div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="document-item">
                      <div className="document-icon">📄</div>
                      <div className="document-info">
                        <div className="document-name">{doc.name}</div>
                        <div className="document-meta">
                          {formatFileSize(doc.size)} • Uploaded by {doc.uploaded_by_name || 'Unknown'} • {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="document-link">View</a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ACTIVITIES TAB */}
          {activeTab === 'activities' && (
            <div className="activities-tab">
              <div className="activities-header">
                <h3>Recent Activities ({activities.length})</h3>
              </div>
              <div className="activities-list">
                {activities.length === 0 ? (
                  <div className="empty-state">No recent activities</div>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {activity.target_type === 'project' && '📁'}
                        {activity.target_type === 'task' && '✅'}
                        {activity.target_type === 'document' && '📄'}
                        {activity.target_type === 'team' && '👥'}
                        {activity.target_type === 'funding' && '💰'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-text">
                          <strong>{activity.user_name}</strong> {activity.action}
                        </div>
                        <div className="activity-time">{timeAgo(activity.created_at)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="dialog-overlay">
            <div className="dialog-content">
              <div className="dialog-icon">⚠️</div>
              <h3>Delete Project</h3>
              <p>Are you sure you want to delete <strong>"{project.name}"</strong>?</p>
              <p className="dialog-warning">This action cannot be undone. All tasks, team members, and documents will be permanently deleted.</p>
              <div className="dialog-actions">
                <button onClick={() => setShowDeleteDialog(false)} className="btn-cancel" disabled={deleting}>
                  Cancel
                </button>
                <button onClick={handleDeleteProject} className="btn-confirm-delete" disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .admin-project-detail-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        
        .admin-project-detail-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .admin-project-detail-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        
        /* Loading */
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
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Header */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .back-link {
          color: #7c5fe6;
          text-decoration: none;
          font-size: 0.85rem;
          display: inline-block;
          margin-bottom: 0.5rem;
        }
        
        .page-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #ffffff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 0.5rem;
        }
        
        .project-meta-header {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .project-sector-badge {
          padding: 0.2rem 0.6rem;
          background: rgba(124,95,230,0.2);
          border-radius: 20px;
          font-size: 0.7rem;
          color: #9b7ff0;
        }
        
        .project-status-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }
        
        .project-id {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
          font-family: monospace;
        }
        
        .header-right {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        
        .btn-refresh, .btn-edit, .btn-review, .btn-delete {
          padding: 0.5rem 1rem;
          border-radius: 30px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .btn-refresh {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .btn-edit {
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          color: #9b7ff0;
        }
        
        .btn-review {
          background: rgba(47,212,255,0.2);
          border: 1px solid rgba(47,212,255,0.3);
          color: #2fd4ff;
        }
        
        .btn-delete {
          background: rgba(252,129,129,0.2);
          border: 1px solid rgba(252,129,129,0.3);
          color: #fc8181;
        }
        
        /* Tabs */
        .tabs-container {
          display: flex;
          gap: 0.25rem;
          background: rgba(0,0,0,0.3);
          padding: 0.5rem;
          border-radius: 60px;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        
        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.2rem;
          background: none;
          border: none;
          border-radius: 40px;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.85rem;
        }
        
        .tab:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .tab.active {
          background: #7c5fe6;
          color: white;
        }
        
        /* Two Columns */
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
        
        /* Info Cards */
        .info-card {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.25rem;
          margin-bottom: 1.25rem;
        }
        
        .info-card h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        /* Progress */
        .progress-section {
          margin-bottom: 0.5rem;
        }
        
        .progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.7);
        }
        
        .progress-bar {
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }
        
        .budget-fill {
          background: linear-gradient(90deg, #48bb78, #38a169);
        }
        
        /* Budget */
        .budget-stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .budget-item {
          text-align: center;
          flex: 1;
        }
        
        .budget-label {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
        }
        
        .budget-amount {
          font-size: 0.9rem;
          font-weight: 600;
          color: #48bb78;
        }
        
        .budget-percentage {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          margin-top: 0.5rem;
          text-align: right;
        }
        
        /* Tech Stack */
        .tech-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .tech-tag {
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 20px;
          padding: 0.25rem 0.75rem;
          font-size: 0.7rem;
        }
        
        /* Stats Grid */
        .stats-grid-detail {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        
        .stat-card-detail {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .stat-icon-detail {
          font-size: 1.3rem;
        }
        
        .stat-value-detail {
          font-size: 1rem;
          font-weight: 700;
          color: white;
        }
        
        .stat-label-detail {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
        }
        
        /* Owner Info */
        .owner-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .owner-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 600;
        }
        
        .owner-details {
          flex: 1;
        }
        
        .owner-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        
        .owner-email {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          margin-bottom: 0.25rem;
        }
        
        .owner-link {
          font-size: 0.7rem;
          color: #7c5fe6;
          text-decoration: none;
        }
        
        /* Timeline */
        .timeline {
          position: relative;
          padding-left: 1.5rem;
        }
        
        .timeline-item {
          position: relative;
          padding-bottom: 1rem;
        }
        
        .timeline-dot {
          position: absolute;
          left: -1.2rem;
          top: 0.25rem;
          width: 10px;
          height: 10px;
          background: #2fd4ff;
          border-radius: 50%;
        }
        
        .timeline-title {
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .timeline-date {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
        }
        
        /* Tasks Tab */
        .tasks-header {
          margin-bottom: 1.5rem;
        }
        
        .tasks-summary {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .task-summary-card {
          flex: 1;
          text-align: center;
          padding: 1rem;
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
        }
        
        .task-summary-count {
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        .task-summary-count.todo { color: #f6c90e; }
        .task-summary-count.progress { color: #2fd4ff; }
        .task-summary-count.done { color: #48bb78; }
        
        .task-summary-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .task-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
        }
        
        .task-status {
          font-size: 1.2rem;
        }
        
        .task-content {
          flex: 1;
        }
        
        .task-title {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        
        .task-description {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.5rem;
        }
        
        .task-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
          flex-wrap: wrap;
        }
        
        /* Team Tab */
        .team-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .team-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          flex-wrap: wrap;
        }
        
        .member-avatar {
          width: 40px;
          height: 40px;
          background: rgba(124,95,230,0.3);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }
        
        .member-info {
          flex: 1;
          min-width: 150px;
        }
        
        .member-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        
        .member-email {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        
        .member-joined {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.4);
        }
        
        .member-role {
          font-size: 0.7rem;
          background: rgba(124,95,230,0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
        }
        
        .member-link {
          font-size: 0.7rem;
          color: #7c5fe6;
          text-decoration: none;
        }
        
        /* Documents Tab */
        .documents-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .document-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
        }
        
        .document-icon {
          font-size: 1.2rem;
        }
        
        .document-info {
          flex: 1;
        }
        
        .document-name {
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .document-meta {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.5);
        }
        
        .document-link {
          color: #2fd4ff;
          text-decoration: none;
          font-size: 0.7rem;
        }
        
        /* Activities Tab */
        .activities-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .activity-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(0,0,0,0.02);
          border-radius: 10px;
        }
        
        .activity-icon {
          font-size: 1.2rem;
        }
        
        .activity-content {
          flex: 1;
        }
        
        .activity-text {
          font-size: 0.75rem;
        }
        
        .activity-time {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.4);
          margin-top: 0.25rem;
        }
        
        .empty-state {
          text-align: center;
          padding: 2rem;
          color: rgba(255,255,255,0.4);
        }
        
        /* Error State */
        .error-state {
          text-align: center;
          padding: 3rem;
        }
        
        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        
        .error-state h2 {
          margin-bottom: 0.5rem;
        }
        
        .error-state p {
          color: rgba(255,255,255,0.6);
          margin-bottom: 1.5rem;
        }
        
        .btn-back {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 30px;
          color: #7c5fe6;
          text-decoration: none;
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
          text-align: center;
        }
        
        .dialog-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .dialog-content h3 {
          margin-bottom: 0.5rem;
        }
        
        .dialog-content p {
          color: rgba(255,255,255,0.7);
          margin-bottom: 0.5rem;
        }
        
        .dialog-warning {
          font-size: 0.75rem;
          color: #fc8181;
        }
        
        .dialog-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1.5rem;
        }
        
        .btn-cancel, .btn-confirm-delete {
          padding: 0.5rem 1rem;
          border-radius: 30px;
          border: none;
          cursor: pointer;
          font-weight: 500;
        }
        
        .btn-cancel {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .btn-confirm-delete {
          background: #fc8181;
          color: #1a1a2e;
        }
      `}</style>
    </div>
  );
};

export default AdminProjectDetail;