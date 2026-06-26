// Single source of truth for the user-app sidebar.
// Rendered ONLY by DashboardLayout — pages must never render their own sidebar.
import { memo, useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../../contexts/AuthContext';
import { signOut } from '../../../services/auth.service';
import { BrandLogo } from '../../shared/components/common/BrandLogo';

const mainMenu = [
  { icon: '🏠', label: 'Home', route: '/' },
  { icon: '📊', label: 'Dashboard', route: '/dashboard' },
  { icon: '📁', label: 'Projects', route: '/projects' },
  { icon: '🧪', label: 'Experiments', route: '/experiments' },
  { icon: '✅', label: 'Validation', route: '/validation' },
  { icon: '🤖', label: 'AI Assistant', route: '/ai-assistant' },
  { icon: '📦', label: 'Prototypes', route: '/prototypes' },
  { icon: '👥', label: 'Teams', route: '/teams' },
  { icon: '🔬', label: 'Research Center', route: '/research' },
  { icon: '📄', label: 'Documents', route: '/documents' },
  { icon: '🔐', label: 'Innovation Vault', route: '/vault' },
  { icon: '💰', label: 'Funding Hub', route: '/funding' },
  { icon: '🚀', label: 'Commercialization', route: '/commercialization' },
  { icon: '🎓', label: 'Mentorship', route: '/mentorship' },
  { icon: '🏢', label: 'Enterprise', route: '/enterprise' },
  { icon: '🗄️', label: 'Enterprise Vault', route: '/enterprise/vault' },
  { icon: '🏆', label: 'Hackathons', route: '/hackathons' },
  { icon: '📚', label: 'Learning Hub', route: '/learning' },
  { icon: '📈', label: 'Analytics', route: '/analytics' },
  { icon: '🛒', label: 'Marketplace', route: '/marketplace' },
];

const userMenu = [
  { icon: '🔔', label: 'Notifications', route: '/notifications' },
  { icon: '💬', label: 'Messages', route: '/messages' },
  { icon: '💳', label: 'Billing', route: '/billing' },
  { icon: '⚙️', label: 'Settings', route: '/settings' },
];

// memo: the sidebar only needs to re-render on route changes (useLocation),
// never because a parent layout re-rendered.
export const AppSidebar = memo(function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, role, roleLoading } = useAuthContext();

  const isActive = (route: string) => {
    if (route === '/') return location.pathname === '/';
    if (route === '/billing') {
      return location.pathname === '/billing' || location.pathname === '/settings/billing';
    }
    return location.pathname === route || (route !== '/dashboard' && location.pathname.startsWith(route + '/'));
  };

  const handleLogout = useCallback(async () => {
    await signOut('/');
  }, []);

  useEffect(() => {
    document.body.dataset.sidebarCollapsed = collapsed ? '1' : '';
    document.body.dataset.sidebarMobileOpen = mobileOpen ? '1' : '';
    return () => {
      delete document.body.dataset.sidebarCollapsed;
      delete document.body.dataset.sidebarMobileOpen;
    };
  }, [collapsed, mobileOpen]);

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <button className="mobile-sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <BrandLogo to="/dashboard" size="sm" />
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
              className={`sidebar-link ${isActive(item.route) ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-divider"></div>
        <nav className="sidebar-nav user-nav">
          {isAdmin ? (
            <Link
              to="/admin"
              className={`sidebar-link admin-portal-link ${isActive('/admin') ? 'active' : ''}`}
              title={collapsed ? 'Admin Portal' : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <span className="sidebar-icon">🛡️</span>
              {!collapsed && <span className="sidebar-label">Admin Portal</span>}
            </Link>
          ) : null}
          {!collapsed && role && !roleLoading ? (
            <div className="sidebar-role-hint" title="Your account role">
              Role: {role}
            </div>
          ) : null}
          {userMenu.map((item) => (
            <Link
              key={item.label}
              to={item.route}
              className={`sidebar-link ${isActive(item.route) ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
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
        /* ── Overlay ── */
        .sidebar-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 298; /* below sidebar (299) but above content */
          display: none;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
          backdrop-filter: blur(2px);
        }

        /* ── Mobile hamburger button ── */
        .mobile-sidebar-toggle {
          display: none;
          position: fixed;
          top: max(0.85rem, env(safe-area-inset-top));
          left: max(0.85rem, env(safe-area-inset-left));
          z-index: 300;
          background: #7c5fe6;
          border: none;
          color: white;
          font-size: 1.4rem;
          width: 46px;
          height: 46px;
          border-radius: 12px;
          cursor: pointer;
          touch-action: manipulation;
          box-shadow: 0 4px 12px rgba(124,95,230,0.4);
          line-height: 1;
        }

        /* ── Sidebar ── */
        .sidebar {
          position: fixed; top: 0; left: 0;
          height: 100vh; height: 100dvh;
          background: #0a0d1a;
          color: rgba(255,255,255,0.7);
          display: flex; flex-direction: column;
          z-index: 299;
          transition: transform 0.22s cubic-bezier(0.32, 0.72, 0, 1), width 0.15s ease;
          overflow-y: auto; overflow-x: hidden;
          overscroll-behavior: contain;
          width: 280px;
          box-shadow: 2px 0 20px rgba(0,0,0,0.4);
          will-change: transform;
          /* safe area for notch/status-bar */
          padding-top: env(safe-area-inset-top, 0);
          padding-bottom: env(safe-area-inset-bottom, 0);
        }

        .sidebar.collapsed { width: 80px; }

        /* ── Logo area ── */
        .sidebar-logo {
          padding: 1.25rem 1rem;
          display: flex; align-items: center; gap: 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          position: relative;
          flex-shrink: 0;
        }
        .brand-logo-link { display: flex; flex-shrink: 0; }
        .logo-title { font-weight: 700; font-size: 0.95rem; color: white; }
        .logo-tagline { font-size: 0.62rem; color: rgba(255,255,255,0.45); }
        .sidebar-toggle {
          position: absolute; right: 0.5rem;
          background: rgba(255,255,255,0.08);
          border: none; color: white;
          width: 26px; height: 26px;
          border-radius: 7px; cursor: pointer;
          transition: background 0.12s;
        }
        .sidebar-toggle:hover { background: rgba(255,255,255,0.15); }

        /* ── Nav ── */
        .sidebar-nav { flex: 1; padding: 0.75rem 0; overflow-y: auto; overscroll-behavior: contain; }
        .sidebar-link {
          display: flex; align-items: center; gap: 0.85rem;
          padding: 0.7rem 1rem;
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          transition: background 0.1s ease, color 0.1s ease;
          margin: 0.2rem 0.5rem;
          border-radius: 11px;
          background: none; border: none;
          width: calc(100% - 1rem);
          cursor: pointer;
          font-size: 0.875rem;
          touch-action: manipulation;
          text-align: left;
        }
        .sidebar-link:hover { background: rgba(124,95,230,0.2); color: white; }
        .sidebar-link.active { background: #7c5fe6; color: white; }
        .sidebar-icon { font-size: 1.2rem; min-width: 22px; text-align: center; flex-shrink: 0; }
        .sidebar-label { font-size: 0.83rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sidebar.collapsed .sidebar-label { display: none; }
        .sidebar.collapsed .sidebar-link { justify-content: center; padding: 0.75rem; }

        /* ── Group label ── */
        .sidebar-group-label {
          padding: 0.4rem 1.5rem 0.1rem;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          flex-shrink: 0;
        }

        /* ── AI Assistant group ── */
        .ai-nav { flex: none; padding: 0.25rem 0; }
        .ai-link { color: rgba(160,130,255,0.8); }
        .ai-link:hover { background: rgba(124,95,230,0.25); color: #c4b0ff; }
        .ai-link.active { background: linear-gradient(135deg, #5b3fd8 0%, #7c5fe6 100%); color: white; }

        /* ── Settings nav ── */
        .settings-nav { flex: none; padding: 0.25rem 0; }

        /* ── Divider ── */
        .sidebar-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 0.5rem 1rem; flex-shrink: 0; }

        /* ── User nav ── */
        .user-nav { padding-bottom: 0.5rem; flex-shrink: 0; }

        /* ── Special links ── */
        .admin-portal-link { color: #f6ad55; }
        .admin-portal-link:hover { background: rgba(246,173,85,0.18); color: #f6ad55; }
        .admin-portal-link.active { background: #dd6b20; color: white; }

        .sidebar-role-hint {
          margin: 0 1rem 0.5rem;
          padding: 0.45rem 0.7rem;
          border-radius: 8px;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .logout-link { color: #fc8181; }
        .logout-link:hover { background: rgba(252,129,129,0.18); color: #fc8181; }

        /* ── Mobile breakpoint ── */
        @media (max-width: 1024px) {
          .mobile-sidebar-toggle { display: flex; align-items: center; justify-content: center; }
          .sidebar { transform: translateX(-100%); width: 280px; max-width: 85vw; }
          .sidebar.mobile-open { transform: translateX(0); }
          .sidebar-overlay { display: block; }
          body[data-sidebar-mobile-open='1'] .sidebar-overlay { opacity: 1; pointer-events: auto; }
          /* Prevent body scroll when sidebar is open */
          body[data-sidebar-mobile-open='1'] { overflow: hidden; }
        }

        /* Tiny phones */
        @media (max-width: 380px) {
          .sidebar { width: 90vw; max-width: 90vw; }
        }
      `}</style>
    </>
  );
});
