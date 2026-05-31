// C:\Users\user\maylet-xlab\src\app\routes\Enterprise.tsx
// PROFESSIONAL ENTERPRISE PAGE – Solutions, private vault, team management, demo request

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface EnterpriseTeam {
  id: string;
  name: string;
  member_count: number;
  project_count: number;
}

interface EnterpriseVaultItem {
  id: string;
  title: string;
  description: string;
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
    { icon: '🏢', label: 'Enterprise', route: '/enterprise', active: true },
    { icon: '🏆', label: 'Hackathons', route: '/hackathons' },
    { icon: '📚', label: 'Learning Hub', route: '/learning' },
    { icon: '📈', label: 'Market', route: '/market' },
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
// ENTERPRISE PAGE
// ============================================================
const Enterprise = () => {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<EnterpriseTeam[]>([]);
  const [vaultItems, setVaultItems] = useState<EnterpriseVaultItem[]>([]);
  const [showDemoForm, setShowDemoForm] = useState(false);
  const [demoEmail, setDemoEmail] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login');
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const fetchEnterpriseData = async () => {
    if (!userId) return;
    // Example: fetch enterprise teams (if user belongs to any enterprise team)
    const { data: teamsData } = await supabase
      .from('enterprise_teams')
      .select('id, name, member_count, project_count')
      .eq('user_id', userId);
    setTeams(teamsData || []);
    // Fetch enterprise vault items (private vault)
    const { data: vaultData } = await supabase
      .from('enterprise_vault')
      .select('id, title, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    setVaultItems(vaultData || []);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchEnterpriseData();
  }, [userId]);

  const handleDemoRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoEmail) return;
    setSubmitting(true);
    const { error } = await supabase.from('enterprise_demo_requests').insert({
      email: demoEmail,
      message: demoMessage,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    if (!error) {
      alert('Demo request sent! Our enterprise team will contact you soon.');
      setShowDemoForm(false);
      setDemoEmail('');
      setDemoMessage('');
    } else {
      alert('Failed to send request. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="enterprise-container">
        <Sidebar />
        <main className="enterprise-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="enterprise-container">
      <Sidebar />
      <main className="enterprise-main">
        <div className="enterprise-header">
          <h1>🏢 Enterprise Solutions</h1>
          <p>Scale your innovation with dedicated infrastructure, security, and support</p>
        </div>

        <div className="enterprise-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{teams.length}</div>
            <div className="stat-label">Enterprise Teams</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔐</div>
            <div className="stat-value">{vaultItems.length}</div>
            <div className="stat-label">Private Vault Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚀</div>
            <div className="stat-value">99.9%</div>
            <div className="stat-label">Uptime SLA</div>
          </div>
        </div>

        <div className="enterprise-features">
          <h2>Enterprise Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>SSO & Advanced Security</h3>
              <p>Single sign‑on, MFA, and audit logs for complete control.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏛️</div>
              <h3>Private Innovation Lab</h3>
              <p>Isolated environment for your most sensitive projects.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Dedicated Account Manager</h3>
              <p>Priority support and strategic guidance.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h3>API Access</h3>
              <p>Full API integration with your internal systems.</p>
            </div>
          </div>
        </div>

        <div className="enterprise-teams">
          <h2>Your Enterprise Teams</h2>
          {teams.length === 0 ? (
            <p>No enterprise teams yet. Contact sales to set up your first team.</p>
          ) : (
            <div className="teams-list">
              {teams.map(team => (
                <div key={team.id} className="team-card">
                  <h3>{team.name}</h3>
                  <p>👥 {team.member_count} members</p>
                  <p>📁 {team.project_count} projects</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="enterprise-vault">
          <h2>🔐 Private Enterprise Vault</h2>
          {vaultItems.length === 0 ? (
            <p>No vault items yet. Your private IP will appear here.</p>
          ) : (
            <div className="vault-items">
              {vaultItems.map(item => (
                <div key={item.id} className="vault-item">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <small>{new Date(item.created_at).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          )}
          <Link to="/enterprise/vault" className="vault-link">Access Full Vault →</Link>
        </div>

        <div className="enterprise-cta">
          <h2>Ready to upgrade?</h2>
          <p>Get a custom quote and see how Maylet XLab Enterprise can accelerate your innovation.</p>
          <button onClick={() => setShowDemoForm(true)} className="cta-button">Request Demo</button>
        </div>

        {showDemoForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Request Enterprise Demo</h3>
                <button onClick={() => setShowDemoForm(false)} className="modal-close">×</button>
              </div>
              <form onSubmit={handleDemoRequest}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" value={demoEmail} onChange={(e) => setDemoEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Message (optional)</label>
                    <textarea value={demoMessage} onChange={(e) => setDemoMessage(e.target.value)} rows={4} placeholder="Tell us about your enterprise needs..." />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowDemoForm(false)} className="btn-cancel">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-submit">{submitting ? 'Sending...' : 'Send Request'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .enterprise-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .enterprise-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .enterprise-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .enterprise-header {
          margin-bottom: 2rem;
        }
        .enterprise-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .enterprise-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
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
        .stat-icon { font-size: 2rem; }
        .stat-value { font-size: 1.5rem; font-weight: 700; }
        .stat-label { font-size: 0.7rem; color: rgba(255,255,255,0.6); }
        .enterprise-features h2, .enterprise-teams h2, .enterprise-vault h2 {
          margin-bottom: 1rem;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 900px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .feature-card {
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1rem;
          text-align: center;
        }
        .feature-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .enterprise-teams, .enterprise-vault {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1rem;
          margin-bottom: 2rem;
        }
        .teams-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .team-card {
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          padding: 0.75rem;
        }
        .vault-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .vault-item {
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          padding: 0.75rem;
        }
        .vault-link {
          display: inline-block;
          margin-top: 0.5rem;
          color: #2fd4ff;
          text-decoration: none;
        }
        .enterprise-cta {
          background: linear-gradient(135deg, rgba(124,95,230,0.2), rgba(47,212,255,0.1));
          border-radius: 20px;
          padding: 2rem;
          text-align: center;
        }
        .cta-button {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 1rem;
        }
        .modal-overlay {
          position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.8);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content {
          background: #1a1a2e;
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
        }
        .modal-header {
          display: flex; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .modal-body { padding: 1.5rem; }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block; font-size: 0.7rem; text-transform: uppercase; color: #7c5fe6; margin-bottom: 0.25rem;
        }
        .form-group input, .form-group textarea {
          width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 0.6rem; color: white;
        }
        .btn-cancel, .btn-submit {
          padding: 0.4rem 1rem; border-radius: 30px; border: none; cursor: pointer;
        }
        .btn-cancel { background: rgba(255,255,255,0.1); color: white; }
        .btn-submit { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a; font-weight: 600; }
        .loading-spinner {
          width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6;
          border-radius: 50%; animation: spin 1s linear infinite; margin: 20% auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Enterprise;