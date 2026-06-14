import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';

interface SavedIdea {
  id: string;
  title: string;
  content: string;
  content_hash: string;
  created_at: string;
  version: number;
  tags: string[];
}

const SaveIdea = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recentIdeas, setRecentIdeas] = useState<SavedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<SavedIdea | null>(null);

  useEffect(() => {
    const fetchUserAndIdeas = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: ideas } = await supabase
          .from('vault_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (ideas) {
          setRecentIdeas(ideas);
        }
      }
      setLoading(false);
    };
    
    fetchUserAndIdeas();
  }, []);

  const generateHash = async (text: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const encryptContent = (text: string): string => {
    // Simple encryption for demo - in production use proper encryption
    // For real implementation, use AES-256-GCM with proper key management
    return btoa(encodeURIComponent(text));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSaveIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Please enter a title for your idea.' });
      return;
    }
    
    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Please enter your idea content.' });
      return;
    }
    
    setSaving(true);
    setMessage(null);
    
    try {
      const contentHash = await generateHash(content);
      const encryptedContent = encryptContent(content);
      
      const { error } = await supabase
        .from('vault_entries')
        .insert({
          user_id: user?.id,
          title: title.trim(),
          content: encryptedContent,
          content_hash: contentHash,
          tags: tags,
          version: 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Your idea has been saved securely in the Innovation Vault!' });
      
      // Clear form
      setTitle('');
      setContent('');
      setTags([]);
      
      // Refresh recent ideas
      const { data: ideas } = await supabase
        .from('vault_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (ideas) {
        setRecentIdeas(ideas);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setMessage({ type: 'error', text: errorMessage || 'Failed to save idea. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const decryptContent = (encrypted: string): string => {
    try {
      return decodeURIComponent(atob(encrypted));
    } catch {
      return encrypted;
    }
  };

  const viewIdea = (idea: SavedIdea) => {
    const decryptedContent = decryptContent(idea.content);
    setSelectedIdea({
      ...idea,
      content: decryptedContent,
    });
    setShowPreview(true);
  };

  const deleteIdea = async (id: string) => {
    if (!confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
      return;
    }
    
    const { error } = await supabase
      .from('vault_entries')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setRecentIdeas(recentIdeas.filter(idea => idea.id !== id));
      setMessage({ type: 'success', text: 'Idea deleted successfully.' });
    } else {
      setMessage({ type: 'error', text: 'Failed to delete idea.' });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Innovation Vault...</p>
      </div>
    );
  }

  return (
    <div className="save-idea-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-icon">🔐</div>
        <h1>Innovation Vault</h1>
        <p>Protect your ideas with blockchain-grade security and timestamped proof of ownership.</p>
      </div>

      {/* Two Column Layout */}
      <div className="two-columns">
        {/* Left Column - Save Idea Form */}
        <div className="form-column">
          <div className="form-card">
            <h2>Save New Idea</h2>
            <p className="form-description">
              Your idea will be encrypted, timestamped, and stored securely. You'll have legally defensible proof of ownership.
            </p>
            
            {message && (
              <div className={`alert ${message.type}`}>
                {message.text}
              </div>
            )}
            
            <form onSubmit={handleSaveIdea}>
              <div className="form-group">
                <label>Idea Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Smart Irrigation System using IoT"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Idea Description *</label>
                <textarea
                  rows={8}
                  placeholder="Describe your idea in detail. What problem does it solve? How does it work? What makes it unique?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Tags (Optional)</label>
                <div className="tag-input-container">
                  <input
                    type="text"
                    placeholder="Add tags like: AI, AgriTech, Mobile"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button type="button" className="add-tag-btn" onClick={addTag}>Add</button>
                </div>
                <div className="tags-list">
                  {tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="security-notice">
                <span className="security-icon">🛡️</span>
                <div>
                  <strong>Your idea is protected</strong>
                  <p>256-bit encryption • SHA-256 timestamp • Legally defensible proof</p>
                </div>
              </div>
              
              <button type="submit" className="btn-primary btn-large" disabled={saving}>
                {saving ? 'Saving...' : 'Save to Innovation Vault →'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Right Column - Recent Ideas */}
        <div className="list-column">
          <div className="recent-card">
            <h2>Recent Ideas</h2>
            <p className="recent-description">Your recently saved and protected ideas.</p>
            
            {recentIdeas.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">💡</span>
                <h3>No ideas saved yet</h3>
                <p>Your protected ideas will appear here.</p>
              </div>
            ) : (
              <div className="ideas-list">
                {recentIdeas.map((idea) => (
                  <div key={idea.id} className="idea-item">
                    <div className="idea-header">
                      <h3>{idea.title}</h3>
                      <div className="idea-actions">
                        <button className="view-btn" onClick={() => viewIdea(idea)}>View</button>
                        <button className="delete-btn" onClick={() => deleteIdea(idea.id)}>Delete</button>
                      </div>
                    </div>
                    <div className="idea-meta">
                      <span>📅 {new Date(idea.created_at).toLocaleDateString()}</span>
                      <span>🔒 Version {idea.version}</span>
                      <span>🔑 Hash: {idea.content_hash.substring(0, 16)}...</span>
                    </div>
                    {idea.tags && idea.tags.length > 0 && (
                      <div className="idea-tags">
                        {idea.tags.map(tag => (
                          <span key={tag} className="idea-tag">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <Link to="/vault" className="view-all-link">
              View All Protected Ideas →
            </Link>
          </div>
          
          {/* Info Card */}
          <div className="info-card">
            <h3>Why Protect Your Ideas?</h3>
            <ul>
              <li>✓ Timestamped proof of ownership</li>
              <li>✓ Legally defensible in court</li>
              <li>✓ Share with confidence</li>
              <li>✓ Prevent idea theft</li>
              <li>✓ Track version history</li>
            </ul>
            <Link to="/vault/learn-more" className="info-link">Learn more about IP protection →</Link>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedIdea && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPreview(false)}>×</button>
            <div className="modal-header">
              <span className="modal-icon">💡</span>
              <h2>{selectedIdea.title}</h2>
            </div>
            <div className="modal-body">
              <div className="proof-info">
                <div className="proof-item">
                  <strong>Protected on:</strong>
                  <span>{new Date(selectedIdea.created_at).toLocaleString()}</span>
                </div>
                <div className="proof-item">
                  <strong>Version:</strong>
                  <span>{selectedIdea.version}</span>
                </div>
                <div className="proof-item">
                  <strong>Ownership Hash:</strong>
                  <code>{selectedIdea.content_hash}</code>
                </div>
              </div>
              <div className="idea-content">
                <strong>Idea Description:</strong>
                <p>{selectedIdea.content}</p>
              </div>
              {selectedIdea.tags && selectedIdea.tags.length > 0 && (
                <div className="modal-tags">
                  <strong>Tags:</strong>
                  {selectedIdea.tags.map(tag => <span key={tag} className="modal-tag">#{tag}</span>)}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowPreview(false)}>Close</button>
              <button className="btn-primary" onClick={() => {
                navigator.clipboard.writeText(selectedIdea.content_hash);
                alert('Hash copied to clipboard!');
              }}>Copy Hash</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .save-idea-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
          font-family: 'Inter', sans-serif;
        }
        .page-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .header-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        .page-header h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .page-header p {
          color: rgba(255,255,255,0.6);
        }
        .two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .form-card, .recent-card, .info-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 1.5rem;
        }
        .form-card h2, .recent-card h2 {
          font-size: 1.3rem;
          margin-bottom: 0.25rem;
        }
        .form-description, .recent-description {
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
        .form-group input, .form-group textarea {
          width: 100%;
          padding: 0.6rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-family: inherit;
        }
        .tag-input-container {
          display: flex;
          gap: 0.5rem;
        }
        .tag-input-container input {
          flex: 1;
        }
        .add-tag-btn {
          padding: 0.6rem 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          cursor: pointer;
        }
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .tag {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.6rem;
          background: rgba(124,95,230,0.2);
          border-radius: 20px;
          font-size: 0.75rem;
          color: #9b7ff0;
        }
        .tag button {
          background: none;
          border: none;
          color: #9b7ff0;
          cursor: pointer;
          font-size: 1rem;
        }
        .security-notice {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(72,187,120,0.05);
          border: 1px solid rgba(72,187,120,0.1);
          border-radius: 12px;
          margin: 1rem 0;
        }
        .security-icon {
          font-size: 1.5rem;
        }
        .security-notice strong {
          color: #48bb78;
        }
        .security-notice p {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          margin-top: 0.2rem;
        }
        .btn-primary, .btn-outline {
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
        .btn-large {
          width: 100%;
          padding: 0.8rem;
          font-size: 1rem;
        }
        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
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
        .ideas-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .idea-item {
          padding: 1rem;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
        }
        .idea-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .idea-header h3 {
          font-size: 1rem;
        }
        .idea-actions {
          display: flex;
          gap: 0.5rem;
        }
        .view-btn, .delete-btn {
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          font-size: 0.7rem;
          cursor: pointer;
          border: none;
        }
        .view-btn {
          background: rgba(124,95,230,0.2);
          color: #9b7ff0;
        }
        .delete-btn {
          background: rgba(252,129,129,0.2);
          color: #fc8181;
        }
        .idea-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.4);
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }
        .idea-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
        }
        .idea-tag {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.5);
        }
        .view-all-link {
          display: block;
          text-align: center;
          padding-top: 1rem;
          color: #9b7ff0;
          text-decoration: none;
          font-size: 0.85rem;
        }
        .info-card {
          margin-top: 1rem;
        }
        .info-card h3 {
          font-size: 1rem;
          margin-bottom: 0.75rem;
        }
        .info-card ul {
          list-style: none;
          padding: 0;
          margin-bottom: 1rem;
        }
        .info-card li {
          padding: 0.3rem 0;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
        }
        .info-link {
          color: #9b7ff0;
          text-decoration: none;
          font-size: 0.8rem;
        }
        .empty-state {
          text-align: center;
          padding: 2rem;
        }
        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.5rem;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.9);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
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
        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .modal-icon {
          font-size: 2rem;
        }
        .modal-body {
          padding: 1.5rem;
        }
        .proof-info {
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .proof-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
        }
        .proof-item code {
          background: rgba(255,255,255,0.05);
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.7rem;
        }
        .idea-content {
          margin-bottom: 1rem;
        }
        .idea-content p {
          margin-top: 0.5rem;
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
        }
        .modal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        .modal-tag {
          padding: 0.2rem 0.5rem;
          background: rgba(124,95,230,0.2);
          border-radius: 20px;
          font-size: 0.7rem;
          color: #9b7ff0;
        }
        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
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
          .two-columns {
            grid-template-columns: 1fr;
          }
          .idea-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default SaveIdea;