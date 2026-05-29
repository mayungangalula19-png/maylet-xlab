// C:\Users\user\maylet-xlab\src\app\routes\Experiments.tsx
// ADVANCED EXPERIMENTS PAGE - COMPLETE INNOVATION LAB
// FIXED: Removed unused userName variable (line 602)

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface Experiment {
  id: string;
  project_id: string;
  project_name?: string;
  project_sector?: string;
  type: 'market' | 'pricing' | 'feature' | 'competitor' | 'usability';
  hypothesis: string;
  result: string;
  feasibility_score: number;
  market_size?: number;
  competitor_strength?: number;
  recommendations?: string[];
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  sector: string;
}

interface AIAnalysis {
  score: number;
  risk_level: 'low' | 'medium' | 'high';
  market_potential: number;
  recommendations: string[];
  competitor_insights: string;
}

// ============================================================
// SIDEBAR COMPONENT
// ============================================================
const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const mainMenu = [
    { icon: '📊', label: 'Dashboard', route: '/dashboard' },
    { icon: '📁', label: 'Projects', route: '/projects' },
    { icon: '🧪', label: 'Experiments', route: '/experiments', active: true },
    { icon: '🤖', label: 'AI Assistant', route: '/ai-assistant' },
    { icon: '📦', label: 'Prototypes', route: '/prototypes' },
    { icon: '👥', label: 'Teams', route: '/teams' },
    { icon: '📄', label: 'Documents', route: '/documents' },
    { icon: '🔐', label: 'Innovation Vault', route: '/vault' },
    { icon: '💰', label: 'Funding Hub', route: '/funding' },
    { icon: '🎓', label: 'Mentorship', route: '/mentorship' },
    { icon: '🏢', label: 'Enterprise', route: '/enterprise' },
    { icon: '🏆', label: 'Hackathons', route: '/hackathons' },
    { icon: '📚', label: 'Learning Hub', route: '/learning' },
    { icon: '📈', label: 'Analytics', route: '/analytics' },
    { icon: '🛒', label: 'Marketplace', route: '/marketplace' },
    { icon: '💬', label: 'Feedback', route: '/feedback' },
    { icon: '🛠️', label: 'Help & Support', route: '/help' },
  ];

  const userMenu = [
    { icon: '🔔', label: 'Notifications', route: '/notifications' },
    { icon: '⚙️', label: 'Settings', route: '/settings' },
    { icon: '👤', label: 'Profile', route: '/profile' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <button className="mobile-sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">✦</div>
          {!collapsed && (
            <div className="logo-text">
              <div className="logo-title">MAYLET X LAB</div>
              <div className="logo-tagline">Innovate. Build. Scale.</div>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {mainMenu.map((item) => (
            <Link key={item.label} to={item.route} className={`sidebar-link ${item.active ? 'active' : ''}`} title={collapsed ? item.label : undefined}>
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-divider"></div>
        <nav className="sidebar-nav user-nav">
          {userMenu.map((item) => (
            <Link key={item.label} to={item.route} className="sidebar-link" title={collapsed ? item.label : undefined}>
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
          <button onClick={handleLogout} className="sidebar-link logout-link">
            <span className="sidebar-icon">🚪</span>
            {!collapsed && <span className="sidebar-label">Sign Out</span>}
          </button>
        </nav>
      </aside>
      <style>{`
        .sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 98; display: none; }
        .mobile-sidebar-toggle { display: none; position: fixed; top: 1rem; left: 1rem; z-index: 100; background: #7c5fe6; border: none; color: white; font-size: 1.5rem; width: 48px; height: 48px; border-radius: 12px; cursor: pointer; }
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; background: #0a0d1a; color: rgba(255,255,255,0.7); display: flex; flex-direction: column; z-index: 99; transition: width 0.3s ease; overflow-y: auto; overflow-x: hidden; width: 280px; box-shadow: 2px 0 10px rgba(0,0,0,0.3); }
        .sidebar.collapsed { width: 80px; }
        .sidebar-logo { padding: 1.5rem 1rem; display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); position: relative; }
        .logo-icon { font-size: 2rem; font-weight: bold; background: linear-gradient(135deg, #7c5fe6, #2fd4ff); -webkit-background-clip: text; background-clip: text; color: transparent; min-width: 40px; text-align: center; }
        .logo-title { font-weight: 700; font-size: 1rem; color: white; }
        .logo-tagline { font-size: 0.65rem; color: rgba(255,255,255,0.5); }
        .sidebar-toggle { position: absolute; right: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; }
        .sidebar-nav { flex: 1; padding: 1rem 0; }
        .sidebar-link { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.2s; margin: 0.25rem 0.5rem; border-radius: 12px; background: none; border: none; width: calc(100% - 1rem); cursor: pointer; font-size: 0.9rem; }
        .sidebar-link:hover { background: rgba(124,95,230,0.2); color: white; }
        .sidebar-link.active { background: #7c5fe6; color: white; }
        .sidebar-icon { font-size: 1.25rem; min-width: 24px; text-align: center; }
        .sidebar-label { font-size: 0.85rem; white-space: nowrap; }
        .sidebar.collapsed .sidebar-label { display: none; }
        .sidebar.collapsed .sidebar-link { justify-content: center; padding: 0.75rem; }
        .sidebar-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 0.5rem 1rem; }
        .user-nav { margin-bottom: 1rem; }
        .logout-link { color: #fc8181; }
        .logout-link:hover { background: rgba(252,129,129,0.2); color: #fc8181; }
        @media (max-width: 768px) { .mobile-sidebar-toggle { display: block; } .sidebar { transform: translateX(-100%); width: 280px; } .sidebar.mobile-open { transform: translateX(0); } .sidebar-overlay { display: block; } }
      `}</style>
    </>
  );
};

// ============================================================
// STAT CARD COMPONENT
// ============================================================
const StatCard = ({ icon, label, value, color, trend }: { icon: string; label: string; value: string | number; color: string; trend?: number }) => (
  <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="stat-icon" style={{ background: `${color}20` }}>{icon}</div>
    <div className="stat-content">
      <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="stat-label">{label}</div>
      {trend !== undefined && (
        <div className={`stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  </div>
);

// ============================================================
// AI ANALYSIS MODAL
// ============================================================
const AIAnalysisModal = ({ experiment, onClose, onUpdate }: { experiment: Experiment; onClose: () => void; onUpdate: () => void }) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const runAIAnalysis = async () => {
    setLoading(true);
    
    // Simulate AI analysis - In production, call OpenAI/Gemini API
    setTimeout(() => {
      const aiAnalysis: AIAnalysis = {
        score: Math.floor(Math.random() * 50) + 50,
        risk_level: Math.random() > 0.7 ? 'medium' : 'low',
        market_potential: Math.floor(Math.random() * 50) + 50,
        recommendations: [
          'Focus on user acquisition through social media',
          'Consider a freemium pricing model',
          'Partner with local agricultural cooperatives',
          'Add offline capabilities for rural areas'
        ],
        competitor_insights: 'Main competitors are focusing on urban areas. There is an opportunity to target rural underserved markets.',
      };
      setAnalysis(aiAnalysis);
      setLoading(false);
    }, 2000);
  };

  const saveAnalysis = async () => {
    if (!analysis) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('experiments')
      .update({
        feasibility_score: analysis.score,
        result: JSON.stringify({
          risk_level: analysis.risk_level,
          market_potential: analysis.market_potential,
          competitor_insights: analysis.competitor_insights,
        }),
        recommendations: analysis.recommendations,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', experiment.id);
    
    if (!error) {
      onUpdate();
      onClose();
    }
    setSaving(false);
  };

  useEffect(() => {
    runAIAnalysis();
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>🤖 AI Analysis: {experiment.type.toUpperCase()}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="ai-loading">
              <div className="loading-spinner-small"></div>
              <p>AI is analyzing your experiment...</p>
            </div>
          ) : analysis ? (
            <div className="ai-results">
              <div className="ai-score-section">
                <div className="ai-score-circle" style={{ background: `conic-gradient(#2fd4ff 0deg ${analysis.score * 3.6}deg, #1a1a2e ${analysis.score * 3.6}deg 360deg)` }}>
                  <span>{analysis.score}%</span>
                </div>
                <div className="ai-score-details">
                  <div className="detail-item">
                    <span>Risk Level:</span>
                    <strong style={{ color: analysis.risk_level === 'low' ? '#48bb78' : analysis.risk_level === 'medium' ? '#f6c90e' : '#fc8181' }}>
                      {analysis.risk_level.toUpperCase()}
                    </strong>
                  </div>
                  <div className="detail-item">
                    <span>Market Potential:</span>
                    <strong>{analysis.market_potential}%</strong>
                  </div>
                </div>
              </div>
              <div className="ai-recommendations">
                <h4>📝 Recommendations</h4>
                <ul>
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i}>💡 {rec}</li>
                  ))}
                </ul>
              </div>
              <div className="ai-insights">
                <h4>🔍 Competitor Insights</h4>
                <p>{analysis.competitor_insights}</p>
              </div>
            </div>
          ) : (
            <div className="ai-error">Failed to run analysis. Please try again.</div>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={saveAnalysis} disabled={loading || saving || !analysis} className="btn-save">
            {saving ? 'Saving...' : 'Save Analysis Results'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CREATE EXPERIMENT MODAL
// ============================================================
const CreateExperimentModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    project_id: '',
    type: 'market' as Experiment['type'],
    hypothesis: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('projects')
          .select('id, name, description, sector')
          .eq('user_id', session.user.id);
        setProjects(data || []);
      }
    };
    fetchProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.hypothesis) {
      setError('Please select a project and enter a hypothesis');
      return;
    }
    setLoading(true);
    setError('');

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
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const experimentTypes = [
    { value: 'market', label: '📊 Market Validation', desc: 'Test if there is demand for your product' },
    { value: 'pricing', label: '💰 Pricing Test', desc: 'Find the optimal price point' },
    { value: 'feature', label: '⚙️ Feature Test', desc: 'Validate specific features' },
    { value: 'competitor', label: '🔍 Competitor Analysis', desc: 'Analyze competitive landscape' },
    { value: 'usability', label: '👥 Usability Test', desc: 'Test user experience' },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Create New Experiment</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label>Select Project *</label>
              <select value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })} required>
                <option value="">Choose a project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sector})
                  </option>
                ))}
              </select>
            </div>

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
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Experiment['type'] })}
                    />
                    <div className="type-content">
                      <div className="type-title">{type.label}</div>
                      <div className="type-desc">{type.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

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

            <div className="ai-tip">
              <span className="ai-tip-icon">🤖</span>
              <div className="ai-tip-content">
                <strong>AI Pro Tip</strong>
                <p>Experiments with clear hypotheses are 3x more likely to produce actionable insights. Be specific about your target audience and expected outcome!</p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" disabled={loading} className="btn-create">
              {loading ? 'Creating...' : 'Create Experiment →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// EXPERIMENT DETAIL MODAL
// ============================================================
const ExperimentDetailModal = ({ experiment, onClose, onUpdate }: { experiment: Experiment; onClose: () => void; onUpdate: () => void }) => {
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [result, setResult] = useState(experiment.result || '');
  const [saving, setSaving] = useState(false);

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'market': return '📊 Market Validation';
      case 'pricing': return '💰 Pricing Test';
      case 'feature': return '⚙️ Feature Test';
      case 'competitor': return '🔍 Competitor Analysis';
      case 'usability': return '👥 Usability Test';
      default: return '🧪 Experiment';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#48bb78';
    if (score >= 40) return '#f6c90e';
    return '#fc8181';
  };

  const handleSaveManual = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('experiments')
      .update({
        result,
        updated_at: new Date().toISOString(),
      })
      .eq('id', experiment.id);
    if (!error) onUpdate();
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content large">
          <div className="modal-header">
            <h3>{getTypeLabel(experiment.type)}</h3>
            <button onClick={onClose} className="modal-close">×</button>
          </div>
          <div className="modal-body">
            <div className="experiment-detail">
              <div className="detail-section">
                <label>Hypothesis</label>
                <p className="hypothesis-text">{experiment.hypothesis}</p>
              </div>
              
              <div className="detail-section">
                <label>Project</label>
                <p>{experiment.project_name || 'Unknown Project'} • {experiment.project_sector || 'No sector'}</p>
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
                      <div className="score-bar">
                        <div className="score-fill" style={{ width: `${experiment.feasibility_score}%`, background: getScoreColor(experiment.feasibility_score) }}></div>
                      </div>
                      <span className="score-value" style={{ color: getScoreColor(experiment.feasibility_score) }}>
                        {experiment.feasibility_score}%
                      </span>
                    </div>
                  </div>
                  
                  {experiment.recommendations && experiment.recommendations.length > 0 && (
                    <div className="detail-section">
                      <label>AI Recommendations</label>
                      <ul className="recommendations-list">
                        {experiment.recommendations.map((rec, i) => (
                          <li key={i}>💡 {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="detail-section">
                  <button onClick={() => setShowAIAnalysis(true)} className="btn-ai-analysis">
                    🤖 Run AI Analysis
                  </button>
                </div>
              )}

              <div className="detail-section">
                <label>Manual Results / Learnings</label>
                <textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="Document your findings, lessons learned, and next steps..."
                  rows={6}
                />
              </div>

              <div className="detail-section">
                <label>Metadata</label>
                <div className="meta-grid">
                  <div className="meta-item">
                    <span>Created:</span>
                    <strong>{new Date(experiment.created_at).toLocaleDateString()}</strong>
                  </div>
                  <div className="meta-item">
                    <span>Last Updated:</span>
                    <strong>{new Date(experiment.updated_at).toLocaleDateString()}</strong>
                  </div>
                  <div className="meta-item">
                    <span>ID:</span>
                    <code>{experiment.id.slice(0, 8)}...</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={onClose} className="btn-cancel">Close</button>
            <button onClick={handleSaveManual} disabled={saving} className="btn-save">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {showAIAnalysis && (
        <AIAnalysisModal
          experiment={experiment}
          onClose={() => setShowAIAnalysis(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

// ============================================================
// MAIN EXPERIMENTS COMPONENT
// ============================================================
const Experiments = () => {
  const [loading, setLoading] = useState(true);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [filteredExperiments, setFilteredExperiments] = useState<Experiment[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    active: 0,
    avgScore: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);

  const fetchExperiments = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('experiments')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    // Get project details for each experiment
    const experimentsWithProjects = await Promise.all(
      (data || []).map(async (exp) => {
        const { data: projectData } = await supabase
          .from('projects')
          .select('name, sector')
          .eq('id', exp.project_id)
          .single();
        return { 
          ...exp, 
          project_name: projectData?.name || 'Unknown',
          project_sector: projectData?.sector || 'Unknown',
        };
      })
    );

    setExperiments(experimentsWithProjects);
    
    // Calculate stats
    const completed = experimentsWithProjects.filter(e => e.status === 'completed').length;
    const active = experimentsWithProjects.filter(e => e.status === 'active').length;
    const scores = experimentsWithProjects.filter(e => e.feasibility_score).map(e => e.feasibility_score);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    
    setStats({
      total: experimentsWithProjects.length,
      completed,
      active,
      avgScore,
    });
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  // Filter experiments
  useEffect(() => {
    let filtered = [...experiments];
    
    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.hypothesis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => e.type === typeFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }
    
    setFilteredExperiments(filtered);
  }, [searchTerm, typeFilter, statusFilter, experiments]);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'market': return '📊';
      case 'pricing': return '💰';
      case 'feature': return '⚙️';
      case 'competitor': return '🔍';
      case 'usability': return '👥';
      default: return '🧪';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return '🟢';
      case 'completed': return '✅';
      case 'draft': return '📝';
      case 'archived': return '📦';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="experiments-container">
        <Sidebar />
        <main className="experiments-main">
          <div className="loading-spinner"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="experiments-container">
      <Sidebar />
      
      <main className="experiments-main">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1>Experiments Lab</h1>
            <p>Validate your ideas with AI-powered experiments</p>
          </div>
          <div className="header-right">
            <button onClick={() => setShowCreateModal(true)} className="btn-create">
              + New Experiment
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <StatCard icon="🧪" label="Total Experiments" value={stats.total} color="#7c5fe6" />
          <StatCard icon="✅" label="Completed" value={stats.completed} color="#48bb78" />
          <StatCard icon="🟢" label="Active" value={stats.active} color="#2fd4ff" />
          <StatCard icon="📊" label="Avg AI Score" value={`${stats.avgScore}%`} color="#f6c90e" />
        </div>

        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search experiments by hypothesis or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filters">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="market">📊 Market</option>
              <option value="pricing">💰 Pricing</option>
              <option value="feature">⚙️ Feature</option>
              <option value="competitor">🔍 Competitor</option>
              <option value="usability">👥 Usability</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Experiments Grid */}
        {filteredExperiments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧪</div>
            <h3>No experiments found</h3>
            <p>Create your first experiment to start validating your ideas</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-create-empty">
              + Create Experiment
            </button>
          </div>
        ) : (
          <div className="experiments-grid">
            {filteredExperiments.map((exp) => (
              <div key={exp.id} className="experiment-card" onClick={() => setSelectedExperiment(exp)}>
                <div className="experiment-header">
                  <div className="experiment-icon">{getTypeIcon(exp.type)}</div>
                  <div className="experiment-status">{getStatusIcon(exp.status)}</div>
                </div>
                <div className="experiment-content">
                  <h3 className="experiment-hypothesis">
                    {exp.hypothesis.length > 100 ? `${exp.hypothesis.substring(0, 100)}...` : exp.hypothesis}
                  </h3>
                  <div className="experiment-meta">
                    <span className="experiment-project">📁 {exp.project_name}</span>
                    <span className="experiment-date">📅 {new Date(exp.created_at).toLocaleDateString()}</span>
                  </div>
                  {exp.feasibility_score ? (
                    <div className="experiment-score">
                      <div className="score-bar-small">
                        <div className="score-fill-small" style={{ width: `${exp.feasibility_score}%` }}></div>
                      </div>
                      <span className="score-value-small">{exp.feasibility_score}%</span>
                    </div>
                  ) : (
                    <div className="experiment-pending">🤖 Pending AI Analysis</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateExperimentModal
            onClose={() => setShowCreateModal(false)}
            onCreated={fetchExperiments}
          />
        )}

        {selectedExperiment && (
          <ExperimentDetailModal
            experiment={selectedExperiment}
            onClose={() => setSelectedExperiment(null)}
            onUpdate={fetchExperiments}
          />
        )}
      </main>

      <style>{`
        .experiments-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        
        .experiments-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .experiments-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
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
        
        .loading-spinner-small {
          width: 30px;
          height: 30px;
          border: 2px solid rgba(124,95,230,0.3);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .page-header h1 {
          font-size: 2rem;
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
          color: #0a0d1a;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-create:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(124,95,230,0.4);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        @media (max-width: 1000px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        .stat-card {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          background: rgba(0,0,0,0.5);
        }
        
        .stat-icon {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        
        .stat-value {
          font-size: 1.2rem;
          font-weight: 700;
        }
        
        .stat-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .stat-trend {
          font-size: 0.6rem;
          margin-top: 0.2rem;
        }
        
        .stat-trend.positive { color: #48bb78; }
        .stat-trend.negative { color: #fc8181; }
        
        .search-filter-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        
        .search-wrapper {
          flex: 2;
          position: relative;
        }
        
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.5);
        }
        
        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          color: white;
        }
        
        .filters {
          display: flex;
          gap: 0.5rem;
        }
        
        .filters select {
          padding: 0.75rem 1rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          color: white;
        }
        
        .experiments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1rem;
        }
        
        .experiment-card {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .experiment-card:hover {
          transform: translateY(-2px);
          background: rgba(0,0,0,0.5);
          border-color: rgba(124,95,230,0.3);
        }
        
        .experiment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .experiment-icon {
          font-size: 1.5rem;
        }
        
        .experiment-status {
          font-size: 0.8rem;
        }
        
        .experiment-hypothesis {
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }
        
        .experiment-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
          margin-bottom: 0.75rem;
        }
        
        .experiment-score {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .score-bar-small {
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .score-fill-small {
          height: 100%;
          background: linear-gradient(90deg, #7c5fe6, #2fd4ff);
          border-radius: 2px;
        }
        
        .score-value-small {
          font-size: 0.7rem;
          font-weight: 600;
          color: #2fd4ff;
        }
        
        .experiment-pending {
          font-size: 0.7rem;
          color: #f6c90e;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(0,0,0,0.3);
          border-radius: 20px;
        }
        
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .btn-create-empty {
          margin-top: 1rem;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 30px;
          color: #0a0d1a;
          cursor: pointer;
        }
        
        /* Modal Styles */
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
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-content.large {
          max-width: 700px;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .modal-close {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
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
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.8);
        }
        
        .form-group input, .form-group textarea, .form-group select {
          width: 100%;
          padding: 0.75rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        
        .experiment-types {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .type-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .type-option.selected {
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
        }
        
        .type-option input {
          width: auto;
        }
        
        .type-title {
          font-weight: 500;
          font-size: 0.85rem;
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
          border-radius: 12px;
          padding: 0.75rem;
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        
        .ai-tip-icon {
          font-size: 1.2rem;
        }
        
        .ai-tip-content strong {
          display: block;
          font-size: 0.75rem;
          color: #2fd4ff;
          margin-bottom: 0.25rem;
        }
        
        .ai-tip-content p {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.7);
        }
        
        .error-message {
          background: rgba(252,129,129,0.2);
          border: 1px solid rgba(252,129,129,0.3);
          border-radius: 8px;
          padding: 0.5rem;
          margin-bottom: 1rem;
          color: #fc8181;
          font-size: 0.8rem;
        }
        
        .btn-cancel, .btn-create, .btn-save {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-cancel {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .btn-create, .btn-save {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          font-weight: 600;
        }
        
        .btn-create:hover, .btn-save:hover {
          transform: translateY(-1px);
        }
        
        .btn-ai-analysis {
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          border-radius: 8px;
          color: #0a0d1a;
          font-weight: 600;
          cursor: pointer;
        }
        
        .detail-section {
          margin-bottom: 1.25rem;
        }
        
        .detail-section label {
          display: block;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.25rem;
        }
        
        .hypothesis-text {
          font-size: 0.85rem;
          line-height: 1.5;
          background: rgba(0,0,0,0.3);
          padding: 0.75rem;
          border-radius: 8px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
        }
        
        .status-active { background: rgba(47,212,255,0.2); color: #2fd4ff; }
        .status-completed { background: rgba(72,187,120,0.2); color: #48bb78; }
        .status-draft { background: rgba(246,201,14,0.2); color: #f6c90e; }
        .status-archived { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
        
        .score-display {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .score-bar {
          flex: 1;
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .score-fill {
          height: 100%;
          border-radius: 4px;
        }
        
        .recommendations-list {
          padding-left: 1.2rem;
          margin: 0;
        }
        
        .recommendations-list li {
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
          color: rgba(255,255,255,0.8);
        }
        
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        
        .meta-item {
          display: flex;
          gap: 0.5rem;
          font-size: 0.7rem;
        }
        
        .meta-item code {
          background: rgba(0,0,0,0.5);
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
        }
        
        .ai-loading {
          text-align: center;
          padding: 2rem;
        }
        
        .ai-results {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .ai-score-section {
          display: flex;
          align-items: center;
          gap: 2rem;
          justify-content: center;
        }
        
        .ai-score-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .ai-score-circle span {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }
        
        .ai-score-details {
          flex: 1;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .ai-recommendations h4, .ai-insights h4 {
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        
        .ai-error {
          text-align: center;
          color: #fc8181;
          padding: 1rem;
        }
      `}</style>
    </div>
  );
};

export default Experiments;