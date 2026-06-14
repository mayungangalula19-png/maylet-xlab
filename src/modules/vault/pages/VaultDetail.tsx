// C:\Users\user\maylet-xlab\src\app\routes\VaultDetail.tsx
// PROFESSIONAL VAULT DETAIL PAGE – View, edit, delete a single vault entry

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface VaultEntry {
  id: string;
  user_id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// EDIT MODAL (inline editing)
// ============================================================
const EditVaultModal = ({ entry, onClose, onUpdate }: { entry: VaultEntry; onClose: () => void; onUpdate: () => void }) => {
  const [formData, setFormData] = useState({
    title: entry.title,
    description: entry.description || '',
    content: entry.content,
    tags: entry.tags?.join(', ') || '',
    is_public: entry.is_public,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('innovation_vault')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          content: formData.content.trim(),
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          is_public: formData.is_public,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entry.id);
      if (updateError) throw updateError;
      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Edit Vault Entry</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}
            <div className="form-group">
              <label>Title</label>
              <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Short Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={8} required />
            </div>
            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
            </div>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" checked={formData.is_public} onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })} />
                Make publicly visible
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" disabled={loading} className="btn-save">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// MAIN VAULT DETAIL PAGE
// ============================================================
const VaultDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<VaultEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login');
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const fetchEntry = useCallback(async () => {
    if (!id || !userId) return;
    const { data, error } = await supabase
      .from('innovation_vault')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) {
      setError('Entry not found or access denied');
      setLoading(false);
      return;
    }
    // Check permission: only owner can view private entries
    if (!data.is_public && data.user_id !== userId) {
      setError('You do not have permission to view this entry');
      setLoading(false);
      return;
    }
    setEntry(data);
    setLoading(false);
  }, [id, userId]);

  useEffect(() => {
    if (userId) fetchEntry();
  }, [userId, fetchEntry]);

  const handleDelete = async () => {
    if (!entry) return;
    if (window.confirm('Permanently delete this vault entry? This action cannot be undone.')) {
      const { error } = await supabase.from('innovation_vault').delete().eq('id', entry.id);
      if (!error) navigate('/vault');
      else alert('Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="vault-detail-container">
        <main className="detail-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="vault-detail-container">
        <main className="detail-main">
          <div className="error-message">{error || 'Entry not found'}</div>
          <Link to="/vault" className="back-link">← Back to Vault</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="vault-detail-container">
      <main className="detail-main">
        <div className="detail-header">
          <Link to="/vault" className="back-link">← Back to Vault</Link>
          <div className="detail-actions">
            <button onClick={() => setShowEditModal(true)} className="btn-edit">✏️ Edit</button>
            <button onClick={handleDelete} className="btn-delete">🗑️ Delete</button>
          </div>
        </div>

        <div className="detail-content">
          <h1>{entry.title}</h1>
          <div className="detail-meta">
            <span className={`badge ${entry.is_public ? 'public' : 'private'}`}>
              {entry.is_public ? 'Public' : 'Private'}
            </span>
            {entry.tags?.map(tag => <span key={tag} className="badge tag">{tag}</span>)}
            <span>📅 Created: {new Date(entry.created_at).toLocaleString()}</span>
            <span>🕒 Updated: {new Date(entry.updated_at).toLocaleString()}</span>
          </div>
          {entry.description && (
            <div className="detail-description">
              <h3>Description</h3>
              <p>{entry.description}</p>
            </div>
          )}
          <div className="detail-full-content">
            <h3>Full Content</h3>
            <div className="content-box">{entry.content}</div>
          </div>
        </div>

        {showEditModal && <EditVaultModal entry={entry} onClose={() => setShowEditModal(false)} onUpdate={fetchEntry} />}
      </main>

      <style>{`
        .vault-detail-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .detail-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .detail-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .back-link {
          color: #7c5fe6;
          text-decoration: none;
        }
        .detail-actions {
          display: flex;
          gap: 0.75rem;
        }
        .btn-edit, .btn-delete {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.3rem 1rem;
          border-radius: 30px;
          cursor: pointer;
        }
        .btn-edit:hover {
          background: #7c5fe6;
        }
        .btn-delete:hover {
          background: #fc8181;
        }
        .detail-content {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 2rem;
        }
        .detail-content h1 {
          font-size: 1.8rem;
          margin: 0 0 0.5rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .detail-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .badge {
          font-size: 0.7rem;
          padding: 0.2rem 0.6rem;
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
        .detail-description {
          margin-bottom: 1.5rem;
        }
        .detail-description h3, .detail-full-content h3 {
          margin-bottom: 0.5rem;
        }
        .content-box {
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          padding: 1rem;
          white-space: pre-wrap;
          font-family: monospace;
          font-size: 0.9rem;
        }
        .error-message {
          text-align: center;
          color: #fc8181;
          margin-bottom: 1rem;
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
        .modal-overlay {
          position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.8);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content {
          background: #1a1a2e; border-radius: 20px; width: 90%; max-width: 700px; max-height: 90vh; overflow-y: auto;
        }
        .modal-header {
          display: flex; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .modal-body { padding: 1.5rem; }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);
        }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.7rem; text-transform: uppercase; color: #7c5fe6; margin-bottom: 0.25rem; }
        .form-group input, .form-group textarea {
          width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 0.6rem; color: white;
        }
        .form-group.checkbox label {
          display: flex; align-items: center; gap: 0.5rem; text-transform: none; font-size: 0.8rem; color: rgba(255,255,255,0.8);
        }
        .error-banner {
          background: rgba(252,129,129,0.2); border: 1px solid #fc8181; border-radius: 12px; padding: 0.75rem; margin-bottom: 1rem; color: #fc8181;
        }
        .btn-cancel, .btn-save {
          padding: 0.4rem 1rem; border-radius: 30px; border: none; cursor: pointer;
        }
        .btn-cancel { background: rgba(255,255,255,0.1); color: white; }
        .btn-save { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default VaultDetail;