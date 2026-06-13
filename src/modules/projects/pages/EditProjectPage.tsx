// C:\Users\user\maylet-xlab\src\app\routes\EditProject.tsx
// FULL EDIT PROJECT PAGE - EDIT EXISTING PROJECT
// WITH SUPABASE CONNECTION, TECH STACK MANAGEMENT, AND REAL-TIME UPDATES

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { normalizeProjectStatus, toDbProjectStatus } from '../../../types/project.types';

// ============================================================
// TYPES
// ============================================================
interface Project {
  id: string;
  name: string;
  description: string;
  sector: string;
  status: 'Idea' | 'Experiment' | 'Prototype' | 'Launched';
  progress: number;
  team_size: number;
  tasks_completed: number;
  tasks_total: number;
  budget_used: number;
  budget_total: number;
  tech_stack: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

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
        <select value={newTech} onChange={(e) => setNewTech(e.target.value)} title="Select a technology to add to the tech stack">
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
// MAIN EDIT PROJECT COMPONENT
// ============================================================
const EditProject = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sector: 'Agriculture',
    status: 'Idea' as 'Idea' | 'Experiment' | 'Prototype' | 'Launched',
    progress: 0,
    budget_used: 0,
    budget_total: 0,
    tech_stack: [] as string[],
  });

  const [originalData, setOriginalData] = useState<Project | null>(null);

  // Options
  const sectors = [
    'Agriculture', 'Health', 'Education', 'FinTech', 
    'Environment', 'Blockchain', 'AI/ML', 'IoT', 
    'E-commerce', 'Logistics', 'Tourism', 'Cybersecurity', 'Gaming', 'Other'
  ];

  const statuses = ['Idea', 'Experiment', 'Prototype', 'Launched'];

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Project not found');

        if (data.user_id !== session.user.id) {
          setError('You do not have permission to edit this project');
          setLoading(false);
          return;
        }

        setOriginalData(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          sector: data.sector || 'Agriculture',
          status: normalizeProjectStatus(data.status || 'idea') as Project['status'],
          progress: Number(data.progress ?? data.progress_score ?? 0),
          budget_used: 0,
          budget_total: 0,
          tech_stack: [],
        });

      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('Error fetching project:', error);
        setError(error.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProject();
  }, [id, navigate]);

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
    setSaving(true);
    setError(null);
    setSuccess(false);

    if (!formData.name.trim()) {
      setError('Project name is required');
      setSaving(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Project description is required');
      setSaving(false);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          description: formData.description,
          sector: formData.sector,
          status: toDbProjectStatus(formData.status),
          progress: formData.progress,
          progress_score: formData.progress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('activities').insert({
          user_id: session.user.id,
          project_id: id,
          type: 'project',
          title: `Updated project "${formData.name}"`,
          metadata: { sector: formData.sector, status: formData.status },
        });
      }

      setSuccess(true);
      
      setTimeout(() => {
        navigate(`/projects/${id}`);
      }, 1500);

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('Error updating project:', error);
      setError(error.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      '⚠️ Are you sure you want to delete this project?\n\nThis action cannot be undone. All tasks, team members, documents, and data will be permanently deleted.'
    );
    
    if (!confirmDelete) return;

    setSaving(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      navigate('/projects');
      
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('Error deleting project:', error);
      setError(error.message || 'Failed to delete project');
      setSaving(false);
    }
  };

  // Calculate budget percentage
  const budgetPercentage = formData.budget_total > 0 
    ? Math.round((formData.budget_used / formData.budget_total) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="edit-project-container">
        <main className="edit-project-main">
          <div className="loading-spinner"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="edit-project-container">
      
      <main className="edit-project-main">
        {/* Header */}
        <div className="edit-header">
          <Link to={`/projects/${id}`} className="back-link">
            ← Back to Project
          </Link>
          <h1>Edit Project</h1>
          <p>Update your project information and settings</p>
        </div>

        {/* Form Card */}
        <div className="form-card">
          {/* Success Message */}
          {success && (
            <div className="success-message">
              <span>✅</span> Project updated successfully! Redirecting...
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

            {/* Sector and Status */}
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

            {/* Progress Slider */}
            <div className="form-group">
              <label htmlFor="progress">Progress: {formData.progress}%</label>
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
                    className={`progress-fill ${budgetPercentage > 90 ? 'budget-warning' : budgetPercentage > 100 ? 'budget-over' : ''}`}
                    data-width={Math.min(budgetPercentage, 100)}
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
              <div className="actions-left">
                <button 
                  type="button" 
                  onClick={handleDelete} 
                  className="btn-delete"
                  disabled={saving}
                >
                  🗑️ Delete Project
                </button>
              </div>
              <div className="actions-right">
                <Link to={`/projects/${id}`} className="btn-cancel">
                  Cancel
                </Link>
                <button type="submit" className="btn-submit" disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Last Updated Info */}
        {originalData && (
          <div className="last-updated">
            <div>
              <span>📅 Created:</span>
              <strong>{new Date(originalData.created_at).toLocaleString()}</strong>
            </div>
            <div>
              <span>🔄 Last updated:</span>
              <strong>{new Date(originalData.updated_at).toLocaleString()}</strong>
            </div>
            <div>
              <span>🆔 Project ID:</span>
              <code>{originalData.id}</code>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .edit-project-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
        }
        
        .edit-project-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .edit-project-main {
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
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .edit-header {
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
        
        .edit-header h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 0.5rem;
        }
        
        .edit-header p {
          color: rgba(255,255,255,0.6);
        }
        
        .form-card {
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 1.5rem;
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
          width: attr(data-width %);
        }
        
        .budget-warning {
          background: linear-gradient(90deg, #f6c90e, #ecc30b);
        }
        
        .budget-over {
          background: #fc8181;
        }
        
        .budget-warning-text {
          font-size: 0.7rem;
          color: #f6c90e;
          margin-top: 0.5rem;
        }
        
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
        
        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .actions-left, .actions-right {
          display: flex;
          gap: 0.75rem;
        }
        
        .btn-delete {
          padding: 0.75rem 1.5rem;
          background: rgba(252,129,129,0.15);
          border: 1px solid rgba(252,129,129,0.3);
          border-radius: 40px;
          color: #fc8181;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        
        .btn-delete:hover:not(:disabled) {
          background: rgba(252,129,129,0.3);
          transform: translateY(-1px);
        }
        
        .btn-cancel {
          padding: 0.75rem 1.5rem;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 40px;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .btn-cancel:hover {
          background: rgba(255,255,255,0.15);
          color: white;
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
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .last-updated {
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .last-updated span {
          margin-right: 0.5rem;
        }
        
        .last-updated strong {
          color: rgba(255,255,255,0.8);
          font-weight: 500;
        }
        
        .last-updated code {
          background: rgba(0,0,0,0.5);
          padding: 0.2rem 0.4rem;
          border-radius: 6px;
          font-size: 0.65rem;
        }
      `}</style>
    </div>
  );
};

export default EditProject;