import { memo } from 'react';
import type { ExperimentOpsMaya } from '../../../../lib/experiment/experimentOps';

interface MayaIntelligencePanelProps {
  maya: ExperimentOpsMaya;
  onOpenAssistant?: () => void;
}

export const MayaIntelligencePanel = memo(function MayaIntelligencePanel({
  maya,
  onOpenAssistant,
}: MayaIntelligencePanelProps) {
  const warningText =
    maya.anomalies[0] ?? maya.patterns[0] ?? 'Monitoring experiment portfolio for anomalies.';
  const errorText =
    maya.improvements[0] ?? 'Review high-risk experiments in the registry.';
  const forecastLabel =
    maya.predictedValidationOutcome === 'PASS'
      ? 'Q3 2024'
      : maya.predictedValidationOutcome === 'FAIL'
        ? 'Hold — remediation required'
        : 'Q4 2024';

  return (
    <aside className="admin-experiment-maya admin-experiment-glass">
      <div className="admin-experiment-maya-head">
        <div className="admin-experiment-maya-brand">
          <span className="admin-experiment-maya-icon">✨</span>
          <div>
            <h3>Maya AI Intelligence Center</h3>
          </div>
        </div>
      </div>

      <div className="admin-experiment-maya-alerts">
        <div className="admin-experiment-maya-alert admin-experiment-maya-alert--warn">
          <span className="admin-experiment-maya-alert-icon">⚠</span>
          <div>
            <strong>Anomaly detected</strong>
            <p>{warningText}</p>
          </div>
        </div>
        <div className="admin-experiment-maya-alert admin-experiment-maya-alert--error">
          <span className="admin-experiment-maya-alert-icon">✕</span>
          <div>
            <strong>Resource constraint</strong>
            <p>{errorText}</p>
          </div>
        </div>
        <div className="admin-experiment-maya-alert admin-experiment-maya-alert--success">
          <span className="admin-experiment-maya-alert-icon">✓</span>
          <div>
            <strong>Success Prediction: {maya.successProbability}%</strong>
            <div className="admin-experiment-maya-progress">
              <div style={{ width: `${maya.successProbability}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-experiment-maya-forecasts">
        <div className="admin-experiment-maya-forecast-row">
          <span>Validation Forecast</span>
          <strong>{forecastLabel}</strong>
        </div>
        <div className="admin-experiment-maya-forecast-row admin-experiment-maya-forecast-row--funding">
          <span>Funding Recommendation</span>
          <strong>
            {maya.predictedValidationOutcome === 'PASS'
              ? 'Approve next tranche'
              : maya.predictedValidationOutcome === 'FAIL'
                ? 'Defer funding review'
                : 'Conditional hold'}
          </strong>
        </div>
      </div>

      {maya.priorityExperiment ? (
        <div className="admin-experiment-maya-priority">
          <h4>Priority focus</h4>
          <p className="admin-experiment-maya-priority-title">{maya.priorityExperiment.title}</p>
          <p className="admin-muted">{maya.priorityAction}</p>
        </div>
      ) : null}

      <button
        type="button"
        className="admin-btn admin-btn--primary admin-experiment-maya-cta"
        onClick={onOpenAssistant}
      >
        Open Maya AI Assistant
      </button>
    </aside>
  );
});
