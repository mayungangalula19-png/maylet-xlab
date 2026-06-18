import { Link } from 'react-router-dom';
import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import { WORKSPACE_STAGES } from '../../types/prototypeCreation.types';
import type { PrototypeRecord } from '../../types/prototype.types';
import { LIFECYCLE_LABELS } from '../../types/prototype.types';

interface Props {
  prototype: PrototypeRecord;
  meta: PrototypeBuilderMeta;
  creatorLabel?: string;
  onShare: () => void;
  onDownloadSummary: () => void;
  onExportPdf: () => void;
}

export function PrototypeHero({
  prototype,
  meta,
  creatorLabel = 'Innovation team',
  onShare,
  onDownloadSummary,
  onExportPdf,
}: Props) {
  const stageLabel =
    WORKSPACE_STAGES.find((s) => s.id === meta.workspaceStage)?.label ?? meta.workspaceStage;

  return (
    <header className="proto-preview-hero">
      <div className="proto-preview-hero__content">
        <nav className="proto-breadcrumb">
          <Link to="/prototypes">Prototypes</Link>
          <span>/</span>
          <span>Presentation</span>
        </nav>
        <div className="proto-preview-hero__badges">
          <span className="proto-preview-badge">{meta.category || 'Prototype'}</span>
          {meta.industry ? <span className="proto-preview-badge proto-preview-badge--muted">{meta.industry}</span> : null}
          <span className={`proto-lifecycle proto-lifecycle--${prototype.lifecycle_status}`}>
            {LIFECYCLE_LABELS[prototype.lifecycle_status]}
          </span>
          <span className="proto-preview-badge proto-preview-badge--stage">{stageLabel}</span>
        </div>
        <h1>{prototype.name}</h1>
        <p className="proto-preview-hero__tagline">
          {meta.description.trim() || prototype.description || 'Innovation prototype presentation'}
        </p>
        {meta.tags.length > 0 ? (
          <div className="proto-preview-hero__tags">
            {meta.tags.map((t) => (
              <span key={t} className="proto-preview-tag">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <div className="proto-preview-hero__meta">
          <span>By {creatorLabel}</span>
          <span>Updated {new Date(prototype.updated_at).toLocaleDateString()}</span>
          <span>v{prototype.version}</span>
          <span>{prototype.views} views</span>
        </div>
      </div>
      <div className="proto-preview-hero__actions">
        <button type="button" className="proto-btn proto-btn--ghost" onClick={onShare}>
          Share
        </button>
        <button type="button" className="proto-btn proto-btn--secondary" onClick={onDownloadSummary}>
          Download summary
        </button>
        <button type="button" className="proto-btn proto-btn--secondary" onClick={onExportPdf}>
          Export PDF
        </button>
        <Link to={`/prototypes/${prototype.id}/build`} className="proto-btn proto-btn--secondary">
          View builder
        </Link>
        <Link to={`/validation/new?prototypeId=${prototype.id}`} className="proto-btn proto-btn--primary">
          Start validation
        </Link>
      </div>
    </header>
  );
}
