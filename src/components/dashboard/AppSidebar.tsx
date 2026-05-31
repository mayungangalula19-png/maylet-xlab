import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from '../../services/auth.service';

const mainMenu = [
  { icon: '📊', label: 'Dashboard', route: '/dashboard' },
  { icon: '📁', label: 'Projects', route: '/projects' },
  { icon: '🧪', label: 'Experiments', route: '/experiments' },
  { icon: '🤖', label: 'MAYA AI', route: '/ai-assistant' },
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
  { icon: '🛠️', label: 'Help & Support', route: '/support' },
];

const userMenu = [
  { icon: '🔔', label: 'Notifications', route: '/notifications' },
  { icon: '💬', label: 'Messages', route: '/messages' },
  { icon: '⚙️', label: 'Settings', route: '/settings' },
  { icon: '👤', label: 'Profile', route: '/profile' },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minHeight: '100vh',
        background: 'rgba(0,0,0,0.35)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '1rem 0.5rem',
        transition: 'width 0.2s',
      }}
    >
      <div style={{ padding: '0 0.5rem 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.5rem' }}>✦</span>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.75rem' }}>MAYLET X LAB</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>InnoOS</div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav>
        {mainMenu.map((item) => {
          const active = location.pathname === item.route || location.pathname.startsWith(item.route + '/');
          return (
            <Link
              key={item.route}
              to={item.route}
              title={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0.55rem 0.75rem',
                marginBottom: 2,
                borderRadius: 8,
                textDecoration: 'none',
                color: active ? '#9b7ff0' : 'rgba(255,255,255,0.75)',
                background: active ? 'rgba(124,95,230,0.15)' : 'transparent',
                fontSize: '0.85rem',
              }}
            >
              <span>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
        {userMenu.map((item) => (
          <Link
            key={item.route}
            to={item.route}
            style={{
              display: 'flex',
              gap: 10,
              padding: '0.5rem 0.75rem',
              color: 'rgba(255,255,255,0.65)',
              textDecoration: 'none',
              fontSize: '0.8rem',
            }}
          >
            <span>{item.icon}</span>
            {!collapsed && item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: 'flex',
            gap: 10,
            padding: '0.5rem 0.75rem',
            width: '100%',
            background: 'none',
            border: 'none',
            color: '#fc8181',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          <span>🚪</span>
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
