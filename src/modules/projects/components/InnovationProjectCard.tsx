import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../../../types/project.types';
import { formatTimeAgo, getInnovationStage, type InnovationStage } from '../../../lib/innovation/lifecycle';
import { EMPTY } from '../../../lib/innovation/dashboardData';
import { InnovationLifecycleBar } from './InnovationLifecycleBar';

interface Props {
  project: Project;
  onDelete: (id: string) => void;
}

const STAGE_THEME: Record<InnovationStage, { bg: string; border: string; accent: string }> = {
  Idea: { bg: 'rgba(246, 201, 14, 0.2)', border: 'rgba(246, 201, 14, 0.45)', accent: '#f6c90e' },
  Research: { bg: 'rgba(47, 212, 255, 0.15)', border: 'rgba(47, 212, 255, 0.4)', accent: '#2fd4ff' },
  Prototype: { bg: 'rgba(124, 95, 230, 0.2)', border: 'rgba(124, 95, 230, 0.45)', accent: '#7c5fe6' },
  Experiment: { bg: 'rgba(236, 195, 11, 0.18)', border: 'rgba(236, 195, 11, 0.4)', accent: '#ecc30b' },
  Validation: { bg: 'rgba(72, 187, 120, 0.15)', border: 'rgba(72, 187, 120, 0.4)', accent: '#48bb78' },
  Funding: { bg: 'rgba(240, 147, 251, 0.15)', border: 'rgba(240, 147, 251, 0.4)', accent: '#f093fb' },
  Commercialization: { bg: 'rgba(79, 172, 254, 0.15)', border: 'rgba(79, 172, 254, 0.4)', accent: '#4facfe' },
};

function getProjectSymbol(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (words[0] || 'P').slice(0, 2).toUpperCase();
}

function getProjectColor(name: string) {
  const colors = ['#7c5fe6', '#2fd4ff', '#48bb78', '#f6c90e', '#f093fb', '#4facfe'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function InnovationProjectCard({ project, onDelete }: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const stage = getInnovationStage(project);
  const theme = STAGE_THEME[stage];
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const needsAction = daysSinceUpdate > 14;
  const updateLabel = needsAction ? EMPTY.ACTION_REQUIRED : formatTimeAgo(project.updated_at);

  const handleDelete = async () => {
    await onDelete(project.id);
    setShowDeleteDialog(false);
  };

  const cardStyle = {
    '--portfolio-accent': `linear-gradient(90deg, ${theme.accent}, #2fd4ff)`,
    '--portfolio-stage-bg': theme.bg,
    '--portfolio-stage-border': theme.border,
  } as CSSProperties;

  return (
    <>
      <article className="portfolio-card icc-glass" style={cardStyle}>
        <div className="portfolio-card__top">
          <Link
            to={`/projects/${project.id}`}
            className="portfolio-card__avatar"
            title={project.name}
            style={{ background: getProjectColor(project.name) }}
          >
            {getProjectSymbol(project.name)}
          </Link>
          <div className="portfolio-card__head">
            <Link to={`/projects/${project.id}`} className="portfolio-card__title-link">
              <h3 className="portfolio-card__title">{project.name}</h3>
            </Link>
            <div className="portfolio-card__tags">
              <span className="portfolio-card__sector">{project.sector}</span>
              <span className={`portfolio-card__updated${needsAction ? ' portfolio-card__updated--alert' : ''}`}>
                {updateLabel}
              </span>
            </div>
          </div>
          <span className="portfolio-card__stage">{stage}</span>
        </div>

        {project.description ? (
          <p className="portfolio-card__desc">{project.description}</p>
        ) : null}

        <div className="portfolio-card__progress">
          <div className="portfolio-card__progress-head">
            <span>Progress</span>
            <strong>{project.progress}%</strong>
          </div>
          <div className="portfolio-card__progress-bar">
            <div className="portfolio-card__progress-fill" style={{ width: `${project.progress}%` }} />
          </div>
          <InnovationLifecycleBar currentStage={stage} compact />
        </div>

        <div className="portfolio-card__stats">
          <div className="portfolio-card__stat">
            <strong>{project.status}</strong>
            <span>Status</span>
          </div>
          <div className="portfolio-card__stat">
            <strong>{project.progress}%</strong>
            <span>Progress</span>
          </div>
          <div className="portfolio-card__stat">
            <strong>{project.team_size}</strong>
            <span>Team</span>
          </div>
          <div className="portfolio-card__stat">
            <strong>
              {project.tasks_total > 0 ? `${project.tasks_completed}/${project.tasks_total}` : '—'}
            </strong>
            <span>Tasks</span>
          </div>
        </div>

        <div className="portfolio-card__footer">
          <span className="portfolio-card__maya">
            MAYA: <strong>{project.ai_score != null ? project.ai_score : EMPTY.NOT_AVAILABLE}</strong>
          </span>
          {needsAction ? (
            <span className="portfolio-card__badge portfolio-card__badge--alert">{EMPTY.ACTION_REQUIRED}</span>
          ) : null}
        </div>

        <div className="portfolio-card__actions">
          <Link to={`/projects/${project.id}`} className="portfolio-card__btn-primary">
            Open
          </Link>
          <Link to={`/projects/${project.id}/edit`} className="portfolio-card__btn-secondary">
            Edit
          </Link>
          <div className="portfolio-card__shortcuts">
            <Link to={`/research/${project.id}`} className="portfolio-card__shortcut">Research</Link>
            <Link to={`/experiments/new?projectId=${project.id}`} className="portfolio-card__shortcut">Lab</Link>
            <Link to="/funding" className="portfolio-card__shortcut">Fund</Link>
            <Link to={`/ai-assistant/analyze?projectId=${project.id}`} className="portfolio-card__shortcut">MAYA</Link>
          </div>
          <button type="button" onClick={() => setShowDeleteDialog(true)} className="portfolio-card__btn-remove">
            Remove
          </button>
        </div>
      </article>

      {showDeleteDialog && (
        <div className="portfolio-dialog-overlay" role="presentation" onClick={() => setShowDeleteDialog(false)}>
          <div
            className="portfolio-dialog icc-glass"
            role="dialog"
            aria-labelledby="delete-project-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-project-title">Remove project?</h3>
            <p>
              &quot;{project.name}&quot; will be permanently deleted. This cannot be undone.
            </p>
            <div className="portfolio-dialog__actions">
              <button type="button" onClick={() => setShowDeleteDialog(false)} className="portfolio-dialog__cancel">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} className="portfolio-dialog__confirm">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
