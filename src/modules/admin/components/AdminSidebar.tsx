// Single source of truth for the admin sidebar.
// Rendered ONLY by AdminLayout — admin pages must never render their own sidebar.
import { memo, useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from '../../../services/auth.service';
import { BrandLogo } from '../../shared/components/common/BrandLogo';
import { ADMIN_NAV_ITEMS } from '../config/adminNav.config';
import { useAdminPermissions } from '../hooks/useAdminPermissions';

// memo: the sidebar only needs to re-render on route changes (useLocation),
// never because a parent layout re-rendered.
export const AdminSidebar = memo(function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { can, roleLabel } = useAdminPermissions();

  const navItems = ADMIN_NAV_ITEMS.filter(
    (item) => !item.permission || can(item.permission)
  );

  const isActive = (route: string) => {
    if (route === '/') return location.pathname === '/';
    return location.pathname === route || (route !== '/admin' && location.pathname.startsWith(route + '/'));
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
          <BrandLogo to="/admin" size="sm" />
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
          {navItems.map((item) => (
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
        {!collapsed ? (
          <div className="admin-sidebar-role" title="Your admin role">
            {roleLabel}
          </div>
        ) : null}
        <div className="sidebar-divider"></div>
        <nav className="sidebar-nav user-nav">
          <Link to="/dashboard" className="sidebar-link" title={collapsed ? 'User App' : undefined}>
            <span className="sidebar-icon">🏠</span>
            {!collapsed && <span className="sidebar-label">Back to User App</span>}
          </Link>
          <button onClick={handleLogout} className="sidebar-link logout-link">
            <span className="sidebar-icon">🚪</span>
            {!collapsed && <span className="sidebar-label">Sign Out</span>}
          </button>
        </nav>
      </aside>
      <style>{`
        .sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 98; display: none; opacity: 0; transition: opacity 0.15s ease; pointer-events: none; }
        .mobile-sidebar-toggle { display: none; position: fixed; top: 1rem; left: 1rem; z-index: 100; background: #7c5fe6; border: none; color: white; font-size: 1.5rem; width: 48px; height: 48px; border-radius: 12px; cursor: pointer; touch-action: manipulation; }
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; height: 100dvh; background: #0a0d1a; color: rgba(255,255,255,0.7); display: flex; flex-direction: column; z-index: 99; transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1), width 0.15s ease; overflow-y: auto; overflow-x: hidden; width: 280px; box-shadow: 2px 0 10px rgba(0,0,0,0.3); will-change: transform; }
        .sidebar.collapsed { width: 80px; }
        .sidebar-logo { padding: 1.5rem 1rem; display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); position: relative; }
        .brand-logo-link { display: flex; flex-shrink: 0; }
        .logo-title { font-weight: 700; font-size: 1rem; color: white; }
        .logo-tagline { font-size: 0.65rem; color: rgba(255,255,255,0.5); }
        .sidebar-toggle { position: absolute; right: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; }
        .sidebar-nav { flex: 1; padding: 1rem 0; }
        .sidebar-link { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; color: rgba(255,255,255,0.7); text-decoration: none; transition: background 0.12s ease, color 0.12s ease; margin: 0.25rem 0.5rem; border-radius: 12px; background: none; border: none; width: calc(100% - 1rem); cursor: pointer; font-size: 0.9rem; touch-action: manipulation; }
        .sidebar-link:hover { background: rgba(124,95,230,0.2); color: white; }
        .sidebar-link.active { background: #7c5fe6; color: white; }
        .sidebar-icon { font-size: 1.25rem; min-width: 24px; text-align: center; }
        .sidebar-label { font-size: 0.85rem; white-space: nowrap; }
        .sidebar.collapsed .sidebar-label { display: none; }
        .sidebar.collapsed .sidebar-link { justify-content: center; padding: 0.75rem; }
        .sidebar-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 0.5rem 1rem; }
        .user-nav { margin-bottom: 1rem; flex: 0 0 auto; }
        .logout-link { color: #fc8181; }
        .logout-link:hover { background: rgba(252,129,129,0.2); color: #fc8181; }
        @media (max-width: 1024px) {
          .mobile-sidebar-toggle { display: block; }
          .sidebar { transform: translateX(-100%); width: 280px; }
          .sidebar.mobile-open { transform: translateX(0); }
          .sidebar-overlay { display: block; }
          body[data-sidebar-mobile-open='1'] .sidebar-overlay { opacity: 1; pointer-events: auto; }
        }
      `}</style>
    </>
  );
});
