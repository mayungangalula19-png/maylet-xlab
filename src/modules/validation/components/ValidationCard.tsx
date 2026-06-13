import { Link } from 'react-router-dom';
import type { ValidationRecord } from '../types/validation.types';

const DECISION_CLASS: Record<string, string> = {
  pass: 'val-badge--pass',
  hold: 'val-badge--hold',
  fail: 'val-badge--fail',
  pending: 'val-badge--pending',
};

interface Props {
  record: ValidationRecord;
}

export function ValidationCard({ record }: Props) {
  return (
    <Link to={`/validation/${record.id}`} className="val-card">
      <div className="val-card__head">
        <h3>{record.project_name ?? 'Project'}</h3>
        <span className={`val-badge ${DECISION_CLASS[record.decision] ?? ''}`}>
          {record.decision.toUpperCase()}
        </span>
      </div>
      <p className="val-card__score">Readiness {record.scores.overall}/100</p>
      <div className="val-card__dims">
        <span>Tech {record.scores.technical}</span>
        <span>User {record.scores.user}</span>
        <span>Market {record.scores.market}</span>
        <span>Financial {record.scores.financial}</span>
      </div>
      {record.promoted_at && <span className="val-card__promoted">Promoted to Funding</span>}
    </Link>
  );
}
