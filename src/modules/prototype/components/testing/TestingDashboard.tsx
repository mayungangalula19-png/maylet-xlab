import { TestingCommandCenter } from './TestingCommandCenter';
import { ValidationReadinessPanel } from './ValidationReadinessPanel';
import { UsabilityTestingPanel } from './UsabilityTestingPanel';
import { PerformanceTestingPanel } from './PerformanceTestingPanel';
import { SecurityTestingPanel } from './SecurityTestingPanel';
import { TestingAnalyticsDashboard } from './TestingAnalyticsDashboard';
import { ActivityTimeline } from './ActivityTimeline';
import type { PrototypeTestingWorkspace } from '../../types/prototypeTesting.types';
import type { TestingKPIs, ReadinessScores } from '../../utils/testingCenter.utils';

interface Props {
  workspace: PrototypeTestingWorkspace;
  kpis: TestingKPIs;
  readiness: ReadinessScores;
  securityScore: number;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeTestingWorkspace>) => void;
}

export function TestingDashboard({
  workspace,
  kpis,
  readiness,
  securityScore,
  disabled,
  onChange,
}: Props) {
  return (
    <div className="proto-test-dashboard">
      <TestingCommandCenter kpis={kpis} readiness={readiness} />
      <ValidationReadinessPanel readiness={readiness} />
      <div className="proto-test-dashboard__panels">
        <UsabilityTestingPanel workspace={workspace} disabled={disabled} onChange={onChange} />
        <PerformanceTestingPanel workspace={workspace} disabled={disabled} onChange={onChange} />
        <SecurityTestingPanel workspace={workspace} securityScore={securityScore} disabled={disabled} onChange={onChange} />
      </div>
      <TestingAnalyticsDashboard workspace={workspace} kpis={kpis} />
      <ActivityTimeline workspace={workspace} compact />
    </div>
  );
}
