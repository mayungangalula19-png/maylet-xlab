import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { signOut } from '../../../services/auth.service';
import BillingDashboard from '../../billing/pages/BillingDashboard';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  bio: string;
  location: string;
  website: string;
  github_handle: string;
  twitter_handle: string;
  linkedin_url: string;
  organization_name: string;
  user_type: 'student' | 'developer' | 'founder' | 'investor' | 'other';
  is_student: boolean;
  notification_email: boolean;
  notification_push: boolean;
  notification_marketing: boolean;
  theme: 'dark' | 'light';
  language: string;
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'account' | 'api' | 'billing' | 'help' | 'feedback'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    full_name: '',
    email: '',
    avatar_url: null,
    bio: '',
    location: '',
    website: '',
    github_handle: '',
    twitter_handle: '',
    linkedin_url: '',
    organization_name: '',
    user_type: 'other',
    is_student: false,
    notification_email: true,
    notification_push: true,
    notification_marketing: false,
    theme: 'dark',
    language: 'en',
  });

  // Security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch profile from public.users table
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile({
            id: user.id,
            full_name: profileData.full_name || '',
            email: user.email || '',
            avatar_url: profileData.avatar_url || null,
            bio: profileData.bio || '',
            location: profileData.location || '',
            website: profileData.website || '',
            github_handle: profileData.github_handle || '',
            twitter_handle: profileData.twitter_handle || '',
            linkedin_url: profileData.linkedin_url || '',
            organization_name: profileData.organization_name || '',
            user_type: profileData.user_type || 'other',
            is_student: profileData.is_student || false,
            notification_email: profileData.notification_email !== false,
            notification_push: profileData.notification_push !== false,
            notification_marketing: profileData.notification_marketing || false,
            theme: profileData.theme || 'dark',
            language: profileData.language || 'en',
          });
        } else {
          setProfile(prev => ({ ...prev, id: user.id, email: user.email || '' }));
        }
      }
      setLoading(false);
    };

    fetchUserAndProfile();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from('users')
      .upsert({
        id: profile.id,
        full_name: profile.full_name,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        github_handle: profile.github_handle,
        twitter_handle: profile.twitter_handle,
        linkedin_url: profile.linkedin_url,
        organization_name: profile.organization_name,
        user_type: profile.user_type,
        is_student: profile.is_student,
        notification_email: profile.notification_email,
        notification_push: profile.notification_push,
        notification_marketing: profile.notification_marketing,
        theme: profile.theme,
        language: profile.language,
        updated_at: new Date(),
      });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
    }
    setSaving(false);
  };

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setPasswordError('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSaving(false);
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;

    const { error } = await supabase.rpc('delete_user_account');
    
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      await signOut('/');
    }
    setShowDeleteModal(false);
  };

  const updateAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      setMessage({ type: 'error', text: uploadError.message });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id);

    if (updateError) {
      setMessage({ type: 'error', text: updateError.message });
    } else {
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setMessage({ type: 'success', text: 'Avatar updated!' });
    }
  };

  const handleSignOut = async () => {
    await signOut('/');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-sidebar">
        <div className="profile-summary">
          <div className="avatar-wrapper">
            {profile.avatar_url ? (
              <img loading="lazy" decoding="async" src={profile.avatar_url} alt={profile.full_name} className="avatar" />
            ) : (
              <div className="avatar-placeholder">{profile.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}</div>
            )}
            <label className="avatar-upload">
              <span>📷</span>
              <input type="file" accept="image/*" onChange={updateAvatar} hidden />
            </label>
          </div>
          <div className="profile-name">{profile.full_name || user?.email?.split('@')[0]}</div>
          <div className="profile-email">{user?.email}</div>
        </div>

        <nav className="settings-nav">
          <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <span className="nav-icon">👤</span> Profile
          </button>
          <button className={`nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            <span className="nav-icon">🔒</span> Security
          </button>
          <button className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <span className="nav-icon">🔔</span> Notifications
          </button>
          <button className={`nav-item ${activeTab === 'api' ? 'active' : ''}`} onClick={() => setActiveTab('api')}>
            <span className="nav-icon">🔑</span> API Keys
          </button>
          <button className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>
            <span className="nav-icon">💳</span> Billing
          </button>
          <button className={`nav-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
            <span className="nav-icon">⚙️</span> Account
          </button>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0.5rem 0' }} />
          <button className={`nav-item ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
            <span className="nav-icon">💬</span> Feedback
          </button>
          <button className={`nav-item ${activeTab === 'help' ? 'active' : ''}`} onClick={() => setActiveTab('help')}>
            <span className="nav-icon">🛠️</span> Help & Support
          </button>
        </nav>

        <button onClick={handleSignOut} className="signout-btn">Sign Out</button>
      </div>

      <div className="settings-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="settings-card">
            <h2>Profile Settings</h2>
            {message && <div className={`alert ${message.type}`}>{message.text}</div>}
            
            <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="John Innovator" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={profile.email} disabled className="disabled" />
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell us about yourself..." />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Dar es Salaam, Tanzania" />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input type="url" value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} placeholder="https://example.com" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>GitHub Handle</label>
                  <input type="text" value={profile.github_handle} onChange={(e) => setProfile({ ...profile, github_handle: e.target.value })} placeholder="username" />
                </div>
                <div className="form-group">
                  <label>Twitter Handle</label>
                  <input type="text" value={profile.twitter_handle} onChange={(e) => setProfile({ ...profile, twitter_handle: e.target.value })} placeholder="@username" />
                </div>
              </div>

              <div className="form-group">
                <label>LinkedIn URL</label>
                <input type="url" value={profile.linkedin_url} onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/username" />
              </div>

              <div className="form-group">
                <label>Organization / University</label>
                <input type="text" value={profile.organization_name} onChange={(e) => setProfile({ ...profile, organization_name: e.target.value })} placeholder="e.g., University of Dar es Salaam" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>I am a...</label>
                  <select value={profile.user_type} onChange={(e) => setProfile({ ...profile, user_type: e.target.value as any })}>
                    <option value="student">Student / Researcher</option>
                    <option value="developer">Developer / Engineer</option>
                    <option value="founder">Entrepreneur / Founder</option>
                    <option value="investor">Investor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={profile.is_student} onChange={(e) => setProfile({ ...profile, is_student: e.target.checked })} />
                    I am a student
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Theme Preference</label>
                <div className="theme-options">
                  <button type="button" className={`theme-btn ${profile.theme === 'dark' ? 'active' : ''}`} onClick={() => setProfile({ ...profile, theme: 'dark' })}>🌙 Dark</button>
                  <button type="button" className={`theme-btn ${profile.theme === 'light' ? 'active' : ''}`} onClick={() => setProfile({ ...profile, theme: 'light' })}>☀️ Light</button>
                </div>
              </div>

              <div className="form-group">
                <label>Language</label>
                <select value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })}>
                  <option value="en">English</option>
                  <option value="sw">Kiswahili</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="settings-card">
            <h2>Security Settings</h2>
            {message && <div className={`alert ${message.type}`}>{message.text}</div>}
            
            <div className="security-section">
              <h3>Change Password</h3>
              <form onSubmit={(e) => { e.preventDefault(); updatePassword(); }}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                {passwordError && <div className="error-text">{passwordError}</div>}
                <button type="submit" className="btn-primary" disabled={saving}>Update Password</button>
              </form>
            </div>

            <div className="security-section">
              <h3>Two-Factor Authentication</h3>
              <p>Add an extra layer of security to your account.</p>
              <button className="btn-outline">Enable 2FA</button>
            </div>

            <div className="security-section">
              <h3>Active Sessions</h3>
              <div className="session-list">
                <div className="session-item">
                  <div className="session-info">
                    <strong>Chrome on Windows</strong>
                    <span>Current session • Dar es Salaam, Tanzania</span>
                  </div>
                  <span className="current-badge">Current</span>
                </div>
                <div className="session-item">
                  <div className="session-info">
                    <strong>Safari on iPhone</strong>
                    <span>Last active 2 days ago • Nairobi, Kenya</span>
                  </div>
                  <button className="revoke-btn">Revoke</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="settings-card">
            <h2>Notification Preferences</h2>
            <p>Choose which notifications you want to receive.</p>

            <div className="notification-group">
              <div className="notification-item">
                <div>
                  <strong>Email Notifications</strong>
                  <p>Receive updates about your projects and experiments via email.</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={profile.notification_email} onChange={(e) => setProfile({ ...profile, notification_email: e.target.checked })} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div>
                  <strong>Push Notifications</strong>
                  <p>Get real-time alerts on your browser.</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={profile.notification_push} onChange={(e) => setProfile({ ...profile, notification_push: e.target.checked })} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div>
                  <strong>Marketing Communications</strong>
                  <p>Receive updates about new features, resources, and events.</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={profile.notification_marketing} onChange={(e) => setProfile({ ...profile, notification_marketing: e.target.checked })} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-primary" onClick={saveProfile}>Save Preferences</button>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="settings-card">
            <h2>API Keys</h2>
            <p>Manage your API keys for accessing Maylet XLab programmatically.</p>

            <div className="api-section">
              <button className="btn-primary">+ Generate New API Key</button>
              <div className="api-keys-list">
                <div className="api-key-item">
                  <div>
                    <strong>Production API Key</strong>
                    <span>Created on May 1, 2025 • Last used 2 days ago</span>
                  </div>
                  <div className="api-key-actions">
                    <code>••••••••••••••••</code>
                    <button className="btn-outline-small">Revoke</button>
                  </div>
                </div>
                <div className="api-key-item">
                  <div>
                    <strong>Development API Key</strong>
                    <span>Created on Apr 15, 2025 • Never used</span>
                  </div>
                  <div className="api-key-actions">
                    <code>••••••••••••••••</code>
                    <button className="btn-outline-small">Revoke</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="api-docs">
              <h3>API Documentation</h3>
              <p>Learn how to integrate Maylet XLab into your applications.</p>
              <a href="/docs/api" className="btn-outline">View API Docs →</a>
            </div>
          </div>
        )}

        {/* Billing Tab — live enterprise dashboard */}
        {activeTab === 'billing' && (
          <div className="settings-billing-embed">
            <BillingDashboard />
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="settings-card">
            <h2>Account Settings</h2>
            
            <div className="danger-zone">
              <h3>Danger Zone</h3>
              <div className="danger-item">
                <div>
                  <strong>Delete Account</strong>
                  <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>Delete Account</button>
              </div>
            </div>

            <div className="export-data">
              <h3>Export Your Data</h3>
              <p>Download all your data in JSON or CSV format.</p>
              <div className="export-buttons">
                <button className="btn-outline">Export as JSON</button>
                <button className="btn-outline">Export as CSV</button>
              </div>
            </div>
          </div>
        )}
        {/* Help & Support Tab */}
        {activeTab === 'help' && (
          <div className="settings-card">
            <h2>Help & Support</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>Find answers, contact support, or browse documentation.</p>
            <div className="security-section">
              <h3>📖 Documentation</h3>
              <p>Browse guides, tutorials, and API references.</p>
              <a href="/resources" className="btn-outline" style={{ display: 'inline-block', marginTop: '0.5rem' }}>View Documentation →</a>
            </div>
            <div className="security-section">
              <h3>❓ FAQ</h3>
              <p>Find answers to the most common questions.</p>
              <a href="/faq" className="btn-outline" style={{ display: 'inline-block', marginTop: '0.5rem' }}>Browse FAQ →</a>
            </div>
            <div className="security-section">
              <h3>✉️ Contact Support</h3>
              <p>Can't find what you need? Reach out to our team.</p>
              <a href="/contact" className="btn-outline" style={{ display: 'inline-block', marginTop: '0.5rem' }}>Contact Us →</a>
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="settings-card">
            <h2>Feedback</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>Share your thoughts, report bugs, or suggest new features.</p>
            <div className="security-section">
              <h3>💡 Feature Requests</h3>
              <p>Have an idea that would make Maylet XLab better? We'd love to hear it.</p>
              <a href="/feedback" className="btn-primary" style={{ display: 'inline-block', marginTop: '0.5rem' }}>Submit Feedback →</a>
            </div>
            <div className="security-section">
              <h3>🐛 Report a Bug</h3>
              <p>Found something broken? Let us know so we can fix it.</p>
              <a href="/contact" className="btn-outline" style={{ display: 'inline-block', marginTop: '0.5rem' }}>Report Bug →</a>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Account</h3>
            <p>This action is <strong>permanent</strong>. You will lose:</p>
            <ul>
              <li>All your projects and data</li>
              <li>Team memberships and collaborations</li>
              <li>Funding pitches and investment history</li>
              <li>Innovation Vault entries</li>
            </ul>
            <p>Type <strong>DELETE</strong> to confirm:</p>
            <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={deleteAccount} disabled={deleteConfirm !== 'DELETE'}>Delete Account</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .settings-page {
          display: flex;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
          font-family: 'Inter', sans-serif;
        }
        .settings-sidebar {
          width: 280px;
          flex-shrink: 0;
        }
        .profile-summary {
          text-align: center;
          padding: 1.5rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          margin-bottom: 1rem;
        }
        .avatar-wrapper {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
        }
        .avatar, .avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .avatar-placeholder {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
        }
        .avatar-upload {
          position: absolute;
          bottom: 0;
          right: 0;
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .profile-name {
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .profile-email {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
        }
        .settings-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-radius: 12px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          text-align: left;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.05);
        }
        .nav-item.active {
          background: #7c5fe6;
          color: white;
        }
        .signout-btn {
          width: 100%;
          margin-top: 1rem;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          color: #fc8181;
          cursor: pointer;
        }
        .settings-content {
          flex: 1;
        }
        .settings-billing-embed {
          margin: 0 -0.5rem;
        }
        .settings-billing-embed .billing-page {
          max-width: none;
          padding: 0;
        }
        .settings-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 2rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.3rem;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.7);
        }
        .form-group input, .form-group textarea, .form-group select {
          width: 100%;
          padding: 0.6rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        .form-group input.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .theme-options {
          display: flex;
          gap: 0.5rem;
        }
        .theme-btn {
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          cursor: pointer;
        }
        .theme-btn.active {
          background: #7c5fe6;
          border-color: #7c5fe6;
        }
        .alert {
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .alert.success {
          background: rgba(72,187,120,0.1);
          border: 1px solid #48bb78;
          color: #48bb78;
        }
        .alert.error {
          background: rgba(252,129,129,0.1);
          border: 1px solid #fc8181;
          color: #fc8181;
        }
        .security-section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .session-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          margin-bottom: 0.5rem;
        }
        .current-badge {
          background: #48bb78;
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          font-size: 0.7rem;
        }
        .revoke-btn {
          background: none;
          border: none;
          color: #fc8181;
          cursor: pointer;
        }
        .notification-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .toggle {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.3s;
          border-radius: 24px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        input:checked + .toggle-slider {
          background-color: #7c5fe6;
        }
        input:checked + .toggle-slider:before {
          transform: translateX(26px);
        }
        .api-keys-list {
          margin: 1rem 0;
        }
        .api-key-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          margin-bottom: 0.5rem;
        }
        .danger-zone {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: rgba(252,129,129,0.05);
          border: 1px solid rgba(252,129,129,0.2);
          border-radius: 16px;
        }
        .danger-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .btn-danger {
          background: #fc8181;
          color: #0a0d1a;
          padding: 0.6rem 1rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn-primary {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          cursor: pointer;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 2rem;
          max-width: 450px;
          width: 90%;
        }
        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }
        .loading-container {
          text-align: center;
          padding: 3rem;
        }
        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .settings-page {
            flex-direction: column;
          }
          .settings-sidebar {
            width: 100%;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
          .danger-item {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;