// C:\Users\user\maylet-xlab\src\app\routes\FundingHub.tsx
// PROFESSIONAL FUNDING HUB – Manage pitches, discover investors, track applications

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  amount: number; // amount sought in USD
  equity_offered: number; // percentage (0-100), 0 for grants
  pitch_deck_url: string | null;
  status: PitchStatus;
  industry: string;
  stage: string; // idea, prototype, mvp, growth
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
// PITCH CARD COMPONENT
// ============================================================
const PitchCard = ({ pitch, onEdit, onDelete, onSubmit, applications }: {
  pitch: FundingPitch;
  onEdit: (pitch: FundingPitch) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  applications: PitchApplication[];
}) => {
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

  const appStatuses = applications.filter(a => a.pitch_id === pitch.id);
  const investorCount = appStatuses.length;
  const acceptedCount = appStatuses.filter(a => a.status === 'accepted').length;

  return (
    <div className="pitch-card">
      <div className="pitch-header">
        <h3>{pitch.title}</h3>
        <span className="pitch-status" style={{ background: getStatusColor(pitch.status) }}>
          {pitch.status.toUpperCase()}
        </span>
      </div>
      <p className="pitch-description">{pitch.description.substring(0, 100)}...</p>
      <div className="pitch-details">
        <span>💰 ${pitch.amount.toLocaleString()}</span>
        {pitch.equity_offered > 0 && <span>📊 {pitch.equity_offered}% equity</span>}
        <span>🏭 {pitch.industry}</span>
        <span>📈 {pitch.stage}</span>
      </div>
      <div className="pitch-stats">
        <span>📨 {investorCount} applications</span>
        <span>✅ {acceptedCount} accepted</span>
      </div>
      <div className="pitch-actions">
        <button onClick={() => onEdit(pitch)} className="btn-edit">Edit</button>
        {pitch.status === 'draft' && (
          <button onClick={() => onSubmit(pitch.id)} className="btn-submit">Submit to Investors</button>
        )}
        <button onClick={() => onDelete(pitch.id)} className="btn-delete">Delete</button>
      </div>
    </div>
  );
};

// ============================================================
// PITCH FORM MODAL (Create/Edit)
// ============================================================
const PitchModal = ({ pitch, onClose, onSave }: { pitch?: FundingPitch; onClose: () => void; onSave: () => void }) => {
  const [formData, setFormData] = useState({
    title: pitch?.title || '',
    description: pitch?.description || '',
    amount: pitch?.amount || 50000,
    equity_offered: pitch?.equity_offered || 10,
    pitch_deck_url: pitch?.pitch_deck_url || '',
    industry: pitch?.industry || 'Technology',
    stage: pitch?.stage || 'idea',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const industries = ['Technology', 'AgriTech', 'HealthTech', 'EdTech', 'FinTech', 'CleanTech', 'E-commerce', 'Other'];
  const stages = ['idea', 'prototype', 'mvp', 'growth'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        equity_offered: Number(formData.equity_offered),
        updated_at: new Date().toISOString(),
      };
      if (pitch) {
        const { error } = await supabase.from('funding_pitches').update(payload).eq('id', pitch.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('funding_pitches').insert({
          ...payload,
          user_id: session.user.id,
          status: 'draft',
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
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
          <h3>{pitch ? 'Edit Pitch' : 'New Funding Pitch'}</h3>
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
              <label>Description *</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Amount ($) *</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} required />
              </div>
              <div className="form-group">
                <label>Equity (%)</label>
                <input type="number" value={formData.equity_offered} onChange={(e) => setFormData({ ...formData, equity_offered: Number(e.target.value) })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Industry *</label>
                <select value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })}>
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Stage *</label>
                <select value={formData.stage} onChange={(e) => setFormData({ ...formData, stage: e.target.value })}>
                  {stages.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Pitch Deck URL (Google Slides, etc.)</label>
              <input value={formData.pitch_deck_url} onChange={(e) => setFormData({ ...formData, pitch_deck_url: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" disabled={loading} className="btn-save">{loading ? 'Saving...' : (pitch ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// INVESTOR MATCHING MODAL
// ============================================================
const InvestorMatchModal = ({ pitchId, onClose, onSubmitted }: { pitchId: string; onClose: () => void; onSubmitted: () => void }) => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvestors = async () => {
      // Get pitch industry to suggest matches
      const { data: pitch } = await supabase.from('funding_pitches').select('industry, amount').eq('id', pitchId).single();
      if (pitch) {
        const { data, error } = await supabase
          .from('investors')
          .select('*')
          .contains('focus_industries', [pitch.industry])
          .lte('investment_range_min', pitch.amount)
          .gte('investment_range_max', pitch.amount);
        if (!error) setInvestors(data || []);
      }
      setLoading(false);
    };
    fetchInvestors();
  }, [pitchId]);

  const submitToInvestor = async (investorId: string) => {
    setSubmitting(investorId);
    const { error } = await supabase.from('pitch_investor_applications').insert({
      pitch_id: pitchId,
      investor_id: investorId,
      status: 'pending',
      message: `Pitch submitted for consideration.`,
      created_at: new Date().toISOString(),
    });
    if (error) alert('Submission failed');
    else {
      alert('Submitted! The investor will review your pitch.');
      onSubmitted();
      onClose();
    }
    setSubmitting(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Find Investors for your Pitch</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading-spinner-small"></div>
          ) : investors.length === 0 ? (
            <p>No matching investors found at this time. Check back later or broaden your pitch parameters.</p>
          ) : (
            <div className="investors-list">
              {investors.map(inv => (
                <div key={inv.id} className="investor-card">
                  <div className="investor-logo">{inv.logo_url ? <img loading="lazy" decoding="async" src={inv.logo_url} alt={inv.name} /> : <span>{inv.name[0]}</span>}</div>
                  <div className="investor-info">
                    <h4>{inv.name}</h4>
                    <p>{inv.type.toUpperCase()} · ${inv.investment_range_min.toLocaleString()} – ${inv.investment_range_max.toLocaleString()}</p>
                    <p className="investor-focus">{inv.focus_industries.join(', ')}</p>
                    <button onClick={() => submitToInvestor(inv.id)} disabled={submitting === inv.id} className="btn-submit-pitch">
                      {submitting === inv.id ? 'Submitting...' : 'Submit Pitch'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// APPLICATIONS MODAL (view applications per pitch)
// ============================================================
const ApplicationsModal = ({ applications, onClose }: { applications: PitchApplication[]; onClose: () => void }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h3>Investor Applications</h3>
        <button onClick={onClose} className="modal-close">×</button>
      </div>
      <div className="modal-body">
        {applications.length === 0 ? (
          <p>No applications yet.</p>
        ) : (
          applications.map(app => (
            <div key={app.id} className="application-item">
              <div><strong>{app.investor?.name || 'Investor'}</strong> – {app.status.toUpperCase()}</div>
              <div className="app-message">{app.message}</div>
              <div className="app-date">{new Date(app.created_at).toLocaleDateString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

// ============================================================
// MAIN FUNDING HUB PAGE
// ============================================================
const FundingHub = () => {
  const [loading, setLoading] = useState(true);
  const [pitches, setPitches] = useState<FundingPitch[]>([]);
  const [applications, setApplications] = useState<PitchApplication[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPitch, setEditingPitch] = useState<FundingPitch | null>(null);
  const [submittingPitchId, setSubmittingPitchId] = useState<string | null>(null);
  const [viewingAppsPitchId, setViewingAppsPitchId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login');
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    // Fetch user's pitches
    const { data: pitchesData, error: pError } = await supabase
      .from('funding_pitches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (pError) console.error(pError);
    else setPitches(pitchesData || []);

    // Fetch all applications for those pitches
    if (pitchesData?.length) {
      const pitchIds = pitchesData.map(p => p.id);
      const { data: appsData, error: aError } = await supabase
        .from('pitch_investor_applications')
        .select('*, investor:investors(*)')
        .in('pitch_id', pitchIds);
      if (!aError) setApplications(appsData || []);
    } else setApplications([]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, fetchData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;
    const pitchesChannel = supabase
      .channel('funding_pitches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'funding_pitches', filter: `user_id=eq.${userId}` }, () => fetchData())
      .subscribe();
    const appsChannel = supabase
      .channel('pitch_applications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pitch_investor_applications' }, () => fetchData())
      .subscribe();
    return () => {
      pitchesChannel.unsubscribe();
      appsChannel.unsubscribe();
    };
  }, [userId, fetchData]);

  const handleDeletePitch = async (id: string) => {
    if (window.confirm('Delete this pitch? All applications will be removed.')) {
      const { error } = await supabase.from('funding_pitches').delete().eq('id', id);
      if (error) alert('Delete failed');
    }
  };

  const handleSubmitPitch = (pitchId: string) => {
    setSubmittingPitchId(pitchId);
  };

  const handlePitchSubmitted = () => {
    fetchData();
    setSubmittingPitchId(null);
  };

  const stats = {
    totalPitches: pitches.length,
    totalFundingSought: pitches.reduce((sum, p) => sum + p.amount, 0),
    fundedPitches: pitches.filter(p => p.status === 'funded').length,
    activeApplications: applications.filter(a => a.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="funding-hub-container">
        <main className="hub-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  const applicationsForPitch = (pitchId: string) => applications.filter(a => a.pitch_id === pitchId);

  return (
    <div className="funding-hub-container">
      <main className="hub-main">
        <div className="hub-header">
          <h1>💰 Funding Hub</h1>
          <p>Connect with investors, raise capital, and track your fundraising journey</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon">📄</div><div className="stat-value">{stats.totalPitches}</div><div className="stat-label">Total Pitches</div></div>
          <div className="stat-card"><div className="stat-icon">💵</div><div className="stat-value">${stats.totalFundingSought.toLocaleString()}</div><div className="stat-label">Funding Sought</div></div>
          <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value">{stats.fundedPitches}</div><div className="stat-label">Funded</div></div>
          <div className="stat-card"><div className="stat-icon">📨</div><div className="stat-value">{stats.activeApplications}</div><div className="stat-label">Active Applications</div></div>
        </div>

        <div className="hub-actions">
          <button onClick={() => setShowCreateModal(true)} className="btn-create-pitch">+ New Pitch</button>
        </div>

        {pitches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>No pitches yet</h3>
            <p>Create your first funding pitch to start raising capital.</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-create-empty">+ Create Pitch</button>
          </div>
        ) : (
          <div className="pitches-grid">
            {pitches.map(pitch => (
              <PitchCard
                key={pitch.id}
                pitch={pitch}
                onEdit={setEditingPitch}
                onDelete={handleDeletePitch}
                onSubmit={handleSubmitPitch}
                applications={applicationsForPitch(pitch.id)}
              />
            ))}
          </div>
        )}

        {showCreateModal && <PitchModal onClose={() => setShowCreateModal(false)} onSave={fetchData} />}
        {editingPitch && <PitchModal pitch={editingPitch} onClose={() => setEditingPitch(null)} onSave={fetchData} />}
        {submittingPitchId && <InvestorMatchModal pitchId={submittingPitchId} onClose={() => setSubmittingPitchId(null)} onSubmitted={handlePitchSubmitted} />}
        {viewingAppsPitchId && (
          <ApplicationsModal
            applications={applications.filter(a => a.pitch_id === viewingAppsPitchId)}
            onClose={() => setViewingAppsPitchId(null)}
          />
        )}
      </main>

      <style>{`
        .funding-hub-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .hub-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .hub-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .hub-header {
          margin-bottom: 2rem;
        }
        .hub-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .stat-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .stat-icon { font-size: 2rem; }
        .stat-value { font-size: 1.5rem; font-weight: 700; }
        .stat-label { font-size: 0.7rem; color: rgba(255,255,255,0.6); }
        .hub-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 2rem;
        }
        .btn-create-pitch {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 30px;
          font-weight: 600;
          cursor: pointer;
        }
        .pitches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        .pitch-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1.2rem;
          transition: transform 0.2s;
        }
        .pitch-card:hover {
          transform: translateY(-4px);
        }
        .pitch-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .pitch-status {
          font-size: 0.7rem;
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          color: #0a0d1a;
          font-weight: 600;
        }
        .pitch-description {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.7);
          margin-bottom: 0.75rem;
        }
        .pitch-details {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.75rem;
        }
        .pitch-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.7rem;
          margin-bottom: 1rem;
        }
        .pitch-actions {
          display: flex;
          gap: 0.5rem;
        }
        .btn-edit, .btn-submit, .btn-delete {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.3rem 0.8rem;
          border-radius: 30px;
          cursor: pointer;
          font-size: 0.7rem;
        }
        .btn-edit:hover { background: #7c5fe6; }
        .btn-submit:hover { background: #2fd4ff; color: #0a0d1a; }
        .btn-delete:hover { background: #fc8181; }
        .empty-state { text-align: center; padding: 3rem; background: rgba(0,0,0,0.3); border-radius: 20px; }
        .modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: #1a1a2e; border-radius: 20px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
        .modal-content.large { max-width: 700px; }
        .modal-header { display: flex; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .modal-body { padding: 1.5rem; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.7rem; text-transform: uppercase; color: #7c5fe6; margin-bottom: 0.25rem; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.6rem; color: white; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .investors-list { display: flex; flex-direction: column; gap: 1rem; }
        .investor-card { display: flex; gap: 1rem; padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 16px; }
        .investor-logo { width: 50px; height: 50px; background: #7c5fe6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .investor-info { flex: 1; }
        .btn-submit-pitch { background: #2fd4ff; border: none; padding: 0.3rem 1rem; border-radius: 30px; cursor: pointer; margin-top: 0.5rem; }
        .application-item { padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .loading-spinner { width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6; border-radius: 50%; animation: spin 1s linear infinite; margin: 20% auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default FundingHub;