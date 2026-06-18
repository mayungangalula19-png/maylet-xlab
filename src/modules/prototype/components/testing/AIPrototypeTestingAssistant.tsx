import { useMemo, useState } from 'react';
import type { PrototypeTestingWorkspace } from '../../types/prototypeTesting.types';
import type { TestingKPIs, ReadinessScores } from '../../utils/testingCenter.utils';
import { TEST_CATEGORIES } from '../../types/prototypeTesting.types';

type AiAction = 'generate_cases' | 'missing_tests' | 'analyze_defects' | 'risk' | 'report' | 'readiness';

interface Props {
  workspace: PrototypeTestingWorkspace;
  kpis: TestingKPIs;
  readiness: ReadinessScores;
  prototypeName: string;
  disabled?: boolean;
  onApplyCases?: (titles: string[]) => void;
}

export function AIPrototypeTestingAssistant({ workspace, kpis, readiness, prototypeName, disabled, onApplyCases }: Props) {
  const [output, setOutput] = useState<string | null>(null);

  const missingCategories = useMemo(() => {
    const covered = new Set(workspace.testCases.map((c) => c.category));
    return TEST_CATEGORIES.filter((c) => !covered.has(c.id)).map((c) => c.label);
  }, [workspace.testCases]);

  const run = (action: AiAction) => {
    switch (action) {
      case 'generate_cases':
        setOutput(
          ['Login flow validation', 'Core workflow E2E', 'Error handling paths', 'Mobile responsive check', 'API integration smoke'].join('\n• ')
        );
        break;
      case 'missing_tests':
        setOutput(missingCategories.length ? `Missing: ${missingCategories.join(', ')}` : 'All test categories covered.');
        break;
      case 'analyze_defects':
        setOutput(
          workspace.defects.length
            ? `${workspace.defects.filter((d) => d.severity === 'critical').length} critical · ${workspace.defects.filter((d) => d.status === 'open').length} open`
            : 'No defects — maintain regression suite.'
        );
        break;
      case 'risk':
        setOutput(`Risk score ${readiness.riskScore}/100. Failed tests: ${kpis.failed}. Critical defects: ${kpis.criticalIssues}.`);
        break;
      case 'report':
        setOutput(`# ${prototypeName} Testing Summary\n\nQuality: ${kpis.qualityScore}%\nPass rate: ${kpis.passRate}%\nReadiness: ${readiness.readinessIndex}%`);
        break;
      case 'readiness':
        setOutput(
          readiness.readinessIndex >= 75
            ? 'Recommend moving to Validation Center with current evidence package.'
            : `Complete ${100 - readiness.completionPct}% more test execution before validation.`
        );
        break;
    }
  };

  const actions: { id: AiAction; label: string }[] = [
    { id: 'generate_cases', label: 'Generate test cases' },
    { id: 'missing_tests', label: 'Suggest missing tests' },
    { id: 'analyze_defects', label: 'Analyze defects' },
    { id: 'risk', label: 'Predict risks' },
    { id: 'report', label: 'Testing report' },
    { id: 'readiness', label: 'Validation readiness' },
  ];

  return (
    <aside className="proto-test-ai" aria-label="AI testing assistant">
      <h2>AI testing assistant</h2>
      <div className="proto-test-ai__actions">
        {actions.map((a) => (
          <button key={a.id} type="button" className="proto-test-ai__btn" disabled={disabled} onClick={() => run(a.id)}>
            {a.label}
          </button>
        ))}
      </div>
      {output ? (
        <div className="proto-test-ai__output">
          <pre>{output}</pre>
          {onApplyCases && output.includes('•') ? (
            <button type="button" className="proto-btn proto-btn--secondary" onClick={() => onApplyCases(output.split('\n• ').filter(Boolean))}>
              Apply cases
            </button>
          ) : null}
        </div>
      ) : (
        <p className="proto-muted">Run AI actions for testing guidance.</p>
      )}
    </aside>
  );
}
