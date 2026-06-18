import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { AdminPrototypeRow, PrototypeActivityItem } from '../types/prototypeOpsAdmin.types';
import {
  buildRiskHeatmap,
  extractApprovalItems,
  extractEvidenceItems,
} from '../utils/prototypeOpsAdmin.utils';

interface PrototypeOpsPanelsProps {
  rows: AdminPrototypeRow[];
  activity: PrototypeActivityItem[];
  selected: AdminPrototypeRow | null;
}

export const PrototypeOpsPanels = memo(function PrototypeOpsPanels({
  rows,
  activity,
  selected,
}: PrototypeOpsPanelsProps) {
  const heatmap = buildRiskHeatmap(rows);
  const evidence = extractEvidenceItems(rows);
  const approvals = extractApprovalItems(rows);
  const impactLabels = ['Low', 'Medium', 'High'];
  const likelihoodLabels = ['Low', 'Med', 'High'];
  const twin = selected?.digitalTwin;

  return (
    <div className="admin-prototype-panels-grid">
      {twin ? (
        <div className="admin-prototype-panel admin-prototype-glass admin-prototype-digital-twin">
          <h4>Prototype Digital Twin — {selected?.name}</h4>
          <div className="admin-prototype-twin-grid">
            <TwinMetric label="Current Status" value={twin.currentStatus} />
            <TwinMetric label="Technical State" value={twin.technicalState} />
            <TwinMetric label="Experiment Status" value={twin.experimentStatus} />
            <TwinMetric label="Validation Status" value={twin.validationStatus} />
            <TwinMetric label="Funding Status" value={twin.fundingStatus} />
            <TwinMetric label="Commercialization" value={twin.commercializationStatus} />
          </div>
          <div className="admin-prototype-twin-forecasts">
            <Forecast label="Readiness Forecast" value={`${twin.readinessForecast}%`} />
            <Forecast label="Failure Prediction" value={`${twin.failurePrediction}/100`} warn />
            <Forecast label="Timeline Forecast" value={`${twin.timelineForecastDays} days`} />
            <Forecast label="Cost Forecast" value={`$${twin.costForecastUsd.toLocaleString()}`} />
          </div>
        </div>
      ) : null}

      <div className="admin-prototype-panel admin-prototype-glass">
        <h4>Risk Management Center</h4>
        <div className="admin-prototype-heatmap">
          <div className="admin-prototype-heatmap-corner" />
          {likelihoodLabels.map((label) => (
            <div key={`col-${label}`} className="admin-prototype-heatmap-col-label">
              {label}
            </div>
          ))}
          {impactLabels.map((impactLabel, rowIdx) => (
            <div key={`impact-row-${impactLabel}`} className="admin-prototype-heatmap-row">
              <div className="admin-prototype-heatmap-row-label">{impactLabel}</div>
              {likelihoodLabels.map((_, colIdx) => {
                const impact = 2 - rowIdx;
                const cell = heatmap.find(
                  (c) => c.impact === impact && c.likelihood === colIdx
                );
                return (
                  <div
                    key={`${impact}-${colIdx}`}
                    className={`admin-prototype-heatmap-cell admin-prototype-heatmap-cell--${cell?.tone ?? 'low'}`}
                  >
                    {cell?.count ?? 0}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {selected ? (
          <ul className="admin-prototype-risk-breakdown">
            {(
              [
                ['Technical', selected.risks.technical],
                ['Operational', selected.risks.operational],
                ['Security', selected.risks.security],
                ['Manufacturing', selected.risks.manufacturing],
                ['Financial', selected.risks.financial],
                ['Compliance', selected.risks.compliance],
                ['IP', selected.risks.ip],
                ['Market', selected.risks.market],
              ] as const
            ).map(([label, level]) => (
              <li key={label}>
                <span>{label}</span>
                <span className={`admin-prototype-risk-pill admin-prototype-risk-pill--${level}`}>
                  {level}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="admin-prototype-panel admin-prototype-glass">
        <h4>Evidence Repository</h4>
        <ul className="admin-prototype-evidence-list">
          {evidence.length === 0 ? (
            <li className="admin-muted">No evidence files linked yet.</li>
          ) : (
            evidence.map((item) => (
              <li key={item.id}>
                <span className="admin-prototype-evidence-icon">{item.icon}</span>
                <div>
                  <strong>{item.name}</strong>
                  <span className="admin-muted">{item.prototypeName}</span>
                </div>
              </li>
            ))
          )}
        </ul>
        <Link to="/admin/vault" className="admin-link admin-prototype-panel-link">
          View all evidence →
        </Link>
      </div>

      <div className="admin-prototype-panel admin-prototype-glass">
        <h4>Readiness Scoring Engine</h4>
        {selected ? (
          <div className="admin-prototype-readiness-bars">
            <ReadinessBar label="Documentation" value={selected.readiness.documentation} />
            <ReadinessBar label="Engineering" value={selected.readiness.engineering} />
            <ReadinessBar label="Testing" value={selected.readiness.testing} />
            <ReadinessBar label="Validation" value={selected.readiness.validation} />
            <ReadinessBar label="Funding" value={selected.readiness.funding} />
            <ReadinessBar label="Commercialization" value={selected.readiness.commercialization} />
            <div className="admin-prototype-readiness-overall">
              <span>Overall Readiness</span>
              <strong>{selected.readiness.overall}%</strong>
              <span className="admin-muted">AI Confidence {selected.readiness.aiConfidence}%</span>
            </div>
          </div>
        ) : (
          <p className="admin-muted">Select a prototype to view readiness breakdown.</p>
        )}
      </div>

      <div className="admin-prototype-panel admin-prototype-glass">
        <h4>Audit Center</h4>
        <ul className="admin-prototype-audit-timeline">
          {activity.slice(0, 6).map((item) => (
            <li key={item.id}>
              <span className="admin-prototype-audit-dot" />
              <div>
                <time>{new Date(item.at).toLocaleString()}</time>
                <span>{item.action}</span>
                <span className="admin-muted">{item.prototypeName}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-prototype-panel admin-prototype-glass">
        <h4>Approval Governance</h4>
        <ul className="admin-prototype-approval-list">
          {approvals.length === 0 ? (
            <li className="admin-muted">No pending approvals.</li>
          ) : (
            approvals.map((item) => (
              <li key={item.id}>
                <Link to={`/admin/prototypes/${item.prototypeId}`} className="admin-link">
                  {item.prototypeName}
                </Link>
                <span className="admin-muted">
                  {item.reviewerRole} · {item.status}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="admin-prototype-panel admin-prototype-glass">
        <h4>Testing Command Center</h4>
        {selected ? (
          <>
            <p className="admin-prototype-testing-summary">
              {selected.intel.tests.length} test run(s) · Pass rate{' '}
              {selected.intel.tests.length === 0
                ? 0
                : Math.round(
                    (selected.intel.tests.filter((t) => t.verdict === 'pass').length /
                      selected.intel.tests.length) *
                      100
                  )}
              %
            </p>
            <ul className="admin-prototype-test-list">
              {selected.intel.tests.length === 0 ? (
                <li className="admin-muted">No test runs recorded.</li>
              ) : (
                selected.intel.tests.map((t) => (
                  <li key={t.name}>
                    <span>{t.name}</span>
                    <span
                      className={`admin-prototype-test-verdict admin-prototype-test-verdict--${t.verdict}`}
                    >
                      {t.verdict}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </>
        ) : (
          <p className="admin-muted">Select a prototype for testing metrics.</p>
        )}
      </div>

      <div className="admin-prototype-panel admin-prototype-glass">
        <h4>Technical Architecture Center</h4>
        {selected ? (
          <ul className="admin-prototype-arch-list">
            <li>Hardware — {selected.intel.architectureLayers > 0 ? 'Documented' : 'Pending'}</li>
            <li>Software — {selected.intel.builds.length > 0 ? 'Active builds' : 'Not started'}</li>
            <li>Cloud — {selected.record.file_url ? 'Artifact deployed' : 'Pending'}</li>
            <li>AI — Maya intelligence linked</li>
            <li>Security — {selected.risks.security === 'low' ? 'Low risk' : 'Review required'}</li>
            <li>Integrations — {selected.intel.experiments.length} experiment(s)</li>
            <li>Dependencies — {selected.intel.files.length} file(s)</li>
          </ul>
        ) : (
          <p className="admin-muted">Select a prototype for architecture status.</p>
        )}
      </div>
    </div>
  );
});

function TwinMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-prototype-twin-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Forecast({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`admin-prototype-twin-forecast ${warn ? 'admin-prototype-twin-forecast--warn' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ReadinessBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-prototype-readiness-row">
      <span>{label}</span>
      <div className="admin-prototype-readiness-track">
        <div className="admin-prototype-readiness-fill" style={{ width: `${value}%` }} />
      </div>
      <strong>{value}%</strong>
    </div>
  );
}
