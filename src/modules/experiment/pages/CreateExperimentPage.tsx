// C:\Users\user\maylet-xlab\src\app\routes\CreateExperiment.tsx
// PROFESSIONAL CREATE EXPERIMENT PAGE – Standalone form for new experiments

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
type ExperimentType = 'market' | 'pricing' | 'feature' | 'competitor' | 'usability';

interface Project {
  id: string;
  name: string;
  sector: string;
}

// ============================================================
// CREATE EXPERIMENT PAGE
// ============================================================
const CreateExperiment = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const prefillProjectId = queryParams.get('projectId');

  const [formData, setFormData] = useState({
    project_id: prefillProjectId || '',
    type: 'market' as ExperimentType,
    hypothesis: '',
  });

  useEffect(() => {
    const fetchProjects = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, sector')
        .eq('user_id', session.user.id);
      if (error) console.error(error);
      else setProjects(data || []);
      setLoading(false);
    };
    fetchProjects();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.hypothesis) {
      setError('Please select a project and enter a hypothesis');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');
      const { error } = await supabase.from('experiments').insert({
        user_id: session.user.id,
        project_id: formData.project_id,
        type: formData.type,
        hypothesis: formData.hypothesis,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      navigate('/experiments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create experiment');
    } finally {
      setSubmitting(false);
    }
  };

  const experimentTypes = [
    { value: 'market', label: '📊 Market Validation', desc: 'Test if there is demand for your product' },
    { value: 'pricing', label: '💰 Pricing Test', desc: 'Find the optimal price point' },
    { value: 'feature', label: '⚙️ Feature Test', desc: 'Validate specific features' },
    { value: 'competitor', label: '🔍 Competitor Analysis', desc: 'Analyze competitive landscape' },
    { value: 'usability', label: '👥 Usability Test', desc: 'Test user experience' },
  ];

  if (loading) {
    return (
      <div className="create-experiment-container">
        <main className="form-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="create-experiment-container">
      <main className="form-main">
        <div className="form-header">
          <Link to="/experiments" className="back-link">← Back to Experiments</Link>
          <h1>🧪 Create New Experiment</h1>
          <p>Design a testable hypothesis to validate your innovation</p>
        </div>

        <div className="form-card">
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleSubmit}>
            {/* Project Selection */}
            <div className="form-group">
              <label>Select Project *</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                required
              >
                <option value="">Choose a project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sector})
                  </option>
                ))}
              </select>
            </div>

            {/* Experiment Type */}
            <div className="form-group">
              <label>Experiment Type *</label>
              <div className="experiment-types">
                {experimentTypes.map(type => (
                  <label key={type.value} className={`type-option ${formData.type === type.value ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as ExperimentType })}
                    />
                    <div className="type-content">
                      <div className="type-title">{type.label}</div>
                      <div className="type-desc">{type.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Hypothesis */}
            <div className="form-group">
              <label>Hypothesis *</label>
              <textarea
                placeholder="What do you want to test? Be specific and measurable.&#10;&#10;Example: 'Small farmers in Tanzania will pay $10/month for AI-powered weather alerts that help them plan planting seasons.'"
                value={formData.hypothesis}
                onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                rows={5}
                required
              />
              <p className="hint">A good hypothesis is specific, measurable, and testable.</p>
            </div>

            {/* AI Pro Tip */}
            <div className="ai-tip">
              <span className="ai-tip-icon">🤖</span>
              <div className="ai-tip-content">
                <strong>AI Pro Tip</strong>
                <p>Experiments with clear hypotheses are 3x more likely to produce actionable insights. Be specific about your target audience and expected outcome!</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <Link to="/experiments" className="btn-cancel">Cancel</Link>
              <button type="submit" disabled={submitting} className="btn-submit">
                {submitting ? 'Creating...' : 'Create Experiment →'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <style>{`
        .create-experiment-container {
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
        .form-group select,
        .form-group textarea {
          width: 100%;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0.75rem;
          color: white;
          font-size: 0.9rem;
        }
        .experiment-types {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .type-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .type-option.selected {
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
        }
        .type-option input {
          width: auto;
          margin: 0;
        }
        .type-title {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .type-desc {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
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

export default CreateExperiment;