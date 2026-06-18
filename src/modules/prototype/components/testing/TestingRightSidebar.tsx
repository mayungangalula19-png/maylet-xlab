import type { PrototypeAiEvaluation } from '../../types/prototype.types';
import type { ReadinessScores } from '../../utils/testingCenter.utils';
import { getRiskLevel } from '../../ai/riskAnalyzer';
import { AIPrototypeTestingAssistant } from './AIPrototypeTestingAssistant';
import type { PrototypeTestingWorkspace } from '../../types/prototypeTesting.types';
import type { TestingKPIs } from '../../utils/testingCenter.utils';

interface Props {
  workspace: PrototypeTestingWorkspace;
  kpis: TestingKPIs;
  readiness: ReadinessScores;
  aiEval: PrototypeAiEvaluation | null;
  prototypeName: string;
  disabled?: boolean;
  onApplyCases?: (titles: string[]) => void;
}

export function TestingRightSidebar({
  workspace,
  kpis,
  readiness,
  aiEval,
  prototypeName,
  disabled,
  onApplyCases,
}: Props) {
  const riskLevel = getRiskLevel(readiness.riskScore);

  return (
    <aside className="proto-test-aside" aria-label="Testing intelligence">
      <AIPrototypeTestingAssistant
        workspace={workspace}
        kpis={kpis}
        readiness={readiness}
        prototypeName={prototypeName}
        disabled={disabled}
        onApplyCases={onApplyCases}
      />

      <section className="proto-test-insights">
        <h3>Validation insights</h3>
        <ul>
          <li>Readiness index: <strong>{readiness.readinessIndex}%</strong></li>
          <li>Testing completion: <strong>{readiness.completionPct}%</strong></li>
          <li>Security score: <strong>{readiness.securityScore}%</strong></li>
          <li>Open defects: <strong>{workspace.defects.filter((d) => d.status === 'open').length}</strong></li>
        </ul>
        <p className="proto-test-insights__verdict">
          {readiness.readinessIndex >= 75
            ? 'Quality gate: ready for validation submission.'
            : 'Quality gate: continue testing before validation.'}
        </p>
      </section>

      <section className="proto-test-insights proto-test-insights--risk">
        <h3>Risk analysis</h3>
        {aiEval ? (
          <>
            <p className={`proto-test-risk proto-test-risk--${riskLevel.toLowerCase()}`}>
              Risk level: <strong>{riskLevel}</strong> ({readiness.riskScore}/100)
            </p>
            <p>{aiEval.explanation}</p>
            <p className="proto-muted">
              {readiness.riskScore >= 70 ? 'Elevated risk — address failures before validation.' : readiness.riskScore >= 40 ? 'Moderate risk — monitor defect trends.' : 'Low risk — maintain test coverage.'}
            </p>
            {aiEval.improvements.length > 0 ? (
              <ul className="proto-test-risk-list">
                {aiEval.improvements.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="proto-muted">Run tests and upload builds to unlock MAYA risk analysis.</p>
        )}
      </section>
    </aside>
  );
}
