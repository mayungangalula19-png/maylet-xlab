import { Link } from 'react-router-dom';
import type { ResearchProjectSummary } from '../types/research.types';

interface Props {
  project: ResearchProjectSummary;
  active?: boolean;
}

export function ResearchCard({ project, active }: Props) {
  return (
    <Link
      to={`/research/${project.id}`}
      className={`research-project-item${active ? ' research-project-item--active' : ''}`}
    >
      <strong>{project.name}</strong>
      <span>{project.sector}</span>
      <div className="research-progress-mini">
        <div style={{ width: `${project.completionRate}%` }} />
      </div>
      <span>{project.completionRate}% complete</span>
    </Link>
  );
}
