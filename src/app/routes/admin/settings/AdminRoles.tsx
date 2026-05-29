// C:\Users\user\maylet-xlab\src\app\routes\admin\settings\AdminRoles.tsx
// FULL ADMIN ROLES MANAGEMENT PAGE - MANAGE USER ROLES AND PERMISSIONS
// WITH ROLE ASSIGNMENT, PERMISSION MATRIX, AND AUDIT LOGS

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isDefault: boolean;
  createdAt: string;
}

interface UserRole {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: string;
  assigned_at: string;
  assigned_by: string;
}

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
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
    { icon: '⚙️', label: 'Settings', route: '/admin/settings', active: true },
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
// ROLE CARD COMPONENT
// ============================================================
const RoleCard = ({ role, onEdit, onDelete, onViewUsers }: { role: Role; onEdit: (role: Role) => void; onDelete: (roleId: string) => void; onViewUsers: (roleName: string) => void }) => {
  const getRoleColor = (roleName: string) => {
    switch(roleName) {
      case 'super_admin': return '#fc8181';
      case 'admin': return '#7c5fe6';
      case 'mentor': return '#2fd4ff';
      case 'investor': return '#48bb78';
      case 'innovator': return '#f6c90e';
      default: return '#888';
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch(roleName) {
      case 'super_admin': return '👑';
      case 'admin': return '🛡️';
      case 'mentor': return '🎓';
      case 'investor': return '💰';
      case 'innovator': return '💡';
      default: return '👤';
    }
  };

  return (
    <div className="role-card">
      <div className="role-card-header">
        <div className="role-icon" style={{ background: getRoleColor(role.name) }}>
          {getRoleIcon(role.name)}
        </div>
        <div className="role-info">
          <h3 className="role-name">{role.name.replace('_', ' ').toUpperCase()}</h3>
          <p className="role-description">{role.description}</p>
        </div>
        {role.isDefault && <span className="default-badge">Default</span>}
      </div>
      <div className="role-stats">
        <div className="role-stat">
          <span className="stat-value">{role.userCount}</span>
          <span className="stat-label">Users</span>
        </div>
        <div className="role-stat">
          <span className="stat-value">{role.permissions.length}</span>
          <span className="stat-label">Permissions</span>
        </div>
      </div>
      <div className="role-actions">
        <button onClick={() => onViewUsers(role.name)} className="btn-view-users">👥 View Users</button>
        <button onClick={() => onEdit(role)} className="btn-edit-role">✏️ Edit</button>
        {!role.isDefault && (
          <button onClick={() => onDelete(role.id)} className="btn-delete-role">🗑️ Delete</button>
        )}
      </div>
    </div>
  );
};

// ============================================================
// PERMISSION MATRIX COMPONENT
// ============================================================
const PermissionMatrix = ({ permissions, userRoles, onTogglePermission }: { permissions: Permission[]; userRoles: string[]; onTogglePermission: (permissionId: string) => void }) => {
  return (
    <div className="permission-matrix">
      <table className="permission-table">
        <thead>
          <tr>
            <th>Permission</th>
            <th>Description</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((permission) => (
            <tr key={permission.id}>
              <td className="permission-name">{permission.name}</td>
              <td className="permission-desc">{permission.description}</td>
              <td>
                <span className={`permission-status ${userRoles.includes(permission.name) ? 'enabled' : 'disabled'}`}>
                  {userRoles.includes(permission.name) ? '✅ Enabled' : '❌ Disabled'}
                </span>
              </td>
              <td>
                <button 
                  onClick={() => onTogglePermission(permission.id)}
                  className={`toggle-permission ${userRoles.includes(permission.name) ? 'remove' : 'add'}`}
                >
                  {userRoles.includes(permission.name) ? 'Remove' : 'Add'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================
// MAIN ADMIN ROLES COMPONENT
// ============================================================
const AdminRoles = () => {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedRoleName, setSelectedRoleName] = useState('');
  const [roleUsers, setRoleUsers] = useState<UserRole[]>([]);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] as string[] });
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [assignUserEmail, setAssignUserEmail] = useState('');
  const [assignRole, setAssignRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Fetch all roles data
  const fetchRolesData = async () => {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();

      // Fetch roles from profiles (distinct roles)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('role');
      
      const roleCounts: Record<string, number> = {};
      profilesData?.forEach(p => {
        if (p.role) {
          roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
        }
      });

      // Define available roles
      const availableRoles: Role[] = [
        { id: '1', name: 'super_admin', description: 'Full system access with all permissions', permissions: ['all'], userCount: roleCounts['super_admin'] || 0, isDefault: false, createdAt: new Date().toISOString() },
        { id: '2', name: 'admin', description: 'Can manage users, projects, and system settings', permissions: ['manage_users', 'manage_projects', 'view_analytics', 'manage_settings'], userCount: roleCounts['admin'] || 0, isDefault: false, createdAt: new Date().toISOString() },
        { id: '3', name: 'innovator', description: 'Can create and manage their own projects', permissions: ['create_projects', 'edit_projects', 'view_own_projects', 'run_experiments'], userCount: roleCounts['innovator'] || 0, isDefault: true, createdAt: new Date().toISOString() },
        { id: '4', name: 'mentor', description: 'Can review projects and provide feedback', permissions: ['view_projects', 'provide_feedback', 'view_analytics'], userCount: roleCounts['mentor'] || 0, isDefault: false, createdAt: new Date().toISOString() },
        { id: '5', name: 'investor', description: 'Can view funding opportunities and invest', permissions: ['view_funding', 'invest_projects', 'view_portfolio'], userCount: roleCounts['investor'] || 0, isDefault: false, createdAt: new Date().toISOString() },
      ];

      setRoles(availableRoles);

      // Fetch user roles
      const { data: userRolesData } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at');
      
      const formattedUserRoles: UserRole[] = (userRolesData || []).map(user => ({
        id: user.id,
        user_id: user.id,
        user_name: user.full_name || user.email?.split('@')[0] || 'Unknown',
        user_email: user.email,
        role: user.role || 'user',
        assigned_at: user.created_at,
        assigned_by: 'System',
      }));
      
      setUserRoles(formattedUserRoles);

      // Define permissions
      const permissionList: Permission[] = [
        { id: 'p1', name: 'manage_users', category: 'User Management', description: 'Create, edit, and delete user accounts' },
        { id: 'p2', name: 'manage_projects', category: 'Project Management', description: 'Create, edit, and delete any project' },
        { id: 'p3', name: 'view_analytics', category: 'Analytics', description: 'View platform analytics and reports' },
        { id: 'p4', name: 'manage_settings', category: 'System', description: 'Change system settings and configurations' },
        { id: 'p5', name: 'create_projects', category: 'Projects', description: 'Create new projects' },
        { id: 'p6', name: 'edit_projects', category: 'Projects', description: 'Edit own projects' },
        { id: 'p7', name: 'view_own_projects', category: 'Projects', description: 'View own projects' },
        { id: 'p8', name: 'run_experiments', category: 'Experiments', description: 'Run AI experiments on projects' },
        { id: 'p9', name: 'view_projects', category: 'Projects', description: 'View all projects' },
        { id: 'p10', name: 'provide_feedback', category: 'Mentorship', description: 'Provide feedback on projects' },
        { id: 'p11', name: 'view_funding', category: 'Funding', description: 'View funding opportunities' },
        { id: 'p12', name: 'invest_projects', category: 'Funding', description: 'Invest in projects' },
        { id: 'p13', name: 'view_portfolio', category: 'Funding', description: 'View investment portfolio' },
        { id: 'p14', name: 'moderate_content', category: 'Moderation', description: 'Review and moderate user content' },
        { id: 'p15', name: 'view_logs', category: 'System', description: 'View system logs and audit trails' },
      ];
      
      setPermissions(permissionList);

    } catch (error) {
      console.error('Error fetching roles data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new role
  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      alert('Role name is required');
      return;
    }

    const newRoleObj: Role = {
      id: Date.now().toString(),
      name: newRole.name.toLowerCase().replace(/\s/g, '_'),
      description: newRole.description,
      permissions: newRole.permissions,
      userCount: 0,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    setRoles([...roles, newRoleObj]);
    setShowAddRoleModal(false);
    setNewRole({ name: '', description: '', permissions: [] });
  };

  // Update role
  const handleUpdateRole = async () => {
    if (!editingRole) return;

    setRoles(roles.map(r => r.id === editingRole.id ? editingRole : r));
    setShowEditRoleModal(false);
    setEditingRole(null);
  };

  // Delete role
  const handleDeleteRole = async (roleId: string) => {
    if (confirm('Are you sure you want to delete this role? Users with this role will be affected.')) {
      setRoles(roles.filter(r => r.id !== roleId));
    }
  };

  // Assign role to user
  const handleAssignRole = async () => {
    if (!assignUserEmail || !assignRole) {
      alert('Please select both user and role');
      return;
    }

    try {
      // Find user by email
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', assignUserEmail)
        .single();

      if (!userData) {
        alert('User not found');
        return;
      }

      // Update user role
      const { error } = await supabase
        .from('profiles')
        .update({ role: assignRole })
        .eq('id', userData.id);

      if (error) throw error;

      // Refresh data
      await fetchRolesData();
      setShowAssignRoleModal(false);
      setAssignUserEmail('');
      setAssignRole('');
      
      alert(`Role assigned to ${userData.email} successfully!`);
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Failed to assign role');
    }
  };

  // View users by role
  const handleViewUsersByRole = (roleName: string) => {
    const filteredUsers = userRoles.filter(u => u.role === roleName);
    setRoleUsers(filteredUsers);
    setSelectedRoleName(roleName);
    setShowUsersModal(true);
  };

  const getRoleColor = (roleName: string) => {
    switch(roleName) {
      case 'super_admin': return '#fc8181';
      case 'admin': return '#7c5fe6';
      case 'mentor': return '#2fd4ff';
      case 'investor': return '#48bb78';
      case 'innovator': return '#f6c90e';
      default: return '#888';
    }
  };

  const filteredUserRoles = userRoles.filter(u => 
    u.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchRolesData();
  }, []);

  if (loading) {
    return (
      <div className="admin-roles-container">
        <Sidebar />
        <main className="admin-roles-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading roles management...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-roles-container">
      <Sidebar />
      
      <main className="admin-roles-main">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1>Role Management</h1>
            <p className="subtitle">Manage user roles and permissions</p>
          </div>
          <div className="header-right">
            <button onClick={() => setShowAddRoleModal(true)} className="btn-create-role">
              + Create New Role
            </button>
            <button onClick={() => setShowAssignRoleModal(true)} className="btn-assign-role">
              👥 Assign Role
            </button>
            <button onClick={() => fetchRolesData()} className="btn-refresh">
              ⟳ Refresh
            </button>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="roles-grid">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={(r) => { setEditingRole(r); setShowEditRoleModal(true); }}
              onDelete={handleDeleteRole}
              onViewUsers={handleViewUsersByRole}
            />
          ))}
        </div>

        {/* Current User Roles Table */}
        <div className="roles-table-section">
          <div className="section-header">
            <h2>Current User Roles</h2>
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="table-container">
            <table className="user-roles-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Assigned By</th>
                  <th>Assigned Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUserRoles.map((userRole) => (
                  <tr key={userRole.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{userRole.user_name.charAt(0).toUpperCase()}</div>
                        <span>{userRole.user_name}</span>
                      </div>
                    </td>
                    <td>{userRole.user_email}</td>
                    <td>
                      <span className="role-badge" style={{ background: getRoleColor(userRole.role) }}>
                        {userRole.role}
                      </span>
                    </td>
                    <td>{userRole.assigned_by}</td>
                    <td>{new Date(userRole.assigned_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-change-role" onClick={() => { setAssignUserEmail(userRole.user_email); setShowAssignRoleModal(true); }}>
                        Change
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Role Modal */}
        {showAddRoleModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Create New Role</h3>
                <button onClick={() => setShowAddRoleModal(false)} className="modal-close">×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Role Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Content Manager"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Describe the role responsibilities"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowAddRoleModal(false)} className="btn-cancel">Cancel</button>
                <button onClick={handleCreateRole} className="btn-create">Create Role</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Role Modal */}
        {showEditRoleModal && editingRole && (
          <div className="modal-overlay">
            <div className="modal-content large">
              <div className="modal-header">
                <h3>Edit Role: {editingRole.name}</h3>
                <button onClick={() => setShowEditRoleModal(false)} className="modal-close">×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Role Name</label>
                  <input
                    type="text"
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editingRole.description}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Permissions</label>
                  <PermissionMatrix
                    permissions={permissions}
                    userRoles={editingRole.permissions}
                    onTogglePermission={(permId) => {
                      const perm = permissions.find(p => p.id === permId);
                      if (perm) {
                        setEditingRole({
                          ...editingRole,
                          permissions: editingRole.permissions.includes(perm.name)
                            ? editingRole.permissions.filter(p => p !== perm.name)
                            : [...editingRole.permissions, perm.name]
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowEditRoleModal(false)} className="btn-cancel">Cancel</button>
                <button onClick={handleUpdateRole} className="btn-save">Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Role Modal */}
        {showAssignRoleModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Assign Role to User</h3>
                <button onClick={() => setShowAssignRoleModal(false)} className="modal-close">×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>User Email</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={assignUserEmail}
                    onChange={(e) => setAssignUserEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Select Role</label>
                  <select value={assignRole} onChange={(e) => setAssignRole(e.target.value)}>
                    <option value="">Select a role...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.name}>{role.name.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowAssignRoleModal(false)} className="btn-cancel">Cancel</button>
                <button onClick={handleAssignRole} className="btn-assign">Assign Role</button>
              </div>
            </div>
          </div>
        )}

        {/* View Users Modal */}
        {showUsersModal && (
          <div className="modal-overlay">
            <div className="modal-content large">
              <div className="modal-header">
                <h3>Users with Role: {selectedRoleName}</h3>
                <button onClick={() => setShowUsersModal(false)} className="modal-close">×</button>
              </div>
              <div className="modal-body">
                <div className="users-list-modal">
                  {roleUsers.length === 0 ? (
                    <p>No users found with this role.</p>
                  ) : (
                    <table className="users-table-modal">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Assigned Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roleUsers.map(user => (
                          <tr key={user.id}>
                            <td>{user.user_name}</td>
                            <td>{user.user_email}</td>
                            <td>{new Date(user.assigned_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowUsersModal(false)} className="btn-close">Close</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .admin-roles-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        
        .admin-roles-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .admin-roles-main {
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
        
        .btn-create-role, .btn-assign-role, .btn-refresh {
          padding: 0.5rem 1.2rem;
          border-radius: 30px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        
        .btn-create-role {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
        }
        
        .btn-assign-role {
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          color: #9b7ff0;
        }
        
        .btn-refresh {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .role-card {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.25rem;
          transition: all 0.2s;
        }
        
        .role-card:hover {
          transform: translateY(-2px);
          background: rgba(0,0,0,0.5);
        }
        
        .role-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .role-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        
        .role-info {
          flex: 1;
        }
        
        .role-name {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        
        .role-description {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .default-badge {
          background: rgba(72,187,120,0.2);
          color: #48bb78;
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          font-size: 0.6rem;
        }
        
        .role-stats {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 0.75rem 0;
          border-top: 1px solid rgba(255,255,255,0.1);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .role-stat {
          flex: 1;
          text-align: center;
        }
        
        .stat-value {
          display: block;
          font-size: 1.2rem;
          font-weight: 700;
          color: #2fd4ff;
        }
        
        .stat-label {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
        }
        
        .role-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .btn-view-users, .btn-edit-role, .btn-delete-role {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        
        .btn-view-users {
          background: rgba(47,212,255,0.2);
          color: #2fd4ff;
        }
        
        .btn-edit-role {
          background: rgba(124,95,230,0.2);
          color: #9b7ff0;
        }
        
        .btn-delete-role {
          background: rgba(252,129,129,0.2);
          color: #fc8181;
        }
        
        .roles-table-section {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.25rem;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .section-header h2 {
          font-size: 1rem;
        }
        
        .search-input {
          padding: 0.5rem 1rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 30px;
          color: white;
          width: 250px;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        .user-roles-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .user-roles-table th, .user-roles-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .user-roles-table th {
          color: rgba(255,255,255,0.7);
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
        }
        
        .role-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }
        
        .btn-change-role {
          background: rgba(124,95,230,0.2);
          border: none;
          padding: 0.25rem 0.6rem;
          border-radius: 15px;
          color: #9b7ff0;
          cursor: pointer;
          font-size: 0.7rem;
        }
        
        /* Modal Styles */
        .modal-overlay {
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
        
        .modal-content {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-content.large {
          max-width: 800px;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .modal-header h3 {
          margin: 0;
        }
        
        .modal-close {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
        }
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.8);
        }
        
        .form-group input, .form-group textarea, .form-group select {
          width: 100%;
          padding: 0.75rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        
        .permission-matrix {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .permission-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .permission-table th, .permission-table td {
          padding: 0.5rem;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .permission-name {
          font-weight: 500;
        }
        
        .permission-desc {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .permission-status {
          font-size: 0.7rem;
        }
        
        .permission-status.enabled { color: #48bb78; }
        .permission-status.disabled { color: #fc8181; }
        
        .toggle-permission {
          padding: 0.2rem 0.6rem;
          border-radius: 15px;
          font-size: 0.7rem;
          cursor: pointer;
          border: none;
        }
        
        .toggle-permission.add {
          background: rgba(72,187,120,0.2);
          color: #48bb78;
        }
        
        .toggle-permission.remove {
          background: rgba(252,129,129,0.2);
          color: #fc8181;
        }
        
        .btn-cancel, .btn-create, .btn-save, .btn-assign, .btn-close {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }
        
        .btn-cancel {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .btn-create, .btn-save, .btn-assign {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
        }
        
        .btn-close {
          background: rgba(124,95,230,0.2);
          color: #9b7ff0;
        }
        
        .users-list-modal {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .users-table-modal {
          width: 100%;
          border-collapse: collapse;
        }
        
        .users-table-modal th, .users-table-modal td {
          padding: 0.5rem;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
      `}</style>
    </div>
  );
};

export default AdminRoles;