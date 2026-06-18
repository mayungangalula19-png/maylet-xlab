import type { PrototypeTestRun } from '../types/prototype.types';
import type {
  PrototypeTestingWorkspace,
  TestCase,
  TestCaseStatus,
} from '../types/prototypeTesting.types';

export interface TestingKPIs {
  totalCases: number;
  passed: number;
  failed: number;
  blocked: number;
  pending: number;
  criticalIssues: number;
  qualityScore: number;
  passRate: number;
  readinessScore: number;
  passTrend: number;
  defectTrend: number;
}

export interface ReadinessScores {
  completionPct: number;
  qualityScore: number;
  riskScore: number;
  readinessIndex: number;
  securityScore: number;
}

const STATUS_COUNTS: Record<TestCaseStatus, keyof Pick<TestingKPIs, 'passed' | 'failed' | 'blocked' | 'pending'>> = {
  draft: 'pending',
  pending: 'pending',
  running: 'pending',
  passed: 'passed',
  failed: 'failed',
  blocked: 'blocked',
};

export function computeTestingKPIs(ws: PrototypeTestingWorkspace, dbRuns: PrototypeTestRun[]): TestingKPIs {
  const kpis: TestingKPIs = {
    totalCases: ws.testCases.length,
    passed: 0,
    failed: 0,
    blocked: 0,
    pending: 0,
    criticalIssues: ws.defects.filter((d) => d.severity === 'critical' && d.status !== 'closed').length,
    qualityScore: 0,
    passRate: 0,
    readinessScore: 0,
    passTrend: 0,
    defectTrend: ws.defects.filter((d) => d.status === 'open').length,
  };

  ws.testCases.forEach((tc) => {
    const bucket = STATUS_COUNTS[tc.status];
    if (bucket === 'pending') kpis.pending += 1;
    else kpis[bucket] += 1;
  });

  if (ws.testCases.length === 0 && dbRuns.length > 0) {
    kpis.totalCases = dbRuns.length;
    kpis.passed = dbRuns.filter((r) => r.verdict === 'pass').length;
    kpis.failed = dbRuns.filter((r) => r.verdict === 'fail').length;
    kpis.pending = dbRuns.filter((r) => r.verdict === 'pending' || r.verdict === 'partial').length;
  }

  const executed = kpis.passed + kpis.failed + kpis.blocked;
  kpis.passRate = executed === 0 ? 0 : Math.round((kpis.passed / executed) * 100);

  const avgScore =
    dbRuns.length > 0
      ? dbRuns.reduce((s, r) => s + (r.score ?? 70), 0) / dbRuns.length
      : kpis.passRate;
  const defectPenalty = Math.min(40, kpis.criticalIssues * 10 + ws.defects.filter((d) => d.status === 'open').length * 3);
  kpis.qualityScore = Math.max(0, Math.round(avgScore - defectPenalty));
  kpis.passTrend = kpis.passRate;
  kpis.readinessScore = Math.round(
    (executed / Math.max(ws.testCases.length, 1)) * 35 +
      kpis.qualityScore * 0.35 +
      (100 - Math.min(100, kpis.criticalIssues * 15)) * 0.3
  );

  return kpis;
}

export function computeReadinessScores(
  ws: PrototypeTestingWorkspace,
  kpis: TestingKPIs,
  aiRiskScore: number | null
): ReadinessScores {
  const total = ws.testCases.length || 1;
  const executed = ws.testCases.filter((tc) => ['passed', 'failed', 'blocked'].includes(tc.status)).length;
  const completionPct = Math.round((executed / total) * 100);

  const openSecurity = ws.security.filter((s) => s.status !== 'closed').length;
  const securityScore = Math.max(0, 100 - openSecurity * 15 - ws.security.filter((s) => s.severity === 'critical').length * 20);

  const riskScore = aiRiskScore ?? Math.min(100, kpis.failed * 12 + kpis.criticalIssues * 18 + (100 - kpis.qualityScore) * 0.5);
  const readinessIndex = Math.round(
    completionPct * 0.35 + kpis.qualityScore * 0.35 + securityScore * 0.15 + (100 - riskScore) * 0.15
  );

  return {
    completionPct,
    qualityScore: kpis.qualityScore,
    riskScore: Math.round(riskScore),
    readinessIndex,
    securityScore,
  };
}

export function syncDbRunsToCases(runs: PrototypeTestRun[]): TestCase[] {
  return runs.map((r) => ({
    id: r.id,
    planId: null,
    title: r.name,
    description: r.notes ?? '',
    priority: 'medium' as const,
    category: 'functional' as const,
    expectedResult: 'Pass criteria met',
    actualResult: r.notes ?? '',
    status: (r.verdict === 'pass' ? 'passed' : r.verdict === 'fail' ? 'failed' : 'pending') as TestCaseStatus,
    tester: 'System',
    testedAt: r.created_at,
    startedAt: r.created_at,
    endedAt: r.created_at,
    durationMs: 0,
  }));
}

export interface TestingReportBundle {
  summary: string;
  defects: string;
  readiness: string;
  executive: string;
}

export function buildTestingReports(
  prototypeName: string,
  version: string | number,
  kpis: TestingKPIs,
  readiness: ReadinessScores,
  ws: PrototypeTestingWorkspace
): TestingReportBundle {
  const summary = [
    `# Testing Summary — ${prototypeName}`,
    `Version: ${version}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    `Total cases: ${kpis.totalCases}`,
    `Passed: ${kpis.passed} | Failed: ${kpis.failed} | Blocked: ${kpis.blocked}`,
    `Quality score: ${kpis.qualityScore}%`,
    `Pass rate: ${kpis.passRate}%`,
  ].join('\n');

  const defects = [
    `# Defect Summary — ${prototypeName}`,
    '',
    ...ws.defects.map(
      (d) =>
        `## ${d.title}\nSeverity: ${d.severity} | Status: ${d.status}\n${d.description}\nResolution: ${d.resolutionNotes || '—'}`
    ),
  ].join('\n\n');

  const readinessReport = [
    `# Validation Readiness — ${prototypeName}`,
    '',
    `Completion: ${readiness.completionPct}%`,
    `Quality: ${readiness.qualityScore}%`,
    `Risk: ${readiness.riskScore}%`,
    `Readiness index: ${readiness.readinessIndex}%`,
    `Security score: ${readiness.securityScore}%`,
  ].join('\n');

  const executive = [
    `EXECUTIVE TESTING REPORT`,
    `${prototypeName} v${version}`,
    '',
    `Validation readiness index: ${readiness.readinessIndex}%`,
    `Quality score: ${kpis.qualityScore}% | Risk level: ${readiness.riskScore >= 60 ? 'High' : readiness.riskScore >= 35 ? 'Medium' : 'Low'}`,
    `Critical defects: ${kpis.criticalIssues}`,
    '',
    'Recommendation:',
    readiness.readinessIndex >= 75
      ? 'Proceed to formal validation workflow.'
      : 'Continue testing and resolve critical defects before validation submission.',
  ].join('\n');

  return { summary, defects, readiness: readinessReport, executive };
}

export function downloadReport(content: string, filename: string, mime = 'text/markdown') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
