import { memo } from 'react';
import type { VaultOpsMaya } from '../types/vaultOpsAdmin.types';

interface VaultMayaPanelProps {
  maya: VaultOpsMaya;
  onOpenAssistant?: () => void;
}

export const VaultMayaPanel = memo(function VaultMayaPanel({ maya, onOpenAssistant }: VaultMayaPanelProps) {
  return (
    <aside className="admin-vault-maya admin-vault-glass">
      <div className="admin-vault-maya-head">
        <span className="admin-vault-maya-icon">✨</span>
        <div>
          <h3>AI Knowledge Engine</h3>
          <p className="admin-muted">Maya AI · Summarize · Insights · Knowledge graphs</p>
        </div>
      </div>

      <div className="admin-vault-maya-summary">
        <h4>Executive Summary</h4>
        <p>{maya.executiveSummary}</p>
      </div>

      {maya.duplicateWarnings.length > 0 ? (
        <div className="admin-vault-maya-alert admin-vault-maya-alert--warn">
          <strong>Duplicate knowledge detected</strong>
          <ul>
            {maya.duplicateWarnings.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {maya.missingDocumentation.length > 0 ? (
        <div className="admin-vault-maya-alert">
          <strong>Missing documentation</strong>
          <ul>
            {maya.missingDocumentation.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="admin-vault-maya-insights">
        <h4>Knowledge graph insights</h4>
        <ul>
          {maya.knowledgeGraphInsights.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>

      <div className="admin-vault-maya-recs">
        <h4>Related asset recommendations</h4>
        <ul>
          {maya.relatedRecommendations.length === 0 ? (
            <li className="admin-muted">No recommendations at this time.</li>
          ) : (
            maya.relatedRecommendations.map((r) => <li key={r}>{r}</li>)
          )}
        </ul>
      </div>

      <div className="admin-vault-maya-confidence">
        <span>AI Confidence</span>
        <strong>{maya.aiConfidence}%</strong>
        <div className="admin-vault-maya-progress">
          <div style={{ width: `${maya.aiConfidence}%` }} />
        </div>
      </div>

      {maya.priorityAsset ? (
        <div className="admin-vault-maya-priority">
          <h4>Priority</h4>
          <p>{maya.priorityAction}</p>
        </div>
      ) : null}

      {onOpenAssistant ? (
        <button type="button" className="admin-btn admin-btn--primary admin-vault-maya-cta" onClick={onOpenAssistant}>
          Open Maya Assistant
        </button>
      ) : null}
    </aside>
  );
});
