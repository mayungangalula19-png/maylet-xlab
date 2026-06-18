import { Link } from 'react-router-dom';
import type { PortfolioItem } from '../../types/commandCenter.types';
import { INNOVATION_STAGES } from '../../types/commandCenter.types';

interface Props {
  item: PortfolioItem;
  onArchive?: (id: string) => void;
}

export function PortfolioCard({ item, onArchive }: Props) {
  const { prototype: p, meta, stage, completion, validationScore, fundingScore, readinessIndex } = item;
  const stageLabel = INNOVATION_STAGES.find((s) => s.id === stage)?.label ?? stage;

  return (
    <article className={`proto-cc-card proto-cc-card--risk-${item.riskLevel}`}>
      <div className="proto-cc-card__thumb">
        {p.thumbnail_url ? (
          <img src={p.thumbnail_url} alt="" loading="lazy" />
        ) : (
          <span>📦</span>
        )}
      </div>
      <div className="proto-cc-card__body">
        <div className="proto-cc-card__top">
          <h3>{p.name}</h3>
          <span className="proto-cc-card__stage">{stageLabel}</span>
        </div>
        <p className="proto-cc-card__meta">
          {meta.category || 'MVP'} · {meta.industry || 'General'}
        </p>
        <div className="proto-cc-card__scores">
          <span title="Completion">{completion}%</span>
          <span title="Validation">{validationScore}</span>
          <span title="Funding">{fundingScore}</span>
          <span title="Readiness" className="proto-cc-card__readiness">
            {readinessIndex}
          </span>
        </div>
        <div className="proto-cc-card__bar">
          <div style={{ width: `${completion}%` }} />
        </div>
        <time className="proto-cc-card__time">
          {new Date(item.lastActivity).toLocaleDateString()}
        </time>
      </div>
      <div className="proto-cc-card__actions">
        <Link to={`/prototypes/${p.id}/workspace`} className="proto-btn proto-btn--ghost">
          Open
        </Link>
        <Link to={`/prototypes/${p.id}/build`} className="proto-btn proto-btn--ghost">
          Edit
        </Link>
        <Link to={`/prototypes/${p.id}/preview`} className="proto-btn proto-btn--ghost">
          Preview
        </Link>
        <Link to={`/validation/new?prototypeId=${p.id}`} className="proto-btn proto-btn--ghost">
          Validate
        </Link>
        {onArchive ? (
          <button type="button" className="proto-btn proto-btn--ghost" onClick={() => onArchive(p.id)}>
            Archive
          </button>
        ) : null}
      </div>
    </article>
  );
}
