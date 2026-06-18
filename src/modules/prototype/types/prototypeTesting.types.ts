export type TestCaseStatus =
  | 'draft'
  | 'pending'
  | 'running'
  | 'passed'
  | 'failed'
  | 'blocked';

export type TestCasePriority = 'low' | 'medium' | 'high' | 'critical';

export type TestCategory =
  | 'functional'
  | 'usability'
  | 'performance'
  | 'reliability'
  | 'security'
  | 'accessibility'
  | 'compatibility'
  | 'integration'
  | 'uat'
  | 'pilot';

export type DefectSeverity = 'critical' | 'high' | 'medium' | 'low';
export type DefectStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TestPlan {
  id: string;
  title: string;
  objective: string;
  scope: string;
  methodology: string;
  successCriteria: string;
  exitCriteria: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  id: string;
  planId: string | null;
  title: string;
  description: string;
  priority: TestCasePriority;
  category: TestCategory;
  expectedResult: string;
  actualResult: string;
  status: TestCaseStatus;
  tester: string;
  testedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationMs: number | null;
}

export interface Defect {
  id: string;
  testCaseId: string | null;
  title: string;
  description: string;
  severity: DefectSeverity;
  priority: TestCasePriority;
  category: string;
  reproducibility: string;
  owner: string;
  status: DefectStatus;
  resolutionNotes: string;
  createdAt: string;
}

export interface UsabilitySession {
  id: string;
  feedback: string;
  taskCompletionRate: number | null;
  satisfactionScore: number | null;
  painPoints: string;
  createdAt: string;
}

export interface PerformanceMetric {
  id: string;
  responseTimeMs: number | null;
  loadTimeMs: number | null;
  throughput: number | null;
  resourceUsage: string;
  reliability: string;
  recordedAt: string;
}

export interface SecurityFinding {
  id: string;
  title: string;
  category: string;
  severity: DefectSeverity;
  description: string;
  status: DefectStatus;
  createdAt: string;
}

export interface TestEvidence {
  id: string;
  label: string;
  kind: 'screenshot' | 'video' | 'document' | 'log' | 'report';
  url: string;
  linkedTestCaseId: string | null;
  createdAt: string;
}

export interface TestingComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface TestingActivity {
  id: string;
  type: 'execution' | 'defect' | 'approval' | 'validation' | 'comment' | 'evidence';
  message: string;
  createdAt: string;
}

export interface PrototypeTestingWorkspace {
  version: 1;
  testPlans: TestPlan[];
  testCases: TestCase[];
  defects: Defect[];
  usability: UsabilitySession[];
  performance: PerformanceMetric[];
  security: SecurityFinding[];
  evidence: TestEvidence[];
  comments: TestingComment[];
  activity: TestingActivity[];
  updatedAt: string;
}

export type TestingSectionId =
  | 'dashboard'
  | 'plans'
  | 'cases'
  | 'runs'
  | 'defects'
  | 'evidence'
  | 'reports';

export const TESTING_NAV: { id: TestingSectionId; label: string; icon: string }[] = [
  { id: 'plans', label: 'Test plans', icon: '📋' },
  { id: 'cases', label: 'Test cases', icon: '✅' },
  { id: 'runs', label: 'Test runs', icon: '▶️' },
  { id: 'defects', label: 'Defects', icon: '🐛' },
  { id: 'evidence', label: 'Evidence', icon: '📎' },
  { id: 'reports', label: 'Reports', icon: '📄' },
];

export const TEST_CATEGORIES: { id: TestCategory; label: string }[] = [
  { id: 'functional', label: 'Functional' },
  { id: 'usability', label: 'Usability' },
  { id: 'performance', label: 'Performance' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'security', label: 'Security' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'compatibility', label: 'Compatibility' },
  { id: 'integration', label: 'Integration' },
  { id: 'uat', label: 'UAT' },
  { id: 'pilot', label: 'Pilot' },
];

export function emptyTestingWorkspace(): PrototypeTestingWorkspace {
  const now = new Date().toISOString();
  return {
    version: 1,
    testPlans: [],
    testCases: [],
    defects: [],
    usability: [],
    performance: [],
    security: [],
    evidence: [],
    comments: [],
    activity: [],
    updatedAt: now,
  };
}

export function newTestingId(): string {
  return crypto.randomUUID();
}
