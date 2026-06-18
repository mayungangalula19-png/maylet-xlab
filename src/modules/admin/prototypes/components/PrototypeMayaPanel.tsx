import { memo } from 'react';
import type { PrototypeOpsMaya } from '../types/prototypeOpsAdmin.types';

interface PrototypeMayaPanelProps {
  maya: PrototypeOpsMaya;
  onOpenAssistant?: () => void;
}

export const PrototypeMayaPanel = memo(function PrototypeMayaPanel({
  maya,
  onOpenAssistant,
}: PrototypeMayaPanelProps) {
  return (
    <aside className="admin-prototype-maya admin-prototype-glass">
      <div className="admin-prototype-maya-head">
        <div className="admin-prototype-maya-brand">
          <span className="admin-prototype-maya-icon">✨</span>
          <div>
            <h3>Maya AI Engineering Assistant</h3>
            <p className="admin-muted">Prototype intelligence &amp; governance</p>
          </div>
        </div>
      </div>

      <div className="admin-prototype-maya-alerts">
        {maya.anomalies[0] ? (
          <div className="admin-prototype-maya-alert admin-prototype-maya-alert--warn">
            <span>⚠</span>
            <div>
              <strong>Anomaly detected</strong>
              <p>{maya.anomalies[0]}</p>
            </div>
          </div>
        ) : null}
        {maya.improvements[0] ? (
          <div className="admin-prototype-maya-alert admin-prototype-maya-alert--error">
            <span>✕</span>
            <div>
              <strong>Optimization</strong>
              <p>{maya.improvements[0]}</p>
            </div>
          </div>
        ) : null}
        <div className="admin-prototype-maya-alert admin-prototype-maya-alert--success">
          <span>✓</span>
          <div>
            <strong>Success Prediction: {maya.successProbability}%</strong>
            <div className="admin-prototype-maya-progress">
              <div style={{ width: `${maya.successProbability}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-prototype-maya-summaries">
        <div className="admin-prototype-maya-summary-block">
          <h4>Executive Summary</h4>
          <p>{maya.executiveSummary}</p>
        </div>
        <div className="admin-prototype-maya-summary-block">
          <h4>Technical Summary</h4>
          <p>{maya.technicalSummary}</p>
        </div>
        <div className="admin-prototype-maya-summary-block">
          <h4>Engineering Report</h4>
          <p>{maya.engineeringReport}</p>
        </div>
      </div>

      <div className="admin-prototype-maya-forecasts">
        <div className="admin-prototype-maya-forecast-row">
          <span>Validation Readiness</span>
          <strong>{maya.validationReadiness}%</strong>
        </div>
        <div className="admin-prototype-maya-forecast-row">
          <span>Manufacturing Readiness</span>
          <strong>{maya.manufacturingReadiness}%</strong>
        </div>
        <div className="admin-prototype-maya-forecast-row admin-prototype-maya-forecast-row--funding">
          <span>Commercialization Prediction</span>
          <strong>{maya.commercializationPrediction}%</strong>
        </div>
        <div className="admin-prototype-maya-forecast-row">
          <span>AI Confidence</span>
          <strong>{maya.aiConfidence}%</strong>
        </div>
      </div>

      {maya.priorityPrototype ? (
        <div className="admin-prototype-maya-priority">
          <h4>Priority focus</h4>
          <p>{maya.priorityAction}</p>
        </div>
      ) : null}

      {onOpenAssistant ? (
        <button type="button" className="admin-btn admin-btn--primary admin-prototype-maya-cta" onClick={onOpenAssistant}>
          Open Maya Assistant
        </button>
      ) : null}
    </aside>
  );
});
