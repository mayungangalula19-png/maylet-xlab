// C:\Users\user\maylet-xlab\src\app\routes\CreateProject.tsx
// FULL CREATE PROJECT PAGE - CREATE NEW INNOVATION PROJECT
// WITH SUPABASE CONNECTION, VALIDATION, AND REAL-TIME UPDATES

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface ProjectFormData {
  name: string;
  description: string;
  sector: string;
  status: 'Idea' | 'Experiment' | 'Prototype' | 'Launched';
  progress: number;
  visibility: 'private' | 'public' | 'team_only';
  budget_used: number;
  budget_total: number;
  tech_stack: string[];
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
    { icon: '📁', label: 'Projects', route: '/projects', active: true },
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
// TECH STACK MANAGER COMPONENT
// ============================================================
const TechStackManager = ({ techStack, onUpdate }: { techStack: string[]; onUpdate: (newStack: string[]) => void }) => {
  const [newTech, setNewTech] = useState('');
  
  const availableTech = [
    'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Python', 'Django',
    'Flask', 'FastAPI', 'Supabase', 'Firebase', 'MongoDB', 'PostgreSQL', 
    'MySQL', 'Redis', 'TensorFlow', 'PyTorch', 'OpenAI', 'Gemini',
    'Arduino', 'Raspberry Pi', 'ESP32', 'MQTT', 'LoRaWAN',
    'Flutter', 'React Native', 'Swift', 'Kotlin', 'Tailwind CSS', 
    'TypeScript', 'JavaScript', 'Go', 'Rust', 'Kubernetes', 'Docker', 'AWS', 'Azure'
  ];

  const addTech = () => {
    if (newTech && !techStack.includes(newTech)) {
      onUpdate([...techStack, newTech]);
      setNewTech('');
    }
  };

  const removeTech = (tech: string) => {
    onUpdate(techStack.filter(t => t !== tech));
  };

  return (
    <div className="tech-stack-manager">
      <label>Tech Stack</label>
      <div className="tech-tags">
        {techStack.length === 0 ? (
          <span className="tech-empty">No technologies added yet</span>
        ) : (
          techStack.map((tech) => (
            <span key={tech} className="tech-tag">
              {tech}
              <button type="button" onClick={() => removeTech(tech)} className="remove-tech">×</button>
            </span>
          ))
        )}
      </div>
      <div className="add-tech">
        <select value={newTech} onChange={(e) => setNewTech(e.target.value)}>
          <option value="">Select technology...</option>
          {availableTech.filter(t => !techStack.includes(t)).map((tech) => (
            <option key={tech} value={tech}>{tech}</option>
          ))}
        </select>
        <button type="button" onClick={addTech} className="btn-add-tech">+ Add</button>
      </div>
    </div>
  );
};

// ============================================================
// MAIN CREATE PROJECT COMPONENT
// ============================================================
const CreateProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    sector: 'Agriculture',
    status: 'Idea',
    progress: 0,
    visibility: 'private',
    budget_used: 0,
    budget_total: 0,
    tech_stack: [],
  });

  // Sector options
  const sectors = [
    'Agriculture', 'Health', 'Education', 'FinTech', 
    'Environment', 'Blockchain', 'AI/ML', 'IoT', 
    'E-commerce', 'Logistics', 'Tourism', 'Cybersecurity', 'Gaming', 'Other'
  ];

  // Status options
  const statuses = ['Idea', 'Experiment', 'Prototype', 'Launched'];

  // Get user info
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Innovator');
      } else {
        navigate('/login');
      }
    };
    getUser();
  }, [navigate]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle number input
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  // Handle progress slider
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }));
  };

  // Handle tech stack update
  const handleTechStackUpdate = (newStack: string[]) => {
    setFormData(prev => ({ ...prev, tech_stack: newStack }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate form
    if (!formData.name.trim()) {
      setError('Project name is required');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Project description is required');
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to create a project');
        setLoading(false);
        return;
      }

      // Insert into Supabase
      const { error: supabaseError } = await supabase

        .from('projects')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            sector: formData.sector,
            status: formData.status,
            progress: formData.progress,
            visibility: formData.visibility,
            budget_used: formData.budget_used,
            budget_total: formData.budget_total,
            tech_stack: formData.tech_stack,
            user_id: session.user.id,
            team_size: 1,
            tasks_completed: 0,
            tasks_total: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])
        .select();

      if (supabaseError) throw supabaseError;

      // Log activity
      await supabase.from('activities').insert([
        {
          user_id: session.user.id,
          user_name: userName,
          user_email: session.user.email,
          action: 'created a new project',
          target_type: 'project',
          target_name: formData.name,
          created_at: new Date().toISOString(),
        }
      ]);

      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/projects');
      }, 2000);

    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
      setLoading(false);
    }
  };

  // Calculate budget percentage
  const budgetPercentage = formData.budget_total > 0 
    ? Math.round((formData.budget_used / formData.budget_total) * 100) 
    : 0;

  return (
    <div className="create-project-container">
      <Sidebar />
      
      <main className="create-project-main">
        {/* Header */}
        <div className="create-header">
          <Link to="/projects" className="back-link">
            ← Back to Projects
          </Link>
          <h1>Create New Project</h1>
          <p>Fill in the details below to start your innovation journey</p>
        </div>

        {/* Form Card */}
        <div className="form-card">
          {/* Success Message */}
          {success && (
            <div className="success-message">
              <span>✅</span> Project created successfully! Redirecting to projects...
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Project Name */}
            <div className="form-group">
              <label htmlFor="name">
                Project Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., AI Smart Farming System"
                required
              />
              <p className="hint">Use a clear, descriptive name for your project</p>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what problem your project solves and how it works..."
                rows={5}
                required
              />
              <p className="hint">Be specific about the problem, solution, and target audience</p>
            </div>

            {/* Sector and Status - Two Columns */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sector">Sector / Industry</label>
                <select
                  id="sector"
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                >
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status">Project Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'Idea' && '💡 Idea'}
                      {status === 'Experiment' && '🧪 Experiment'}
                      {status === 'Prototype' && '📦 Prototype'}
                      {status === 'Launched' && '🚀 Launched'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visibility and Progress */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="visibility">Visibility</label>
                <select
                  id="visibility"
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                >
                  <option value="private">🔒 Private - Only me</option>
                  <option value="team_only">👥 Team Only - My team members</option>
                  <option value="public">🌍 Public - Everyone can see</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="progress">Initial Progress: {formData.progress}%</label>
                <input
                  type="range"
                  id="progress"
                  name="progress"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.progress}
                  onChange={handleProgressChange}
                />
                <div className="progress-hint">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Budget Section */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="budget_used">Budget Used ($)</label>
                <input
                  type="number"
                  id="budget_used"
                  name="budget_used"
                  value={formData.budget_used}
                  onChange={handleNumberChange}
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="budget_total">Total Budget ($)</label>
                <input
                  type="number"
                  id="budget_total"
                  name="budget_total"
                  value={formData.budget_total}
                  onChange={handleNumberChange}
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            {/* Budget Progress Bar */}
            {formData.budget_total > 0 && (
              <div className="budget-progress">
                <div className="budget-label">
                  <span>Budget Usage</span>
                  <span>{budgetPercentage}% (${formData.budget_used.toLocaleString()} of ${formData.budget_total.toLocaleString()})</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${budgetPercentage > 90 ? 'budget-warning' : ''}`}
                    style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                  ></div>
                </div>
                {budgetPercentage > 90 && (
                  <p className="budget-warning-text">⚠️ Budget is almost used up! Consider requesting additional funding.</p>
                )}
              </div>
            )}

            {/* Tech Stack Manager */}
            <TechStackManager 
              techStack={formData.tech_stack} 
              onUpdate={handleTechStackUpdate} 
            />

            {/* AI Tip Section */}
            <div className="ai-tip-card">
              <div className="ai-tip-icon">🤖</div>
              <div className="ai-tip-content">
                <strong>AI Pro Tip</strong>
                <p>Projects with complete tech stacks and clear budgets are 2x more likely to attract investors. Keep your information up to date!</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <Link to="/projects" className="btn-cancel">
                Cancel
              </Link>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Project →'}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Tips */}
        <div className="quick-tips">
          <h3>📌 Quick Tips for a Great Project</h3>
          <ul>
            <li>💡 Use a clear, memorable project name</li>
            <li>📝 Describe the problem you're solving</li>
            <li>🎯 Identify your target audience</li>
            <li>🔧 List key features and technologies</li>
            <li>📈 Set realistic milestones</li>
            <li>💰 Be transparent about your budget</li>
          </ul>
        </div>
      </main>

      <style>{`
        .create-project-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        
        .create-project-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .create-project-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        
        /* Header */
        .create-header {
          margin-bottom: 2rem;
        }
        
        .back-link {
          color: #7c5fe6;
          text-decoration: none;
          font-size: 0.9rem;
          display: inline-block;
          margin-bottom: 1rem;
        }
        
        .back-link:hover {
          text-decoration: underline;
        }
        
        .create-header h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 0.5rem;
        }
        
        .create-header p {
          color: rgba(255,255,255,0.6);
        }
        
        /* Form Card */
        .form-card {
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 2rem;
        }
        
        .success-message {
          background: rgba(72,187,120,0.2);
          border: 1px solid rgba(72,187,120,0.3);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          color: #48bb78;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .error-message {
          background: rgba(252,129,129,0.2);
          border: 1px solid rgba(252,129,129,0.3);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          color: #fc8181;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.8);
        }
        
        .required {
          color: #fc8181;
        }
        
        .hint {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
          margin-top: 0.25rem;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #7c5fe6;
        }
        
        .form-group input[type="range"] {
          padding: 0;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        
        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        
        .progress-hint {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
        }
        
        /* Budget Progress */
        .budget-progress {
          margin-bottom: 1.5rem;
        }
        
        .budget-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          margin-bottom: 0.25rem;
        }
        
        .progress-bar {
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #48bb78, #38a169);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .budget-warning {
          background: linear-gradient(90deg, #f6c90e, #ecc30b);
        }
        
        .budget-warning-text {
          font-size: 0.7rem;
          color: #f6c90e;
          margin-top: 0.5rem;
        }
        
        /* Tech Stack Manager */
        .tech-stack-manager {
          margin-bottom: 1.5rem;
        }
        
        .tech-stack-manager label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.8);
        }
        
        .tech-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          min-height: 45px;
        }
        
        .tech-tag {
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 20px;
          padding: 0.3rem 0.75rem;
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .tech-empty {
          color: rgba(255,255,255,0.4);
          font-size: 0.8rem;
          padding: 0.3rem 0;
        }
        
        .remove-tech {
          background: none;
          border: none;
          color: #fc8181;
          cursor: pointer;
          font-size: 1rem;
          padding: 0;
          margin-left: 0.25rem;
        }
        
        .add-tech {
          display: flex;
          gap: 0.5rem;
        }
        
        .add-tech select {
          flex: 1;
          padding: 0.6rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: white;
        }
        
        .btn-add-tech {
          padding: 0.6rem 1.2rem;
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 10px;
          color: #7c5fe6;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-add-tech:hover {
          background: rgba(124,95,230,0.3);
        }
        
        /* AI Tip Card */
        .ai-tip-card {
          background: linear-gradient(135deg, rgba(124,95,230,0.15), rgba(47,212,255,0.08));
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .ai-tip-icon {
          font-size: 2rem;
        }
        
        .ai-tip-content strong {
          display: block;
          color: #2fd4ff;
          margin-bottom: 0.25rem;
        }
        
        .ai-tip-content p {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
        }
        
        /* Form Actions */
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
        
        .btn-cancel {
          padding: 0.75rem 1.5rem;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 40px;
          color: white;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .btn-cancel:hover {
          background: rgba(255,255,255,0.2);
        }
        
        .btn-submit {
          padding: 0.75rem 2rem;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          border-radius: 40px;
          color: #0a0d1a;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124,95,230,0.4);
        }
        
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Quick Tips */
        .quick-tips {
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          padding: 1rem 1.5rem;
        }
        
        .quick-tips h3 {
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }
        
        .quick-tips ul {
          list-style: none;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.5rem;
        }
        
        .quick-tips li {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
        }
      `}</style>
    </div>
  );
};

export default CreateProject;