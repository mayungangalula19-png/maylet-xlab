// C:\Users\user\maylet-xlab\src\app\routes\LearningHub.tsx
// PROFESSIONAL LEARNING HUB – Courses, videos, articles with progress tracking

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
type ResourceType = 'course' | 'video' | 'article' | 'workshop';
type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

interface LearningResource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  skill_level: SkillLevel;
  duration: string; // e.g., "2 hours", "15 min"
  thumbnail_url: string | null;
  url: string;
  author: string;
  tags: string[];
  created_at: string;
}

interface UserProgress {
  id: string;
  resource_id: string;
  completed: boolean;
  completed_at: string | null;
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
    { icon: '📚', label: 'Learning Hub', route: '/learning', active: true },
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
// RESOURCE CARD COMPONENT
// ============================================================
const ResourceCard = ({
  resource,
  completed,
  onToggleComplete,
}: {
  resource: LearningResource;
  completed: boolean;
  onToggleComplete: (resourceId: string, completed: boolean) => void;
}) => {
  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'course': return '📘';
      case 'video': return '🎥';
      case 'article': return '📄';
      case 'workshop': return '🎤';
      default: return '📚';
    }
  };

  const getLevelColor = (level: SkillLevel) => {
    switch (level) {
      case 'beginner': return '#48bb78';
      case 'intermediate': return '#f6c90e';
      case 'advanced': return '#fc8181';
      default: return '#7c5fe6';
    }
  };

  return (
    <div className={`resource-card ${completed ? 'completed' : ''}`}>
      <div className="resource-thumbnail">
        {resource.thumbnail_url ? (
          <img src={resource.thumbnail_url} alt={resource.title} />
        ) : (
          <div className="thumbnail-placeholder">{getTypeIcon(resource.type)}</div>
        )}
      </div>
      <div className="resource-content">
        <div className="resource-header">
          <span className="resource-type">{getTypeIcon(resource.type)} {resource.type.toUpperCase()}</span>
          <span className="resource-level" style={{ background: getLevelColor(resource.skill_level) }}>
            {resource.skill_level}
          </span>
        </div>
        <h3>{resource.title}</h3>
        <p>{resource.description.substring(0, 120)}...</p>
        <div className="resource-meta">
          <span>⏱️ {resource.duration}</span>
          <span>✍️ {resource.author}</span>
          <span>🏷️ {resource.tags.slice(0, 2).join(', ')}</span>
        </div>
        <div className="resource-actions">
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="btn-view">Open Resource</a>
          <button
            className={`btn-complete ${completed ? 'completed' : ''}`}
            onClick={() => onToggleComplete(resource.id, !completed)}
          >
            {completed ? '✓ Completed' : 'Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN LEARNING HUB PAGE
// ============================================================
const LearningHub = () => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<SkillLevel | 'all'>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login');
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Fetch all learning resources
      const { data: resourcesData, error: rError } = await supabase
        .from('learning_resources')
        .select('*')
        .order('created_at', { ascending: false });
      if (rError) throw rError;
      setResources(resourcesData || []);

      // Fetch user progress
      const { data: progressData, error: pError } = await supabase
        .from('user_learning_progress')
        .select('*')
        .eq('user_id', userId);
      if (pError) throw pError;
      setUserProgress(progressData || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, fetchData]);

  const handleToggleComplete = async (resourceId: string, completed: boolean) => {
    if (!userId) return;
    try {
      if (completed) {
        // Insert completion record
        const { error } = await supabase.from('user_learning_progress').insert({
          user_id: userId,
          resource_id: resourceId,
          completed: true,
          completed_at: new Date().toISOString(),
        });
        if (error) throw error;
        setUserProgress(prev => [...prev, { id: 'temp', resource_id: resourceId, completed: true, completed_at: new Date().toISOString() }]);
      } else {
        // Delete completion record
        const existing = userProgress.find(p => p.resource_id === resourceId);
        if (existing) {
          const { error } = await supabase.from('user_learning_progress').delete().eq('id', existing.id);
          if (error) throw error;
          setUserProgress(prev => prev.filter(p => p.resource_id !== resourceId));
        }
      }
    } catch (err) {
      console.error('Update progress error:', err);
    }
  };

  const isCompleted = (resourceId: string) => userProgress.some(p => p.resource_id === resourceId);

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          res.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          res.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || res.type === typeFilter;
    const matchesLevel = levelFilter === 'all' || res.skill_level === levelFilter;
    return matchesSearch && matchesType && matchesLevel;
  });

  const stats = {
    total: resources.length,
    completed: userProgress.length,
    inProgress: resources.filter(r => !isCompleted(r.id)).length,
    byType: {
      courses: resources.filter(r => r.type === 'course').length,
      videos: resources.filter(r => r.type === 'video').length,
      articles: resources.filter(r => r.type === 'article').length,
      workshops: resources.filter(r => r.type === 'workshop').length,
    },
  };

  if (loading) {
    return (
      <div className="learning-hub-container">
        <Sidebar />
        <main className="hub-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="learning-hub-container">
      <Sidebar />
      <main className="hub-main">
        <div className="hub-header">
          <h1>📚 Learning Hub</h1>
          <p>Master innovation, design, and entrepreneurship with curated resources</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon">📖</div><div className="stat-value">{stats.total}</div><div className="stat-label">Total Resources</div></div>
          <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value">{stats.completed}</div><div className="stat-label">Completed</div></div>
          <div className="stat-card"><div className="stat-icon">🔄</div><div className="stat-value">{stats.inProgress}</div><div className="stat-label">In Progress</div></div>
          <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-value">{stats.byType.courses}/{stats.byType.videos}/{stats.byType.articles}/{stats.byType.workshops}</div><div className="stat-label">C/V/A/W</div></div>
        </div>

        {/* Search and Filters */}
        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="Search by title, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="filters">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
              <option value="all">All Types</option>
              <option value="course">📘 Courses</option>
              <option value="video">🎥 Videos</option>
              <option value="article">📄 Articles</option>
              <option value="workshop">🎤 Workshops</option>
            </select>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as any)}>
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Resources Grid */}
        {filteredResources.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No resources found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="resources-grid">
            {filteredResources.map(res => (
              <ResourceCard
                key={res.id}
                resource={res}
                completed={isCompleted(res.id)}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </div>
        )}
      </main>

      <style>{`
        .learning-hub-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .hub-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .hub-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .hub-header {
          margin-bottom: 2rem;
        }
        .hub-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
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
        .stat-icon {
          font-size: 2rem;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .stat-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        .search-filter-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .search-input {
          flex: 2;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          padding: 0.75rem 1rem;
          color: white;
        }
        .filters {
          display: flex;
          gap: 0.5rem;
        }
        .filters select {
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          padding: 0.75rem 1rem;
          color: white;
        }
        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        .resource-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          overflow: hidden;
          transition: transform 0.2s;
        }
        .resource-card:hover {
          transform: translateY(-4px);
        }
        .resource-card.completed {
          opacity: 0.8;
          border-left: 4px solid #48bb78;
        }
        .resource-thumbnail {
          height: 160px;
          background: #1a1a2e;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .thumbnail-placeholder {
          font-size: 3rem;
        }
        .resource-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .resource-content {
          padding: 1.2rem;
        }
        .resource-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .resource-type {
          font-size: 0.7rem;
          color: #2fd4ff;
        }
        .resource-level {
          font-size: 0.6rem;
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          color: #0a0d1a;
          font-weight: 600;
        }
        .resource-content h3 {
          margin: 0.5rem 0;
          font-size: 1.1rem;
        }
        .resource-content p {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
          margin: 0.5rem 0;
        }
        .resource-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
          margin: 0.5rem 0;
        }
        .resource-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .btn-view, .btn-complete {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.4rem 1rem;
          border-radius: 30px;
          cursor: pointer;
          text-decoration: none;
          color: white;
          font-size: 0.7rem;
        }
        .btn-view:hover {
          background: #7c5fe6;
        }
        .btn-complete {
          background: rgba(72,187,120,0.2);
          color: #48bb78;
        }
        .btn-complete.completed {
          background: #48bb78;
          color: #0a0d1a;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(0,0,0,0.3);
          border-radius: 20px;
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

export default LearningHub;