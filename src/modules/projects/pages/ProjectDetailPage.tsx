// C:\Users\user\maylet-xlab\src\app\routes\ProjectDetail.tsx
// FULL PROJECT DETAIL PAGE - COMPLETE PROJECT CONTROL CENTER
// WITH TABS: OVERVIEW, TASKS, TEAM, DOCUMENTS, AI LAB, FUNDING, SETTINGS

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { buildProjectUpdate, fetchTeamMembersForProject } from '../../../lib/supabase/dbHelpers';
import { normalizeProjectStatus } from '../../../types/project.types';

// ============================================================
// TYPES
// ============================================================
interface Project {
  id: string;
  name: string;
  description: string;
  sector: string;
  progress: number;
  status: 'Idea' | 'Experiment' | 'Prototype' | 'Launched';
  created_at: string;
  updated_at: string;
  user_id: string;
  team_size: number;
  tasks_completed: number;
  tasks_total: number;
  budget_used?: number;
  budget_total?: number;
  tech_stack?: string[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  assigned_to: string;
  assigned_to_name?: string;
  due_date: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  project_id: string;
  role: 'admin' | 'developer' | 'designer' | 'marketer' | 'viewer';
  full_name: string;
  email: string;
  avatar?: string;
  joined_at: string;
}

interface Document {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  size: number;
  uploaded_by: string;
  uploaded_by_name: string;
  created_at: string;
}

interface AIAnalysis {
  id: string;
  score: number;
  risk_level: 'low' | 'medium' | 'high';
  recommendations: string[];
  market_fit: number;
  competitor_analysis: string;
  created_at: string;
}

interface FundingPitch {
  id: string;
  amount: number;
  equity: number;
  description: string;
  status: 'draft' | 'submitted' | 'funded' | 'rejected';
  investor_name?: string;
  created_at: string;
}

// ============================================================
// TABS COMPONENT
// ============================================================
const Tabs = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'ai-lab', label: 'AI Lab', icon: '🤖' },
    { id: 'funding', label: 'Funding', icon: '💰' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="tabs-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// ============================================================
// OVERVIEW TAB
// ============================================================
const OverviewTab = ({ project, stats }: { project: Project; stats: any }) => {
  const getSectorIcon = (sector: string) => {
    if (sector.includes('Agri')) return '🌾';
    if (sector.includes('Blockchain')) return '🔗';
    if (sector.includes('Health')) return '🏥';
    if (sector.includes('Education')) return '📚';
    if (sector.includes('Environment')) return '🌍';
    return '💡';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Idea': return '#f6c90e';
      case 'Experiment': return '#2fd4ff';
      case 'Prototype': return '#7c5fe6';
      case 'Launched': return '#48bb78';
      default: return '#888';
    }
  };

  const budgetPercentage = project.budget_total && project.budget_total > 0 
    ? Math.round((project.budget_used || 0) / project.budget_total * 100) 
    : 0;

  return (
    <div className="overview-tab">
      {/* Project Header */}
      <div className="project-header-card">
        <div className="project-icon-large">{getSectorIcon(project.sector)}</div>
        <div className="project-info-large">
          <h2>{project.name}</h2>
          <p className="project-sector">{project.sector}</p>
          <span className="status-badge" style={{ background: getStatusColor(project.status) }}>
            {project.status}
          </span>
        </div>
        <div className="project-actions-header">
          <Link to={`/research/${project.id}`} className="btn-edit-header">🔬 Research</Link>
          <Link to={`/research/${project.id}?tab=gate`} className="btn-edit-header">🚦 Gate</Link>
          <Link to={`/projects/${project.id}/edit`} className="btn-edit-header">✏️ Edit</Link>
          <Link to={`/experiments/new?projectId=${project.id}`} className="btn-experiment-header">🧪 Run Experiment</Link>
        </div>
      </div>

      {/* Description */}
      <div className="info-card">
        <h3>📝 Description</h3>
        <p>{project.description}</p>
      </div>

      {/* Progress Section */}
      <div className="info-card">
        <h3>📈 Progress</h3>
        <div className="progress-section">
          <div className="progress-label">
            <span>Overall Completion</span>
            <span>{project.progress}%</span>
          </div>
          <div className="progress-bar-large">
            <div className="progress-fill-large" style={{ width: `${project.progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid-detail">
        <Link to={`/projects/${project.id}/team`} className="stat-card-detail">
          <div className="stat-icon-detail">👥</div>
          <div className="stat-info-detail">
            <div className="stat-value-detail">{stats.teamSize}</div>
            <div className="stat-label-detail">Team Members</div>
          </div>
        </Link>
        <Link to={`/projects/${project.id}/tasks`} className="stat-card-detail">
          <div className="stat-icon-detail">✅</div>
          <div className="stat-info-detail">
            <div className="stat-value-detail">{stats.tasksCompleted}/{stats.tasksTotal}</div>
            <div className="stat-label-detail">Tasks Done</div>
          </div>
        </Link>
        <Link to={`/research/${project.id}`} className="stat-card-detail">
          <div className="stat-icon-detail">🔬</div>
          <div className="stat-info-detail">
            <div className="stat-value-detail">Research</div>
            <div className="stat-label-detail">Workspace</div>
          </div>
        </Link>
        <Link to={`/projects/${project.id}/documents`} className="stat-card-detail">
          <div className="stat-icon-detail">📄</div>
          <div className="stat-info-detail">
            <div className="stat-value-detail">{stats.documents}</div>
            <div className="stat-label-detail">Documents</div>
          </div>
        </Link>
        <Link to={`/projects/${project.id}/funding`} className="stat-card-detail">
          <div className="stat-icon-detail">💰</div>
          <div className="stat-info-detail">
            <div className="stat-value-detail">${stats.budgetUsed?.toLocaleString() || 0}</div>
            <div className="stat-label-detail">Budget Used</div>
          </div>
        </Link>
      </div>

      {/* Budget Progress */}
      {project.budget_total && project.budget_total > 0 && (
        <div className="info-card">
          <h3>💰 Budget</h3>
          <div className="budget-section">
            <div className="budget-stats">
              <div>
                <div className="budget-label">Used</div>
                <div className="budget-amount">${project.budget_used?.toLocaleString() || 0}</div>
              </div>
              <div>
                <div className="budget-label">Total</div>
                <div className="budget-amount">${project.budget_total.toLocaleString()}</div>
              </div>
              <div>
                <div className="budget-label">Remaining</div>
                <div className="budget-amount">${(project.budget_total - (project.budget_used || 0)).toLocaleString()}</div>
              </div>
            </div>
            <div className="progress-bar-large">
              <div className="progress-fill-large budget-fill" style={{ width: `${budgetPercentage}%` }}></div>
            </div>
            <div className="budget-percentage">{budgetPercentage}% of budget used</div>
          </div>
        </div>
      )}

      {/* Tech Stack */}
      {project.tech_stack && project.tech_stack.length > 0 && (
        <div className="info-card">
          <h3>🛠️ Tech Stack</h3>
          <div className="tech-stack">
            {project.tech_stack.map((tech, i) => (
              <span key={i} className="tech-tag">{tech}</span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="info-card">
        <h3>⏱️ Timeline</h3>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-title">Project Created</div>
              <div className="timeline-date">{new Date(project.created_at).toLocaleDateString()}</div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-title">Last Updated</div>
              <div className="timeline-date">{new Date(project.updated_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TASKS TAB
// ============================================================
const TasksTab = ({ tasks, onTaskUpdate }: { tasks: Task[]; onTaskUpdate: () => void }) => {
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const { id } = useParams();

  const handleStatusChange = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 
                      currentStatus === 'in_progress' ? 'done' : 'in_progress';
    
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);
    
    if (!error) onTaskUpdate();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Delete this task?')) {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (!error) onTaskUpdate();
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title) return;

    const { error } = await supabase.from('tasks').insert({
      project_id: id,
      title: newTask.title,
      description: newTask.description,
      due_date: newTask.due_date,
      status: 'todo',
    });

    if (!error) {
      setNewTask({ title: '', description: '', due_date: '' });
      setShowAddForm(false);
      onTaskUpdate();
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="tasks-tab">
      <div className="tasks-header">
        <h3>Project Tasks</h3>
        <button className="btn-add-task" onClick={() => setShowAddForm(!showAddForm)}>
          + Add Task
        </button>
      </div>

      {showAddForm && (
        <div className="add-task-form">
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <textarea
            placeholder="Task description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <input
            type="date"
            value={newTask.due_date}
            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
          />
          <div className="form-actions">
            <button onClick={() => setShowAddForm(false)}>Cancel</button>
            <button onClick={handleAddTask}>Save Task</button>
          </div>
        </div>
      )}

      <div className="kanban-board">
        <div className="kanban-column">
          <div className="kanban-header todo-header">To Do ({todoTasks.length})</div>
          <div className="kanban-tasks">
            {todoTasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="task-card-header">
                  <div className="task-title">{task.title}</div>
                  <button onClick={() => handleDeleteTask(task.id)} className="task-delete">×</button>
                </div>
                <div className="task-description">{task.description}</div>
                {task.due_date && (
                  <div className="task-due">📅 Due: {new Date(task.due_date).toLocaleDateString()}</div>
                )}
                <button 
                  className="task-status-btn"
                  onClick={() => handleStatusChange(task.id, task.status)}
                >
                  Start Progress →
                </button>
              </div>
            ))}
            {todoTasks.length === 0 && <div className="empty-kanban">No tasks</div>}
          </div>
        </div>

        <div className="kanban-column">
          <div className="kanban-header progress-header">In Progress ({inProgressTasks.length})</div>
          <div className="kanban-tasks">
            {inProgressTasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="task-card-header">
                  <div className="task-title">{task.title}</div>
                  <button onClick={() => handleDeleteTask(task.id)} className="task-delete">×</button>
                </div>
                <div className="task-description">{task.description}</div>
                {task.due_date && (
                  <div className="task-due">📅 Due: {new Date(task.due_date).toLocaleDateString()}</div>
                )}
                <button 
                  className="task-status-btn done-btn"
                  onClick={() => handleStatusChange(task.id, task.status)}
                >
                  Complete →
                </button>
              </div>
            ))}
            {inProgressTasks.length === 0 && <div className="empty-kanban">No tasks</div>}
          </div>
        </div>

        <div className="kanban-column">
          <div className="kanban-header done-header">Done ({doneTasks.length})</div>
          <div className="kanban-tasks">
            {doneTasks.map((task) => (
              <div key={task.id} className="task-card done-card">
                <div className="task-card-header">
                  <div className="task-title">{task.title}</div>
                  <button onClick={() => handleDeleteTask(task.id)} className="task-delete">×</button>
                </div>
                <div className="task-description">{task.description}</div>
                {task.due_date && (
                  <div className="task-due">📅 Due: {new Date(task.due_date).toLocaleDateString()}</div>
                )}
                <button 
                  className="task-status-btn reopen-btn"
                  onClick={() => handleStatusChange(task.id, task.status)}
                >
                  Reopen →
                </button>
              </div>
            ))}
            {doneTasks.length === 0 && <div className="empty-kanban">No tasks</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TEAM TAB
// ============================================================
const TeamTab = ({
  projectId,
  projectName,
  members,
  onMemberAdd,
}: {
  projectId: string;
  projectName: string;
  members: TeamMember[];
  onMemberAdd: () => void;
}) => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setLoading(true);

    const { data: userData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', inviteEmail)
      .single();

    if (userData) {
      let teamId: string | null = null;
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle();

      if (existingTeam?.id) {
        teamId = existingTeam.id as string;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: newTeam } = await supabase
            .from('teams')
            .insert({
              owner_id: session.user.id,
              project_id: projectId,
              name: `${projectName} Team`,
            })
            .select('id')
            .single();
          teamId = newTeam?.id as string;
        }
      }

      if (teamId) {
        await supabase.from('team_members').insert({
          team_id: teamId,
          user_id: userData.id,
          role: inviteRole,
        });
      }
    }

    setInviteEmail('');
    setShowInviteForm(false);
    setLoading(false);
    onMemberAdd();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Remove this member from the team?')) {
      await supabase.from('team_members').delete().eq('id', memberId);
      onMemberAdd();
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'admin': return '#7c5fe6';
      case 'developer': return '#2fd4ff';
      case 'designer': return '#f6c90e';
      case 'marketer': return '#48bb78';
      default: return '#888';
    }
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'admin': return '👑';
      case 'developer': return '💻';
      case 'designer': return '🎨';
      case 'marketer': return '📢';
      default: return '👤';
    }
  };

  return (
    <div className="team-tab">
      <div className="team-header">
        <h3>Team Members ({members.length})</h3>
        <button className="btn-invite" onClick={() => setShowInviteForm(!showInviteForm)}>
          + Invite Member
        </button>
      </div>

      {showInviteForm && (
        <div className="invite-form">
          <input
            type="email"
            placeholder="Email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
            <option value="marketer">Marketer</option>
            <option value="viewer">Viewer</option>
          </select>
          <div className="form-actions">
            <button onClick={() => setShowInviteForm(false)}>Cancel</button>
            <button onClick={handleInvite} disabled={loading}>
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </div>
      )}

      <div className="members-list">
        {members.length === 0 ? (
          <div className="empty-members">
            <div className="empty-icon">👥</div>
            <p>No team members yet. Invite someone to collaborate!</p>
          </div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="member-item">
              <div className="member-avatar">
                {member.full_name?.charAt(0) || member.email?.charAt(0) || '👤'}
              </div>
              <div className="member-info">
                <div className="member-name">{member.full_name || member.email}</div>
                <div className="member-email">{member.email}</div>
              </div>
              <div className="member-role" style={{ background: getRoleColor(member.role) }}>
                <span>{getRoleIcon(member.role)}</span> {member.role}
              </div>
              <button onClick={() => handleRemoveMember(member.id)} className="member-remove">
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================
// DOCUMENTS TAB
// ============================================================
const DocumentsTab = ({ documents, onDocumentUpload }: { documents: Document[]; onDocumentUpload: () => void }) => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { id } = useParams();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;
    const userName = session?.user.user_metadata?.full_name || session?.user.email?.split('@')[0];

    // Upload to Supabase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('project-documents')
      .upload(`${id}/${fileName}`, file);

    if (!uploadError) {
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-documents')
        .getPublicUrl(`${id}/${fileName}`);

      // Save to documents table
      await supabase.from('documents').insert({
        project_id: id,
        name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        size: file.size,
        uploaded_by: userId,
        uploaded_by_name: userName,
      });
      
      onDocumentUpload();
    }
    
    setUploading(false);
    setShowUploadForm(false);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (confirm('Delete this document?')) {
      await supabase.from('documents').delete().eq('id', docId);
      onDocumentUpload();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word')) return '📘';
    if (fileType.includes('excel')) return '📗';
    if (fileType.includes('powerpoint')) return '📙';
    return '📄';
  };

  return (
    <div className="documents-tab">
      <div className="documents-header">
        <h3>Project Documents ({documents.length})</h3>
        <button className="btn-upload" onClick={() => setShowUploadForm(!showUploadForm)}>
          + Upload Document
        </button>
      </div>

      {showUploadForm && (
        <div className="upload-form">
          <input type="file" onChange={handleFileUpload} disabled={uploading} />
          {uploading && <p className="uploading-text">Uploading...</p>}
        </div>
      )}

      <div className="documents-list">
        {documents.length === 0 ? (
          <div className="empty-documents">
            <div className="empty-icon">📄</div>
            <p>No documents yet. Upload your first file!</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="document-item">
              <div className="document-icon">{getFileIcon(doc.file_type)}</div>
              <div className="document-info">
                <div className="document-name">{doc.name}</div>
                <div className="document-meta">
                  {formatFileSize(doc.size)} • Uploaded by {doc.uploaded_by_name || 'Unknown'} • {new Date(doc.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="document-actions">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn-download">
                  Download
                </a>
                <button onClick={() => handleDeleteDocument(doc.id)} className="btn-delete-doc">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================
// AI LAB TAB
// ============================================================
const AILabTab = ({ analysis, projectId: _projectId, projectName }: { analysis: AIAnalysis | null; projectId: string; projectName: string }) => {
  const [loading, setLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(analysis);
  const [aiResponse, setAiResponse] = useState('');
  const [userQuestion, setUserQuestion] = useState('');

  const runNewAnalysis = async () => {
    setLoading(true);
    
    // Simulate AI analysis - In production, call your AI API endpoint
    setTimeout(() => {
      const newAnalysis: AIAnalysis = {
        id: Date.now().toString(),
        score: Math.floor(Math.random() * 30) + 70,
        risk_level: Math.random() > 0.7 ? 'medium' : 'low',
        recommendations: [
          'Focus on user experience improvements',
          'Consider adding more automation features',
          'Expand your target market to include SMEs',
          'Integrate with existing enterprise systems'
        ],
        market_fit: Math.floor(Math.random() * 30) + 65,
        competitor_analysis: 'Your main competitors are FarmConnect (35% market share) and AgriTech Solutions (28% market share). Your advantage is lower pricing and mobile-first approach.',
        created_at: new Date().toISOString(),
      };
      setCurrentAnalysis(newAnalysis);
      setLoading(false);
    }, 2000);
  };

  const askAI = async () => {
    if (!userQuestion) return;
    setLoading(true);
    
    // Simulate AI response - In production, call your AI API
    setTimeout(() => {
      setAiResponse(`Based on my analysis of "${projectName}", here's what I found:\n\n1. Market opportunity is strong in the East African region\n2. Your pricing strategy is competitive\n3. Consider adding offline capabilities for rural areas\n4. The project shows 85% feasibility score\n\nWould you like me to dive deeper into any specific aspect?`);
      setLoading(false);
    }, 1500);
  };

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'low': return '#48bb78';
      case 'medium': return '#f6c90e';
      case 'high': return '#fc8181';
      default: return '#888';
    }
  };

  return (
    <div className="ai-lab-tab">
      {/* AI Score Cards */}
      {currentAnalysis ? (
        <>
          <div className="ai-scores-large">
            <div className="ai-score-card">
              <div className="ai-score-value">{currentAnalysis.score}/100</div>
              <div className="ai-score-label">AI Feasibility Score</div>
            </div>
            <div className="ai-risk-card">
              <div className="ai-risk-value" style={{ color: getRiskColor(currentAnalysis.risk_level) }}>
                {currentAnalysis.risk_level.toUpperCase()}
              </div>
              <div className="ai-risk-label">Risk Level</div>
            </div>
            <div className="ai-market-card">
              <div className="ai-market-value">{currentAnalysis.market_fit}%</div>
              <div className="ai-market-label">Market Fit</div>
            </div>
          </div>

          <div className="info-card">
            <h3>🤖 AI Recommendations</h3>
            <ul className="recommendations-list">
              {currentAnalysis.recommendations.map((rec, i) => (
                <li key={i}>💡 {rec}</li>
              ))}
            </ul>
          </div>

          <div className="info-card">
            <h3>📊 Competitor Analysis</h3>
            <p>{currentAnalysis.competitor_analysis}</p>
          </div>

          <div className="info-card">
            <h3>💬 Ask AI Assistant</h3>
            <div className="ai-chat">
              <textarea
                placeholder="Ask anything about your project..."
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                rows={3}
              />
              <button onClick={askAI} disabled={loading || !userQuestion}>
                {loading ? 'Thinking...' : 'Ask AI →'}
              </button>
              {aiResponse && (
                <div className="ai-response">
                  <strong>AI Response:</strong>
                  <p>{aiResponse}</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="no-analysis">
          <div className="empty-icon">🤖</div>
          <p>No AI analysis yet. Run an analysis to get insights about your project.</p>
        </div>
      )}

      <button className="btn-run-analysis" onClick={runNewAnalysis} disabled={loading}>
        {loading ? 'Running Analysis...' : '🔬 Run New AI Analysis'}
      </button>
    </div>
  );
};

// ============================================================
// FUNDING TAB
// ============================================================
const FundingTab = ({ pitches, onPitchSubmit, projectName: _projectName }: { pitches: FundingPitch[]; onPitchSubmit: () => void; projectName: string }) => {
  const [showPitchForm, setShowPitchForm] = useState(false);
  const [newPitch, setNewPitch] = useState({ amount: '', equity: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const { id } = useParams();

  const handleSubmitPitch = async () => {
    if (!newPitch.amount || !newPitch.equity) return;
    setSubmitting(true);

    await supabase.from('funding_pitches').insert({
      project_id: id,
      amount: parseInt(newPitch.amount),
      equity: parseInt(newPitch.equity),
      description: newPitch.description,
      status: 'submitted',
    });

    setNewPitch({ amount: '', equity: '', description: '' });
    setShowPitchForm(false);
    setSubmitting(false);
    onPitchSubmit();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return '#888';
      case 'submitted': return '#2fd4ff';
      case 'funded': return '#48bb78';
      case 'rejected': return '#fc8181';
      default: return '#888';
    }
  };

  const totalRequested = pitches.reduce((sum, p) => sum + (p.status === 'submitted' ? p.amount : 0), 0);
  const totalFunded = pitches.reduce((sum, p) => sum + (p.status === 'funded' ? p.amount : 0), 0);

  return (
    <div className="funding-tab">
      {/* Funding Summary */}
      <div className="funding-summary">
        <div className="summary-card">
          <div className="summary-value">${totalRequested.toLocaleString()}</div>
          <div className="summary-label">Total Requested</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">${totalFunded.toLocaleString()}</div>
          <div className="summary-label">Total Funded</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{pitches.length}</div>
          <div className="summary-label">Pitches Submitted</div>
        </div>
      </div>

      <div className="funding-header">
        <h3>Funding Pitches</h3>
        <button className="btn-pitch" onClick={() => setShowPitchForm(!showPitchForm)}>
          + Create Pitch
        </button>
      </div>

      {showPitchForm && (
        <div className="pitch-form">
          <div className="form-row">
            <div className="form-group">
              <label>Amount ($)</label>
              <input
                type="number"
                placeholder="e.g., 50000"
                value={newPitch.amount}
                onChange={(e) => setNewPitch({ ...newPitch, amount: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Equity (%)</label>
              <input
                type="number"
                placeholder="e.g., 10"
                value={newPitch.equity}
                onChange={(e) => setNewPitch({ ...newPitch, equity: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Pitch Description</label>
            <textarea
              placeholder="Describe why investors should fund this project..."
              value={newPitch.description}
              onChange={(e) => setNewPitch({ ...newPitch, description: e.target.value })}
              rows={4}
            />
          </div>
          <div className="form-actions">
            <button onClick={() => setShowPitchForm(false)}>Cancel</button>
            <button onClick={handleSubmitPitch} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Pitch'}
            </button>
          </div>
        </div>
      )}

      <div className="pitches-list">
        {pitches.length === 0 ? (
          <div className="empty-pitches">
            <div className="empty-icon">💰</div>
            <p>No funding pitches yet. Create your first pitch to attract investors!</p>
          </div>
        ) : (
          pitches.map((pitch) => (
            <div key={pitch.id} className="pitch-item">
              <div className="pitch-amount">${pitch.amount.toLocaleString()}</div>
              <div className="pitch-equity">{pitch.equity}% equity</div>
              <div className="pitch-status" style={{ color: getStatusColor(pitch.status) }}>
                {pitch.status.toUpperCase()}
              </div>
              <div className="pitch-date">{new Date(pitch.created_at).toLocaleDateString()}</div>
            </div>
          ))
        )}
      </div>

      {/* Funding Tips */}
      <div className="funding-tips">
        <h4>💡 Tips to Get Funded</h4>
        <ul>
          <li>Create a compelling pitch deck</li>
          <li>Show traction and user feedback</li>
          <li>Be clear about how you'll use the funds</li>
          <li>Highlight your team's expertise</li>
        </ul>
      </div>
    </div>
  );
};

// ============================================================
// SETTINGS TAB
// ============================================================
const SettingsTab = ({ project, onUpdate }: { project: Project; onUpdate: () => void }) => {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description,
    sector: project.sector,
    status: project.status,
    progress: project.progress,
    budget_used: project.budget_used || 0,
    budget_total: project.budget_total || 0,
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  const sectors = ['Agriculture', 'Health', 'Education', 'FinTech', 'Environment', 'Blockchain', 'AI/ML', 'IoT', 'E-commerce', 'Logistics', 'Tourism', 'Other'];
  const statuses = ['Idea', 'Experiment', 'Prototype', 'Launched'];

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update(
        buildProjectUpdate({
          name: formData.name,
          description: formData.description,
          sector: formData.sector,
          status: formData.status,
          progress: formData.progress,
        })
      )
      .eq('id', project.id);

    if (!error) onUpdate();
    setSaving(false);
  };

  const handleDelete = async () => {
    await supabase.from('projects').delete().eq('id', project.id);
    navigate('/projects');
  };

  return (
    <div className="settings-tab">
      <div className="info-card">
        <h3>⚙️ Project Settings</h3>
        <div className="settings-form">
          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Sector</label>
              <select value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })}>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Budget Used ($)</label>
              <input
                type="number"
                value={formData.budget_used}
                onChange={(e) => setFormData({ ...formData, budget_used: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Total Budget ($)</label>
              <input
                type="number"
                value={formData.budget_total}
                onChange={(e) => setFormData({ ...formData, budget_total: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Progress: {formData.progress}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
            />
          </div>
          <div className="form-actions">
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="btn-delete-setting" onClick={() => setShowDeleteConfirm(true)}>
              Delete Project
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="dialog-overlay">
          <div className="dialog-content">
            <h3>Delete Project?</h3>
            <p>Are you sure you want to delete "{project.name}"? This action cannot be undone. All tasks, team members, and documents will be permanently deleted.</p>
            <div className="dialog-actions">
              <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button onClick={handleDelete} className="btn-confirm-delete">Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN PROJECT DETAIL COMPONENT
// ============================================================
const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [fundingPitches, setFundingPitches] = useState<FundingPitch[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  // Fetch all project data
  const fetchProjectData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      if (!projectData) throw new Error('Project not found');

      if (projectData.user_id !== session.user.id) {
        setError('You do not have permission to view this project');
        setLoading(false);
        return;
      }

      setProject({
        ...projectData,
        status: normalizeProjectStatus(projectData.status) as Project['status'],
        progress: Number(projectData.progress ?? projectData.progress_score ?? 0),
        team_size: 0,
        tasks_completed: 0,
        tasks_total: 0,
      });

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      setTasks(tasksData || []);

      const teamData = await fetchTeamMembersForProject(id);
      const formattedTeam = teamData.map((tm) => ({
        id: tm.id as string,
        user_id: tm.user_id as string,
        project_id: id,
        role: tm.role as TeamMember['role'],
        full_name: (tm.profiles as { full_name?: string } | null)?.full_name || 'Unknown',
        email: (tm.profiles as { email?: string } | null)?.email || '',
        joined_at: tm.joined_at as string,
      }));
      setTeamMembers(formattedTeam);

      // Fetch documents
      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      setDocuments(docsData || []);

      // Fetch AI analysis
      const { data: aiData } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(1);

      setAiAnalysis(aiData?.[0] || null);

      // Fetch funding pitches
      const { data: fundingData } = await supabase
        .from('funding_pitches')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      setFundingPitches(fundingData || []);

    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Stats for overview
  const stats = {
    teamSize: teamMembers.length,
    tasksCompleted: tasks.filter(t => t.status === 'done').length,
    tasksTotal: tasks.length,
    documents: documents.length,
    budgetUsed: project?.budget_used || 0,
  };

  if (loading) {
    return (
      <div className="project-detail-container">
        <main className="project-detail-main">
          <div className="loading-spinner"></div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-detail-container">
        <main className="project-detail-main">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Error Loading Project</h2>
            <p>{error || 'Project not found'}</p>
            <Link to="/projects" className="btn-back">Back to Projects</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="project-detail-container">
      
      <main className="project-detail-main">
        {/* Header */}
        <div className="detail-header">
          <Link to="/projects" className="back-link">
            ← Back to Projects
          </Link>
        </div>

        {/* Tabs */}
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <OverviewTab project={project} stats={stats} />
          )}
          {activeTab === 'tasks' && (
            <TasksTab tasks={tasks} onTaskUpdate={fetchProjectData} />
          )}
          {activeTab === 'team' && (
            <TeamTab
              projectId={project.id}
              projectName={project.name}
              members={teamMembers}
              onMemberAdd={fetchProjectData}
            />
          )}
          {activeTab === 'documents' && (
            <DocumentsTab documents={documents} onDocumentUpload={fetchProjectData} />
          )}
          {activeTab === 'ai-lab' && (
            <AILabTab analysis={aiAnalysis} projectId={project.id} projectName={project.name} />
          )}
          {activeTab === 'funding' && (
            <FundingTab pitches={fundingPitches} onPitchSubmit={fetchProjectData} projectName={project.name} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab project={project} onUpdate={fetchProjectData} />
          )}
        </div>
      </main>

      <style>{`
        .project-detail-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
        }
        
        .project-detail-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .project-detail-main {
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
        
        .detail-header {
          margin-bottom: 1.5rem;
        }
        
        .back-link {
          color: #7c5fe6;
          text-decoration: none;
          font-size: 0.9rem;
          display: inline-block;
        }
        
        .back-link:hover {
          text-decoration: underline;
        }
        
        /* Tabs */
        .tabs-container {
          display: flex;
          gap: 0.25rem;
          background: rgba(0,0,0,0.3);
          padding: 0.5rem;
          border-radius: 60px;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        
        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          background: none;
          border: none;
          border-radius: 40px;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.85rem;
        }
        
        .tab:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .tab.active {
          background: #7c5fe6;
          color: white;
        }
        
        .tab-icon {
          font-size: 1rem;
        }
        
        /* Info Cards */
        .info-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.25rem;
          margin-bottom: 1.25rem;
        }
        
        .info-card h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
          color: rgba(255,255,255,0.9);
        }
        
        /* Project Header Card */
        .project-header-card {
          background: linear-gradient(135deg, rgba(124,95,230,0.2), rgba(47,212,255,0.1));
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        
        .project-icon-large {
          font-size: 3rem;
        }
        
        .project-info-large {
          flex: 1;
        }
        
        .project-info-large h2 {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }
        
        .project-sector {
          color: rgba(255,255,255,0.6);
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.2rem 0.8rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }
        
        .project-actions-header {
          display: flex;
          gap: 0.75rem;
        }
        
        .btn-edit-header, .btn-experiment-header {
          padding: 0.5rem 1rem;
          border-radius: 30px;
          text-decoration: none;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        
        .btn-edit-header {
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          color: #7c5fe6;
        }
        
        .btn-experiment-header {
          background: rgba(47,212,255,0.2);
          border: 1px solid rgba(47,212,255,0.3);
          color: #2fd4ff;
        }
        
        /* Progress Section */
        .progress-section {
          margin-bottom: 1rem;
        }
        
        .progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
        }
        
        .progress-bar-large {
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill-large {
          height: 100%;
          background: linear-gradient(90deg, #7c5fe6, #2fd4ff);
          border-radius: 4px;
        }
        
        .budget-fill {
          background: linear-gradient(90deg, #48bb78, #38a169);
        }
        
        /* Stats Grid */
        .stats-grid-detail {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        
        @media (max-width: 640px) {
          .stats-grid-detail {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        .stat-card-detail {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .stat-card-detail:hover {
          background: rgba(0,0,0,0.6);
          transform: translateY(-2px);
        }
        
        .stat-icon-detail {
          font-size: 1.5rem;
        }
        
        .stat-value-detail {
          font-size: 1.2rem;
          font-weight: 700;
          color: white;
        }
        
        .stat-label-detail {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        
        /* Budget Section */
        .budget-section {
          margin-top: 0.5rem;
        }
        
        .budget-stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .budget-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        
        .budget-amount {
          font-size: 1rem;
          font-weight: 600;
        }
        
        .budget-percentage {
          text-align: right;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          margin-top: 0.5rem;
        }
        
        /* Tech Stack */
        .tech-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .tech-tag {
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 20px;
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
        }
        
        /* Timeline */
        .timeline {
          position: relative;
          padding-left: 1.5rem;
        }
        
        .timeline-item {
          position: relative;
          padding-bottom: 1rem;
        }
        
        .timeline-dot {
          position: absolute;
          left: -1.2rem;
          top: 0.25rem;
          width: 10px;
          height: 10px;
          background: #2fd4ff;
          border-radius: 50%;
        }
        
        .timeline-title {
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        .timeline-date {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        
        /* Tasks Tab - Kanban */
        .tasks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .btn-add-task {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 30px;
          color: #0a0d1a;
          font-weight: 500;
          cursor: pointer;
        }
        
        .add-task-form {
          background: rgba(0,0,0,0.5);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .add-task-form input,
        .add-task-form textarea {
          width: 100%;
          margin-bottom: 0.75rem;
          padding: 0.75rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        
        .kanban-board {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        
        @media (max-width: 768px) {
          .kanban-board {
            grid-template-columns: 1fr;
          }
        }
        
        .kanban-column {
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .kanban-header {
          padding: 0.75rem;
          font-weight: 600;
          text-align: center;
        }
        
        .todo-header { background: rgba(246,201,14,0.2); color: #f6c90e; }
        .progress-header { background: rgba(47,212,255,0.2); color: #2fd4ff; }
        .done-header { background: rgba(72,187,120,0.2); color: #48bb78; }
        
        .kanban-tasks {
          padding: 0.75rem;
          min-height: 200px;
        }
        
        .task-card {
          background: rgba(0,0,0,0.5);
          border-radius: 10px;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
        }
        
        .task-card.done-card {
          opacity: 0.7;
        }
        
        .task-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .task-title {
          font-weight: 600;
          font-size: 0.85rem;
        }
        
        .task-delete {
          background: none;
          border: none;
          color: #fc8181;
          cursor: pointer;
          font-size: 1.2rem;
        }
        
        .task-description {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.5rem;
        }
        
        .task-due {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.4);
          margin-bottom: 0.5rem;
        }
        
        .task-status-btn {
          width: 100%;
          padding: 0.4rem;
          background: rgba(47,212,255,0.2);
          border: 1px solid rgba(47,212,255,0.3);
          border-radius: 20px;
          color: #2fd4ff;
          cursor: pointer;
          font-size: 0.7rem;
        }
        
        .done-btn {
          background: rgba(72,187,120,0.2);
          border-color: rgba(72,187,120,0.3);
          color: #48bb78;
        }
        
        .reopen-btn {
          background: rgba(246,201,14,0.2);
          border-color: rgba(246,201,14,0.3);
          color: #f6c90e;
        }
        
        .empty-kanban {
          text-align: center;
          color: rgba(255,255,255,0.4);
          padding: 1rem;
        }
        
        /* Team Tab */
        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .btn-invite {
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          padding: 0.5rem 1rem;
          border-radius: 30px;
          color: #7c5fe6;
          cursor: pointer;
        }
        
        .invite-form {
          background: rgba(0,0,0,0.5);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .invite-form input,
        .invite-form select {
          flex: 1;
          padding: 0.75rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        
        .members-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .member-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
        }
        
        .member-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }
        
        .member-info {
          flex: 1;
        }
        
        .member-name {
          font-weight: 500;
        }
        
        .member-email {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        
        .member-role {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .member-remove {
          background: rgba(252,129,129,0.2);
          border: none;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          color: #fc8181;
          cursor: pointer;
        }
        
        .empty-members, .empty-documents, .empty-pitches {
          text-align: center;
          padding: 2rem;
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
        }
        
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        
        /* Documents Tab */
        .documents-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .btn-upload {
          background: rgba(47,212,255,0.2);
          border: 1px solid rgba(47,212,255,0.3);
          padding: 0.5rem 1rem;
          border-radius: 30px;
          color: #2fd4ff;
          cursor: pointer;
        }
        
        .upload-form {
          background: rgba(0,0,0,0.5);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .documents-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .document-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
        }
        
        .document-icon {
          font-size: 1.5rem;
        }
        
        .document-info {
          flex: 1;
        }
        
        .document-name {
          font-weight: 500;
        }
        
        .document-meta {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.4);
        }
        
        .document-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .btn-download {
          padding: 0.25rem 0.75rem;
          background: rgba(72,187,120,0.2);
          border: 1px solid rgba(72,187,120,0.3);
          border-radius: 20px;
          color: #48bb78;
          text-decoration: none;
          font-size: 0.7rem;
        }
        
        .btn-delete-doc {
          padding: 0.25rem 0.75rem;
          background: rgba(252,129,129,0.2);
          border: 1px solid rgba(252,129,129,0.3);
          border-radius: 20px;
          color: #fc8181;
          cursor: pointer;
        }
        
        /* AI Lab Tab */
        .ai-scores-large {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .ai-score-card, .ai-risk-card, .ai-market-card {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1rem;
          text-align: center;
        }
        
        .ai-score-value {
          font-size: 2rem;
          font-weight: 700;
          color: #2fd4ff;
        }
        
        .ai-risk-value {
          font-size: 1.2rem;
          font-weight: 700;
        }
        
        .ai-market-value {
          font-size: 2rem;
          font-weight: 700;
          color: #48bb78;
        }
        
        .ai-score-label, .ai-risk-label, .ai-market-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        
        .recommendations-list {
          padding-left: 1.5rem;
        }
        
        .recommendations-list li {
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.7);
        }
        
        .ai-chat textarea {
          width: 100%;
          padding: 0.75rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white;
          margin-bottom: 0.75rem;
        }
        
        .ai-chat button {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 30px;
          color: #0a0d1a;
          cursor: pointer;
        }
        
        .ai-response {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(124,95,230,0.1);
          border-radius: 12px;
        }
        
        .btn-run-analysis {
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          border-radius: 40px;
          color: #0a0d1a;
          font-weight: 600;
          cursor: pointer;
          margin-top: 1rem;
        }
        
        .no-analysis {
          text-align: center;
          padding: 2rem;
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          margin-bottom: 1rem;
        }
        
        /* Funding Tab */
        .funding-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .summary-card {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1rem;
          text-align: center;
        }
        
        .summary-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #48bb78;
        }
        
        .summary-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        
        .funding-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .btn-pitch {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 30px;
          color: #0a0d1a;
          cursor: pointer;
        }
        
        .pitch-form {
          background: rgba(0,0,0,0.5);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .pitches-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        
        .pitch-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
        }
        
        .pitch-amount {
          font-weight: 600;
          color: #48bb78;
        }
        
        .pitch-equity {
          font-size: 0.8rem;
        }
        
        .pitch-status {
          font-size: 0.7rem;
          font-weight: 600;
        }
        
        .pitch-date {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
        }
        
        .funding-tips {
          background: rgba(124,95,230,0.1);
          border: 1px solid rgba(124,95,230,0.2);
          border-radius: 12px;
          padding: 1rem;
        }
        
        .funding-tips h4 {
          margin-bottom: 0.5rem;
        }
        
        .funding-tips ul {
          padding-left: 1.5rem;
        }
        
        .funding-tips li {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.7);
          margin-bottom: 0.25rem;
        }
        
        /* Settings Tab */
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .form-group label {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.7);
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 0.75rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        .btn-save {
          padding: 0.75rem;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          border-radius: 30px;
          color: #0a0d1a;
          font-weight: 600;
          cursor: pointer;
        }
        
        .btn-delete-setting {
          padding: 0.75rem;
          background: rgba(252,129,129,0.2);
          border: 1px solid rgba(252,129,129,0.3);
          border-radius: 30px;
          color: #fc8181;
          cursor: pointer;
        }
        
        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        /* Dialog */
        .dialog-overlay {
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
        
        .dialog-content {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 1.5rem;
          max-width: 400px;
          width: 90%;
        }
        
        .dialog-content h3 {
          margin-bottom: 0.5rem;
        }
        
        .dialog-content p {
          color: rgba(255,255,255,0.7);
          margin-bottom: 1.5rem;
        }
        
        .dialog-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        
        .dialog-actions button {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }
        
        .dialog-actions button:first-child {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .btn-confirm-delete {
          background: #fc8181;
          color: #1a1a2e;
        }
        
        /* Error State */
        .error-state {
          text-align: center;
          padding: 3rem;
        }
        
        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        
        .error-state h2 {
          margin-bottom: 0.5rem;
        }
        
        .error-state p {
          color: rgba(255,255,255,0.6);
          margin-bottom: 1.5rem;
        }
        
        .btn-back {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 30px;
          color: #7c5fe6;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
};

export default ProjectDetail;