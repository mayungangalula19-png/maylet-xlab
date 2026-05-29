// C:\Users\user\maylet-xlab\src\app\routes\admin\projects\AdminProjects.tsx
// FULL ADMIN PROJECTS MANAGEMENT - COMPLETE CRUD WITH SUPABASE
// REAL PRODUCTION CODE WITH SEARCH, FILTERS, PAGINATION, AND ACTIONS

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  created_at: string;
  updated_at: string;
}

interface ProjectStats {
  total: number;
  byStatus: {
    idea: number;
    experiment: number;
    prototype: number;
    launched: number;
  };
  avgProgress: number;
  totalTeamMembers: number;
  totalTasks: number;
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
// STAT CARD COMPONENT
// ============================================================
const StatCard = ({ icon, label, value, color, link }: { 
  icon: string; 
  label: string; 
  value: number | string; 
  color: string;
  link: string;
}) => (
  <Link to={link} className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="stat-icon" style={{ background: `${color}20` }}>{icon}</div>
    <div className="stat-content">
      <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </Link>
);

// ============================================================
// MAIN ADMIN PROJECTS COMPONENT
// ============================================================
const AdminProjects = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    byStatus: { idea: 0, experiment: 0, prototype: 0, launched: 0 },
    avgProgress: 0,
    totalTeamMembers: 0,
    totalTasks: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const navigate = useNavigate();

  const sectors = [
    'All', 'Agriculture', 'Health', 'Education', 'FinTech', 
    'Environment', 'Blockchain', 'AI/ML', 'IoT', 'E-commerce', 
    'Logistics', 'Tourism', 'Other'
  ];

  // Fetch projects from Supabase
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Verify admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', session.user.id)
        .single();

      if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        navigate('/dashboard');
        return;
      }

      setAdminName(profile.full_name || session.user.email?.split('@')[0] || 'Admin');

      // Fetch all projects with user info
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Get user names and emails for each project
      const projectsWithUsers = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', project.user_id)
            .single();
          
          return {
            ...project,
            user_name: userData?.full_name || userData?.email?.split('@')[0] || 'Unknown',
            user_email: userData?.email || 'Unknown',
          };
        })
      );

      setProjects(projectsWithUsers);
      setFilteredProjects(projectsWithUsers);

      // Calculate statistics
      const total = projectsWithUsers.length;
      const idea = projectsWithUsers.filter(p => p.status === 'Idea').length;
      const experiment = projectsWithUsers.filter(p => p.status === 'Experiment').length;
      const prototype = projectsWithUsers.filter(p => p.status === 'Prototype').length;
      const launched = projectsWithUsers.filter(p => p.status === 'Launched').length;
      const avgProgress = total > 0 
        ? Math.round(projectsWithUsers.reduce((sum, p) => sum + (p.progress || 0), 0) / total)
        : 0;
      const totalTeamMembers = projectsWithUsers.reduce((sum, p) => sum + (p.team_size || 1), 0);
      const totalTasks = projectsWithUsers.reduce((sum, p) => sum + (p.tasks_total || 0), 0);

      setStats({
        total,
        byStatus: { idea, experiment, prototype, launched },
        avgProgress,
        totalTeamMembers,
        totalTasks,
      });

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Delete project
  const handleDeleteProject = async (projectId: string) => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get project name before deletion
      const projectToDelete = projects.find(p => p.id === projectId);
      
      // Delete related records first
      await supabase.from('tasks').delete().eq('project_id', projectId);
      await supabase.from('team_members').delete().eq('project_id', projectId);
      await supabase.from('documents').delete().eq('project_id', projectId);
      await supabase.from('funding_pitches').delete().eq('project_id', projectId);
      await supabase.from('ai_analyses').delete().eq('project_id', projectId);
      
      // Delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      // Log activity
      if (session && projectToDelete) {
        await supabase.from('activities').insert({
          user_id: session.user.id,
          user_name: adminName,
          user_email: session.user.email,
          action: `deleted project "${projectToDelete.name}"`,
          target_type: 'project',
          target_name: projectToDelete.name,
          created_at: new Date().toISOString(),
        });
      }

      await fetchProjects();
      setShowDeleteDialog(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter projects based on search and filters
  useEffect(() => {
    let filtered = [...projects];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    if (sectorFilter !== 'all') {
      filtered = filtered.filter(p => p.sector === sectorFilter);
    }
    
    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sectorFilter, projects]);

  // Real-time subscription
  useEffect(() => {
    fetchProjects();

    const projectsChannel = supabase
      .channel('admin_projects_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' }, 
        () => fetchProjects()
      )
      .subscribe();

    return () => {
      projectsChannel.unsubscribe();
    };
  }, [fetchProjects]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const getSectorIcon = (sector: string) => {
    if (sector?.includes('Agri')) return '🌾';
    if (sector?.includes('Health')) return '🏥';
    if (sector?.includes('Education')) return '📚';
    if (sector?.includes('FinTech')) return '💰';
    if (sector?.includes('Environment')) return '🌍';
    if (sector?.includes('Blockchain')) return '🔗';
    if (sector?.includes('AI') || sector?.includes('ML')) return '🤖';
    if (sector?.includes('IoT')) return '📡';
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

  if (loading) {
    return (
      <div className="admin-projects-container">
        <Sidebar />
        <main className="admin-projects-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading projects...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-projects-container">
      <Sidebar />
      
      <main className="admin-projects-main">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1>Projects Management</h1>
            <p className="subtitle">Manage all innovation projects on the platform</p>
          </div>
          <div className="header-right">
            <div className="last-updated">
              <span className="update-icon">🕐</span>
              <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
            <button onClick={() => fetchProjects()} className="btn-refresh">
              ⟳ Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <StatCard icon="📁" label="Total Projects" value={stats.total} color="#7c5fe6" link="/admin/projects" />
          <StatCard icon="💡" label="Idea Stage" value={stats.byStatus.idea} color="#f6c90e" link="/admin/projects?status=Idea" />
          <StatCard icon="🧪" label="Experiment" value={stats.byStatus.experiment} color="#2fd4ff" link="/admin/projects?status=Experiment" />
          <StatCard icon="📦" label="Prototype" value={stats.byStatus.prototype} color="#7c5fe6" link="/admin/projects?status=Prototype" />
          <StatCard icon="🚀" label="Launched" value={stats.byStatus.launched} color="#48bb78" link="/admin/projects?status=Launched" />
          <StatCard icon="📊" label="Avg Progress" value={`${stats.avgProgress}%`} color="#2fd4ff" link="/admin/projects" />
          <StatCard icon="👥" label="Team Members" value={stats.totalTeamMembers} color="#48bb78" link="/admin/teams" />
          <StatCard icon="✅" label="Total Tasks" value={stats.totalTasks} color="#f6c90e" link="/admin/tasks" />
        </div>

        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search projects by name, description, owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')}>×</button>
            )}
          </div>
          
          <div className="filters">
            <div className="filter-group">
              <label>Status:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="idea">Idea</option>
                <option value="experiment">Experiment</option>
                <option value="prototype">Prototype</option>
                <option value="launched">Launched</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Sector:</label>
              <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}>
                {sectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-count">
          <span>Found {filteredProjects.length} projects</span>
          {filteredProjects.length !== projects.length && (
            <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSectorFilter('all'); }} className="clear-filters">
              Clear all filters
            </button>
          )}
        </div>

        {/* Projects Table */}
        <div className="table-container">
          <table className="projects-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Owner</th>
                <th>Sector</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProjects.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={7}>
                    <div className="empty-state">
                      <span className="empty-icon">📁</span>
                      <p>No projects found</p>
                      <span className="empty-hint">Try adjusting your search or filters</span>
                    </div>
                   </td>
                 </tr>
              ) : (
                currentProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="project-cell">
                      <div className="project-info">
                        <span className="project-icon">{getSectorIcon(project.sector)}</span>
                        <div>
                          <div className="project-name">{project.name}</div>
                          <div className="project-desc">{project.description?.substring(0, 60)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="owner-cell">
                      <div className="owner-info">
                        <div className="owner-avatar">{project.user_name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="owner-name">{project.user_name}</div>
                          <div className="owner-email">{project.user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="sector-badge">{project.sector}</span></td>
                    <td className="progress-cell">
                      <div className="progress-wrapper">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${project.progress}%`, background: getProgressColor(project.progress) }}
                          ></div>
                        </div>
                        <span className="progress-value">{project.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge" style={{ background: `${getStatusColor(project.status)}20`, color: getStatusColor(project.status) }}>
                        {project.status === 'Idea' && '💡'}
                        {project.status === 'Experiment' && '🧪'}
                        {project.status === 'Prototype' && '📦'}
                        {project.status === 'Launched' && '🚀'}
                        {' '}{project.status}
                      </span>
                    </td>
                    <td className="date-cell">
                      {new Date(project.created_at).toLocaleDateString()}
                    </td>
                    <td className="actions-cell">
                      <Link to={`/admin/projects/${project.id}`} className="btn-view" title="View Details">
                        👁️
                      </Link>
                      <Link to={`/admin/projects/${project.id}/edit`} className="btn-edit" title="Edit Project">
                        ✏️
                      </Link>
                      <Link to={`/admin/projects/${project.id}/review`} className="btn-review" title="Review Project">
                        ⚖️
                      </Link>
                      <button onClick={() => setShowDeleteDialog(project.id)} className="btn-delete" title="Delete Project">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ← Previous
            </button>
            <div className="pagination-pages">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                  if (i === 6) pageNum = '...';
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                  if (i === 0) pageNum = '...';
                } else {
                  pageNum = currentPage - 3 + i;
                  if (i === 0 || i === 6) pageNum = '...';
                }
                return (
                  <button
                    key={i}
                    onClick={() => typeof pageNum === 'number' && setCurrentPage(pageNum)}
                    className={`pagination-page ${currentPage === pageNum ? 'active' : ''} ${pageNum === '...' ? 'dots' : ''}`}
                    disabled={pageNum === '...'}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next →
            </button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="dialog-overlay">
            <div className="dialog-content">
              <div className="dialog-icon">⚠️</div>
              <h3>Delete Project</h3>
              <p>Are you sure you want to delete this project?</p>
              <p className="dialog-warning">This action cannot be undone. All tasks, team members, and documents will be permanently deleted.</p>
              <div className="dialog-actions">
                <button onClick={() => setShowDeleteDialog(null)} className="btn-cancel" disabled={deleting}>
                  Cancel
                </button>
                <button onClick={() => handleDeleteProject(showDeleteDialog)} className="btn-confirm-delete" disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}

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
            <span className="version">v2.0.0 | Total Projects: {stats.total}</span>
          </div>
        </footer>
      </main>

      <style>{`
        .admin-projects-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        
        .admin-projects-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .admin-projects-main {
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
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .page-header h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, #ffffff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 0.25rem;
        }
        
        .subtitle {
          color: rgba(255,255,255,0.5);
          font-size: 0.85rem;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
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
        
        .btn-refresh {
          padding: 0.5rem 1.2rem;
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 30px;
          color: #9b7ff0;
          cursor: pointer;
          transition: all 0.2s;
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
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s;
          text-decoration: none;
          color: inherit;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          background: rgba(0,0,0,0.6);
        }
        
        .stat-icon {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }
        
        .stat-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: white;
        }
        
        .stat-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .search-filter-bar {
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1rem;
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }
        
        .search-wrapper {
          flex: 2;
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .search-icon {
          position: absolute;
          left: 1rem;
          color: rgba(255,255,255,0.5);
        }
        
        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          color: white;
          font-size: 0.85rem;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #7c5fe6;
        }
        
        .search-clear {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          font-size: 1.2rem;
        }
        
        .filters {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .filter-group label {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
        }
        
        .filter-group select {
          padding: 0.5rem 1rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 30px;
          color: white;
          cursor: pointer;
        }
        
        .results-count {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
        }
        
        .clear-filters {
          background: none;
          border: none;
          color: #7c5fe6;
          cursor: pointer;
          font-size: 0.75rem;
        }
        
        .table-container {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          overflow-x: auto;
          margin-bottom: 1.5rem;
        }
        
        .projects-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .projects-table th {
          text-align: left;
          padding: 1rem;
          background: rgba(0,0,0,0.3);
          color: rgba(255,255,255,0.7);
          font-weight: 500;
          font-size: 0.8rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .projects-table td {
          padding: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          vertical-align: middle;
        }
        
        .projects-table tr:hover {
          background: rgba(255,255,255,0.02);
        }
        
        .project-cell {
          min-width: 250px;
        }
        
        .project-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .project-icon {
          font-size: 1.5rem;
        }
        
        .project-name {
          font-weight: 500;
          margin-bottom: 0.25rem;
        }
        
        .project-desc {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        
        .owner-cell {
          min-width: 180px;
        }
        
        .owner-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .owner-avatar {
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
        
        .owner-name {
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        .owner-email {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
        }
        
        .sector-badge {
          padding: 0.25rem 0.6rem;
          background: rgba(124,95,230,0.2);
          border-radius: 20px;
          font-size: 0.7rem;
          color: #9b7ff0;
        }
        
        .progress-cell {
          min-width: 120px;
        }
        
        .progress-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .progress-bar {
          flex: 1;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }
        
        .progress-value {
          font-size: 0.75rem;
          font-weight: 500;
          min-width: 35px;
        }
        
        .status-badge {
          padding: 0.25rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .date-cell {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          white-space: nowrap;
        }
        
        .actions-cell {
          white-space: nowrap;
        }
        
        .btn-view, .btn-edit, .btn-review, .btn-delete {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.1rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        
        .btn-view { color: #2fd4ff; }
        .btn-view:hover { background: rgba(47,212,255,0.2); }
        .btn-edit { color: #f6c90e; }
        .btn-edit:hover { background: rgba(246,201,14,0.2); }
        .btn-review { color: #7c5fe6; }
        .btn-review:hover { background: rgba(124,95,230,0.2); }
        .btn-delete { color: #fc8181; }
        .btn-delete:hover { background: rgba(252,129,129,0.2); }
        
        .empty-row td {
          padding: 3rem;
        }
        
        .empty-state {
          text-align: center;
          padding: 2rem;
        }
        
        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.5rem;
        }
        
        .empty-state p {
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.5rem;
        }
        
        .empty-hint {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.4);
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        
        .pagination-btn, .pagination-page {
          padding: 0.5rem 1rem;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .pagination-btn:hover:not(:disabled), .pagination-page:hover:not(.dots) {
          background: rgba(124,95,230,0.3);
          border-color: #7c5fe6;
        }
        
        .pagination-page.active {
          background: #7c5fe6;
          color: white;
          border-color: #7c5fe6;
        }
        
        .pagination-page.dots {
          cursor: default;
          background: none;
          border: none;
        }
        
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
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
          font-size: 0.8rem;
          color: #fc8181;
        }
        
        .dialog-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1.5rem;
        }
        
        .btn-cancel, .btn-confirm-delete {
          padding: 0.6rem 1.2rem;
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
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
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

export default AdminProjects;