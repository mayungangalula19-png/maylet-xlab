import type { ValidationMayaInsight } from '../types/validation.types';

interface Props {
  insights: ValidationMayaInsight[];
  onAskMaya?: () => void;
  mayaLoading?: boolean;
}

export function MayaValidationInsights({ insights, onAskMaya, mayaLoading }: Props) {
  return (
    <section className="val-panel val-panel--maya">
      <div className="val-panel__head-row">
        <h2>MAYA AI insights</h2>
        {onAskMaya && (
          <button type="button" className="val-btn val-btn--ghost" onClick={onAskMaya} disabled={mayaLoading}>
            {mayaLoading ? 'Analyzing…' : 'Ask MAYA'}
          </button>
        )}
      </div>
      <ul className="val-insights">
        {insights.map((item) => (
          <li key={item.id} className={`val-insight val-insight--${item.severity}`}>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
