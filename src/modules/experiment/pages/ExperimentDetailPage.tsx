// C:\Users\user\maylet-xlab\src\app\routes\ExperimentDetail.tsx
// PROFESSIONAL GRADE – Single Experiment View with Real AI (OpenRouter), Full CRUD, Optimistic UI

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';

// ============================================================
// TYPES (aligned with Supabase schema)
// ============================================================
type ExperimentType = 'market' | 'pricing' | 'feature' | 'competitor' | 'usability';
type ExperimentStatus = 'draft' | 'active' | 'completed' | 'archived';

interface Experiment {
  id: string;
  project_id: string;
  project_name?: string;
  project_sector?: string;
  type: ExperimentType;
  hypothesis: string;
  result: string | null;
  feasibility_score: number | null;
  recommendations: string[] | null;
  status: ExperimentStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface AIAnalysisResult {
  score: number;
  risk_level: 'low' | 'medium' | 'high';
  market_potential: number;
  recommendations: string[];
  competitor_insights: string;
}

// ============================================================
// AI ANALYSIS MODAL – REAL OPENROUTER API (FREE TIER)
// ============================================================
const AIAnalysisModal = ({
  experiment,
  onClose,
  onUpdate,
}: {
  experiment: Experiment;
  onClose: () => void;
  onUpdate: () => void;
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runRealAIAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use OpenRouter free endpoint (you can replace with your own key)
      const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!API_KEY) {
        throw new Error('OpenRouter API key missing. Add VITE_OPENROUTER_API_KEY to .env');
      }

      const prompt = `
You are an expert innovation advisor. Analyze the following experiment:

Project type: ${experiment.type}
Hypothesis: "${experiment.hypothesis}"

Return a JSON object with:
- score (0-100 feasibility)
- risk_level ("low", "medium", "high")
- market_potential (0-100)
- recommendations (array of 3-5 strings)
- competitor_insights (string)

Only output valid JSON. No extra text.
      `;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1:free',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content) as AIAnalysisResult;
      setAnalysis(parsed);
    } catch (err) {
      console.error('AI analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysisToSupabase = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('experiments')
        .update({
          feasibility_score: analysis.score,
          recommendations: analysis.recommendations,
          result: JSON.stringify({
            risk_level: analysis.risk_level,
            market_potential: analysis.market_potential,
            competitor_insights: analysis.competitor_insights,
          }),
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', experiment.id);
      if (updateError) throw updateError;
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save analysis');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    runRealAIAnalysis();
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>🤖 AI Analysis: {experiment.type.toUpperCase()}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          {loading && (
            <div className="ai-loading">
              <div className="loading-spinner-small"></div>
              <p>Contacting OpenRouter AI (DeepSeek‑R1) – please wait...</p>
            </div>
          )}
          {error && (
            <div className="ai-error">
              ❌ {error}<br />
              <button onClick={runRealAIAnalysis} className="btn-retry">Retry</button>
            </div>
          )}
          {analysis && !loading && (
            <div className="ai-results">
              <div className="ai-score-section">
                <div className="ai-score-circle" style={{ background: `conic-gradient(#2fd4ff 0deg ${analysis.score * 3.6}deg, #1a1a2e ${analysis.score * 3.6}deg 360deg)` }}>
                  <span>{analysis.score}%</span>
                </div>
                <div className="ai-score-details">
                  <div className="detail-item"><span>Risk Level:</span><strong style={{ color: analysis.risk_level === 'low' ? '#48bb78' : analysis.risk_level === 'medium' ? '#f6c90e' : '#fc8181' }}>{analysis.risk_level.toUpperCase()}</strong></div>
                  <div className="detail-item"><span>Market Potential:</span><strong>{analysis.market_potential}%</strong></div>
                </div>
              </div>
              <div className="ai-recommendations"><h4>📝 Recommendations</h4><ul>{analysis.recommendations.map((rec, i) => <li key={i}>💡 {rec}</li>)}</ul></div>
              <div className="ai-insights"><h4>🔍 Competitor Insights</h4><p>{analysis.competitor_insights}</p></div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={saveAnalysisToSupabase} disabled={loading || saving || !analysis} className="btn-save">
            {saving ? 'Saving...' : 'Save Analysis Results'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN EXPERIMENT DETAIL PAGE
// ============================================================
const ExperimentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    type: 'market' as ExperimentType,
    hypothesis: '',
    status: 'active' as ExperimentStatus,
    result: '',
  });
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchExperiment = useCallback(async () => {
    if (!id) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    const { data, error: expError } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', id)
      .single();
    if (expError || !data) {
      navigate('/experiments');
      return;
    }
    const { data: projectData } = await supabase
      .from('projects')
      .select('name, sector')
      .eq('id', data.project_id)
      .single();
    setExperiment({
      ...data,
      project_name: projectData?.name || 'Unknown',
      project_sector: projectData?.sector || 'Unknown',
    });
    setFormData({
      type: data.type,
      hypothesis: data.hypothesis,
      status: data.status,
      result: data.result || '',
    });
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    fetchExperiment();
  }, [fetchExperiment]);

  const handleSave = async () => {
    if (!experiment) return;
    setSaving(true);
    setError('');
    const { error: updateError } = await supabase
      .from('experiments')
      .update({
        type: formData.type,
        hypothesis: formData.hypothesis,
        status: formData.status,
        result: formData.result,
        updated_at: new Date().toISOString(),
      })
      .eq('id', experiment.id);
    if (updateError) {
      setError(updateError.message);
    } else {
      setExperiment(prev => prev ? { ...prev, ...formData, updated_at: new Date().toISOString() } : null);
      setEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!experiment) return;
    if (window.confirm('⚠️ Permanently delete this experiment? This cannot be undone.')) {
      const { error } = await supabase.from('experiments').delete().eq('id', experiment.id);
      if (!error) navigate('/experiments');
      else alert('Delete failed');
    }
  };

  const getTypeLabel = (type: ExperimentType) => {
    const map = {
      market: '📊 Market Validation',
      pricing: '💰 Pricing Test',
      feature: '⚙️ Feature Test',
      competitor: '🔍 Competitor Analysis',
      usability: '👥 Usability Test',
    };
    return map[type] || '🧪 Experiment';
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#48bb78';
    if (score >= 40) return '#f6c90e';
    return '#fc8181';
  };

  if (loading) {
    return (
      <div className="experiment-detail-container">
        <main className="detail-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  if (!experiment) return null;

  return (
    <div className="experiment-detail-container">
      <main className="detail-main">
        <div className="detail-header">
          <div className="header-left">
            <Link to="/experiments" className="back-link">← Back to Experiments</Link>
            <h1>{editing ? 'Edit Experiment' : getTypeLabel(experiment.type)}</h1>
          </div>
          <div className="header-actions">
            {!editing && (
              <>
                <button onClick={() => setEditing(true)} className="btn-edit">✏️ Edit</button>
                {!experiment.feasibility_score && <button onClick={() => setShowAIAnalysis(true)} className="btn-ai">🤖 Run AI Analysis (OpenRouter)</button>}
                <button onClick={handleDelete} className="btn-delete">🗑️ Delete</button>
              </>
            )}
          </div>
        </div>

        <div className="detail-content">
          {error && <div className="error-banner">{error}</div>}
          {editing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Experiment Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as ExperimentType })}>
                  <option value="market">📊 Market Validation</option>
                  <option value="pricing">💰 Pricing Test</option>
                  <option value="feature">⚙️ Feature Test</option>
                  <option value="competitor">🔍 Competitor Analysis</option>
                  <option value="usability">👥 Usability Test</option>
                </select>
              </div>
              <div className="form-group">
                <label>Hypothesis (testable statement)</label>
                <textarea value={formData.hypothesis} onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })} rows={4} required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as ExperimentStatus })}>
                  <option value="active">🟢 Active</option>
                  <option value="completed">✅ Completed</option>
                  <option value="draft">📝 Draft</option>
                  <option value="archived">📦 Archived</option>
                </select>
              </div>
              <div className="form-group">
                <label>Manual Results / Learnings</label>
                <textarea value={formData.result} onChange={(e) => setFormData({ ...formData, result: e.target.value })} rows={6} placeholder="Document your findings, metrics, lessons..." />
              </div>
              <div className="form-actions">
                <button onClick={() => setEditing(false)} className="btn-cancel">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-save">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          ) : (
            <div className="view-mode">
              <div className="detail-section">
                <label>Project</label>
                <p>{experiment.project_name} • {experiment.project_sector}</p>
              </div>
              <div className="detail-section">
                <label>Hypothesis</label>
                <div className="hypothesis-box">{experiment.hypothesis}</div>
              </div>
              <div className="detail-section">
                <label>Status</label>
                <span className={`status-badge status-${experiment.status}`}>
                  {experiment.status === 'active' && '🟢 Active'}
                  {experiment.status === 'completed' && '✅ Completed'}
                  {experiment.status === 'draft' && '📝 Draft'}
                  {experiment.status === 'archived' && '📦 Archived'}
                </span>
              </div>
              {experiment.feasibility_score ? (
                <>
                  <div className="detail-section">
                    <label>AI Feasibility Score</label>
                    <div className="score-display">
                      <div className="score-bar"><div className="score-fill" style={{ width: `${experiment.feasibility_score}%`, background: getScoreColor(experiment.feasibility_score) }}></div></div>
                      <span className="score-value" style={{ color: getScoreColor(experiment.feasibility_score) }}>{experiment.feasibility_score}%</span>
                    </div>
                  </div>
                  {experiment.recommendations && experiment.recommendations.length > 0 && (
                    <div className="detail-section">
                      <label>AI Recommendations</label>
                      <ul className="recommendations-list">{experiment.recommendations.map((rec, i) => <li key={i}>💡 {rec}</li>)}</ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="detail-section">
                  <button onClick={() => setShowAIAnalysis(true)} className="btn-ai-full">🤖 Run AI Analysis (DeepSeek‑R1 via OpenRouter)</button>
                </div>
              )}
              <div className="detail-section">
                <label>Manual Results / Learnings</label>
                <div className="manual-results">{experiment.result || 'No manual results recorded yet.'}</div>
              </div>
              <div className="detail-section meta">
                <div>Created: {new Date(experiment.created_at).toLocaleString()}</div>
                <div>Last updated: {new Date(experiment.updated_at).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showAIAnalysis && <AIAnalysisModal experiment={experiment} onClose={() => setShowAIAnalysis(false)} onUpdate={fetchExperiment} />}

      <style>{`
        .experiment-detail-container { display: flex; min-height: 100vh; background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%); }
        .detail-main { flex: 1; margin-left: 0; padding: 2rem; transition: margin-left 0.3s ease; }
        @media (max-width: 768px) { .detail-main { margin-left: 0; padding: 1rem; padding-top: 5rem; } }
        .loading-spinner { width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6; border-radius: 50%; animation: spin 1s linear infinite; margin: 20% auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; }
        .back-link { color: #7c5fe6; text-decoration: none; display: inline-block; margin-bottom: 0.5rem; }
        .detail-header h1 { font-size: 1.8rem; background: linear-gradient(135deg, #fff, #9b7ff0); -webkit-background-clip: text; background-clip: text; color: transparent; margin-top: 0.2rem; }
        .header-actions { display: flex; gap: 0.75rem; }
        .btn-edit, .btn-ai, .btn-delete, .btn-ai-full { background: rgba(255,255,255,0.1); border: none; padding: 0.5rem 1rem; border-radius: 30px; cursor: pointer; color: white; transition: all 0.2s; }
        .btn-edit:hover { background: #7c5fe6; }
        .btn-ai:hover, .btn-ai-full:hover { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a; }
        .btn-delete:hover { background: #fc8181; color: #0a0d1a; }
        .detail-content { background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 24px; padding: 2rem; }
        .detail-section { margin-bottom: 1.5rem; }
        .detail-section label { font-size: 0.7rem; text-transform: uppercase; color: #7c5fe6; letter-spacing: 1px; display: block; margin-bottom: 0.25rem; }
        .hypothesis-box { background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 12px; border-left: 3px solid #2fd4ff; }
        .status-badge { display: inline-block; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.75rem; }
        .status-active { background: rgba(47,212,255,0.2); color: #2fd4ff; }
        .status-completed { background: rgba(72,187,120,0.2); color: #48bb78; }
        .status-draft { background: rgba(246,201,14,0.2); color: #f6c90e; }
        .status-archived { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
        .score-display { display: flex; align-items: center; gap: 1rem; }
        .score-bar { flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
        .score-fill { height: 100%; }
        .recommendations-list { padding-left: 1.2rem; }
        .manual-results { background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 12px; white-space: pre-wrap; font-size: 0.85rem; }
        .meta { display: flex; gap: 1.5rem; font-size: 0.7rem; color: rgba(255,255,255,0.5); }
        .edit-form .form-group { margin-bottom: 1rem; }
        .edit-form input, .edit-form textarea, .edit-form select { width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.6rem; color: white; }
        .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; }
        .btn-cancel, .btn-save { padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer; }
        .btn-cancel { background: rgba(255,255,255,0.1); color: white; }
        .btn-save { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a; font-weight: 600; }
        .error-banner { background: rgba(252,129,129,0.2); border: 1px solid #fc8181; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; color: #fc8181; }
        .loading-spinner-small { width: 30px; height: 30px; border: 2px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
        .ai-loading, .ai-error { text-align: center; padding: 2rem; }
        .btn-retry { margin-top: 1rem; background: #7c5fe6; border: none; padding: 0.4rem 1rem; border-radius: 20px; color: white; cursor: pointer; }
        .ai-results { display: flex; flex-direction: column; gap: 1.5rem; }
        .ai-score-section { display: flex; align-items: center; gap: 2rem; justify-content: center; flex-wrap: wrap; }
        .ai-score-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; }
        .ai-score-circle span { font-size: 1.5rem; font-weight: 700; color: white; }
        .modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: #1a1a2e; border-radius: 20px; width: 90%; max-width: 700px; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .modal-close { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
        .modal-body { padding: 1.5rem; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
        .ai-score-details { flex: 1; }
        .detail-item { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default ExperimentDetail;