// C:\Users\user\maylet-xlab\src\app\routes\AIAnalyze.tsx
// PROFESSIONAL AI IDEA ANALYZER – Get feasibility score, market insights, and recommendations

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface AnalysisResult {
  score: number;
  risk_level: 'low' | 'medium' | 'high';
  market_potential: number;
  recommendations: string[];
  competitor_insights: string;
  summary: string;
}

// ============================================================
// SIDEBAR (consistent with other pages)
// ============================================================
const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const mainMenu = [
    { icon: '📊', label: 'Dashboard', route: '/dashboard' },
    { icon: '📁', label: 'Projects', route: '/projects' },
    { icon: '🧪', label: 'Experiments', route: '/experiments' },
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
// AI ANALYZE PAGE
// ============================================================
const AIAnalyze = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [formData, setFormData] = useState({
    ideaName: '',
    description: '',
    targetAudience: '',
    industry: '',
  });
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login');
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ideaName || !formData.description) {
      setError('Please fill in at least the idea name and description');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get API key from environment
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) throw new Error('Missing OpenRouter API key. Please add VITE_OPENROUTER_API_KEY to .env');

      const prompt = `
You are an expert innovation advisor. Analyze the following startup idea:

Idea Name: ${formData.ideaName}
Description: ${formData.description}
Target Audience: ${formData.targetAudience || 'Not specified'}
Industry: ${formData.industry || 'Not specified'}

Return a JSON object with exactly these fields:
- score (number 0-100)
- risk_level (string: "low", "medium", or "high")
- market_potential (number 0-100)
- recommendations (array of 3-5 strings)
- competitor_insights (string, 1-2 sentences)
- summary (string, 2-3 sentences)

Only output valid JSON. No extra text.
      `;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1:free',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content) as AnalysisResult;
      setResult(parsed);

      // Save analysis to Supabase (optional)
      if (userId) {
        await supabase.from('ai_analyses').insert({
          user_id: userId,
          idea_name: formData.ideaName,
          description: formData.description,
          result: parsed,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze idea');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#48bb78';
    if (score >= 40) return '#f6c90e';
    return '#fc8181';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#48bb78';
      case 'medium': return '#f6c90e';
      case 'high': return '#fc8181';
      default: return '#fff';
    }
  };

  return (
    <div className="ai-analyze-container">
      <Sidebar />
      <main className="ai-analyze-main">
        <div className="ai-analyze-header">
          <h1>🤖 AI Idea Analyzer</h1>
          <p>Get instant feasibility scores, market insights, and AI‑powered recommendations</p>
        </div>

        <div className="ai-analyze-layout">
          {/* Input Form */}
          <div className="input-card">
            <h2>Describe Your Idea</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Idea Name *</label>
                <input
                  type="text"
                  placeholder="e.g., AI-Powered Precision Farming"
                  value={formData.ideaName}
                  onChange={(e) => setFormData({ ...formData, ideaName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  placeholder="What problem does it solve? How does it work?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Target Audience</label>
                  <input
                    type="text"
                    placeholder="e.g., Smallholder farmers in East Africa"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <input
                    type="text"
                    placeholder="e.g., AgriTech, HealthTech, FinTech"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="analyze-btn">
                {loading ? 'Analyzing...' : '🚀 Analyze Idea'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="results-card">
            <h2>Analysis Results</h2>
            {error && <div className="error-message">{error}</div>}
            {loading && <div className="loading-state"><div className="spinner"></div><p>AI is analyzing your idea...</p></div>}
            {result && (
              <div className="results-content">
                <div className="score-section">
                  <div className="score-circle" style={{ background: `conic-gradient(${getScoreColor(result.score)} 0deg ${result.score * 3.6}deg, rgba(255,255,255,0.1) ${result.score * 3.6}deg 360deg)` }}>
                    <span>{result.score}%</span>
                  </div>
                  <div className="score-details">
                    <div className="detail-item"><span>Risk Level:</span><strong style={{ color: getRiskColor(result.risk_level) }}>{result.risk_level.toUpperCase()}</strong></div>
                    <div className="detail-item"><span>Market Potential:</span><strong>{result.market_potential}%</strong></div>
                  </div>
                </div>
                <div className="summary">
                  <h4>📋 Summary</h4>
                  <p>{result.summary}</p>
                </div>
                <div className="recommendations">
                  <h4>💡 Recommendations</h4>
                  <ul>
                    {result.recommendations.map((rec, i) => <li key={i}>✓ {rec}</li>)}
                  </ul>
                </div>
                <div className="competitor-insights">
                  <h4>🔍 Competitor Insights</h4>
                  <p>{result.competitor_insights}</p>
                </div>
              </div>
            )}
            {!loading && !result && !error && (
              <div className="placeholder">
                <div className="placeholder-icon">🤖</div>
                <p>Enter your idea details and click "Analyze Idea" to get AI‑powered insights.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .ai-analyze-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .ai-analyze-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .ai-analyze-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .ai-analyze-header {
          margin-bottom: 2rem;
        }
        .ai-analyze-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .ai-analyze-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 1000px) {
          .ai-analyze-layout {
            grid-template-columns: 1fr;
          }
        }
        .input-card, .results-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 1.5rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .form-group input, .form-group textarea {
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
        .analyze-btn {
          width: 100%;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.75rem;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        .error-message {
          background: rgba(252,129,129,0.2);
          border: 1px solid #fc8181;
          border-radius: 12px;
          padding: 0.75rem;
          color: #fc8181;
          margin-bottom: 1rem;
        }
        .loading-state {
          text-align: center;
          padding: 2rem;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(124,95,230,0.3);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        .results-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .score-section {
          display: flex;
          align-items: center;
          gap: 2rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .score-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .score-circle span {
          font-size: 1.8rem;
          font-weight: 700;
          color: white;
        }
        .score-details {
          flex: 1;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .summary, .recommendations, .competitor-insights {
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          padding: 1rem;
        }
        .recommendations ul {
          padding-left: 1.2rem;
          margin: 0;
        }
        .placeholder {
          text-align: center;
          padding: 2rem;
          color: rgba(255,255,255,0.6);
        }
        .placeholder-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIAnalyze;