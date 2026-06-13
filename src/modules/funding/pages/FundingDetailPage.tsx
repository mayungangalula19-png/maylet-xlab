// C:\Users\user\maylet-xlab\src\app\routes\FundingDetail.tsx
// PROFESSIONAL FUNDING PITCH DETAIL – View, edit, track investor applications

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
type PitchStatus = 'draft' | 'submitted' | 'under_review' | 'funded' | 'declined';
type InvestorType = 'angel' | 'vc' | 'grant' | 'accelerator';

interface FundingPitch {
  id: string;
  user_id: string;
  title: string;
  description: string;
  amount: number;
  equity_offered: number;
  pitch_deck_url: string | null;
  status: PitchStatus;
  industry: string;
  stage: string;
  created_at: string;
  updated_at: string;
}

interface Investor {
  id: string;
  name: string;
  type: InvestorType;
  focus_industries: string[];
  investment_range_min: number;
  investment_range_max: number;
  description: string;
  logo_url: string | null;
  website: string;
  contact_email: string;
}

interface PitchApplication {
  id: string;
  pitch_id: string;
  investor_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  created_at: string;
  updated_at: string;
  investor?: Investor;
}

// ============================================================
// PITCH DETAIL PAGE
// ============================================================
const FundingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pitch, setPitch] = useState<FundingPitch | null>(null);
  const [applications, setApplications] = useState<PitchApplication[]>([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<FundingPitch>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login');
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const fetchPitch = useCallback(async () => {
    if (!id || !userId) return;
    const { data, error } = await supabase
      .from('funding_pitches')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) {
      navigate('/funding');
      return;
    }
    if (data.user_id !== userId) {
      navigate('/funding');
      return;
    }
    setPitch(data);
    setFormData(data);
  }, [id, userId, navigate]);

  const fetchApplications = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('pitch_investor_applications')
      .select('*, investor:investors(*)')
      .eq('pitch_id', id);
    if (!error) setApplications(data || []);
  }, [id]);

  useEffect(() => {
    if (userId) {
      fetchPitch();
      fetchApplications();
      setLoading(false);
    }
  }, [userId, fetchPitch, fetchApplications]);

  // Real-time updates for applications
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`pitch_applications_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pitch_investor_applications', filter: `pitch_id=eq.${id}` }, () => fetchApplications())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [id, fetchApplications]);

  const handleUpdatePitch = async () => {
    if (!pitch) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('funding_pitches')
      .update({
        title: formData.title,
        description: formData.description,
        amount: formData.amount,
        equity_offered: formData.equity_offered,
        pitch_deck_url: formData.pitch_deck_url,
        industry: formData.industry,
        stage: formData.stage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pitch.id);
    if (error) setError(error.message);
    else {
      setPitch(prev => prev ? { ...prev, ...formData } : null);
      setEditing(false);
    }
    setSaving(false);
  };

  const handleDeletePitch = async () => {
    if (!pitch) return;
    if (window.confirm('Permanently delete this pitch? All applications will be lost.')) {
      const { error } = await supabase.from('funding_pitches').delete().eq('id', pitch.id);
      if (!error) navigate('/funding');
      else alert('Delete failed');
    }
  };

  const getStatusColor = (status: PitchStatus) => {
    switch (status) {
      case 'draft': return '#f6c90e';
      case 'submitted': return '#2fd4ff';
      case 'under_review': return '#7c5fe6';
      case 'funded': return '#48bb78';
      case 'declined': return '#fc8181';
      default: return '#fff';
    }
  };

  if (loading || !pitch) {
    return (
      <div className="funding-detail-container">
        <main className="detail-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="funding-detail-container">
      <main className="detail-main">
        <div className="detail-header">
          <Link to="/funding" className="back-link">← Back to Funding Hub</Link>
          {pitch.status === 'draft' && (
            <div className="header-actions">
              <button onClick={() => setEditing(!editing)} className="btn-edit">
                {editing ? 'Cancel' : '✏️ Edit'}
              </button>
              <button onClick={handleDeletePitch} className="btn-delete">🗑️ Delete</button>
            </div>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="detail-content">
          {editing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Title</label>
                <input value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={5} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount ($)</label>
                  <input type="number" value={formData.amount || 0} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Equity (%)</label>
                  <input type="number" value={formData.equity_offered || 0} onChange={(e) => setFormData({ ...formData, equity_offered: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Industry</label>
                  <input value={formData.industry || ''} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Stage</label>
                  <select value={formData.stage || 'idea'} onChange={(e) => setFormData({ ...formData, stage: e.target.value })}>
                    <option value="idea">Idea</option>
                    <option value="prototype">Prototype</option>
                    <option value="mvp">MVP</option>
                    <option value="growth">Growth</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Pitch Deck URL</label>
                <input value={formData.pitch_deck_url || ''} onChange={(e) => setFormData({ ...formData, pitch_deck_url: e.target.value })} />
              </div>
              <div className="form-actions">
                <button onClick={() => setEditing(false)} className="btn-cancel">Cancel</button>
                <button onClick={handleUpdatePitch} disabled={saving} className="btn-save">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          ) : (
            <div className="view-mode">
              <div className="pitch-header">
                <h1>{pitch.title}</h1>
                <span className="pitch-status" style={{ background: getStatusColor(pitch.status) }}>
                  {pitch.status.toUpperCase()}
                </span>
              </div>
              <div className="pitch-meta">
                <span>💰 ${pitch.amount.toLocaleString()}</span>
                {pitch.equity_offered > 0 && <span>📊 {pitch.equity_offered}% equity</span>}
                <span>🏭 {pitch.industry}</span>
                <span>📈 {pitch.stage.toUpperCase()}</span>
                <span>📅 Created: {new Date(pitch.created_at).toLocaleDateString()}</span>
              </div>
              <div className="pitch-description">
                <h3>Description</h3>
                <p>{pitch.description}</p>
              </div>
              {pitch.pitch_deck_url && (
                <div className="pitch-deck">
                  <h3>Pitch Deck</h3>
                  <a href={pitch.pitch_deck_url} target="_blank" rel="noopener noreferrer" className="deck-link">📎 View Pitch Deck</a>
                </div>
              )}
            </div>
          )}

          {/* Applications Section */}
          <div className="applications-section">
            <h2>Investor Applications</h2>
            {applications.length === 0 ? (
              <p className="empty-message">No applications yet. Submit your pitch to investors from the Funding Hub.</p>
            ) : (
              <div className="applications-list">
                {applications.map(app => (
                  <div key={app.id} className="application-card">
                    <div className="app-header">
                      <div className="investor-avatar">
                        {app.investor?.logo_url ? <img loading="lazy" decoding="async" src={app.investor.logo_url} alt="" /> : <span>{app.investor?.name?.[0] || '?'}</span>}
                      </div>
                      <div className="investor-details">
                        <strong>{app.investor?.name || 'Investor'}</strong>
                        <span className="investor-type">{app.investor?.type?.toUpperCase()}</span>
                      </div>
                      <span className={`app-status status-${app.status}`}>{app.status.toUpperCase()}</span>
                    </div>
                    <div className="app-message">{app.message}</div>
                    <div className="app-date">Submitted: {new Date(app.created_at).toLocaleDateString()}</div>
                    {app.status === 'accepted' && app.investor?.contact_email && (
                      <div className="app-contact">
                        Contact: <a href={`mailto:${app.investor.contact_email}`}>{app.investor.contact_email}</a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .funding-detail-container {
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
        .header-actions {
          display: flex;
          gap: 0.75rem;
        }
        .btn-edit, .btn-delete {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.4rem 1rem;
          border-radius: 30px;
          cursor: pointer;
        }
        .btn-edit:hover { background: #7c5fe6; }
        .btn-delete:hover { background: #fc8181; }
        .detail-content {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 2rem;
        }
        .pitch-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .pitch-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .pitch-status {
          padding: 0.2rem 0.8rem;
          border-radius: 30px;
          font-size: 0.7rem;
          font-weight: 600;
          color: #0a0d1a;
        }
        .pitch-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          background: rgba(0,0,0,0.3);
          padding: 0.75rem;
          border-radius: 16px;
          margin-bottom: 1.5rem;
          font-size: 0.8rem;
        }
        .pitch-description h3, .pitch-deck h3 {
          margin-bottom: 0.5rem;
        }
        .deck-link {
          color: #2fd4ff;
          text-decoration: none;
        }
        .applications-section {
          margin-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 1.5rem;
        }
        .applications-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .application-card {
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          padding: 1rem;
        }
        .app-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .investor-avatar {
          width: 40px;
          height: 40px;
          background: #7c5fe6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .investor-details {
          flex: 1;
        }
        .investor-type {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        .app-status {
          font-size: 0.7rem;
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
        }
        .status-pending { background: rgba(246,201,14,0.2); color: #f6c90e; }
        .status-accepted { background: rgba(72,187,120,0.2); color: #48bb78; }
        .status-rejected { background: rgba(252,129,129,0.2); color: #fc8181; }
        .app-message {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.8);
          margin: 0.5rem 0;
        }
        .app-date {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
        }
        .app-contact {
          margin-top: 0.5rem;
          font-size: 0.8rem;
        }
        .edit-form .form-group {
          margin-bottom: 1rem;
        }
        .edit-form input, .edit-form textarea, .edit-form select {
          width: 100%;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0.6rem;
          color: white;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }
        .btn-cancel, .btn-save {
          padding: 0.4rem 1rem;
          border-radius: 30px;
          border: none;
          cursor: pointer;
        }
        .btn-cancel { background: rgba(255,255,255,0.1); color: white; }
        .btn-save { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a; font-weight: 600; }
        .error-banner {
          background: rgba(252,129,129,0.2);
          border: 1px solid #fc8181;
          border-radius: 12px;
          padding: 0.75rem;
          margin-bottom: 1rem;
          color: #fc8181;
        }
        .loading-spinner {
          width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6;
          border-radius: 50%; animation: spin 1s linear infinite; margin: 20% auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default FundingDetail;