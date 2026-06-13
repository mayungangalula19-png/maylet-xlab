// C:\Users\user\maylet-xlab\src\app\routes\CreateTeam.tsx
// PROFESSIONAL CREATE TEAM PAGE – Standalone form for creating new teams

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// CREATE TEAM PAGE
// ============================================================
const CreateTeam = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    purpose: '',
  });

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
    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      // Insert team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          purpose: formData.purpose.trim(),
          owner_id: session.user.id,
          user_id: session.user.id,
        })
        .select()
        .single();
      if (teamError) throw teamError;

      // Add creator as owner
      const { error: memberError } = await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: session.user.id,
        role: 'owner',
        joined_at: new Date().toISOString(),
      });
      if (memberError) throw memberError;

      navigate('/teams');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-team-container">
        <main className="form-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="create-team-container">
      <main className="form-main">
        <div className="form-header">
          <Link to="/teams" className="back-link">← Back to Teams</Link>
          <h1>👥 Create New Team</h1>
          <p>Build your team to collaborate on innovation projects</p>
        </div>

        <div className="form-card">
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Team Name *</label>
              <input
                type="text"
                placeholder="e.g., AI Innovation Squad"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="What does your team do? What are your goals?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Purpose / Mission</label>
              <textarea
                placeholder="Why does this team exist? What impact do you want to make?"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                rows={3}
              />
            </div>

            <div className="ai-tip">
              <span className="ai-tip-icon">💡</span>
              <div className="ai-tip-content">
                <strong>Pro Tip</strong>
                <p>Teams with a clear purpose attract better collaborators. Be specific about your innovation focus.</p>
              </div>
            </div>

            <div className="form-actions">
              <Link to="/teams" className="btn-cancel">Cancel</Link>
              <button type="submit" disabled={submitting} className="btn-submit">
                {submitting ? 'Creating...' : 'Create Team →'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <style>{`
        .create-team-container {
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
          max-width: 700px;
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
        .form-group input, .form-group textarea {
          width: 100%;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0.75rem;
          color: white;
          font-size: 0.9rem;
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

export default CreateTeam;