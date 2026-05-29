// C:\Users\user\maylet-xlab\src\app\routes\admin\projects\AdminProjectDelete.tsx
// FULL ADMIN PROJECT DELETE PAGE - PERMANENT PROJECT DELETION WITH CONFIRMATION
// WITH CASCADE DELETE FOR TASKS, TEAM MEMBERS, DOCUMENTS, AND ACTIVITIES

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
  status: string;
  user_id: string;
  user_name: string;
  user_email: string;
  team_size: number;
  tasks_total: number;
  documents_count: number;
  created_at: string;
  updated_at: string;
}

interface DeleteStats {
  tasksDeleted: number;
  teamMembersDeleted: number;
  documentsDeleted: number;
  activitiesDeleted: number;
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
    { icon: '🔐', label: 'Vault', route: '/admin/vault' },
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
// MAIN ADMIN PROJECT DELETE COMPONENT
// ============================================================
const AdminProjectDelete = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [deleteStats, setDeleteStats] = useState<DeleteStats>({
    tasksDeleted: 0,
    teamMembersDeleted: 0,
    documentsDeleted: 0,
    activitiesDeleted: 0,
  });
  const [step, setStep] = useState<'confirm' | 'deleting' | 'complete' | 'error'>('confirm');
  const [errorMessage, setErrorMessage] = useState('');
  const [adminName, setAdminName] = useState('Admin');

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
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

        // Fetch project with counts
        const { data: projectData } = await supabase
          .from('projects')
          .select('*, profiles(full_name, email)')
          .eq('id', id)
          .single();

        if (projectData) {
          // Get counts of related data
          const { count: tasksCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', id);

          const { count: teamCount } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', id);

          const { count: docsCount } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', id);

          const { count: activitiesCount } = await supabase
            .from('activities')
            .select('*', { count: 'exact', head: true })
            .eq('target_name', projectData.name);

          setProject({
            ...projectData,
            user_name: projectData.profiles?.full_name || 'Unknown',
            user_email: projectData.profiles?.email || 'Unknown',
            tasks_total: tasksCount || 0,
            team_size: teamCount || 0,
            documents_count: docsCount || 0,
            activities_count: activitiesCount || 0,
          });
        } else {
          setStep('error');
          setErrorMessage('Project not found');
        }

      } catch (error) {
        console.error('Error fetching project:', error);
        setStep('error');
        setErrorMessage('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProject();
  }, [id, navigate]);

  // Execute deletion
  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      alert('Please type "DELETE" to confirm permanent deletion.');
      return;
    }

    setDeleting(true);
    setStep('deleting');
    setDeleteStats({ tasksDeleted: 0, teamMembersDeleted: 0, documentsDeleted: 0, activitiesDeleted: 0 });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // 1. Delete tasks
      const { count: tasksDeleted } = await supabase
        .from('tasks')
        .delete()
        .eq('project_id', id);
      setDeleteStats(prev => ({ ...prev, tasksDeleted: tasksDeleted || 0 }));

      // 2. Delete team members
      const { count: teamDeleted } = await supabase
        .from('team_members')
        .delete()
        .eq('project_id', id);
      setDeleteStats(prev => ({ ...prev, teamMembersDeleted: teamDeleted || 0 }));

      // 3. Delete documents from storage and table
      const { data: docs } = await supabase
        .from('documents')
        .select('file_url')
        .eq('project_id', id);
      
      if (docs && docs.length > 0) {
        // Delete files from storage
        for (const doc of docs) {
          const filePath = doc.file_url.split('/').pop();
          if (filePath) {
            await supabase.storage.from('project-documents').remove([`${id}/${filePath}`]);
          }
        }
      }
      
      const { count: docsDeleted } = await supabase
        .from('documents')
        .delete()
        .eq('project_id', id);
      setDeleteStats(prev => ({ ...prev, documentsDeleted: docsDeleted || 0 }));

      // 4. Delete related activities
      const { count: activitiesDeleted } = await supabase
        .from('activities')
        .delete()
        .eq('target_name', project?.name);
      setDeleteStats(prev => ({ ...prev, activitiesDeleted: activitiesDeleted || 0 }));

      // 5. Delete funding pitches
      await supabase
        .from('funding_pitches')
        .delete()
        .eq('project_id', id);

      // 6. Delete AI analyses
      await supabase
        .from('ai_analyses')
        .delete()
        .eq('project_id', id);

      // 7. Log activity before deleting project
      await supabase.from('activities').insert({
        user_id: session.user.id,
        user_name: adminName,
        user_email: session.user.email,
        action: `permanently deleted project "${project?.name}"`,
        target_type: 'project',
        target_name: project?.name,
        created_at: new Date().toISOString(),
      });

      // 8. Finally delete the project
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setStep('complete');

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/admin/projects');
      }, 2000);

    } catch (error) {
      console.error('Error deleting project:', error);
      setStep('error');
      setErrorMessage('Failed to delete project. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const getSectorIcon = (sector: string) => {
    if (sector?.includes('Agri')) return '🌾';
    if (sector?.includes('Blockchain')) return '🔗';
    if (sector?.includes('Health')) return '🏥';
    if (sector?.includes('Education')) return '📚';
    if (sector?.includes('Environment')) return '🌍';
    return '💡';
  };

  if (loading) {
    return (
      <div className="admin-delete-container">
        <Sidebar />
        <main className="admin-delete-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading project data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="admin-delete-container">
        <Sidebar />
        <main className="admin-delete-main">
          <div className="success-container">
            <div className="success-icon">✅</div>
            <h2>Project Deleted Successfully!</h2>
            <div className="delete-summary">
              <p>Deleted items:</p>
              <ul>
                <li>📁 Project: {project?.name}</li>
                <li>📋 Tasks: {deleteStats.tasksDeleted}</li>
                <li>👥 Team members: {deleteStats.teamMembersDeleted}</li>
                <li>📄 Documents: {deleteStats.documentsDeleted}</li>
                <li>📝 Activities: {deleteStats.activitiesDeleted}</li>
              </ul>
            </div>
            <p>Redirecting to projects list...</p>
            <Link to="/admin/projects" className="btn-back">Go to Projects Now</Link>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'error' || !project) {
    return (
      <div className="admin-delete-container">
        <Sidebar />
        <main className="admin-delete-main">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Error</h2>
            <p>{errorMessage || 'Project not found'}</p>
            <Link to="/admin/projects" className="btn-back">Back to Projects</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-delete-container">
      <Sidebar />
      
      <main className="admin-delete-main">
        {/* Header */}
        <div className="delete-header">
          <Link to={`/admin/projects/${id}`} className="back-link">
            ← Back to Project Details
          </Link>
          <h1>Delete Project: {project.name}</h1>
          <p className="warning-text">⚠️ This action cannot be undone. All data will be permanently removed.</p>
        </div>

        {/* Project Summary Card */}
        <div className="summary-card">
          <h3>📋 Project Summary</h3>
          <div className="project-summary">
            <div className="summary-icon">{getSectorIcon(project.sector)}</div>
            <div className="summary-details">
              <div className="summary-name">{project.name}</div>
              <div className="summary-meta">
                <span>Owner: {project.user_name}</span>
                <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                <span>Status: {project.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* What Will Be Deleted Card */}
        <div className="delete-items-card">
          <h3>🗑️ What will be deleted permanently</h3>
          <div className="delete-items-grid">
            <div className="delete-item">
              <div className="delete-item-icon">📁</div>
              <div className="delete-item-info">
                <div className="delete-item-title">Project</div>
                <div className="delete-item-count">{project.name}</div>
              </div>
            </div>
            <div className="delete-item">
              <div className="delete-item-icon">📋</div>
              <div className="delete-item-info">
                <div className="delete-item-title">Tasks</div>
                <div className="delete-item-count">{project.tasks_total} tasks</div>
              </div>
            </div>
            <div className="delete-item">
              <div className="delete-item-icon">👥</div>
              <div className="delete-item-info">
                <div className="delete-item-title">Team Members</div>
                <div className="delete-item-count">{project.team_size} members</div>
              </div>
            </div>
            <div className="delete-item">
              <div className="delete-item-icon">📄</div>
              <div className="delete-item-info">
                <div className="delete-item-title">Documents</div>
                <div className="delete-item-count">{project.documents_count} files</div>
              </div>
            </div>
            <div className="delete-item">
              <div className="delete-item-icon">💰</div>
              <div className="delete-item-info">
                <div className="delete-item-title">Funding Pitches</div>
                <div className="delete-item-count">All pitches</div>
              </div>
            </div>
            <div className="delete-item">
              <div className="delete-item-icon">🤖</div>
              <div className="delete-item-info">
                <div className="delete-item-title">AI Analyses</div>
                <div className="delete-item-count">All analyses</div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Card */}
        <div className="confirmation-card">
          <h3>⚠️ Confirm Permanent Deletion</h3>
          <p className="confirmation-warning">
            This action is <strong>irreversible</strong>. Please type <strong>"DELETE"</strong> in the box below to confirm.
          </p>
          
          <div className="confirmation-input">
            <label>Type DELETE to confirm:</label>
            <input
              type="text"
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="confirmation-field"
            />
          </div>

          <div className="confirmation-buttons">
            <Link to={`/admin/projects/${id}`} className="btn-cancel">
              Cancel
            </Link>
            <button 
              onClick={handleDelete} 
              className={`btn-delete ${confirmText === 'DELETE' ? 'ready' : ''}`}
              disabled={deleting || confirmText !== 'DELETE'}
            >
              {deleting ? 'Deleting...' : 'Permanently Delete Project'}
            </button>
          </div>
        </div>

        {/* Owner Info Card */}
        <div className="owner-card">
          <h3>👤 Project Owner</h3>
          <div className="owner-info">
            <div className="owner-avatar">{project.user_name.charAt(0).toUpperCase()}</div>
            <div className="owner-details">
              <div className="owner-name">{project.user_name}</div>
              <div className="owner-email">{project.user_email}</div>
              <div className="owner-note">
                Note: The project owner will NOT be notified automatically.
                You may want to contact them before deletion.
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .admin-delete-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        
        .admin-delete-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
          max-width: 1000px;
        }
        
        @media (max-width: 768px) {
          .admin-delete-main {
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
        .delete-header {
          margin-bottom: 2rem;
        }
        
        .back-link {
          color: #7c5fe6;
          text-decoration: none;
          font-size: 0.85rem;
          display: inline-block;
          margin-bottom: 0.5rem;
        }
        
        .delete-header h1 {
          font-size: 1.5rem;
          color: #fc8181;
          margin-bottom: 0.5rem;
          word-break: break-word;
        }
        
        .warning-text {
          color: #fc8181;
          font-size: 0.85rem;
          background: rgba(252,129,129,0.1);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          display: inline-block;
        }
        
        /* Cards */
        .summary-card, .delete-items-card, .confirmation-card, .owner-card {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .summary-card h3, .delete-items-card h3, .confirmation-card h3, .owner-card h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        /* Project Summary */
        .project-summary {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .summary-icon {
          font-size: 3rem;
        }
        
        .summary-details {
          flex: 1;
        }
        
        .summary-name {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .summary-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        /* Delete Items Grid */
        .delete-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .delete-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
        }
        
        .delete-item-icon {
          font-size: 1.5rem;
        }
        
        .delete-item-info {
          flex: 1;
        }
        
        .delete-item-title {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .delete-item-count {
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        /* Confirmation */
        .confirmation-warning {
          color: #fc8181;
          margin-bottom: 1rem;
          font-size: 0.85rem;
        }
        
        .confirmation-input {
          margin-bottom: 1.5rem;
        }
        
        .confirmation-input label {
          display: block;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.8);
        }
        
        .confirmation-field {
          width: 100%;
          padding: 0.75rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          text-align: center;
          letter-spacing: 2px;
        }
        
        .confirmation-field:focus {
          outline: none;
          border-color: #fc8181;
        }
        
        .confirmation-buttons {
          display: flex;
          gap: 1rem;
        }
        
        .btn-cancel {
          flex: 1;
          padding: 0.75rem;
          text-align: center;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          color: white;
          text-decoration: none;
          font-size: 0.85rem;
        }
        
        .btn-delete {
          flex: 2;
          padding: 0.75rem;
          background: rgba(252,129,129,0.3);
          border: 1px solid rgba(252,129,129,0.5);
          border-radius: 8px;
          color: #fc8181;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-delete.ready {
          background: #fc8181;
          color: white;
        }
        
        .btn-delete.ready:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(252,129,129,0.4);
        }
        
        .btn-delete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
          margin-bottom: 0.5rem;
        }
        
        .owner-note {
          font-size: 0.7rem;
          color: #f6c90e;
          background: rgba(246,201,14,0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }
        
        /* Success Container */
        .success-container, .error-container {
          text-align: center;
          padding: 3rem;
          background: rgba(0,0,0,0.35);
          border-radius: 20px;
          margin-top: 2rem;
        }
        
        .success-icon, .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        
        .success-container h2 {
          color: #48bb78;
          margin-bottom: 1rem;
        }
        
        .error-container h2 {
          color: #fc8181;
          margin-bottom: 1rem;
        }
        
        .delete-summary {
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          padding: 1rem;
          margin: 1.5rem 0;
          text-align: left;
        }
        
        .delete-summary ul {
          margin-top: 0.5rem;
          padding-left: 1.5rem;
        }
        
        .delete-summary li {
          margin: 0.25rem 0;
          font-size: 0.85rem;
        }
        
        .btn-back {
          display: inline-block;
          padding: 0.6rem 1.2rem;
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 30px;
          color: #7c5fe6;
          text-decoration: none;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default AdminProjectDelete;