// C:\Users\user\maylet-xlab\src\app\routes\admin\projects\AdminProjectReview.tsx
// FULL ADMIN PROJECT REVIEW PAGE - REVIEW AND MODERATE PROJECTS
// WITH APPROVE, REJECT, REQUEST CHANGES FUNCTIONALITY

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase/client';
import { logActivity } from '../../../../lib/supabase/dbHelpers';
import { normalizeProjectStatus, toDbProjectStatus } from '../../../../types/project.types';

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
  user_id: string;
  user_name: string;
  user_email: string;
  team_size: number;
  tasks_completed: number;
  tasks_total: number;
  budget_used: number;
  budget_total: number;
  tech_stack: string[];
  created_at: string;
  updated_at: string;
}

interface ReviewHistory {
  id: string;
  project_id: string;
  reviewer_id: string;
  reviewer_name: string;
  action: 'approved' | 'rejected' | 'changes_requested';
  comments: string;
  created_at: string;
}

// ============================================================
// MAIN ADMIN PROJECT REVIEW COMPONENT
// ============================================================
const AdminProjectReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistory[]>([]);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | 'changes_requested'>('approved');
  const [reviewComments, setReviewComments] = useState('');

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        // Fetch project with user info
        const { data: projectData } = await supabase
          .from('projects')
          .select('*, profiles(full_name, email)')
          .eq('id', id)
          .single();

        if (projectData) {
          setProject({
            ...projectData,
            status: normalizeProjectStatus(projectData.status) as Project['status'],
            user_name: projectData.profiles?.full_name || 'Unknown',
            user_email: projectData.profiles?.email || 'Unknown',
            budget_used: 0,
            budget_total: 0,
            tech_stack: [],
            team_size: 0,
            tasks_completed: 0,
            tasks_total: 0,
          });
        }

        const { data: historyData } = await supabase
          .from('project_reviews')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });

        const reviewerIds = [...new Set((historyData ?? []).map((r) => r.reviewer_id as string).filter(Boolean))];
        const { data: reviewers } = reviewerIds.length
          ? await supabase.from('profiles').select('id, full_name, email').in('id', reviewerIds)
          : { data: [] };
        const reviewerMap = new Map(
          (reviewers ?? []).map((r) => [
            r.id as string,
            (r.full_name as string) || (r.email as string)?.split('@')[0] || 'Admin',
          ])
        );

        setReviewHistory(
          (historyData ?? []).map((row) => ({
            id: row.id as string,
            project_id: row.project_id as string,
            reviewer_id: row.reviewer_id as string,
            reviewer_name: reviewerMap.get(row.reviewer_id as string) ?? 'Admin',
            action: row.status as ReviewHistory['action'],
            comments: (row.feedback as string) ?? '',
            created_at: row.created_at as string,
          }))
        );

      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProject();
  }, [id, navigate]);

  // Submit review
  const handleSubmitReview = async () => {
    if (!reviewComments.trim()) {
      alert('Please provide comments for this review.');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Save review to database
      const { error: reviewError } = await supabase
        .from('project_reviews')
        .insert({
          project_id: id,
          reviewer_id: session.user.id,
          status: reviewAction,
          feedback: reviewComments,
        });

      if (reviewError) throw reviewError;

      let newStatus = project?.status ?? 'Idea';
      if (reviewAction === 'approved') {
        newStatus = 'Launched';
      } else if (reviewAction === 'rejected') {
        newStatus = 'Idea';
      }

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          status: toDbProjectStatus(newStatus),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      await logActivity({
        user_id: session.user.id,
        project_id: id,
        type: 'admin',
        title: `${reviewAction} project "${project?.name}"`,
        metadata: {
          target_type: 'project',
          target_name: project?.name,
          review_action: reviewAction,
        },
      });

      await supabase.from('notifications').insert({
        user_id: project?.user_id,
        title: `Project ${reviewAction === 'approved' ? 'Approved' : reviewAction === 'rejected' ? 'Rejected' : 'Changes Requested'}`,
        body: `Your project "${project?.name}" has been ${reviewAction}. ${reviewComments}`,
        type: 'project_review',
        link: '/projects',
      });

      alert(`Project ${reviewAction === 'approved' ? 'approved' : reviewAction === 'rejected' ? 'rejected' : 'changes requested'} successfully!`);
      navigate('/admin/projects');

    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSectorIcon = (sector: string) => {
    if (sector?.includes('Agri')) return '🌾';
    if (sector?.includes('Blockchain')) return '🔗';
    if (sector?.includes('Health')) return '🏥';
    if (sector?.includes('Education')) return '📚';
    if (sector?.includes('Environment')) return '🌍';
    if (sector?.includes('FinTech')) return '💰';
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

  const getActionColor = (action: string) => {
    switch(action) {
      case 'approved': return '#48bb78';
      case 'rejected': return '#fc8181';
      case 'changes_requested': return '#f6c90e';
      default: return '#888';
    }
  };

  if (loading) {
    return (
      <div className="admin-review-container">
        <main className="admin-review-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading project for review...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="admin-review-container">
        <main className="admin-review-main">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Project Not Found</h2>
            <p>The project you're trying to review doesn't exist.</p>
            <Link to="/admin/projects" className="btn-back">Back to Projects</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-review-container">
      
      <main className="admin-review-main">
        {/* Header */}
        <div className="review-header">
          <Link to="/admin/projects" className="back-link">
            ← Back to Projects
          </Link>
          <h1>Review Project: {project.name}</h1>
          <p>Review project details and make a decision</p>
        </div>

        {/* Two Column Layout */}
        <div className="two-columns">
          {/* Left Column - Project Details */}
          <div className="left-column">
            {/* Project Info Card */}
            <div className="info-card">
              <h3>📋 Project Information</h3>
              <div className="project-details">
                <div className="detail-row">
                  <span className="detail-label">Project Name:</span>
                  <span className="detail-value">{project.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Sector:</span>
                  <span className="detail-value">
                    <span className="sector-icon">{getSectorIcon(project.sector)}</span>
                    {project.sector}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="status-badge" style={{ background: getStatusColor(project.status), color: '#fff' }}>
                    {project.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Progress:</span>
                  <div className="progress-wrapper">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                    </div>
                    <span>{project.progress}%</span>
                  </div>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Last Updated:</span>
                  <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="info-card">
              <h3>📝 Description</h3>
              <p>{project.description || 'No description provided.'}</p>
            </div>

            {/* Owner Info Card */}
            <div className="info-card">
              <h3>👤 Project Owner</h3>
              <div className="owner-info">
                <div className="owner-avatar">{project.user_name.charAt(0).toUpperCase()}</div>
                <div className="owner-details">
                  <div className="owner-name">{project.user_name}</div>
                  <div className="owner-email">{project.user_email}</div>
                  <Link to={`/admin/users/${project.user_id}`} className="owner-link">View User Profile →</Link>
                </div>
              </div>
            </div>

            {/* Budget Card */}
            <div className="info-card">
              <h3>💰 Budget</h3>
              <div className="budget-stats">
                <div className="budget-item">
                  <div className="budget-label">Used</div>
                  <div className="budget-amount">${project.budget_used.toLocaleString()}</div>
                </div>
                <div className="budget-item">
                  <div className="budget-label">Total</div>
                  <div className="budget-amount">${project.budget_total.toLocaleString()}</div>
                </div>
                <div className="budget-item">
                  <div className="budget-label">Remaining</div>
                  <div className="budget-amount">${(project.budget_total - project.budget_used).toLocaleString()}</div>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill budget-fill" style={{ width: `${(project.budget_used / project.budget_total) * 100}%` }}></div>
              </div>
            </div>

            {/* Tech Stack Card */}
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
          </div>

          {/* Right Column - Review Form & History */}
          <div className="right-column">
            {/* Review Decision Card */}
            <div className="info-card review-card">
              <h3>⚖️ Make Decision</h3>
              
              <div className="review-actions">
                <label className="review-option">
                  <input
                    type="radio"
                    name="reviewAction"
                    value="approved"
                    checked={reviewAction === 'approved'}
                    onChange={() => setReviewAction('approved')}
                  />
                  <span className="review-option-label approved">✅ Approve Project</span>
                </label>
                
                <label className="review-option">
                  <input
                    type="radio"
                    name="reviewAction"
                    value="changes_requested"
                    checked={reviewAction === 'changes_requested'}
                    onChange={() => setReviewAction('changes_requested')}
                  />
                  <span className="review-option-label changes">📝 Request Changes</span>
                </label>
                
                <label className="review-option">
                  <input
                    type="radio"
                    name="reviewAction"
                    value="rejected"
                    checked={reviewAction === 'rejected'}
                    onChange={() => setReviewAction('rejected')}
                  />
                  <span className="review-option-label rejected">❌ Reject Project</span>
                </label>
              </div>

              <div className="review-comments">
                <label>Review Comments *</label>
                <textarea
                  placeholder="Provide detailed feedback for the project owner..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="review-buttons">
                <Link to="/admin/projects" className="btn-cancel">Cancel</Link>
                <button 
                  onClick={handleSubmitReview} 
                  className={`btn-submit ${reviewAction}`}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : `Submit ${reviewAction === 'approved' ? 'Approval' : reviewAction === 'rejected' ? 'Rejection' : 'Changes Request'}`}
                </button>
              </div>
            </div>

            {/* Review History Card */}
            {reviewHistory.length > 0 && (
              <div className="info-card">
                <h3>📜 Review History</h3>
                <div className="review-history">
                  {reviewHistory.map((review) => (
                    <div key={review.id} className="history-item">
                      <div className="history-header">
                        <span className={`history-action`} style={{ color: getActionColor(review.action) }}>
                          {review.action === 'approved' && '✅'}
                          {review.action === 'rejected' && '❌'}
                          {review.action === 'changes_requested' && '📝'}
                          {' '}{review.action.toUpperCase()}
                        </span>
                        <span className="history-date">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="history-reviewer">by {review.reviewer_name}</div>
                      <div className="history-comments">{review.comments}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Tips Card */}
            <div className="info-card tips-card">
              <h3>💡 Review Guidelines</h3>
              <ul className="tips-list">
                <li>Check if project description is clear and complete</li>
                <li>Verify the project aligns with platform guidelines</li>
                <li>Ensure no copyright or IP violations</li>
                <li>Provide constructive feedback for improvements</li>
                <li>Approve only projects that meet quality standards</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .admin-review-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        
        .admin-review-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .admin-review-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        
        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 70vh;
          gap: 1rem;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(124,95,230,0.3);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Header */
        .review-header {
          margin-bottom: 2rem;
        }
        
        .back-link {
          color: #7c5fe6;
          text-decoration: none;
          font-size: 0.85rem;
          display: inline-block;
          margin-bottom: 0.5rem;
        }
        
        .review-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #ffffff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 0.25rem;
        }
        
        .review-header p {
          color: rgba(255,255,255,0.6);
        }
        
        /* Two Columns */
        .two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        
        @media (max-width: 900px) {
          .two-columns {
            grid-template-columns: 1fr;
          }
        }
        
        /* Info Cards */
        .info-card {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.25rem;
          margin-bottom: 1.25rem;
        }
        
        .info-card h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        /* Project Details */
        .project-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .detail-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .detail-label {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          min-width: 100px;
        }
        
        .detail-value {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .sector-icon {
          font-size: 1rem;
        }
        
        .status-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }
        
        .progress-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }
        
        .progress-bar {
          flex: 1;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c5fe6, #2fd4ff);
          border-radius: 3px;
        }
        
        .budget-fill {
          background: linear-gradient(90deg, #48bb78, #38a169);
        }
        
        /* Owner Info */
        .owner-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .owner-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 600;
        }
        
        .owner-details {
          flex: 1;
        }
        
        .owner-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        
        .owner-email {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          margin-bottom: 0.25rem;
        }
        
        .owner-link {
          font-size: 0.7rem;
          color: #7c5fe6;
          text-decoration: none;
        }
        
        /* Budget */
        .budget-stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .budget-item {
          text-align: center;
        }
        
        .budget-label {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
        }
        
        .budget-amount {
          font-size: 0.9rem;
          font-weight: 600;
          color: #48bb78;
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
          font-size: 0.7rem;
        }
        
        /* Review Form */
        .review-card {
          background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6));
          border-color: #7c5fe6;
        }
        
        .review-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .review-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
          cursor: pointer;
        }
        
        .review-option input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        
        .review-option-label {
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .review-option-label.approved { color: #48bb78; }
        .review-option-label.changes { color: #f6c90e; }
        .review-option-label.rejected { color: #fc8181; }
        
        .review-comments {
          margin-bottom: 1rem;
        }
        
        .review-comments label {
          display: block;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.8);
        }
        
        .review-comments textarea {
          width: 100%;
          padding: 0.75rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-family: inherit;
          resize: vertical;
        }
        
        .review-comments textarea:focus {
          outline: none;
          border-color: #7c5fe6;
        }
        
        .review-buttons {
          display: flex;
          gap: 1rem;
        }
        
        .btn-cancel {
          flex: 1;
          padding: 0.6rem;
          text-align: center;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          color: white;
          text-decoration: none;
          font-size: 0.85rem;
        }
        
        .btn-submit {
          flex: 2;
          padding: 0.6rem;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-submit.approved {
          background: #48bb78;
          color: white;
        }
        
        .btn-submit.changes_requested {
          background: #f6c90e;
          color: #1a1a2e;
        }
        
        .btn-submit.rejected {
          background: #fc8181;
          color: white;
        }
        
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }
        
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Review History */
        .review-history {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .history-item {
          padding: 0.75rem;
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
        }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .history-action {
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .history-date {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
        }
        
        .history-reviewer {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.5rem;
        }
        
        .history-comments {
          font-size: 0.75rem;
          line-height: 1.4;
          color: rgba(255,255,255,0.8);
        }
        
        /* Tips Card */
        .tips-card {
          background: rgba(124,95,230,0.1);
          border-color: rgba(124,95,230,0.3);
        }
        
        .tips-list {
          padding-left: 1.2rem;
          margin: 0;
        }
        
        .tips-list li {
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.7);
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

export default AdminProjectReview;