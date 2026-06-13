import type { ValidationRecord } from '../types/validation.types';

interface Props {
  record: ValidationRecord;
  onPromote?: () => void;
  promoting?: boolean;
}

export function FundingReadinessPanel({ record, onPromote, promoting }: Props) {
  const canPromote = record.decision === 'pass' && !record.promoted_at;

  return (
    <section className="val-panel val-panel--funding">
      <h2>Funding readiness</h2>
      <ul className="val-checklist">
        <li className={record.scores.technical >= 60 ? 'ok' : 'warn'}>Technical validation ≥ 60</li>
        <li className={record.scores.user >= 60 ? 'ok' : 'warn'}>User validation ≥ 60</li>
        <li className={record.scores.market >= 60 ? 'ok' : 'warn'}>Market validation ≥ 60</li>
        <li className={record.scores.financial >= 60 ? 'ok' : 'warn'}>Financial validation ≥ 60</li>
        <li className={record.decision === 'pass' ? 'ok' : 'warn'}>Decision = PASS</li>
      </ul>

      {record.promoted_at ? (
        <p className="val-promoted-msg">Promoted to Funding on {new Date(record.promoted_at).toLocaleDateString()}</p>
      ) : (
        <button
          type="button"
          className="val-btn val-btn--primary"
          disabled={!canPromote || promoting}
          onClick={onPromote}
        >
          {promoting ? 'Promoting…' : 'Promote to Funding'}
        </button>
      )}
      {!canPromote && !record.promoted_at && (
        <p className="val-panel__hint">Set decision to PASS to unlock Funding promotion.</p>
      )}
    </section>
  );
}
