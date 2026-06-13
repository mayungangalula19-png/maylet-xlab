// C:\Users\user\maylet-xlab\src\app\routes\CreatePitch.tsx
// PROFESSIONAL CREATE PITCH PAGE – Standalone form for new funding pitches

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
type PitchStage = 'idea' | 'prototype' | 'mvp' | 'growth';

// ============================================================
// CREATE PITCH PAGE
// ============================================================
const CreatePitch = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: 50000,
    equity_offered: 10,
    pitch_deck_url: '',
    industry: 'Technology',
    stage: 'idea' as PitchStage,
  });

  const industries = [
    'Technology', 'AgriTech', 'HealthTech', 'EdTech',
    'FinTech', 'CleanTech', 'E-commerce', 'Other'
  ];

  const stages: PitchStage[] = ['idea', 'prototype', 'mvp', 'growth'];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || formData.amount <= 0) {
      setError('Please fill all required fields correctly');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');
      const { error } = await supabase.from('funding_pitches').insert({
        user_id: session.user.id,
        title: formData.title,
        description: formData.description,
        amount: formData.amount,
        equity_offered: formData.equity_offered,
        pitch_deck_url: formData.pitch_deck_url || null,
        industry: formData.industry,
        stage: formData.stage,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      navigate('/funding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pitch');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-pitch-container">
        <main className="form-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="create-pitch-container">
      <main className="form-main">
        <div className="form-header">
          <Link to="/funding" className="back-link">← Back to Funding Hub</Link>
          <h1>💰 Create New Pitch</h1>
          <p>Present your idea to investors and raise capital</p>
        </div>

        <div className="form-card">
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="form-group">
              <label>Pitch Title *</label>
              <input
                type="text"
                placeholder="e.g., AI-Powered Precision Farming Platform"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description *</label>
              <textarea
                placeholder="Describe your solution, market opportunity, and traction..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                required
              />
            </div>

            {/* Amount and Equity */}
            <div className="form-row">
              <div className="form-group">
                <label>Amount Seeking ($) *</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Equity Offered (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.equity_offered}
                  onChange={(e) => setFormData({ ...formData, equity_offered: Number(e.target.value) })}
                />
                <p className="hint">For grants or non-equity, enter 0</p>
              </div>
            </div>

            {/* Industry and Stage */}
            <div className="form-row">
              <div className="form-group">
                <label>Industry *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                >
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Startup Stage *</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value as PitchStage })}
                >
                  {stages.map(s => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pitch Deck URL */}
            <div className="form-group">
              <label>Pitch Deck URL (optional)</label>
              <input
                type="url"
                placeholder="https://drive.google.com/... or https://www.canva.com/..."
                value={formData.pitch_deck_url}
                onChange={(e) => setFormData({ ...formData, pitch_deck_url: e.target.value })}
              />
              <p className="hint">Share a link to your deck (Google Slides, Canva, PDF)</p>
            </div>

            {/* Pro Tip */}
            <div className="ai-tip">
              <span className="ai-tip-icon">💡</span>
              <div className="ai-tip-content">
                <strong>Pro Tip</strong>
                <p>Investors look for clear problem statements, market size, traction, and how you'll use funds. Be specific!</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <Link to="/funding" className="btn-cancel">Cancel</Link>
              <button type="submit" disabled={submitting} className="btn-submit">
                {submitting ? 'Creating...' : 'Create Pitch →'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <style>{`
        .create-pitch-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .form-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .form-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .form-header {
          margin-bottom: 2rem;
        }
        .back-link {
          color: #7c5fe6;
          text-decoration: none;
          display: inline-block;
          margin-bottom: 0.5rem;
        }
        .form-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin: 0.5rem 0 0.25rem;
        }
        .form-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 2rem;
          max-width: 800px;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.9);
        }
        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0.75rem;
          color: white;
          font-size: 0.9rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .hint {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
          margin-top: 0.25rem;
        }
        .ai-tip {
          background: linear-gradient(135deg, rgba(124,95,230,0.15), rgba(47,212,255,0.08));
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .ai-tip-icon {
          font-size: 1.5rem;
        }
        .ai-tip-content strong {
          display: block;
          font-size: 0.8rem;
          color: #2fd4ff;
          margin-bottom: 0.25rem;
        }
        .ai-tip-content p {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
          margin: 0;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
        .btn-cancel, .btn-submit {
          padding: 0.6rem 1.2rem;
          border-radius: 40px;
          text-decoration: none;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        .btn-submit {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
        }
        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(124,95,230,0.4);
        }
        .error-banner {
          background: rgba(252,129,129,0.2);
          border: 1px solid #fc8181;
          border-radius: 12px;
          padding: 0.75rem;
          margin-bottom: 1.5rem;
          color: #fc8181;
        }
        .loading-spinner {
          width: 50px;
          height: 50px;
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

export default CreatePitch;