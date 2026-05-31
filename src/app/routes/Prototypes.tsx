// C:\Users\user\maylet-xlab\src\app\routes\Prototypes.tsx
// PROFESSIONAL PROTOTYPES PAGE – Upload, view, edit, delete prototypes

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface Prototype {
  id: string;
  project_id: string;
  project_name?: string;
  name: string;
  description: string;
  file_url: string;
  thumbnail_url: string | null;
  version: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
  downloads: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Project {
  id: string;
  name: string;
  sector: string;
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
    { icon: '📦', label: 'Prototypes', route: '/prototypes', active: true },
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
// PROTOTYPE CARD COMPONENT
// ============================================================
const PrototypeCard = ({ prototype, onDelete, onEdit }: { prototype: Prototype; onDelete: (id: string) => void; onEdit: (prototype: Prototype) => void }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="prototype-card">
      <div className="prototype-thumbnail">
        {prototype.thumbnail_url ? (
          <img src={prototype.thumbnail_url} alt={prototype.name} />
        ) : (
          <div className="thumbnail-placeholder">📦</div>
        )}
      </div>
      <div className="prototype-info">
        <h3>{prototype.name}</h3>
        <p className="prototype-project">{prototype.project_name}</p>
        <p className="prototype-description">{prototype.description.substring(0, 100)}...</p>
        <div className="prototype-meta">
          <span>v{prototype.version}</span>
          <span>👁️ {prototype.views}</span>
          <span>⬇️ {prototype.downloads}</span>
          <span className={`status-${prototype.status}`}>{prototype.status}</span>
        </div>
      </div>
      <div className="prototype-actions">
        <a href={prototype.file_url} target="_blank" rel="noopener noreferrer" className="btn-view">View</a>
        <button onClick={() => onEdit(prototype)} className="btn-edit">Edit</button>
        <button onClick={() => setShowDeleteConfirm(true)} className="btn-delete">Delete</button>
      </div>
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-dialog">
            <p>Delete "{prototype.name}"? This action cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button onClick={() => onDelete(prototype.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// UPLOAD/EDIT MODAL
// ============================================================
const PrototypeModal = ({ prototype, projects, onClose, onSave }: { prototype?: Prototype; projects: Project[]; onClose: () => void; onSave: () => void }) => {
  const [formData, setFormData] = useState({
    project_id: prototype?.project_id || '',
    name: prototype?.name || '',
    description: prototype?.description || '',
    version: prototype?.version || '1.0.0',
    status: prototype?.status || 'draft',
  });
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.name || (!file && !prototype)) {
      setError('Please fill all required fields and select a file');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      let fileUrl = prototype?.file_url || '';
      let thumbnailUrl = prototype?.thumbnail_url || '';

      // Upload new file if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('prototypes')
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('prototypes').getPublicUrl(fileName);
        fileUrl = urlData.publicUrl;
      }

      // Upload thumbnail if provided
      if (thumbnail) {
        const thumbExt = thumbnail.name.split('.').pop();
        const thumbName = `${session.user.id}-thumb-${Date.now()}.${thumbExt}`;
        const { error: thumbError } = await supabase.storage
          .from('prototypes')
          .upload(thumbName, thumbnail);
        if (thumbError) throw thumbError;
        const { data: thumbData } = supabase.storage.from('prototypes').getPublicUrl(thumbName);
        thumbnailUrl = thumbData.publicUrl;
      }

      if (prototype) {
        // Update existing
        const { error: updateError } = await supabase
          .from('prototypes')
          .update({
            project_id: formData.project_id,
            name: formData.name,
            description: formData.description,
            version: formData.version,
            status: formData.status,
            file_url: fileUrl,
            thumbnail_url: thumbnailUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prototype.id);
        if (updateError) throw updateError;
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('prototypes')
          .insert({
            user_id: session.user.id,
            project_id: formData.project_id,
            name: formData.name,
            description: formData.description,
            version: formData.version,
            status: formData.status,
            file_url: fileUrl,
            thumbnail_url: thumbnailUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        if (insertError) throw insertError;
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>{prototype ? 'Edit Prototype' : 'Upload New Prototype'}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}
            <div className="form-group">
              <label>Project *</label>
              <select value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })} required>
                <option value="">Select a project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sector})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Prototype Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="form-group">
              <label>Version</label>
              <input type="text" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="form-group">
              <label>Prototype File * {!prototype && '(required)'}</label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.zip,.exe,.apk,.html,image/*" />
              {prototype && <p className="hint">Leave empty to keep current file</p>}
            </div>
            <div className="form-group">
              <label>Thumbnail (optional)</label>
              <input type="file" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} accept="image/*" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" disabled={uploading} className="btn-save">{uploading ? 'Uploading...' : (prototype ? 'Save Changes' : 'Upload')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// MAIN PROTOTYPES PAGE
// ============================================================
const Prototypes = () => {
  const [loading, setLoading] = useState(true);
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingPrototype, setEditingPrototype] = useState<Prototype | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const fetchPrototypes = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    const { data, error } = await supabase
      .from('prototypes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Fetch prototypes error:', error);
    } else {
      // enrich with project names
      const enriched = await Promise.all((data || []).map(async (p) => {
        const { data: proj } = await supabase.from('projects').select('name').eq('id', p.project_id).single();
        return { ...p, project_name: proj?.name || 'Unknown' };
      }));
      setPrototypes(enriched as Prototype[]);
    }
    setLoading(false);
  }, [navigate]);

  const fetchProjects = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('projects').select('id, name, sector').eq('user_id', session.user.id);
      setProjects(data || []);
    }
  }, []);

  useEffect(() => {
    fetchPrototypes();
    fetchProjects();
  }, [fetchPrototypes, fetchProjects]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('prototypes').delete().eq('id', id);
    if (!error) {
      setPrototypes(prev => prev.filter(p => p.id !== id));
    } else {
      alert('Delete failed');
    }
  };

  const filteredPrototypes = prototypes.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="prototypes-container">
        <Sidebar />
        <main className="prototypes-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="prototypes-container">
      <Sidebar />
      <main className="prototypes-main">
        <div className="prototypes-header">
          <div>
            <h1>📦 Prototypes</h1>
            <p>Manage your product prototypes – upload, share, and iterate</p>
          </div>
          <button onClick={() => setShowUploadModal(true)} className="btn-upload">+ Upload Prototype</button>
        </div>

        <div className="search-filter-bar">
          <input type="text" placeholder="Search prototypes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {filteredPrototypes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No prototypes yet</h3>
            <p>Upload your first prototype to showcase your innovation</p>
            <button onClick={() => setShowUploadModal(true)} className="btn-create-empty">+ Upload Prototype</button>
          </div>
        ) : (
          <div className="prototypes-grid">
            {filteredPrototypes.map(proto => (
              <PrototypeCard key={proto.id} prototype={proto} onDelete={handleDelete} onEdit={setEditingPrototype} />
            ))}
          </div>
        )}

        {showUploadModal && (
          <PrototypeModal projects={projects} onClose={() => setShowUploadModal(false)} onSave={fetchPrototypes} />
        )}
        {editingPrototype && (
          <PrototypeModal prototype={editingPrototype} projects={projects} onClose={() => setEditingPrototype(null)} onSave={fetchPrototypes} />
        )}
      </main>

      <style>{`
        .prototypes-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .prototypes-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .prototypes-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .prototypes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .prototypes-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .btn-upload {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 30px;
          font-weight: 600;
          cursor: pointer;
        }
        .search-filter-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .search-input {
          flex: 1;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          padding: 0.6rem 1rem;
          color: white;
        }
        .prototypes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        .prototype-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          overflow: hidden;
          transition: transform 0.2s;
          position: relative;
        }
        .prototype-card:hover {
          transform: translateY(-4px);
        }
        .prototype-thumbnail {
          height: 160px;
          background: #1a1a2e;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .thumbnail-placeholder {
          font-size: 3rem;
        }
        .prototype-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .prototype-info {
          padding: 1rem;
        }
        .prototype-info h3 {
          margin: 0 0 0.25rem;
        }
        .prototype-project {
          font-size: 0.7rem;
          color: #2fd4ff;
        }
        .prototype-description {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
          margin: 0.5rem 0;
        }
        .prototype-meta {
          display: flex;
          gap: 0.75rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        .status-draft { color: #f6c90e; }
        .status-published { color: #48bb78; }
        .status-archived { color: #fc8181; }
        .prototype-actions {
          display: flex;
          gap: 0.5rem;
          padding: 0 1rem 1rem;
        }
        .btn-view, .btn-edit, .btn-delete {
          flex: 1;
          text-align: center;
          padding: 0.3rem;
          border-radius: 30px;
          text-decoration: none;
          background: rgba(255,255,255,0.1);
          border: none;
          cursor: pointer;
          font-size: 0.7rem;
          color: white;
        }
        .btn-view:hover { background: #2fd4ff; color: #0a0d1a; }
        .btn-edit:hover { background: #7c5fe6; }
        .btn-delete:hover { background: #fc8181; }
        .delete-confirm-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .delete-confirm-dialog {
          background: #1a1a2e;
          padding: 1rem;
          border-radius: 16px;
          text-align: center;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(0,0,0,0.3);
          border-radius: 20px;
        }
        .modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: #1a1a2e; border-radius: 20px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .modal-body { padding: 1.5rem; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.7rem; text-transform: uppercase; color: #7c5fe6; margin-bottom: 0.25rem; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.6rem; color: white; }
        .hint { font-size: 0.65rem; color: rgba(255,255,255,0.4); margin-top: 0.25rem; }
        .btn-cancel, .btn-save { padding: 0.4rem 1rem; border-radius: 30px; border: none; cursor: pointer; }
        .btn-cancel { background: rgba(255,255,255,0.1); color: white; }
        .btn-save { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a; font-weight: 600; }
        .error-banner { background: rgba(252,129,129,0.2); border: 1px solid #fc8181; border-radius: 12px; padding: 0.75rem; margin-bottom: 1rem; color: #fc8181; }
        .loading-spinner { width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6; border-radius: 50%; animation: spin 1s linear infinite; margin: 20% auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Prototypes;