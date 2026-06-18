import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { AdminExperimentRow, ExperimentActivityItem } from '../types/experimentOpsAdmin.types';
import {
  buildRiskHeatmap,
  extractApprovalItems,
  extractEvidenceItems,
} from '../utils/experimentOpsAdmin.utils';

interface ExperimentOpsPanelsProps {
  rows: AdminExperimentRow[];
  activity: ExperimentActivityItem[];
}

export const ExperimentOpsPanels = memo(function ExperimentOpsPanels({
  rows,
  activity,
}: ExperimentOpsPanelsProps) {
  const heatmap = buildRiskHeatmap(rows);
  const evidence = extractEvidenceItems(rows);
  const approvals = extractApprovalItems(rows);
  const impactLabels = ['Low', 'Medium', 'High'];
  const likelihoodLabels = ['Low', 'Med', 'High'];

  return (
    <div className="admin-experiment-panels-grid">
      <div className="admin-experiment-panel admin-experiment-glass">
        <h4>Risk Management Matrix</h4>
        <div className="admin-experiment-heatmap">
          <div className="admin-experiment-heatmap-corner" />
          {likelihoodLabels.map((label) => (
            <div key={`col-${label}`} className="admin-experiment-heatmap-col-label">
              {label}
            </div>
          ))}
          {impactLabels.map((impactLabel, rowIdx) => (
            <div key={`impact-row-${impactLabel}`} className="admin-experiment-heatmap-row">
              <div className="admin-experiment-heatmap-row-label">{impactLabel}</div>
              {likelihoodLabels.map((_, colIdx) => {
                const impact = 2 - rowIdx;
                const cell = heatmap.find(
                  (c) => c.impact === impact && c.likelihood === colIdx
                );
                return (
                  <div
                    key={`${impact}-${colIdx}`}
                    className={`admin-experiment-heatmap-cell admin-experiment-heatmap-cell--${cell?.tone ?? 'low'}`}
                  >
                    {cell?.count ?? 0}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="admin-experiment-panel admin-experiment-glass">
        <h4>Evidence Repository</h4>
        <ul className="admin-experiment-evidence-list">
          {evidence.length === 0 ? (
            <li className="admin-muted">No evidence files linked yet.</li>
          ) : (
            evidence.map((item) => (
              <li key={item.id}>
                <span className="admin-experiment-evidence-icon">{item.icon}</span>
                <div>
                  <strong>{item.name}</strong>
                  <span className="admin-muted">{item.experimentTitle}</span>
                </div>
              </li>
            ))
          )}
        </ul>
        <Link to="/admin/vault" className="admin-link admin-experiment-panel-link">
          View all evidence →
        </Link>
      </div>

      <div className="admin-experiment-panel admin-experiment-glass">
        <h4>Audit Trail</h4>
        <ul className="admin-experiment-audit-timeline">
          {activity.slice(0, 5).map((item) => (
            <li key={item.id}>
              <span className="admin-experiment-audit-dot" />
              <div>
                <time>{new Date(item.at).toLocaleString()}</time>
                <span>{item.action}</span>
                <span className="admin-muted">{item.experimentTitle}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-experiment-panel admin-experiment-glass">
        <h4>Approval Workflow</h4>
        <ul className="admin-experiment-approval-list">
          {approvals.length === 0 ? (
            <li className="admin-muted">No pending approvals.</li>
          ) : (
            approvals.map((item) => (
              <li key={item.id}>
                <span className="admin-experiment-approval-avatar">
                  {item.researcher.charAt(0)}
                </span>
                <div>
                  <strong>{item.kind}</strong>
                  <span>{item.title}</span>
                  <span className="admin-muted">{item.detail}</span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
});
