import { Link } from 'react-router-dom';
import { LIFECYCLE_LABELS } from '../types/prototype.types';
import type { PrototypeRecord } from '../types/prototype.types';

interface Props {
  prototype: PrototypeRecord;
  onDelete?: (id: string) => void;
  onEdit?: (prototype: PrototypeRecord) => void;
}

export function PrototypeCard({ prototype, onDelete }: Props) {
  return (
    <div className="proto-card">
      <div className="proto-card-thumb">
        {prototype.thumbnail_url ? (
          <img src={prototype.thumbnail_url} alt={prototype.name} loading="lazy" />
        ) : (
          <span className="proto-card-placeholder">📦</span>
        )}
      </div>
      <div className="proto-card-body">
        <h3>{prototype.name}</h3>
        <p className="proto-card-project">{prototype.project_name ?? 'Unlinked project'}</p>
        <p className="proto-card-desc">
          {(prototype.description ?? '').slice(0, 100)}
          {(prototype.description?.length ?? 0) > 100 ? '…' : ''}
        </p>
        <div className="proto-card-meta">
          <span>v{prototype.version}</span>
          <span className={`proto-lifecycle proto-lifecycle--${prototype.lifecycle_status}`}>
            {LIFECYCLE_LABELS[prototype.lifecycle_status]}
          </span>
        </div>
      </div>
      <div className="proto-card-actions">
        <Link to={`/prototypes/${prototype.id}`} className="proto-btn proto-btn--ghost">
          Workspace
        </Link>
        <Link to={`/prototypes/${prototype.id}/testing`} className="proto-btn proto-btn--ghost">
          Run test
        </Link>
        {prototype.file_url ? (
          <a href={prototype.file_url} target="_blank" rel="noreferrer" className="proto-btn proto-btn--ghost">
            View build
          </a>
        ) : null}
        {prototype.project_id ? (
          <Link to={`/projects/${prototype.project_id}`} className="proto-btn proto-btn--ghost">
            Project
          </Link>
        ) : null}
        {onDelete ? (
          <button type="button" className="proto-btn proto-btn--danger" onClick={() => onDelete(prototype.id)}>
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}
