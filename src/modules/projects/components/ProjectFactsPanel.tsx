import { Link } from 'react-router-dom';
import { EMPTY } from '../../../lib/innovation/dashboardData';
import { formatTimeAgo, getInnovationStage } from '../../../lib/innovation/lifecycle';
import type { Project } from '../../../types/project.types';

interface Props {
  project: Project | null;
  onCreateProject?: () => void;
}

export function ProjectFactsPanel({ project, onCreateProject }: Props) {
  if (!project) {
    return (
      <div className="icc-glass icc-widget">
        <div className="icc-widget-header">
          <h3>Selected Project</h3>
          <Link to="/ai-assistant" className="icc-widget-link">MAYA</Link>
        </div>
        <p className="icc-widget-empty-text">{EMPTY.COMPLETE_SETUP}</p>
        {onCreateProject ? (
          <button type="button" className="icc-widget-cta" onClick={onCreateProject}>
            Create Project
          </button>
        ) : null}
      </div>
    );
  }

  const stage = getInnovationStage(project);
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const updateStatus = daysSinceUpdate > 14 ? EMPTY.ACTION_REQUIRED : 'Current';

  return (
    <div className="icc-glass icc-widget icc-maya-advisor">
      <div className="icc-widget-header">
        <h3>Selected Project</h3>
        <Link to={`/projects/${project.id}`} className="icc-widget-link">Open</Link>
      </div>
      <p className="icc-maya-summary">
        <Link to={`/projects/${project.id}`} style={{ color: '#2fd4ff' }}>{project.name}</Link>
        {' '}— {project.sector}
      </p>
      <div className="icc-status-rows">
        <div className="icc-status-row"><span>Status</span><strong>{project.status}</strong></div>
        <div className="icc-status-row"><span>Stage</span><strong>{stage}</strong></div>
        <div className="icc-status-row"><span>Progress</span><strong>{project.progress}%</strong></div>
        <div className="icc-status-row"><span>Team</span><strong>{project.team_size}</strong></div>
        <div className="icc-status-row">
          <span>Tasks</span>
          <strong>{project.tasks_total > 0 ? `${project.tasks_completed}/${project.tasks_total}` : EMPTY.NO_DATA}</strong>
        </div>
        <div className="icc-status-row">
          <span>MAYA</span>
          <strong>{project.ai_score != null ? project.ai_score : EMPTY.NOT_AVAILABLE}</strong>
        </div>
        <div className="icc-status-row"><span>Updated</span><strong>{formatTimeAgo(project.updated_at)}</strong></div>
        <div className="icc-status-row"><span>Review</span><strong>{updateStatus}</strong></div>
      </div>
      <Link to={`/ai-assistant/analyze?projectId=${project.id}`} className="btn-analyze icc-clickable">
        Analyze with MAYA
      </Link>
    </div>
  );
}
