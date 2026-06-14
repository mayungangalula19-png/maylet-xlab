// C:\Users\user\maylet-xlab\src\app\routes\admin\settings\AdminSettings.tsx
// FULL ADMIN SETTINGS PAGE - COMPLETE SYSTEM CONFIGURATION
// WITH GENERAL, SECURITY, NOTIFICATION, API, INTEGRATION, BACKUP SETTINGS

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase/client';
import { BRAND } from '../../../../lib/constants/branding';

// ============================================================
// TYPES
// ============================================================
interface SystemSettings {
  // General Settings
  siteName: string;
  siteDescription: string;
  siteLogo: string;
  favicon: string;
  contactEmail: string;
  supportEmail: string;
  timezone: string;
  dateFormat: string;
  
  // Feature Settings
  enableRegistration: boolean;
  enableEmailVerification: boolean;
  enableAIAssistant: boolean;
  enableFundingHub: boolean;
  enableMarketplace: boolean;
  enableMentorship: boolean;
  
  // Security Settings
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  enable2FA: boolean;
  requireAdminApproval: boolean;
  
  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  adminAlerts: boolean;
  
  // API Settings
  apiRateLimit: number;
  apiKeyRotationDays: number;
  
  // Backup Settings
  autoBackup: boolean;
  backupFrequency: string;
  backupRetention: number;
}

// ============================================================
// SETTINGS SECTION COMPONENT
// ============================================================
const SettingsSection = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <div className="settings-section">
    <div className="settings-section-header">
      <span className="settings-section-icon">{icon}</span>
      <h2>{title}</h2>
    </div>
    <div className="settings-section-content">
      {children}
    </div>
  </div>
);

// ============================================================
// TOGGLE SWITCH COMPONENT
// ============================================================
const ToggleSwitch = ({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <div className="toggle-switch-item">
    <div className="toggle-switch-info">
      <div className="toggle-switch-label">{label}</div>
      {description && <div className="toggle-switch-description">{description}</div>}
    </div>
    <button
      className={`toggle-switch ${checked ? 'active' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-slider"></span>
    </button>
  </div>
);

// ============================================================
// MAIN ADMIN SETTINGS COMPONENT
// ============================================================
const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'MAYLET X LAB',
    siteDescription: 'Innovation Operating System for Africa',
    siteLogo: BRAND.logoSrc,
    favicon: BRAND.faviconSrc,
    contactEmail: 'info@mayletxlab.com',
    supportEmail: 'support@mayletxlab.com',
    timezone: 'Africa/Dar_es_Salaam',
    dateFormat: 'DD/MM/YYYY',
    enableRegistration: true,
    enableEmailVerification: true,
    enableAIAssistant: true,
    enableFundingHub: true,
    enableMarketplace: true,
    enableMentorship: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    enable2FA: false,
    requireAdminApproval: false,
    emailNotifications: true,
    pushNotifications: true,
    adminAlerts: true,
    apiRateLimit: 100,
    apiKeyRotationDays: 90,
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adminName, setAdminName] = useState('Admin');
  const navigate = useNavigate();

  // Load settings from Supabase
  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();
      
      setAdminName(profile?.full_name || session.user.email?.split('@')[0] || 'Admin');

      // Try to load settings from database
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (settingsData) {
        setSettings(prev => ({ ...prev, ...settingsData }));
      }

    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save settings to Supabase
  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Save to database
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString(),
          updated_by: adminName,
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Reset to default settings
  const resetSettings = async () => {
    if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      const defaultSettings: SystemSettings = {
        siteName: 'MAYLET X LAB',
        siteDescription: 'Innovation Operating System for Africa',
        siteLogo: BRAND.logoSrc,
        favicon: BRAND.faviconSrc,
        contactEmail: 'info@mayletxlab.com',
        supportEmail: 'support@mayletxlab.com',
        timezone: 'Africa/Dar_es_Salaam',
        dateFormat: 'DD/MM/YYYY',
        enableRegistration: true,
        enableEmailVerification: true,
        enableAIAssistant: true,
        enableFundingHub: true,
        enableMarketplace: true,
        enableMentorship: true,
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        enable2FA: false,
        requireAdminApproval: false,
        emailNotifications: true,
        pushNotifications: true,
        adminAlerts: true,
        apiRateLimit: 100,
        apiKeyRotationDays: 90,
        autoBackup: true,
        backupFrequency: 'daily',
        backupRetention: 30,
      };
      
      setSettings(defaultSettings);
      setMessage({ type: 'success', text: 'Settings reset to default!' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="admin-settings-container">
        <main className="admin-settings-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading settings...</p>
          </div>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'features', label: 'Features', icon: '🎯' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'api', label: 'API & Integrations', icon: '🔗' },
    { id: 'backup', label: 'Backup', icon: '💾' },
  ];

  return (
    <div className="admin-settings-container">
      
      <main className="admin-settings-main">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1>System Settings</h1>
            <p className="subtitle">Configure your platform settings and preferences</p>
          </div>
          <div className="header-right">
            <button onClick={resetSettings} className="btn-reset">
              ↺ Reset to Default
            </button>
            <button onClick={saveSettings} disabled={saving} className="btn-save">
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`message-banner ${message.type}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* Settings Tabs */}
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="settings-content">
          {/* GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <SettingsSection title="General Settings" icon="⚙️">
              <div className="settings-grid">
                <div className="setting-field">
                  <label>Site Name</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                  <p className="field-hint">The name of your platform displayed throughout the site</p>
                </div>
                
                <div className="setting-field">
                  <label>Site Description</label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    rows={3}
                  />
                  <p className="field-hint">Brief description for SEO and sharing</p>
                </div>
                
                <div className="setting-field">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  />
                  <p className="field-hint">Public contact email for users</p>
                </div>
                
                <div className="setting-field">
                  <label>Support Email</label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  />
                  <p className="field-hint">Email for support requests</p>
                </div>
                
                <div className="setting-field">
                  <label>Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  >
                    <option value="Africa/Dar_es_Salaam">East Africa Time (EAT)</option>
                    <option value="Africa/Nairobi">Kenya Time</option>
                    <option value="Africa/Lagos">West Africa Time</option>
                    <option value="Africa/Johannesburg">South Africa Time</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                
                <div className="setting-field">
                  <label>Date Format</label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </SettingsSection>
          )}

          {/* FEATURE SETTINGS */}
          {activeTab === 'features' && (
            <SettingsSection title="Feature Settings" icon="🎯">
              <div className="features-grid">
                <ToggleSwitch
                  label="Enable User Registration"
                  description="Allow new users to register on the platform"
                  checked={settings.enableRegistration}
                  onChange={(val) => setSettings({ ...settings, enableRegistration: val })}
                />
                
                <ToggleSwitch
                  label="Enable Email Verification"
                  description="Require email verification for new accounts"
                  checked={settings.enableEmailVerification}
                  onChange={(val) => setSettings({ ...settings, enableEmailVerification: val })}
                />
                
                <ToggleSwitch
                  label="Enable AI Assistant"
                  description="Allow users to use AI features"
                  checked={settings.enableAIAssistant}
                  onChange={(val) => setSettings({ ...settings, enableAIAssistant: val })}
                />
                
                <ToggleSwitch
                  label="Enable Funding Hub"
                  description="Allow users to submit funding pitches"
                  checked={settings.enableFundingHub}
                  onChange={(val) => setSettings({ ...settings, enableFundingHub: val })}
                />
                
                <ToggleSwitch
                  label="Enable Marketplace"
                  description="Allow buying and selling of products"
                  checked={settings.enableMarketplace}
                  onChange={(val) => setSettings({ ...settings, enableMarketplace: val })}
                />
                
                <ToggleSwitch
                  label="Enable Mentorship"
                  description="Allow users to connect with mentors"
                  checked={settings.enableMentorship}
                  onChange={(val) => setSettings({ ...settings, enableMentorship: val })}
                />
              </div>
            </SettingsSection>
          )}

          {/* SECURITY SETTINGS */}
          {activeTab === 'security' && (
            <SettingsSection title="Security Settings" icon="🔒">
              <div className="settings-grid">
                <div className="setting-field">
                  <label>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  />
                  <p className="field-hint">Auto logout after inactivity (5-480 minutes)</p>
                </div>
                
                <div className="setting-field">
                  <label>Max Login Attempts</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                  />
                  <p className="field-hint">Failed attempts before temporary lockout</p>
                </div>
                
                <div className="setting-field">
                  <label>Minimum Password Length</label>
                  <input
                    type="number"
                    min="6"
                    max="20"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })}
                  />
                  <p className="field-hint">Minimum characters required for passwords</p>
                </div>
                
                <ToggleSwitch
                  label="Enable Two-Factor Authentication"
                  description="Require 2FA for admin accounts"
                  checked={settings.enable2FA}
                  onChange={(val) => setSettings({ ...settings, enable2FA: val })}
                />
                
                <ToggleSwitch
                  label="Require Admin Approval"
                  description="New users require admin approval before accessing"
                  checked={settings.requireAdminApproval}
                  onChange={(val) => setSettings({ ...settings, requireAdminApproval: val })}
                />
              </div>
            </SettingsSection>
          )}

          {/* NOTIFICATION SETTINGS */}
          {activeTab === 'notifications' && (
            <SettingsSection title="Notification Settings" icon="🔔">
              <div className="features-grid">
                <ToggleSwitch
                  label="Email Notifications"
                  description="Send email notifications to users"
                  checked={settings.emailNotifications}
                  onChange={(val) => setSettings({ ...settings, emailNotifications: val })}
                />
                
                <ToggleSwitch
                  label="Push Notifications"
                  description="Send push notifications in browser"
                  checked={settings.pushNotifications}
                  onChange={(val) => setSettings({ ...settings, pushNotifications: val })}
                />
                
                <ToggleSwitch
                  label="Admin Alerts"
                  description="Send critical alerts to administrators"
                  checked={settings.adminAlerts}
                  onChange={(val) => setSettings({ ...settings, adminAlerts: val })}
                />
              </div>
            </SettingsSection>
          )}

          {/* API & INTEGRATIONS */}
          {activeTab === 'api' && (
            <SettingsSection title="API & Integrations" icon="🔗">
              <div className="settings-grid">
                <div className="setting-field">
                  <label>API Rate Limit (requests per minute)</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.apiRateLimit}
                    onChange={(e) => setSettings({ ...settings, apiRateLimit: parseInt(e.target.value) })}
                  />
                  <p className="field-hint">Maximum API requests per minute per user</p>
                </div>
                
                <div className="setting-field">
                  <label>API Key Rotation (days)</label>
                  <input
                    type="number"
                    min="30"
                    max="365"
                    value={settings.apiKeyRotationDays}
                    onChange={(e) => setSettings({ ...settings, apiKeyRotationDays: parseInt(e.target.value) })}
                  />
                  <p className="field-hint">How often API keys must be rotated</p>
                </div>
              </div>
              
              <div className="api-keys-section">
                <h3>API Keys</h3>
                <div className="api-keys-list">
                  <div className="api-key-item">
                    <div>
                      <div className="api-key-name">Production API Key</div>
                      <div className="api-key-value">••••••••••••••••</div>
                    </div>
                    <button className="btn-regenerate">Regenerate</button>
                  </div>
                  <div className="api-key-item">
                    <div>
                      <div className="api-key-name">Testing API Key</div>
                      <div className="api-key-value">••••••••••••••••</div>
                    </div>
                    <button className="btn-regenerate">Regenerate</button>
                  </div>
                </div>
                <button className="btn-generate-new">+ Generate New API Key</button>
              </div>
            </SettingsSection>
          )}

          {/* BACKUP SETTINGS */}
          {activeTab === 'backup' && (
            <SettingsSection title="Backup Settings" icon="💾">
              <div className="features-grid">
                <ToggleSwitch
                  label="Auto Backup"
                  description="Automatically backup system data"
                  checked={settings.autoBackup}
                  onChange={(val) => setSettings({ ...settings, autoBackup: val })}
                />
                
                <div className="setting-field">
                  <label>Backup Frequency</label>
                  <select
                    value={settings.backupFrequency}
                    onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div className="setting-field">
                  <label>Backup Retention (days)</label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={settings.backupRetention}
                    onChange={(e) => setSettings({ ...settings, backupRetention: parseInt(e.target.value) })}
                  />
                  <p className="field-hint">How long to keep old backups</p>
                </div>
              </div>
              
              <div className="backup-actions">
                <button className="btn-run-backup">🔄 Run Backup Now</button>
                <button className="btn-restore-backup">📂 Restore from Backup</button>
              </div>
            </SettingsSection>
          )}
        </div>

        {/* Footer */}
        <footer className="admin-footer">
          <div className="footer-left">
            <span>© 2025 Maylet XLab. All rights reserved.</span>
          </div>
          <div className="footer-center">
            <span className="system-status online">
              <span className="status-dot"></span> System Online
            </span>
          </div>
          <div className="footer-right">
            <span className="version">v2.0.0 | Settings Module</span>
          </div>
        </footer>
      </main>

      <style>{`
        .admin-settings-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        
        .admin-settings-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
          max-width: calc(100% - 280px);
        }
        
        @media (max-width: 768px) {
          .admin-settings-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
            max-width: 100%;
          }
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 70vh;
          gap: 1rem;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(124,95,230,0.3);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .page-header h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, #ffffff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 0.25rem;
        }
        
        .subtitle {
          color: rgba(255,255,255,0.5);
          font-size: 0.85rem;
        }
        
        .btn-reset, .btn-save {
          padding: 0.5rem 1.2rem;
          border-radius: 30px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        
        .btn-reset {
          background: rgba(252,129,129,0.2);
          border: 1px solid rgba(252,129,129,0.3);
          color: #fc8181;
        }
        
        .btn-save {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
        }
        
        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .message-banner {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .message-banner.success {
          background: rgba(72,187,120,0.2);
          border: 1px solid rgba(72,187,120,0.3);
          color: #48bb78;
        }
        
        .message-banner.error {
          background: rgba(252,129,129,0.2);
          border: 1px solid rgba(252,129,129,0.3);
          color: #fc8181;
        }
        
        .settings-tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 1rem;
        }
        
        .settings-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 30px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .settings-tab:hover {
          background: rgba(124,95,230,0.2);
          color: white;
        }
        
        .settings-tab.active {
          background: #7c5fe6;
          color: white;
          border-color: #7c5fe6;
        }
        
        .settings-section {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          margin-bottom: 2rem;
          overflow: hidden;
        }
        
        .settings-section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: rgba(0,0,0,0.3);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .settings-section-icon {
          font-size: 1.3rem;
        }
        
        .settings-section-header h2 {
          font-size: 1.1rem;
          margin: 0;
        }
        
        .settings-section-content {
          padding: 1.5rem;
        }
        
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        
        @media (max-width: 900px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .features-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .setting-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .setting-field label {
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255,255,255,0.8);
        }
        
        .setting-field input, .setting-field textarea, .setting-field select {
          padding: 0.75rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 0.85rem;
        }
        
        .setting-field input:focus, .setting-field textarea:focus, .setting-field select:focus {
          outline: none;
          border-color: #7c5fe6;
        }
        
        .field-hint {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
          margin: 0;
        }
        
        .toggle-switch-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
        }
        
        .toggle-switch-info {
          flex: 1;
        }
        
        .toggle-switch-label {
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }
        
        .toggle-switch-description {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        
        .toggle-switch {
          width: 50px;
          height: 26px;
          background: rgba(255,255,255,0.2);
          border-radius: 30px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: all 0.3s;
        }
        
        .toggle-switch.active {
          background: #7c5fe6;
        }
        
        .toggle-slider {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s;
        }
        
        .toggle-switch.active .toggle-slider {
          transform: translateX(24px);
        }
        
        .api-keys-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .api-keys-section h3 {
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }
        
        .api-keys-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .api-key-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
        }
        
        .api-key-name {
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .api-key-value {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          font-family: monospace;
        }
        
        .btn-regenerate, .btn-generate-new, .btn-run-backup, .btn-restore-backup {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        
        .btn-regenerate {
          background: rgba(47,212,255,0.2);
          color: #2fd4ff;
        }
        
        .btn-generate-new {
          background: rgba(72,187,120,0.2);
          color: #48bb78;
          width: 100%;
        }
        
        .backup-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .btn-run-backup {
          background: rgba(124,95,230,0.2);
          color: #9b7ff0;
        }
        
        .btn-restore-backup {
          background: rgba(252,129,129,0.2);
          color: #fc8181;
        }
        
        .admin-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1.5rem;
          margin-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .system-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          background: #48bb78;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        
        .version {
          background: rgba(255,255,255,0.05);
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;