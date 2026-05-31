// C:\Users\user\maylet-xlab\src\app\routes\Notifications.tsx
// PROFESSIONAL NOTIFICATIONS CENTER – Real-time, mark read, delete, pagination

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
type NotificationType = 'ai' | 'team' | 'funding' | 'system' | 'mentorship';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
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
            <Link key={item.label} to={item.route} className={`sidebar-link ${item.active ? 'active' : ''}`} title={collapsed ? item.label : undefined}>
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
const NotificationItem = ({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'ai': return '🤖';
      case 'team': return '👥';
      case 'funding': return '💰';
      case 'mentorship': return '🎓';
      default: return '🔔';
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className={`notification-item ${!notification.read ? 'unread' : ''}`}>
      <div className="notification-icon">{getTypeIcon(notification.type)}</div>
      <div className="notification-content">
        <div className="notification-header">
          <strong>{notification.title}</strong>
          <span className="notification-time">{timeAgo(notification.created_at)}</span>
        </div>
        <div className="notification-message">{notification.message}</div>
        <div className="notification-actions">
          {!notification.read && (
            <button onClick={() => onMarkRead(notification.id)} className="mark-read-btn">
              Mark as read
            </button>
          )}
          <button onClick={() => onDelete(notification.id)} className="delete-btn">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN NOTIFICATIONS PAGE
// ============================================================
const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const observerRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login');
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const fetchNotifications = useCallback(async (reset = false) => {
    if (!userId) return;
    const currentPage = reset ? 0 : page;
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filter === 'unread') query = query.eq('read', false);
    else if (filter === 'read') query = query.eq('read', true);

    const { data, error, count } = await query;
    if (error) {
      console.error('Fetch error:', error);
      return;
    }
    if (reset) {
      setNotifications(data || []);
      setPage(1);
      setHasMore((data?.length || 0) === PAGE_SIZE);
    } else {
      setNotifications(prev => [...prev, ...(data || [])]);
      setHasMore((data?.length || 0) === PAGE_SIZE);
      setPage(prev => prev + 1);
    }
  }, [userId, filter, page]);

  useEffect(() => {
    if (userId) {
      setNotifications([]);
      setPage(0);
      setHasMore(true);
      fetchNotifications(true);
    }
  }, [userId, filter]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev =>
          prev.map(n => n.id === payload.new.id ? (payload.new as Notification) : n)
        );
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [userId]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current || loadingMore || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          fetchNotifications().finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) console.error('Mark read error:', error);
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);
    if (error) console.error('Mark all read error:', error);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) console.error('Delete error:', error);
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Delete all notifications? This cannot be undone.')) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId!);
      if (error) console.error('Delete all error:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading && !notifications.length) {
    return (
      <div className="notifications-container">
        <Sidebar />
        <main className="notifications-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <Sidebar />
      <main className="notifications-main">
        <div className="notifications-header">
          <div>
            <h1>🔔 Notifications</h1>
            <p>Stay updated with your innovation journey</p>
          </div>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="mark-all-btn">
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={handleDeleteAll} className="delete-all-btn">
                Delete all
              </button>
            )}
          </div>
        </div>

        <div className="filter-tabs">
          <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All ({notifications.length})
          </button>
          <button className={`filter-tab ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
            Unread ({unreadCount})
          </button>
          <button className={`filter-tab ${filter === 'read' ? 'active' : ''}`} onClick={() => setFilter('read')}>
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No notifications</h3>
            <p>When you receive notifications, they will appear here.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(notif => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
            {hasMore && <div ref={observerRef} className="loading-trigger">{loadingMore && <span>Loading more...</span>}</div>}
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
        .mark-all-btn, .delete-all-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.4rem 1rem;
          border-radius: 30px;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .delete-all-btn:hover {
          background: #fc8181;
          color: #0a0d1a;
        }
        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 0.5rem;
        }
        .filter-tab {
          background: none;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 30px;
          cursor: pointer;
          color: rgba(255,255,255,0.7);
          transition: all 0.2s;
        }
        .filter-tab.active {
          background: #7c5fe6;
          color: white;
        }
        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .notification-item {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1.2rem;
          display: flex;
          gap: 1rem;
          transition: transform 0.2s;
          border-left: 3px solid transparent;
        }
        .notification-item.unread {
          border-left-color: #2fd4ff;
          background: rgba(47,212,255,0.05);
        }
        .notification-icon {
          font-size: 1.8rem;
        }
        .notification-content {
          flex: 1;
        }
        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
          flex-wrap: wrap;
        }
        .notification-time {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        .notification-message {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.8);
          margin-bottom: 0.5rem;
        }
        .notification-actions {
          display: flex;
          gap: 1rem;
        }
        .mark-read-btn, .delete-btn {
          background: none;
          border: none;
          font-size: 0.7rem;
          cursor: pointer;
          color: #7c5fe6;
        }
        .delete-btn {
          color: #fc8181;
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
        .loading-trigger {
          text-align: center;
          padding: 1rem;
          color: rgba(255,255,255,0.5);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Notifications;