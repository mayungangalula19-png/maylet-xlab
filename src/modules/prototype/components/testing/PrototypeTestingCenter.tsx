import { useNavigate } from 'react-router-dom';
import { downloadReport } from '../../utils/testingCenter.utils';
import { newTestingId } from '../../types/prototypeTesting.types';
import type { TestingSectionId } from '../../types/prototypeTesting.types';
import { DefectTracker } from './DefectTracker';
import { EvidenceCenter } from './EvidenceCenter';
import { ReportingCenter } from './ReportingCenter';
import { TestCaseManager } from './TestCaseManager';
import { TestExecutionCenter } from './TestExecutionCenter';
import { TestPlanManager } from './TestPlanManager';
import { TestingDashboard } from './TestingDashboard';
import { TestingExecutiveHeader } from './TestingExecutiveHeader';
import { TestingRightSidebar } from './TestingRightSidebar';
import { TestingSidebar } from './TestingSidebar';
import type { usePrototypeTestingCenter } from '../../hooks/usePrototypeTestingCenter';

type TestingState = ReturnType<typeof usePrototypeTestingCenter>;

interface Props extends TestingState {
  author: string;
  disabled?: boolean;
}

export function PrototypeTestingCenter({
  prototype,
  tests,
  aiEval,
  workspace,
  patchWorkspace,
  logActivity,
  kpis,
  readiness,
  recordTest,
  runTestSuite,
  exportReport,
  activeSection,
  setActiveSection,
  saveNow,
  disabled,
}: Props) {
  const navigate = useNavigate();

  if (!prototype) return null;

  const section = activeSection as TestingSectionId | 'dashboard';
  const riskScore = readiness.riskScore;

  const handleExport = () => {
    const text = exportReport();
    downloadReport(text, `${prototype.name.replace(/\s+/g, '-').toLowerCase()}-testing-report.md`);
    logActivity('Exported testing report', 'validation');
  };

  const handleSubmitValidation = () => {
    saveNow();
    logActivity('Submitted for validation review', 'validation');
    navigate(`/validation/new?prototypeId=${prototype.id}`);
  };

  const handleCreatePlan = () => {
    setActiveSection('plans');
    patchWorkspace({
      testPlans: [
        {
          id: newTestingId(),
          title: 'New test plan',
          objective: '',
          scope: '',
          methodology: '',
          successCriteria: '',
          exitCriteria: '',
          owner: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...workspace.testPlans,
      ],
    });
  };

  const handleApplyCases = (titles: string[]) => {
    patchWorkspace({
      testCases: [
        ...workspace.testCases,
        ...titles.map((title) => ({
          id: newTestingId(),
          planId: workspace.testPlans[0]?.id ?? null,
          title,
          description: '',
          priority: 'medium' as const,
          category: 'functional' as const,
          expectedResult: '',
          actualResult: '',
          status: 'pending' as const,
          tester: '',
          testedAt: null,
          startedAt: null,
          endedAt: null,
          durationMs: null,
        })),
      ],
    });
    logActivity(`AI generated ${titles.length} test cases`, 'execution');
  };

  const renderWorkspace = () => {
    if (section === 'dashboard') {
      return (
        <TestingDashboard
          workspace={workspace}
          kpis={kpis}
          readiness={readiness}
          securityScore={readiness.securityScore}
          disabled={disabled}
          onChange={patchWorkspace}
        />
      );
    }

    switch (section) {
      case 'plans':
        return <TestPlanManager workspace={workspace} disabled={disabled} onChange={patchWorkspace} />;
      case 'cases':
        return <TestCaseManager workspace={workspace} disabled={disabled} onChange={patchWorkspace} />;
      case 'runs':
        return (
          <TestExecutionCenter
            workspace={workspace}
            dbRuns={tests}
            disabled={disabled}
            onRecord={recordTest}
            onChange={patchWorkspace}
            onBulkRun={runTestSuite}
          />
        );
      case 'defects':
        return <DefectTracker workspace={workspace} disabled={disabled} onChange={patchWorkspace} />;
      case 'evidence':
        return <EvidenceCenter workspace={workspace} disabled={disabled} onChange={patchWorkspace} />;
      case 'reports':
        return (
          <ReportingCenter
            prototypeName={prototype.name}
            version={prototype.version}
            kpis={kpis}
            readiness={readiness}
            workspace={workspace}
            onExported={(label) => logActivity(`Exported ${label} report`, 'validation')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="proto-test proto-test--ops">
      <TestingExecutiveHeader
        prototype={prototype}
        kpis={kpis}
        readiness={readiness}
        riskScore={riskScore}
        onCreatePlan={handleCreatePlan}
        onRunSuite={runTestSuite}
        onUploadEvidence={() => setActiveSection('evidence')}
        onExport={handleExport}
        onSubmitValidation={handleSubmitValidation}
      />

      <div className="proto-test-ops-layout">
        <TestingSidebar active={section} onSelect={setActiveSection} />
        <main className="proto-test-main">{renderWorkspace()}</main>
        <TestingRightSidebar
          workspace={workspace}
          kpis={kpis}
          readiness={readiness}
          aiEval={aiEval}
          prototypeName={prototype.name}
          disabled={disabled}
          onApplyCases={handleApplyCases}
        />
      </div>
    </div>
  );
}
