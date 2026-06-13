import { useState } from 'react';
import type { ResearchImpactResult } from '../types/research.types';

interface Props {
  impact: ResearchImpactResult | null;
  onRunAnalysis: () => void;
}

export function ResearchImpactPanel({ impact, onRunAnalysis }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="research-impact-panel">
      <div className="research-panel-header">
        <h2>Research Impact Analysis</h2>
        <button type="button" className="research-btn research-btn--primary" onClick={onRunAnalysis}>
          Run Impact Analysis
        </button>
      </div>

      {!impact ? (
        <p className="research-empty">Run analysis to see how research affects project decisions.</p>
      ) : (
        <>
          {impact.impactedProjects.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Affected projects</strong>
              {impact.impactedProjects.map((p) => (
                <div key={p.projectId} className="research-impact-action">
                  {p.projectName} — {p.reason}
                </div>
              ))}
            </div>
          )}

          {impact.suggestedActions.map((a) => (
            <div key={a.id} className="research-impact-action">
              <strong>[{a.type}] {a.title}</strong>
              <div>{a.detail}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>Confidence: {a.confidence}%</div>
            </div>
          ))}

          <button type="button" className="research-btn research-btn--secondary" onClick={() => setOpen(!open)}>
            {open ? 'Hide details' : 'Show details'}
          </button>

          {open && impact.riskChanges.length > 0 && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.78rem' }}>
              <strong>Risk changes</strong>
              {impact.riskChanges.map((r, i) => (
                <div key={i}>{r.projectId}: {r.from} → {r.to} ({r.reason})</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
