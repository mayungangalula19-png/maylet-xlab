import type { ValidationScores } from '../types/validation.types';

const LABELS: { key: keyof ValidationScores; label: string; color: string }[] = [
  { key: 'technical', label: 'Technical', color: '#7c5fe6' },
  { key: 'user', label: 'User', color: '#2fd4ff' },
  { key: 'market', label: 'Market', color: '#48bb78' },
  { key: 'financial', label: 'Financial', color: '#f6ad55' },
];

interface Props {
  scores: ValidationScores;
}

export function ValidationScorePanel({ scores }: Props) {
  return (
    <section className="val-panel">
      <h2>Scoring</h2>
      <div className="val-overall">
        <span>Overall readiness</span>
        <strong>{scores.overall}/100</strong>
      </div>
      <div className="val-bars">
        {LABELS.map(({ key, label, color }) => (
          <div key={key} className="val-bar-row">
            <div className="val-bar-label">
              <span>{label}</span>
              <strong>{scores[key]}</strong>
            </div>
            <div className="val-bar-track">
              <div className="val-bar-fill" style={{ width: `${scores[key]}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
