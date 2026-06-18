import { Link } from 'react-router-dom';
import type { PrototypeRecord } from '../../types/prototype.types';
import type { ReadinessScores, TestingKPIs } from '../../utils/testingCenter.utils';
import { getRiskLevel } from '../../ai/riskAnalyzer';

interface Props {
  prototype: PrototypeRecord;
  kpis: TestingKPIs;
  readiness: ReadinessScores;
  riskScore: number;
  onCreatePlan: () => void;
  onRunSuite: () => void;
  onUploadEvidence: () => void;
  onExport: () => void;
  onSubmitValidation: () => void;
}

export function TestingExecutiveHeader({
  prototype,
  kpis,
  readiness,
  riskScore,
  onCreatePlan,
  onRunSuite,
  onUploadEvidence,
  onExport,
  onSubmitValidation,
}: Props) {
  const testingStatus =
    prototype.lifecycle_status === 'success'
      ? 'Validated'
      : prototype.lifecycle_status === 'testing'
        ? 'In testing'
        : prototype.lifecycle_status === 'failed'
          ? 'Failed'
          : 'Ready';

  const riskLevel = getRiskLevel(riskScore);

  return (
    <header className="proto-test-executive">
      <div>
        <nav className="proto-breadcrumb">
          <Link to="/prototypes">Prototypes</Link>
          <span>/</span>
          <Link to={`/prototypes/${prototype.id}/workspace`}>{prototype.name}</Link>
          <span>/</span>
          <span>Testing operations</span>
        </nav>
        <h1>{prototype.name}</h1>
        <p className="proto-test-executive__sub">
          v{prototype.version} · {testingStatus} · Quality {kpis.qualityScore}% · Risk {riskLevel}
        </p>
        <div className="proto-test-executive__scores">
          <span>Validation readiness <strong>{readiness.readinessIndex}%</strong></span>
          <span>Completion <strong>{readiness.completionPct}%</strong></span>
          <span>Risk score <strong>{riskScore}</strong></span>
        </div>
      </div>
      <div className="proto-test-executive__actions">
        <button type="button" className="proto-btn proto-btn--primary" onClick={onCreatePlan}>
          Create test plan
        </button>
        <button type="button" className="proto-btn proto-btn--secondary" onClick={onRunSuite}>
          Run test suite
        </button>
        <button type="button" className="proto-btn proto-btn--secondary" onClick={onUploadEvidence}>
          Upload evidence
        </button>
        <button type="button" className="proto-btn proto-btn--ghost" onClick={onExport}>
          Export report
        </button>
        <button type="button" className="proto-btn proto-btn--ghost" onClick={onSubmitValidation}>
          Submit for validation
        </button>
      </div>
    </header>
  );
}
