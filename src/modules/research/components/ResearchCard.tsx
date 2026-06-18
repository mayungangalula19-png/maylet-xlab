import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ResearchProjectSummary } from '../types/research.types';

interface Props {
  project: ResearchProjectSummary;
  active?: boolean;
}

type CompletionTier = 'ready' | 'strong' | 'progress' | 'start';

function completionTier(rate: number): CompletionTier {
  if (rate >= 100) return 'ready';
  if (rate >= 60) return 'strong';
  if (rate > 0) return 'progress';
  return 'start';
}

function tierLabel(tier: CompletionTier): string {
  switch (tier) {
    case 'ready':
      return 'Gate ready';
    case 'strong':
      return 'Strong progress';
    case 'progress':
      return 'In progress';
    default:
      return 'Getting started';
  }
}

function sectorIcon(sector: string): string {
  const s = sector.toLowerCase();
  if (s.includes('health') || s.includes('med')) return '🏥';
  if (s.includes('fin') || s.includes('bank')) return '💳';
  if (s.includes('edu')) return '🎓';
  if (s.includes('agri') || s.includes('food')) return '🌾';
  if (s.includes('energy') || s.includes('climate')) return '⚡';
  if (s.includes('retail') || s.includes('commerce')) return '🛒';
  return '🔬';
}

export function ResearchCard({ project, active }: Props) {
  const tier = completionTier(project.completionRate);

  const statParts = useMemo(() => {
    const parts: string[] = [];
    if (project.notesCount != null && project.notesCount > 0) {
      parts.push(`${project.notesCount} note${project.notesCount === 1 ? '' : 's'}`);
    }
    if (project.findingsCount != null && project.findingsCount > 0) {
      parts.push(`${project.findingsCount} finding${project.findingsCount === 1 ? '' : 's'}`);
    }
    if (project.literatureCount != null && project.literatureCount > 0) {
      parts.push(`${project.literatureCount} source${project.literatureCount === 1 ? '' : 's'}`);
    }
    if (project.documentsCount != null && project.documentsCount > 0) {
      parts.push(`${project.documentsCount} doc${project.documentsCount === 1 ? '' : 's'}`);
    }
    return parts;
  }, [project]);

  return (
    <Link
      to={`/research/${project.id}`}
      className={`research-project-item research-card research-card--${tier}${active ? ' research-project-item--active research-card--active' : ''}`}
      aria-label={`Open ${project.name} research workspace, ${project.completionRate}% complete`}
    >
      <div className="research-card__head">
        <span className="research-card__icon" aria-hidden>
          {sectorIcon(project.sector)}
        </span>
        <div className="research-card__titles">
          <strong title={project.name}>{project.name}</strong>
          <span className="research-card__sector">{project.sector || 'General'}</span>
        </div>
        <span className="research-card__chevron" aria-hidden>
          →
        </span>
      </div>

      <div className="research-card__progress">
        <div className="research-card__progress-labels">
          <span className={`research-card__tier research-card__tier--${tier}`}>{tierLabel(tier)}</span>
          <strong>{project.completionRate}%</strong>
        </div>
        <div
          className="research-progress-mini research-card__bar"
          role="progressbar"
          aria-valuenow={project.completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div style={{ width: `${Math.min(100, Math.max(0, project.completionRate))}%` }} />
        </div>
      </div>

      {statParts.length > 0 ? (
        <p className="research-card__stats">{statParts.join(' · ')}</p>
      ) : (
        <p className="research-card__stats research-card__stats--empty">No research artifacts yet</p>
      )}
    </Link>
  );
}
