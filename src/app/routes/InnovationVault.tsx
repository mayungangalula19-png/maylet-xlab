// C:\Users\user\maylet-xlab\src\app\routes\InnovationVault.tsx
// PROFESSIONAL INNOVATION VAULT – Store, protect, and manage your ideas and IP

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface VaultEntry {
  id: string;
  user_id: string;
  title: string;
  description: string;
  content: string; // encrypted or plain text
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// VAULT ENTRY CARD COMPONENT
// ============================================================
const VaultCard = ({ entry, onEdit, onDelete }: { entry: VaultEntry; onEdit: (entry: VaultEntry) => void; onDelete: (id: string) => void }) => (
  <div className="vault-card">
    <div className="vault-header">
      <h3>{entry.title}</h3>
      <div className="vault-badges">
        {entry.is_public ? <span className="badge public">Public</span> : <span className="badge private">Private</span>}
        {entry.tags?.slice(0, 2).map(tag => <span key={tag} className="badge tag">{tag}</span>)}
      </div>
    </div>
    <p className="vault-description">{entry.description.substring(0, 100)}...</p>
    <div className="vault-meta">
      <span>📅 {new Date(entry.created_at).toLocaleDateString()}</span>
    </div>
    <div className="vault-actions">
      <button onClick={() => onEdit(entry)} className="btn-edit">Edit</button>
      <button onClick={() => onDelete(entry.id)} className="btn-delete">Delete</button>
    </div>
  </div>
);

// ============================================================
// VAULT ENTRY MODAL (CREATE/EDIT)
// ============================================================
const VaultModal = ({ entry, onClose, onSave }: { entry?: VaultEntry; onClose: () => void; onSave: () => void }) => {
  const [formData, setFormData] = useState({
    title: entry?.title || '',
    description: entry?.description || '',
    content: entry?.content || '',
    tags: entry?.tags?.join(', ') || '',
    is_public: entry?.is_public || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        is_public: formData.is_public,
        updated_at: new Date().toISOString(),
      };
      if (entry) {
        const { error: updateError } = await supabase
          .from('innovation_vault')
          .update(payload)
          .eq('id', entry.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('innovation_vault')
          .insert({
            ...payload,
            user_id: session.user.id,
            created_at: new Date().toISOString(),
          });
        if (insertError) throw insertError;
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>{entry ? 'Edit Vault Entry' : 'Add New Vault Entry'}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}
            <div className="form-group">
              <label>Title *</label>
              <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Short Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
            </div>
            <div className="form-group">
              <label>Content / Details *</label>
              <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={6} placeholder="Describe your idea, invention, or innovation in detail..." required />
            </div>
            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="e.g., AI, blockchain, agritech" />
            </div>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" checked={formData.is_public} onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })} />
                Make this entry publicly visible (otherwise only you can see it)
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" disabled={loading} className="btn-save">{loading ? 'Saving...' : (entry ? 'Update' : 'Save to Vault')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// MAIN INNOVATION VAULT PAGE
// ============================================================
const InnovationVault = () => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<VaultEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login');
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const fetchEntries = useCallback(async () => {
    if (!userId) return;
    let query = supabase.from('innovation_vault').select('*');
    if (showPublicOnly) {
      query = query.eq('is_public', true);
    } else {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error) setEntries(data || []);
    setLoading(false);
  }, [userId, showPublicOnly]);

  useEffect(() => {
    if (userId) fetchEntries();
  }, [userId, fetchEntries]);

  useEffect(() => {
    let filtered = [...entries];
    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredEntries(filtered);
  }, [searchTerm, entries]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Permanently delete this vault entry? This action cannot be undone.')) {
      const { error } = await supabase.from('innovation_vault').delete().eq('id', id);
      if (!error) fetchEntries();
      else alert('Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="vault-container">
        <main className="vault-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="vault-container">
      <main className="vault-main">
        <div className="vault-header">
          <div>
            <h1>🔐 Innovation Vault</h1>
            <p>Securely store, protect, and timestamp your ideas and intellectual property</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-create">+ New Entry</button>
        </div>

        <div className="vault-controls">
          <input
            type="text"
            placeholder="Search vault..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <label className="public-filter">
            <input type="checkbox" checked={showPublicOnly} onChange={(e) => setShowPublicOnly(e.target.checked)} />
            Show only public entries
          </label>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔐</div>
            <h3>No vault entries found</h3>
            <p>Add your first idea to protect it with timestamped, legally defensible proof.</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-create-empty">+ Add Entry</button>
          </div>
        ) : (
          <div className="vault-grid">
            {filteredEntries.map(entry => (
              <VaultCard key={entry.id} entry={entry} onEdit={setEditingEntry} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {showCreateModal && <VaultModal onClose={() => setShowCreateModal(false)} onSave={fetchEntries} />}
        {editingEntry && <VaultModal entry={editingEntry} onClose={() => setEditingEntry(null)} onSave={fetchEntries} />}
      </main>

      <style>{`
        .vault-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .vault-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .vault-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .vault-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .vault-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .btn-create {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 30px;
          font-weight: 600;
          cursor: pointer;
        }
        .vault-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .search-input {
          flex: 1;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          padding: 0.6rem 1rem;
          color: white;
        }
        .public-filter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0,0,0,0.3);
          padding: 0.4rem 1rem;
          border-radius: 30px;
        }
        .vault-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        .vault-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1.2rem;
          transition: transform 0.2s;
        }
        .vault-card:hover {
          transform: translateY(-4px);
        }
        .vault-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .vault-header h3 {
          margin: 0;
        }
        .vault-badges {
          display: flex;
          gap: 0.5rem;
        }
        .badge {
          font-size: 0.6rem;
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
        }
        .badge.public {
          background: rgba(47,212,255,0.2);
          color: #2fd4ff;
        }
        .badge.private {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
        }
        .badge.tag {
          background: rgba(124,95,230,0.3);
          color: #9b7ff0;
        }
        .vault-description {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
          margin: 0.5rem 0;
        }
        .vault-meta {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          margin-bottom: 0.5rem;
        }
        .vault-actions {
          display: flex;
          gap: 0.5rem;
        }
        .btn-edit, .btn-delete {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.2rem 0.8rem;
          border-radius: 20px;
          cursor: pointer;
        }
        .btn-edit:hover {
          background: #7c5fe6;
        }
        .btn-delete:hover {
          background: #fc8181;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(0,0,0,0.3);
          border-radius: 20px;
        }
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
          border-radius: 20px;
          width: 90%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
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
          font-size: 0.7rem;
          text-transform: uppercase;
          color: #7c5fe6;
          margin-bottom: 0.25rem;
        }
        .form-group input, .form-group textarea {
          width: 100%;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0.6rem;
          color: white;
        }
        .form-group.checkbox label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-transform: none;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.8);
        }
        .error-banner {
          background: rgba(252,129,129,0.2);
          border: 1px solid #fc8181;
          border-radius: 12px;
          padding: 0.75rem;
          margin-bottom: 1rem;
          color: #fc8181;
        }
        .loading-spinner {
          width: 50px; height: 50px;
          border: 3px solid rgba(124,95,230,0.3);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 20% auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default InnovationVault;