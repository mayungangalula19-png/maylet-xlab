// C:\Users\user\maylet-xlab\src\app\routes\admin\settings\AdminAPIKeys.tsx
// FULL ADMIN API KEYS MANAGEMENT PAGE - MANAGE API KEYS FOR INTEGRATIONS
// WITH CREATE, EDIT, DELETE, REGENERATE, AND REVOKE FUNCTIONALITY

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface APIKey {
  id: string;
  name: string;
  key: string;
  key_preview: string;
  permissions: string[];
  created_by: string;
  created_by_name: string;
  created_at: string;
  expires_at: string;
  last_used: string | null;
  status: 'active' | 'expired' | 'revoked';
  usage_count: number;
}

interface APIKeyFormData {
  name: string;
  permissions: string[];
  expiresIn: string;
}

// ============================================================
// API KEY CARD COMPONENT
// ============================================================
const APIKeyCard = ({ apiKey, onCopy, onRegenerate, onRevoke, onEdit }: { 
  apiKey: APIKey; 
  onCopy: (key: string) => void; 
  onRegenerate: (id: string) => void; 
  onRevoke: (id: string) => void;
  onEdit: (apiKey: APIKey) => void;
}) => {
  const [showFullKey, setShowFullKey] = useState(false);
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return '#48bb78';
      case 'expired': return '#fc8181';
      case 'revoked': return '#a0aec0';
      default: return '#888';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return '🟢';
      case 'expired': return '🔴';
      case 'revoked': return '⚪';
      default: return '🟡';
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const daysLeft = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft > 0;
  };

  return (
    <div className={`api-key-card ${apiKey.status === 'active' ? 'active' : 'inactive'}`}>
      <div className="api-key-card-header">
        <div className="api-key-name-section">
          <h3>{apiKey.name}</h3>
          <span className="api-key-status" style={{ background: `${getStatusColor(apiKey.status)}20`, color: getStatusColor(apiKey.status) }}>
            {getStatusIcon(apiKey.status)} {apiKey.status.toUpperCase()}
          </span>
        </div>
        <div className="api-key-actions">
          <button onClick={() => onEdit(apiKey)} className="btn-edit-key" title="Edit">✏️</button>
          <button onClick={() => onRegenerate(apiKey.id)} className="btn-regenerate-key" title="Regenerate">🔄</button>
          <button onClick={() => onRevoke(apiKey.id)} className="btn-revoke-key" title="Revoke">🗑️</button>
        </div>
      </div>
      
      <div className="api-key-value-section">
        <div className="api-key-label">API Key</div>
        <div className="api-key-value-wrapper">
          <code className="api-key-value">
            {showFullKey ? apiKey.key : apiKey.key_preview}
          </code>
          <button onClick={() => setShowFullKey(!showFullKey)} className="btn-toggle-key">
            {showFullKey ? 'Hide' : 'Show'}
          </button>
          <button onClick={() => onCopy(apiKey.key)} className="btn-copy-key">📋 Copy</button>
        </div>
      </div>
      
      <div className="api-key-permissions">
        <div className="api-key-label">Permissions</div>
        <div className="permissions-list">
          {apiKey.permissions.map((perm, i) => (
            <span key={i} className="permission-badge">{perm}</span>
          ))}
        </div>
      </div>
      
      <div className="api-key-meta">
        <div className="meta-item">
          <span className="meta-label">Created by:</span>
          <span>{apiKey.created_by_name}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Created:</span>
          <span>{new Date(apiKey.created_at).toLocaleDateString()}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Expires:</span>
          <span className={isExpiringSoon(apiKey.expires_at) ? 'expiring-soon' : ''}>
            {new Date(apiKey.expires_at).toLocaleDateString()}
            {isExpiringSoon(apiKey.expires_at) && ' (Expiring soon!)'}
          </span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Last used:</span>
          <span>{apiKey.last_used ? new Date(apiKey.last_used).toLocaleDateString() : 'Never'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Usage count:</span>
          <span>{apiKey.usage_count}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN ADMIN API KEYS COMPONENT
// ============================================================
const AdminAPIKeys = () => {
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<APIKey | null>(null);
  const [newKey, setNewKey] = useState<APIKeyFormData>({
    name: '',
    permissions: ['read'],
    expiresIn: '90'
  });
  const [editingKey, setEditingKey] = useState<APIKey | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [adminName, setAdminName] = useState('Admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  const availablePermissions = [
    { id: 'read', label: 'Read', description: 'Read data from the API' },
    { id: 'write', label: 'Write', description: 'Write data to the API' },
    { id: 'delete', label: 'Delete', description: 'Delete data via API' },
    { id: 'admin', label: 'Admin', description: 'Full admin access' },
    { id: 'projects', label: 'Projects', description: 'Access project endpoints' },
    { id: 'users', label: 'Users', description: 'Access user endpoints' },
    { id: 'payments', label: 'Payments', description: 'Access payment endpoints' },
    { id: 'analytics', label: 'Analytics', description: 'Access analytics endpoints' },
  ];

  // Fetch API keys
  const fetchAPIKeys = async () => {
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

      // Fetch API keys from database
      const { data: keysData } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (keysData) {
        const formattedKeys: APIKey[] = keysData.map(key => ({
          id: key.id,
          name: key.name,
          key: key.key,
          key_preview: key.key.substring(0, 16) + '••••••••••••••••',
          permissions: key.permissions || ['read'],
          created_by: key.created_by,
          created_by_name: key.created_by_name,
          created_at: key.created_at,
          expires_at: key.expires_at,
          last_used: key.last_used,
          status: new Date(key.expires_at) < new Date() ? 'expired' : (key.status || 'active'),
          usage_count: key.usage_count || 0,
        }));
        setApiKeys(formattedKeys);
      } else {
        // Demo data if no keys exist
        setApiKeys([]);
      }

    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate random API key
  const generateAPIKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'mlx_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  // Create new API key
  const handleCreateAPIKey = async () => {
    if (!newKey.name.trim()) {
      alert('API key name is required');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const apiKeyValue = generateAPIKey();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(newKey.expiresIn));

    const newAPIKey: APIKey = {
      id: Date.now().toString(),
      name: newKey.name,
      key: apiKeyValue,
      key_preview: apiKeyValue.substring(0, 16) + '••••••••••••••••',
      permissions: newKey.permissions,
      created_by: session.user.id,
      created_by_name: adminName,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      last_used: null,
      status: 'active',
      usage_count: 0,
    };

    // Save to database
    const { error } = await supabase
      .from('api_keys')
      .insert({
        id: newAPIKey.id,
        name: newAPIKey.name,
        key: newAPIKey.key,
        permissions: newAPIKey.permissions,
        created_by: newAPIKey.created_by,
        created_by_name: newAPIKey.created_by_name,
        created_at: newAPIKey.created_at,
        expires_at: newAPIKey.expires_at,
        status: 'active',
        usage_count: 0,
      });

    if (error) {
      console.error('Error saving API key:', error);
      alert('Failed to create API key');
      return;
    }

    setGeneratedKey(apiKeyValue);
    setApiKeys([newAPIKey, ...apiKeys]);
    setNewKey({ name: '', permissions: ['read'], expiresIn: '90' });
    
    // Don't close modal yet, show the generated key
  };

  // Update API key
  const handleUpdateAPIKey = async () => {
    if (!editingKey) return;

    const { error } = await supabase
      .from('api_keys')
      .update({
        name: editingKey.name,
        permissions: editingKey.permissions,
      })
      .eq('id', editingKey.id);

    if (error) {
      console.error('Error updating API key:', error);
      alert('Failed to update API key');
      return;
    }

    setApiKeys(apiKeys.map(k => k.id === editingKey.id ? editingKey : k));
    setShowEditModal(false);
    setEditingKey(null);
  };

  // Regenerate API key
  const handleRegenerateKey = async (id: string) => {
    if (confirm('Are you sure you want to regenerate this API key? The old key will be invalidated immediately.')) {
      const newKeyValue = generateAPIKey();
      
      const { error } = await supabase
        .from('api_keys')
        .update({
          key: newKeyValue,
          regenerated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error regenerating API key:', error);
        alert('Failed to regenerate API key');
        return;
      }

      setApiKeys(apiKeys.map(k => k.id === id ? { 
        ...k, 
        key: newKeyValue,
        key_preview: newKeyValue.substring(0, 16) + '••••••••••••••••'
      } : k));
      
      alert('API key regenerated successfully!');
    }
  };

  // Revoke API key
  const handleRevokeKey = async (id: string) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      const { error } = await supabase
        .from('api_keys')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error revoking API key:', error);
        alert('Failed to revoke API key');
        return;
      }

      setApiKeys(apiKeys.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
      setShowDeleteModal(null);
    }
  };

  // Copy key to clipboard
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    alert('API key copied to clipboard!');
  };

  // Filter API keys
  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || key.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  if (loading) {
    return (
      <div className="admin-apikeys-container">
        <main className="admin-apikeys-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading API keys...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-apikeys-container">
      
      <main className="admin-apikeys-main">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1>API Keys Management</h1>
            <p className="subtitle">Manage API keys for integrations and third-party applications</p>
          </div>
          <div className="header-right">
            <button onClick={() => setShowCreateModal(true)} className="btn-create-key">
              + Create New API Key
            </button>
            <button onClick={() => fetchAPIKeys()} className="btn-refresh">
              ⟳ Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🔑</div>
            <div className="stat-value">{apiKeys.length}</div>
            <div className="stat-label">Total Keys</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🟢</div>
            <div className="stat-value">{apiKeys.filter(k => k.status === 'active').length}</div>
            <div className="stat-label">Active Keys</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{apiKeys.reduce((sum, k) => sum + k.usage_count, 0)}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-value">{apiKeys.filter(k => new Date(k.expires_at) < new Date()).length}</div>
            <div className="stat-label">Expired Keys</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="search-filter-bar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search API keys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-wrapper">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        {/* API Keys List */}
        <div className="api-keys-list">
          {filteredKeys.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔑</div>
              <h3>No API Keys Found</h3>
              <p>Create your first API key to start integrating with Maylet XLab</p>
              <button onClick={() => setShowCreateModal(true)} className="btn-create-empty">
                + Create API Key
              </button>
            </div>
          ) : (
            filteredKeys.map((apiKey) => (
              <APIKeyCard
                key={apiKey.id}
                apiKey={apiKey}
                onCopy={handleCopyKey}
                onRegenerate={handleRegenerateKey}
                onRevoke={() => setShowDeleteModal(apiKey)}
                onEdit={(key) => { setEditingKey(key); setShowEditModal(true); }}
              />
            ))
          )}
        </div>

        {/* API Documentation Section */}
        <div className="api-docs-section">
          <h3>📚 API Documentation</h3>
          <div className="api-endpoints">
            <div className="endpoint-group">
              <h4>Authentication</h4>
              <div className="endpoint">
                <code className="method post">POST</code>
                <code className="path">/api/v1/auth/verify</code>
                <span className="desc">Verify API key</span>
              </div>
            </div>
            <div className="endpoint-group">
              <h4>Projects</h4>
              <div className="endpoint">
                <code className="method get">GET</code>
                <code className="path">/api/v1/projects</code>
                <span className="desc">List all projects</span>
              </div>
              <div className="endpoint">
                <code className="method post">POST</code>
                <code className="path">/api/v1/projects</code>
                <span className="desc">Create a project</span>
              </div>
              <div className="endpoint">
                <code className="method get">GET</code>
                <code className="path">/api/v1/projects/{'{id}'}</code>
                <span className="desc">Get project details</span>
              </div>
            </div>
            <div className="endpoint-group">
              <h4>Users</h4>
              <div className="endpoint">
                <code className="method get">GET</code>
                <code className="path">/api/v1/users</code>
                <span className="desc">List users</span>
              </div>
              <div className="endpoint">
                <code className="method get">GET</code>
                <code className="path">/api/v1/users/{'{id}'}</code>
                <span className="desc">Get user details</span>
              </div>
            </div>
          </div>
          <div className="api-docs-footer">
            <Link to="/admin/api-docs" className="btn-view-docs">📖 View Full API Documentation</Link>
          </div>
        </div>

        {/* Create API Key Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Create New API Key</h3>
                <button onClick={() => { setShowCreateModal(false); setGeneratedKey(null); }} className="modal-close">×</button>
              </div>
              <div className="modal-body">
                {generatedKey ? (
                  <div className="generated-key-section">
                    <div className="success-icon">✅</div>
                    <h4>API Key Generated Successfully!</h4>
                    <p className="warning-text">Make sure to copy your API key now. You won't be able to see it again!</p>
                    <div className="generated-key">
                      <code>{generatedKey}</code>
                      <button onClick={() => handleCopyKey(generatedKey)} className="btn-copy-generated">Copy</button>
                    </div>
                    <button onClick={() => { setShowCreateModal(false); setGeneratedKey(null); }} className="btn-done">
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Key Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Production Server, Mobile App, etc."
                        value={newKey.name}
                        onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Expires In</label>
                      <select
                        value={newKey.expiresIn}
                        onChange={(e) => setNewKey({ ...newKey, expiresIn: e.target.value })}
                      >
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="365">1 year</option>
                        <option value="0">Never expires</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Permissions</label>
                      <div className="permissions-checkboxes">
                        {availablePermissions.map((perm) => (
                          <label key={perm.id} className="permission-checkbox">
                            <input
                              type="checkbox"
                              checked={newKey.permissions.includes(perm.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewKey({ ...newKey, permissions: [...newKey.permissions, perm.id] });
                                } else {
                                  setNewKey({ ...newKey, permissions: newKey.permissions.filter(p => p !== perm.id) });
                                }
                              }}
                            />
                            <span>
                              <strong>{perm.label}</strong>
                              <small>{perm.description}</small>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {!generatedKey && (
                <div className="modal-footer">
                  <button onClick={() => setShowCreateModal(false)} className="btn-cancel">Cancel</button>
                  <button onClick={handleCreateAPIKey} className="btn-create">Generate Key</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit API Key Modal */}
        {showEditModal && editingKey && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Edit API Key</h3>
                <button onClick={() => setShowEditModal(false)} className="modal-close">×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Key Name</label>
                  <input
                    type="text"
                    value={editingKey.name}
                    onChange={(e) => setEditingKey({ ...editingKey, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Permissions</label>
                  <div className="permissions-checkboxes">
                    {availablePermissions.map((perm) => (
                      <label key={perm.id} className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={editingKey.permissions.includes(perm.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingKey({ ...editingKey, permissions: [...editingKey.permissions, perm.id] });
                            } else {
                              setEditingKey({ ...editingKey, permissions: editingKey.permissions.filter(p => p !== perm.id) });
                            }
                          }}
                        />
                        <span>
                          <strong>{perm.label}</strong>
                          <small>{perm.description}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowEditModal(false)} className="btn-cancel">Cancel</button>
                <button onClick={handleUpdateAPIKey} className="btn-save">Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete/Revoke Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content small">
              <div className="modal-header">
                <h3>Revoke API Key</h3>
                <button onClick={() => setShowDeleteModal(null)} className="modal-close">×</button>
              </div>
              <div className="modal-body">
                <div className="warning-icon">⚠️</div>
                <p>Are you sure you want to revoke <strong>{showDeleteModal.name}</strong>?</p>
                <p className="warning-text">This action cannot be undone. Any applications using this key will lose access immediately.</p>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowDeleteModal(null)} className="btn-cancel">Cancel</button>
                <button onClick={() => handleRevokeKey(showDeleteModal.id)} className="btn-revoke">Revoke Key</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .admin-apikeys-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        
        .admin-apikeys-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .admin-apikeys-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
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
        
        .btn-create-key, .btn-refresh {
          padding: 0.5rem 1.2rem;
          border-radius: 30px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        
        .btn-create-key {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
        }
        
        .btn-refresh {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        @media (max-width: 1000px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        .stat-card {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1rem;
          text-align: center;
        }
        
        .stat-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        .stat-value {
          font-size: 1.3rem;
          font-weight: 700;
          color: #2fd4ff;
        }
        
        .stat-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .search-filter-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        
        .search-wrapper {
          flex: 2;
          position: relative;
        }
        
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.5);
        }
        
        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          color: white;
        }
        
        .filter-wrapper select {
          padding: 0.75rem 1rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          color: white;
        }
        
        .api-keys-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .api-key-card {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.25rem;
          transition: all 0.2s;
        }
        
        .api-key-card.active {
          border-left: 4px solid #48bb78;
        }
        
        .api-key-card.inactive {
          border-left: 4px solid #a0aec0;
          opacity: 0.7;
        }
        
        .api-key-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .api-key-name-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        
        .api-key-name-section h3 {
          margin: 0;
          font-size: 1rem;
        }
        
        .api-key-status {
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }
        
        .api-key-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .btn-edit-key, .btn-regenerate-key, .btn-revoke-key {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }
        
        .btn-edit-key { color: #f6c90e; }
        .btn-regenerate-key { color: #2fd4ff; }
        .btn-revoke-key { color: #fc8181; }
        
        .api-key-value-section {
          margin-bottom: 1rem;
        }
        
        .api-key-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          margin-bottom: 0.25rem;
        }
        
        .api-key-value-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .api-key-value {
          background: rgba(0,0,0,0.5);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-family: monospace;
          font-size: 0.8rem;
          color: #2fd4ff;
        }
        
        .btn-toggle-key, .btn-copy-key {
          background: rgba(124,95,230,0.2);
          border: none;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          color: #9b7ff0;
          cursor: pointer;
          font-size: 0.7rem;
        }
        
        .permissions-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .permission-badge {
          background: rgba(47,212,255,0.2);
          padding: 0.2rem 0.6rem;
          border-radius: 15px;
          font-size: 0.7rem;
          color: #2fd4ff;
        }
        
        .api-key-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        
        .meta-item {
          display: flex;
          gap: 0.5rem;
        }
        
        .meta-label {
          color: rgba(255,255,255,0.7);
        }
        
        .expiring-soon {
          color: #f6c90e;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
        }
        
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .empty-state h3 {
          margin-bottom: 0.5rem;
        }
        
        .empty-state p {
          color: rgba(255,255,255,0.6);
          margin-bottom: 1rem;
        }
        
        .btn-create-empty {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 30px;
          color: #0a0d1a;
          cursor: pointer;
        }
        
        .api-docs-section {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.25rem;
          margin-top: 1rem;
        }
        
        .api-docs-section h3 {
          margin-bottom: 1rem;
        }
        
        .api-endpoints {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .endpoint-group h4 {
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
          color: #9b7ff0;
        }
        
        .endpoint {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.7rem;
          flex-wrap: wrap;
        }
        
        .method {
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.65rem;
        }
        
        .method.get { background: rgba(72,187,120,0.2); color: #48bb78; }
        .method.post { background: rgba(47,212,255,0.2); color: #2fd4ff; }
        .method.put { background: rgba(246,201,14,0.2); color: #f6c90e; }
        .method.delete { background: rgba(252,129,129,0.2); color: #fc8181; }
        
        .path {
          font-family: monospace;
          color: #2fd4ff;
        }
        
        .desc {
          color: rgba(255,255,255,0.6);
        }
        
        .btn-view-docs {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 30px;
          color: #9b7ff0;
          text-decoration: none;
          font-size: 0.8rem;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-content.small {
          max-width: 400px;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .modal-close {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
        }
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.8);
        }
        
        .form-group input, .form-group select {
          width: 100%;
          padding: 0.75rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        
        .permissions-checkboxes {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .permission-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        
        .permission-checkbox input {
          width: auto;
        }
        
        .permission-checkbox span {
          display: flex;
          flex-direction: column;
        }
        
        .permission-checkbox small {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
        }
        
        .generated-key-section {
          text-align: center;
        }
        
        .success-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        
        .warning-text {
          color: #f6c90e;
          font-size: 0.8rem;
          margin: 0.5rem 0;
        }
        
        .generated-key {
          background: rgba(0,0,0,0.5);
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          word-break: break-all;
        }
        
        .generated-key code {
          font-size: 0.7rem;
        }
        
        .btn-copy-generated {
          background: rgba(47,212,255,0.2);
          border: none;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          color: #2fd4ff;
          cursor: pointer;
          margin-left: 0.5rem;
        }
        
        .btn-done {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 30px;
          color: #0a0d1a;
          cursor: pointer;
        }
        
        .warning-icon {
          font-size: 3rem;
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .btn-cancel, .btn-create, .btn-save, .btn-revoke {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }
        
        .btn-cancel {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .btn-create, .btn-save {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
        }
        
        .btn-revoke {
          background: #fc8181;
          color: #1a1a2e;
        }
      `}</style>
    </div>
  );
};

export default AdminAPIKeys;