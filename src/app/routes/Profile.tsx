// C:\Users\user\maylet-xlab\src\app\routes\Profile.tsx
// PROFESSIONAL USER PROFILE – View, edit, upload avatar, change password

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  user_type: 'innovator' | 'mentor' | 'investor' | 'admin';
  location: string | null;
  website: string | null;
  twitter: string | null;
  linkedin: string | null;
  github: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// SIDEBAR (same as other pages)
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
    { icon: '🔔', label: 'Notifications', route: '/notifications' },
    { icon: '⚙️', label: 'Settings', route: '/settings' },
    { icon: '👤', label: 'Profile', route: '/profile', active: true },
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
// PROFILE COMPONENT
// ============================================================
const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    setEmail(session.user.email || '');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Profile fetch error:', error);
      setError('Failed to load profile');
    } else if (data) {
      setProfile(data as Profile);
      setFormData(data as Partial<Profile>);
    } else {
      // create empty profile
      const newProfile = {
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name || '',
        avatar_url: null,
        bio: null,
        user_type: 'innovator',
        location: null,
        website: null,
        twitter: null,
        linkedin: null,
        github: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(newProfile);
      setFormData(newProfile);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const avatarUrl = urlData.publicUrl;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);
      if (updateError) throw updateError;
      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
      setFormData(prev => ({ ...prev, avatar_url: avatarUrl }));
      setSuccess('Avatar updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          twitter: formData.twitter,
          linkedin: formData.linkedin,
          github: formData.github,
          user_type: formData.user_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);
      if (updateError) throw updateError;
      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;
      setSuccess('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <Sidebar />
        <main className="profile-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="profile-container">
      <Sidebar />
      <main className="profile-main">
        <div className="profile-header">
          <h1>👤 My Profile</h1>
          <p>Manage your personal information and account settings</p>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <div className="profile-grid">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="avatar-container">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || 'Avatar'} />
              ) : (
                <div className="avatar-placeholder">{profile.full_name?.[0] || 'U'}</div>
              )}
              <label className="avatar-upload-btn">
                {uploadingAvatar ? 'Uploading...' : '📷 Change'}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <div className="profile-email">
              <strong>Email</strong>
              <p>{email}</p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="profile-form-section">
            <div className="form-header">
              <h2>Profile Information</h2>
              {!editing && <button onClick={() => setEditing(true)} className="btn-edit">✏️ Edit</button>}
            </div>
            <div className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                {editing ? (
                  <input value={formData.full_name || ''} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                ) : (
                  <p>{profile.full_name || 'Not set'}</p>
                )}
              </div>
              <div className="form-group">
                <label>User Type</label>
                {editing ? (
                  <select value={formData.user_type || 'innovator'} onChange={(e) => setFormData({ ...formData, user_type: e.target.value as Profile['user_type'] })}>
                    <option value="innovator">Innovator</option>
                    <option value="mentor">Mentor</option>
                    <option value="investor">Investor</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <p>{profile.user_type || 'innovator'}</p>
                )}
              </div>
              <div className="form-group">
                <label>Bio</label>
                {editing ? (
                  <textarea value={formData.bio || ''} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={3} />
                ) : (
                  <p>{profile.bio || 'No bio yet'}</p>
                )}
              </div>
              <div className="form-group">
                <label>Location</label>
                {editing ? (
                  <input value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                ) : (
                  <p>{profile.location || 'Not specified'}</p>
                )}
              </div>
              <div className="form-group">
                <label>Website</label>
                {editing ? (
                  <input value={formData.website || ''} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                ) : (
                  <p>{profile.website ? <a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a> : 'Not set'}</p>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Twitter</label>
                  {editing ? (
                    <input value={formData.twitter || ''} onChange={(e) => setFormData({ ...formData, twitter: e.target.value })} />
                  ) : (
                    <p>{profile.twitter ? <a href={`https://twitter.com/${profile.twitter}`} target="_blank">{profile.twitter}</a> : 'Not set'}</p>
                  )}
                </div>
                <div className="form-group">
                  <label>LinkedIn</label>
                  {editing ? (
                    <input value={formData.linkedin || ''} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} />
                  ) : (
                    <p>{profile.linkedin ? <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank">{profile.linkedin}</a> : 'Not set'}</p>
                  )}
                </div>
                <div className="form-group">
                  <label>GitHub</label>
                  {editing ? (
                    <input value={formData.github || ''} onChange={(e) => setFormData({ ...formData, github: e.target.value })} />
                  ) : (
                    <p>{profile.github ? <a href={`https://github.com/${profile.github}`} target="_blank">{profile.github}</a> : 'Not set'}</p>
                  )}
                </div>
              </div>
              {editing && (
                <div className="form-actions">
                  <button onClick={() => setEditing(false)} className="btn-cancel">Cancel</button>
                  <button onClick={handleSaveProfile} disabled={saving} className="btn-save">{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              )}
            </div>
          </div>

          {/* Change Password Section */}
          <div className="profile-password-section">
            <h2>🔒 Change Password</h2>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
            </div>
            <button onClick={handleChangePassword} disabled={saving || !passwordData.currentPassword || !passwordData.newPassword} className="btn-change-password">
              Update Password
            </button>
          </div>
        </div>
      </main>

      <style>{`
        .profile-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .profile-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .profile-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .profile-header {
          margin-bottom: 2rem;
        }
        .profile-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .profile-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }
        .profile-avatar-section {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 1.5rem;
          text-align: center;
        }
        .avatar-container {
          position: relative;
          display: inline-block;
        }
        .avatar-container img, .avatar-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          background: #7c5fe6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: bold;
        }
        .avatar-upload-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          background: #7c5fe6;
          border-radius: 30px;
          padding: 0.2rem 0.6rem;
          font-size: 0.7rem;
          cursor: pointer;
        }
        .avatar-upload-btn input {
          display: none;
        }
        .profile-email {
          margin-top: 1rem;
        }
        .profile-form-section, .profile-password-section {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 1.5rem;
        }
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .btn-edit {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.3rem 1rem;
          border-radius: 30px;
          cursor: pointer;
        }
        .profile-form .form-group {
          margin-bottom: 1rem;
        }
        .profile-form label {
          display: block;
          font-size: 0.7rem;
          text-transform: uppercase;
          color: #7c5fe6;
          margin-bottom: 0.25rem;
        }
        .profile-form input, .profile-form textarea, .profile-form select {
          width: 100%;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0.6rem;
          color: white;
        }
        .profile-form p {
          background: rgba(0,0,0,0.3);
          padding: 0.6rem;
          border-radius: 12px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
        }
        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1rem;
        }
        .btn-cancel, .btn-save, .btn-change-password {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 30px;
          cursor: pointer;
        }
        .btn-save {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          font-weight: 600;
        }
        .profile-password-section .form-group {
          margin-bottom: 1rem;
        }
        .error-banner {
          background: rgba(252,129,129,0.2);
          border: 1px solid #fc8181;
          border-radius: 12px;
          padding: 0.75rem;
          margin-bottom: 1rem;
          color: #fc8181;
        }
        .success-banner {
          background: rgba(72,187,120,0.2);
          border: 1px solid #48bb78;
          border-radius: 12px;
          padding: 0.75rem;
          margin-bottom: 1rem;
          color: #48bb78;
        }
        .loading-spinner {
          width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6; border-radius: 50%;
          animation: spin 1s linear infinite; margin: 20% auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Profile;