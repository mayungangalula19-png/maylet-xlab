// C:\Users\user\maylet-xlab\src\app\routes\Notifications.tsx
// PROFESSIONAL NOTIFICATIONS CENTER – Real‑time alerts, read/unread, filtering

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'ai' | 'team' | 'funding' | 'system' | 'mentorship';
  read: boolean;
  created_at: string;
  metadata?: any;
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
    { icon: '📈', label: 'Analytics', route: '/analytics' },
    { icon: '🛒', label: 'Marketplace', route: '/marketplace' },
    { icon: '💬', label: 'Feedback', route: '/feedback' },
    { icon: '🛠️', label: 'Help & Support', route: '/help' },
  ];

  const userMenu = [
    { icon: '🔔', label: 'Notifications', route: '/notifications', active: true },
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
            <Link key={item.label} to={item.route} className="sidebar-link" title={collapsed ? item.label : undefined}>
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-divider"></div>
        <nav className="sidebar-nav user-nav">
          {userMenu.map((item) => (
            <Link key={item.label} to={item.route} className={`sidebar-link ${item.active ? 'active' : ''}`} title={collapsed ? item.label : undefined}>
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
// NOTIFICATION ITEM COMPONENT
// ============================================================
const NotificationItem = ({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) => {
  const getIcon = (type: string) => {
    switch(type) {
      case 'ai': return '🤖';
      case 'team': return '👥';
      case 'funding': return '💰';
      case 'mentorship': return '🎓';
      default: return '🔔';
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'ai': return '#2fd4ff';
      case 'team': return '#7c5fe6';
      case 'funding': return '#48bb78';
      case 'mentorship': return '#f6c90e';
      default: return 'rgba(255,255,255,0.5)';
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={`notification-item ${!notification.read ? 'unread' : ''}`} onClick={() => !notification.read && onRead(notification.id)}>
      <div className="notification-icon" style={{ background: `${getTypeColor(notification.type)}20`, color: getTypeColor(notification.type) }}>
        {getIcon(notification.type)}
      </div>
      <div className="notification-content">
        <div className="notification-header">
          <div className="notification-title">{notification.title}</div>
          <div className="notification-time">{timeAgo(notification.created_at)}</div>
        </div>
        <div className="notification-message">{notification.message}</div>
      </div>
      {!notification.read && <div className="unread-dot"></div>}
    </div>
  );
};

// ============================================================
// NOTIFICATIONS PAGE
// ============================================================
const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'ai' | 'team' | 'funding' | 'mentorship'>('all');
  // loading state removed – not used
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login');
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) {
      setNotifications(data || []);
    }
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const clearAll = async () => {
    if (window.confirm('Delete all notifications? This cannot be undone.')) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);
      if (!error) setNotifications([]);
    }
  };

  useEffect(() => {
    if (userId) fetchNotifications();
  }, [userId, fetchNotifications]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'ai') return n.type === 'ai';
    if (filter === 'team') return n.type === 'team';
    if (filter === 'funding') return n.type === 'funding';
    if (filter === 'mentorship') return n.type === 'mentorship';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-container">
      <Sidebar />
      <main className="notifications-main">
        <div className="notifications-header">
          <div>
            <h1>🔔 Notifications</h1>
            <p>Stay updated on your innovation journey</p>
          </div>
          <div className="header-actions">
            <button onClick={markAllAsRead} disabled={unreadCount === 0} className="btn-mark-read">
              Mark all as read
            </button>
            <button onClick={clearAll} className="btn-clear">Clear all</button>
          </div>
        </div>

        <div className="filter-tabs">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            All ({notifications.length})
          </button>
          <button className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>
            Unread ({unreadCount})
          </button>
          <button className={filter === 'ai' ? 'active' : ''} onClick={() => setFilter('ai')}>🤖 AI</button>
          <button className={filter === 'team' ? 'active' : ''} onClick={() => setFilter('team')}>👥 Team</button>
          <button className={filter === 'funding' ? 'active' : ''} onClick={() => setFilter('funding')}>💰 Funding</button>
          <button className={filter === 'mentorship' ? 'active' : ''} onClick={() => setFilter('mentorship')}>🎓 Mentorship</button>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔕</div>
            <h3>No notifications</h3>
            <p>You're all caught up! Check back later for updates.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <NotificationItem key={notification.id} notification={notification} onRead={markAsRead} />
            ))}
          </div>
        )}
      </main>

      <style>{`
        .notifications-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .notifications-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .notifications-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .notifications-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .header-actions {
          display: flex;
          gap: 0.75rem;
        }
        .btn-mark-read, .btn-clear {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-mark-read:hover {
          background: #7c5fe6;
        }
        .btn-clear:hover {
          background: #fc8181;
        }
        .filter-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }
        .filter-tabs button {
          background: rgba(255,255,255,0.05);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-tabs button.active {
          background: #7c5fe6;
        }
        .notifications-list {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          overflow: hidden;
        }
        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
        }
        .notification-item:hover {
          background: rgba(255,255,255,0.03);
        }
        .notification-item.unread {
          background: rgba(124,95,230,0.1);
        }
        .notification-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .notification-content {
          flex: 1;
        }
        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .notification-title {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .notification-time {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.4);
        }
        .notification-message {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
        }
        .unread-dot {
          width: 8px;
          height: 8px;
          background: #2fd4ff;
          border-radius: 50%;
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
        }
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
      `}</style>
    </div>
  );
};

export default Notifications;