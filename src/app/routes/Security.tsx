import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'password_change' | 'email_change' | '2fa_enabled' | '2fa_disabled' | 'device_added';
  location: string;
  device: string;
  ip_address: string;
  timestamp: string;
  status: 'success' | 'warning' | 'failed';
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
}

interface SecurityUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}

const Security = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<SecurityUser | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  // Sessions
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  
  // Security events
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);

  useEffect(() => {
    const fetchSecurityData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
          user_metadata: user.user_metadata,
        });
      }
      
      // Fetch user's 2FA status (from your database)
      const { data: profileData } = await supabase
        .from('users')
        .select('two_factor_enabled')
        .eq('id', user?.id)
        .single();
      
      if (profileData) {
        setTwoFactorEnabled(profileData.two_factor_enabled || false);
      }
      
      // Mock active sessions (replace with actual API call)
      setActiveSessions([
        {
          id: '1',
          device: 'Windows PC',
          browser: 'Chrome 120',
          location: 'Dar es Salaam, Tanzania',
          ip_address: '197.250.xxx.xxx',
          last_active: new Date().toISOString(),
          is_current: true,
        },
        {
          id: '2',
          device: 'iPhone 13',
          browser: 'Safari',
          location: 'Nairobi, Kenya',
          ip_address: '197.248.xxx.xxx',
          last_active: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          is_current: false,
        },
        {
          id: '3',
          device: 'MacBook Pro',
          browser: 'Firefox',
          location: 'Kampala, Uganda',
          ip_address: '41.210.xxx.xxx',
          last_active: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          is_current: false,
        },
      ]);
      
      // Mock security events (replace with actual API call)
      setSecurityEvents([
        {
          id: '1',
          type: 'login',
          location: 'Dar es Salaam, Tanzania',
          device: 'Chrome on Windows',
          ip_address: '197.250.xxx.xxx',
          timestamp: new Date().toISOString(),
          status: 'success',
        },
        {
          id: '2',
          type: 'password_change',
          location: 'Dar es Salaam, Tanzania',
          device: 'Chrome on Windows',
          ip_address: '197.250.xxx.xxx',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'success',
        },
        {
          id: '3',
          type: 'login',
          location: 'Nairobi, Kenya',
          device: 'Safari on iPhone',
          ip_address: '197.248.xxx.xxx',
          timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'warning',
        },
      ]);
      
      setLoading(false);
    };
    
    fetchSecurityData();
  }, []);

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
    setMessage(null);
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Log security event
      await supabase.from('security_events').insert({
        user_id: user?.id,
        type: 'password_change',
        status: 'success',
      });
    }
    setSaving(false);
  };

  const enable2FA = async () => {
    // Mock 2FA setup - in production, integrate with TOTP library
    setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    setShow2FASetup(true);
  };

  const verify2FA = async () => {
    if (verificationCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
      return;
    }
    
    setSaving(true);
    
    // Mock verification - in production, verify with TOTP
    const mockBackupCodes = ['ABCD-EFGH', 'IJKL-MNOP', 'QRST-UVWX', 'YZ12-3456', '7890-ABCD'];
    setBackupCodes(mockBackupCodes);
    
    // Save to database
    await supabase
      .from('users')
      .update({ two_factor_enabled: true })
      .eq('id', user?.id);
    
    setTwoFactorEnabled(true);
    setShow2FASetup(false);
    setVerificationCode('');
    setMessage({ type: 'success', text: 'Two-factor authentication enabled!' });
    setSaving(false);
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }
    
    setSaving(true);
    
    await supabase
      .from('users')
      .update({ two_factor_enabled: false })
      .eq('id', user?.id);
    
    setTwoFactorEnabled(false);
    setMessage({ type: 'success', text: 'Two-factor authentication disabled.' });
    setSaving(false);
  };

  const revokeSession = async (sessionId: string) => {
    // In production, call API to revoke session
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    setShowRevokeModal(false);
    setSessionToRevoke(null);
    setMessage({ type: 'success', text: 'Session revoked successfully.' });
  };

  const revokeAllOtherSessions = async () => {
    if (!confirm('This will sign you out from all other devices. Continue?')) {
      return;
    }
    
    setActiveSessions(prev => prev.filter(s => s.is_current));
    setMessage({ type: 'success', text: 'All other sessions have been revoked.' });
  };

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'password_change': return '🔑';
      case 'email_change': return '📧';
      case '2fa_enabled': return '🔒';
      case '2fa_disabled': return '🔓';
      case 'device_added': return '📱';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading security settings...</p>
      </div>
    );
  }

  return (
    <div className="security-page">
      <div className="security-header">
        <h1>Security Settings</h1>
        <p>Manage your account security and privacy preferences</p>
      </div>

      <div className="security-grid">
        {/* Password Section */}
        <div className="security-card">
          <div className="card-header">
            <span className="card-icon">🔑</span>
            <h2>Password</h2>
          </div>
          <p className="card-description">Change your password to keep your account secure.</p>
          
          {message && <div className={`alert ${message.type}`}>{message.text}</div>}
          
          <form onSubmit={(e) => { e.preventDefault(); updatePassword(); }}>
            <div className="form-group">
              <label htmlFor="current-password">Current Password</label>
              <input 
                id="current-password"
                type="password" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                title="Enter your current password"
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input 
                id="new-password"
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                title="Enter your new password"
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input 
                id="confirm-password"
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                title="Confirm your new password" 
                required 
              />
            </div>
            {passwordError && <div className="error-text">{passwordError}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="security-card">
          <div className="card-header">
            <span className="card-icon">🔒</span>
            <h2>Two-Factor Authentication</h2>
          </div>
          <p className="card-description">
            Add an extra layer of security to your account.
          </p>
          
          <div className="two-factor-status">
            <div className="status-indicator">
              <span className={`status-dot ${twoFactorEnabled ? 'enabled' : 'disabled'}`}></span>
              <span>{twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            {!twoFactorEnabled ? (
              <button className="btn-outline" onClick={enable2FA}>Enable 2FA</button>
            ) : (
              <button className="btn-danger-small" onClick={disable2FA}>Disable 2FA</button>
            )}
          </div>
        </div>

        {/* Active Sessions Section */}
        <div className="security-card full-width">
          <div className="card-header">
            <span className="card-icon">💻</span>
            <h2>Active Sessions</h2>
            <button className="btn-outline-small" onClick={revokeAllOtherSessions}>
              Sign Out All Other Devices
            </button>
          </div>
          <p className="card-description">Devices and browsers where you're currently signed in.</p>
          
          <div className="sessions-list">
            {activeSessions.map((session) => (
              <div key={session.id} className="session-item">
                <div className="session-info">
                  <div className="session-device">
                    <strong>{session.device}</strong> • {session.browser}
                    {session.is_current && <span className="current-badge">Current session</span>}
                  </div>
                  <div className="session-meta">
                    <span>📍 {session.location}</span>
                    <span>🌐 {session.ip_address}</span>
                    <span>🕐 Last active: {new Date(session.last_active).toLocaleString()}</span>
                  </div>
                </div>
                {!session.is_current && (
                  <button 
                    className="revoke-btn" 
                    onClick={() => {
                      setSessionToRevoke(session.id);
                      setShowRevokeModal(true);
                    }}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security Events Section */}
        <div className="security-card full-width">
          <div className="card-header">
            <span className="card-icon">📋</span>
            <h2>Security Events</h2>
          </div>
          <p className="card-description">Recent security-related activity on your account.</p>
          
          <div className="events-table">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Location</th>
                  <th>Device</th>
                  <th>IP Address</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {securityEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <span className="event-icon">{getEventIcon(event.type)}</span>
                      {event.type.replace('_', ' ').charAt(0).toUpperCase() + event.type.replace('_', ' ').slice(1)}
                    </td>
                    <td>{event.location}</td>
                    <td>{event.device}</td>
                    <td>{event.ip_address}</td>
                    <td>{new Date(event.timestamp).toLocaleString()}</td>
                    <td>
                      <span className="event-status" data-status={event.status}>
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="modal-overlay" onClick={() => setShow2FASetup(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShow2FASetup(false)}>×</button>
            <h2>Set Up Two-Factor Authentication</h2>
            
            {!backupCodes.length ? (
              <>
                <p>Scan the QR code below with your authenticator app (Google Authenticator, Microsoft Authenticator, or Authy).</p>
                <div className="qr-code">
                  <img src={qrCode} alt="2FA QR Code" />
                </div>
                <p>Or enter this code manually: <code>ABCD EFGH IJKL MNOP</code></p>
                <div className="form-group">
                  <label>Enter 6-digit code from authenticator app</label>
                  <input 
                    type="text" 
                    maxLength={6} 
                    placeholder="000000" 
                    value={verificationCode} 
                    onChange={(e) => setVerificationCode(e.target.value)} 
                  />
                </div>
                <div className="modal-actions">
                  <button className="btn-outline" onClick={() => setShow2FASetup(false)}>Cancel</button>
                  <button className="btn-primary" onClick={verify2FA} disabled={saving}>
                    {saving ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="success-icon">✅</div>
                <h3>2FA Enabled Successfully!</h3>
                <p>Save these backup codes in a secure place. You'll need them if you lose access to your authenticator app.</p>
                <div className="backup-codes">
                  {backupCodes.map((code, i) => (
                    <code key={i}>{code}</code>
                  ))}
                </div>
                <button className="btn-primary" onClick={() => setShow2FASetup(false)}>Done</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Revoke Session Modal */}
      {showRevokeModal && (
        <div className="modal-overlay" onClick={() => setShowRevokeModal(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <h3>Revoke Session</h3>
            <p>Are you sure you want to revoke this session? You will be signed out from that device.</p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowRevokeModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={() => sessionToRevoke && revokeSession(sessionToRevoke)}>
                Revoke Session
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .security-page {
          max-width: 1000px;
          margin: 0 auto;
          padding: 1.5rem;
          font-family: 'Inter', sans-serif;
        }
        .security-header {
          margin-bottom: 2rem;
        }
        .security-header h1 {
          font-size: 1.8rem;
          margin-bottom: 0.25rem;
        }
        .security-header p {
          color: rgba(255,255,255,0.6);
        }
        .security-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .security-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 1.5rem;
        }
        .security-card.full-width {
          width: 100%;
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }
        .card-icon {
          font-size: 1.5rem;
        }
        .card-header h2 {
          font-size: 1.2rem;
          flex: 1;
        }
        .card-description {
          color: rgba(255,255,255,0.6);
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
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
        .form-group input {
          width: 100%;
          padding: 0.6rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        .btn-primary, .btn-outline, .btn-danger, .btn-outline-small, .btn-danger-small {
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .btn-primary {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
        }
        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
        }
        .btn-outline-small {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.3rem 0.8rem;
          font-size: 0.75rem;
        }
        .btn-danger {
          background: #fc8181;
          color: #0a0d1a;
        }
        .btn-danger-small {
          background: #fc8181;
          color: #0a0d1a;
          padding: 0.3rem 0.8rem;
          font-size: 0.75rem;
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
        .error-text {
          color: #fc8181;
          font-size: 0.8rem;
          margin-bottom: 1rem;
        }
        .two-factor-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .status-dot.enabled {
          background: #48bb78;
        }
        .status-dot.disabled {
          background: #fc8181;
        }
        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .session-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .session-device {
          margin-bottom: 0.25rem;
        }
        .current-badge {
          margin-left: 0.5rem;
          padding: 0.2rem 0.5rem;
          background: #48bb78;
          border-radius: 20px;
          font-size: 0.7rem;
          color: #0a0d1a;
        }
        .session-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        .revoke-btn {
          background: none;
          border: 1px solid #fc8181;
          color: #fc8181;
          padding: 0.3rem 0.8rem;
          border-radius: 6px;
          cursor: pointer;
        }
        .events-table {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        th {
          color: rgba(255,255,255,0.6);
          font-weight: 600;
          font-size: 0.8rem;
        }
        td {
          font-size: 0.8rem;
        }
        .event-icon {
          margin-right: 0.5rem;
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
          max-width: 500px;
          width: 90%;
          position: relative;
        }
        .modal-content.small {
          max-width: 400px;
        }
        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
        }
        .qr-code {
          text-align: center;
          margin: 1rem 0;
        }
        .qr-code img {
          width: 200px;
          height: 200px;
          background: white;
          padding: 0.5rem;
          border-radius: 12px;
        }
        .backup-codes {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin: 1rem 0;
        }
        .backup-codes code {
          background: rgba(255,255,255,0.05);
          padding: 0.5rem;
          text-align: center;
          border-radius: 8px;
          font-family: monospace;
        }
        .success-icon {
          font-size: 3rem;
          text-align: center;
          margin-bottom: 1rem;
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
          .security-page {
            padding: 1rem;
          }
          .session-item {
            flex-direction: column;
            align-items: flex-start;
          }
          .card-header {
            flex-direction: column;
            align-items: flex-start;
          }
            
        }
      `}</style>
    </div>
  );
};

export default Security;