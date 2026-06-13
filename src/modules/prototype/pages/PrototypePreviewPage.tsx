// C:\Users\user\maylet-xlab\src\app\routes\PrototypePreview.tsx
// PROFESSIONAL PROTOTYPE PREVIEW – View, download, edit, delete prototype

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface Prototype {
  id: string;
  project_id: string;
  project_name?: string;
  name: string;
  description: string;
  file_url: string;
  thumbnail_url: string | null;
  version: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
  downloads: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// ============================================================
// PROTOTYPE VIEWER COMPONENT
// ============================================================
const PrototypeViewer = ({ fileUrl, fileName }: { fileUrl: string; fileName: string }) => {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  if (fileExtension === 'pdf') {
    return <iframe src={fileUrl} className="viewer-iframe" title="PDF Viewer" />;
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
    return <img loading="lazy" decoding="async" src={fileUrl} alt={fileName} className="viewer-image" />;
  }
  if (['mp4', 'webm', 'ogg'].includes(fileExtension || '')) {
    return <video src={fileUrl} controls className="viewer-video" />;
  }
  return (
    <div className="viewer-fallback">
      <p>Preview not available for this file type.</p>
      <a href={fileUrl} download className="btn-download">Download File</a>
    </div>
  );
};

// ============================================================
// EDIT PROTOTYPE MODAL
// ============================================================
const EditPrototypeModal = ({ prototype, onClose, onSave }: { prototype: Prototype; onClose: () => void; onSave: () => void }) => {
  const [formData, setFormData] = useState({
    name: prototype.name,
    description: prototype.description,
    version: prototype.version,
    status: prototype.status,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('prototypes')
        .update({
          name: formData.name,
          description: formData.description,
          version: formData.version,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prototype.id);
      if (updateError) throw updateError;
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Edit Prototype</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="form-group">
              <label>Version</label>
              <input type="text" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
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
// MAIN PROTOTYPE PREVIEW PAGE
// ============================================================
const PrototypePreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrototype = useCallback(async () => {
    if (!id) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    const { data, error: fetchError } = await supabase
      .from('prototypes')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !data) {
      setError('Prototype not found or access denied');
      setLoading(false);
      return;
    }
    // Get project name
    const { data: project } = await supabase.from('projects').select('name').eq('id', data.project_id).single();
    setPrototype({ ...data, project_name: project?.name || 'Unknown' });
    // Increment view count
    await supabase.from('prototypes').update({ views: (data.views || 0) + 1 }).eq('id', id);
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    fetchPrototype();
  }, [fetchPrototype]);

  const handleDelete = async () => {
    if (!prototype) return;
    if (window.confirm('Delete this prototype? This action cannot be undone.')) {
      const { error: deleteError } = await supabase.from('prototypes').delete().eq('id', prototype.id);
      if (!deleteError) {
        navigate('/prototypes');
      } else {
        alert('Delete failed');
      }
    }
  };

  const handleDownload = async () => {
    if (!prototype) return;
    window.open(prototype.file_url, '_blank');
    await supabase.from('prototypes').update({ downloads: (prototype.downloads || 0) + 1 }).eq('id', prototype.id);
    setPrototype(prev => prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : null);
  };

  if (loading) {
    return (
      <div className="prototype-preview-container">
        <main className="preview-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  if (error || !prototype) {
    return (
      <div className="prototype-preview-container">
        <main className="preview-main">
          <div className="error-message">{error || 'Prototype not found'}</div>
          <Link to="/prototypes" className="back-link">← Back to Prototypes</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="prototype-preview-container">
      <main className="preview-main">
        <div className="preview-header">
          <Link to="/prototypes" className="back-link">← Back to Prototypes</Link>
          <div className="preview-actions">
            <button onClick={handleDownload} className="btn-download">⬇️ Download</button>
            <button onClick={() => setShowEditModal(true)} className="btn-edit">✏️ Edit</button>
            <button onClick={handleDelete} className="btn-delete">🗑️ Delete</button>
          </div>
        </div>

        <div className="preview-content">
          <div className="preview-info">
            <h1>{prototype.name}</h1>
            <div className="preview-meta">
              <span>📁 {prototype.project_name}</span>
              <span>📌 v{prototype.version}</span>
              <span>📅 {new Date(prototype.created_at).toLocaleDateString()}</span>
              <span>👁️ {prototype.views} views</span>
              <span>⬇️ {prototype.downloads} downloads</span>
              <span className={`status-${prototype.status}`}>{prototype.status}</span>
            </div>
            <p className="preview-description">{prototype.description || 'No description provided.'}</p>
          </div>
          <div className="preview-viewer">
            <PrototypeViewer fileUrl={prototype.file_url} fileName={prototype.name} />
          </div>
        </div>

        {showEditModal && (
          <EditPrototypeModal prototype={prototype} onClose={() => setShowEditModal(false)} onSave={fetchPrototype} />
        )}
      </main>

      <style>{`
        .prototype-preview-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .preview-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .preview-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .back-link {
          color: #7c5fe6;
          text-decoration: none;
        }
        .preview-actions {
          display: flex;
          gap: 0.5rem;
        }
        .btn-download, .btn-edit, .btn-delete {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.4rem 1rem;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-download:hover { background: #2fd4ff; color: #0a0d1a; }
        .btn-edit:hover { background: #7c5fe6; }
        .btn-delete:hover { background: #fc8181; }
        .preview-content {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 2rem;
        }
        .preview-info h1 {
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }
        .preview-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 1rem;
        }
        .status-draft { color: #f6c90e; }
        .status-published { color: #48bb78; }
        .status-archived { color: #fc8181; }
        .preview-description {
          color: rgba(255,255,255,0.8);
          margin-bottom: 2rem;
        }
        .preview-viewer {
          background: #0a0a0f;
          border-radius: 16px;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .viewer-iframe {
          width: 100%;
          height: 70vh;
          border: none;
          border-radius: 16px;
        }
        .viewer-image {
          max-width: 100%;
          max-height: 70vh;
          object-fit: contain;
        }
        .viewer-video {
          max-width: 100%;
          max-height: 70vh;
        }
        .viewer-fallback {
          text-align: center;
          padding: 3rem;
        }
        .error-message {
          text-align: center;
          color: #fc8181;
          margin-bottom: 1rem;
        }
        .loading-spinner {
          width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6; border-radius: 50%;
          animation: spin 1s linear infinite; margin: 20% auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: #1a1a2e; border-radius: 20px; width: 90%; max-width: 500px; }
        .modal-header { display: flex; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .modal-body { padding: 1.5rem; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.7rem; text-transform: uppercase; color: #7c5fe6; margin-bottom: 0.25rem; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.6rem; color: white; }
        .btn-cancel, .btn-save { padding: 0.4rem 1rem; border-radius: 30px; border: none; cursor: pointer; }
        .btn-cancel { background: rgba(255,255,255,0.1); color: white; }
        .btn-save { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a; font-weight: 600; }
        .error-banner { background: rgba(252,129,129,0.2); border: 1px solid #fc8181; border-radius: 12px; padding: 0.75rem; margin-bottom: 1rem; color: #fc8181; }
      `}</style>
    </div>
  );
};

export default PrototypePreview;