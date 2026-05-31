import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from '../../services/auth.service';

const adminMenu = [
  { label: 'Dashboard', route: '/admin', icon: '📊' },
  { label: 'Users', route: '/admin/users', icon: '👥' },
  { label: 'Innovators', route: '/admin/innovators', icon: '💡' },
  { label: 'Mentors', route: '/admin/mentors', icon: '🎓' },
  { label: 'Investors', route: '/admin/investors', icon: '💰' },
  { label: 'Projects', route: '/admin/projects', icon: '📁' },
  { label: 'Experiments', route: '/admin/experiments', icon: '🧪' },
  { label: 'Prototypes', route: '/admin/prototypes', icon: '📦' },
  { label: 'Vault', route: '/admin/vault', icon: '🔐' },
  { label: 'Subscriptions', route: '/admin/subscriptions', icon: '📊' },
  { label: 'Payments', route: '/admin/payments', icon: '💵' },
  { label: 'Analytics', route: '/admin/analytics', icon: '📈' },
  { label: 'AI Monitor', route: '/admin/ai-monitor', icon: '🤖' },
  { label: 'Reports', route: '/admin/reports', icon: '📄' },
  { label: 'Moderation', route: '/admin/moderation', icon: '⚖️' },
  { label: 'System', route: '/admin/system-monitor', icon: '📡' },
  { label: 'Settings', route: '/admin/settings', icon: '⚙️' },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      style={{
        width: 220,
        minHeight: '100vh',
        background: '#0d0d14',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '1rem',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.85rem' }}>ADMIN · MAYA</div>
      {adminMenu.map((item) => {
        const active = location.pathname === item.route;
        return (
          <Link
            key={item.route}
            to={item.route}
            style={{
              display: 'block',
              padding: '0.5rem 0.65rem',
              marginBottom: 2,
              borderRadius: 6,
              textDecoration: 'none',
              color: active ? '#9b7ff0' : 'rgba(255,255,255,0.7)',
              background: active ? 'rgba(124,95,230,0.12)' : 'transparent',
              fontSize: '0.82rem',
            }}
          >
            {item.icon} {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={async () => {
          await signOut();
          navigate('/login');
        }}
        style={{
          marginTop: '1rem',
          background: 'none',
          border: 'none',
          color: '#fc8181',
          cursor: 'pointer',
          fontSize: '0.8rem',
        }}
      >
        Sign out
      </button>
      <Link to="/dashboard" style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.75rem', color: '#888' }}>
        ← User app
      </Link>
    </aside>
  );
}
