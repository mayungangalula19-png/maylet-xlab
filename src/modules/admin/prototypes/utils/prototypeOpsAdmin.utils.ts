import { analyzePrototypeRisk } from '../../../prototype/ai/prototypeAI.engine';
import {
  normalizeLifecycleStatus,
  type PrototypeRecord,
} from '../../../prototype/types/prototype.types';
import type { AdminServiceResult } from '../../types/projectAdmin.types';
import type {
  AdminPrototypeOpsStats,
  AdminPrototypeRow,
  ExecutivePrototypeStage,
  PrototypeActivityItem,
  PrototypeAnalyticsData,
  PrototypeApprovalItem,
  PrototypeDigitalTwin,
  PrototypeEvidenceItem,
  PrototypeIntelContext,
  PrototypeLifecycleInsight,
  PrototypeOpsMaya,
  PrototypeReadinessBreakdown,
  PrototypeRiskBreakdown,
  PrototypeRiskLevel,
} from '../types/prototypeOpsAdmin.types';
import { EXECUTIVE_PROTOTYPE_STAGES } from '../types/prototypeOpsAdmin.types';

export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.length > 0) return err.message;
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    for (const key of ['message', 'details', 'hint'] as const) {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
    if (typeof record.code === 'string' && record.code.length > 0) {
      return `Database error (${record.code})`;
    }
  }
  if (typeof err === 'string' && err.length > 0) return err;
  return 'Request failed';
}

export function isSchemaError(err: unknown): boolean {
  const msg = extractErrorMessage(err).toLowerCase();
  return (
    msg.includes('does not exist') ||
    msg.includes('could not find') ||
    msg.includes('schema cache') ||
    msg.includes('column') ||
    msg.includes('42p01') ||
    msg.includes('42703') ||
    msg.includes('pgrst') ||
    msg.includes('relation')
  );
}

export function schemaMissingError(err: unknown): AdminServiceResult<never> {
  return {
    data: null,
    error: {
      code: 'SCHEMA_MISSING',
      message: `${extractErrorMessage(err)}. Run supabase/migrations/20260617000002_prototype_ops_admin.sql in Supabase SQL Editor.`,
    },
  };
}

const PROTOTYPE_SELECTS = [
  'id, user_id, project_id, research_id, name, description, file_url, thumbnail_url, version, status, views, downloads, created_at, updated_at',
  'id, user_id, project_id, name, description, file_url, version, status, created_at, updated_at',
  'id, user_id, project_id, name, status, version, created_at, updated_at',
  '*',
];

export async function queryPrototypesWithFallback(
  supabase: {
    from: (table: string) => {
      select: (
        s: string,
        opts?: { count?: 'exact' }
      ) => {
        order: (
          c: string,
          o: { ascending: boolean }
        ) => PromiseLike<{ data: unknown[] | null; error: unknown; count: number | null }>;
      };
    };
  }
): Promise<{ rows: Record<string, unknown>[]; count: number | null }> {
  for (const select of PROTOTYPE_SELECTS) {
    const { data, error, count } = await supabase
      .from('prototypes')
      .select(select, { count: 'exact' })
      .order('updated_at', { ascending: false });
    if (!error) {
      return { rows: (data ?? []) as Record<string, unknown>[], count };
    }
    if (!isSchemaError(error)) throw error;
  }
  return { rows: [], count: 0 };
}

export function mapPrototypeRecord(row: Record<string, unknown>): PrototypeRecord {
  const status = String(row.status ?? 'draft');
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    project_id: row.project_id ? String(row.project_id) : null,
    research_id: row.research_id ? String(row.research_id) : null,
    name: String(row.name ?? 'Untitled'),
    description: row.description ? String(row.description) : null,
    file_url: row.file_url ? String(row.file_url) : null,
    thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
    version: String(row.version ?? '1.0'),
    status,
    lifecycle_status: normalizeLifecycleStatus(status),
    views: Number(row.views ?? 0),
    downloads: Number(row.downloads ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  };
}

export function formatPrototypeDisplayId(id: string, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  const suffix = id.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `PRT-${year}-${suffix}`;
}

function scoreToRiskLevel(score: number): PrototypeRiskLevel {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function testPassRate(tests: PrototypeIntelContext['tests']): number {
  if (tests.length === 0) return 0;
  const passed = tests.filter((t) => t.verdict === 'pass').length;
  return passed / tests.length;
}

function buildPassRate(tests: PrototypeIntelContext['tests']): number {
  return Math.round(testPassRate(tests) * 100);
}

function buildSuccessBuildRate(builds: PrototypeIntelContext['builds']): number {
  if (builds.length === 0) return 0.5;
  const completed = builds.filter((b) => b.status === 'completed').length;
  return completed / builds.length;
}

export function computeReadinessBreakdown(
  proto: PrototypeRecord,
  intel: PrototypeIntelContext
): PrototypeReadinessBreakdown {
  const hasDescription = !!proto.description?.trim();
  const hasFile = !!proto.file_url;
  const fileCount = intel.files.length;
  const passRate = testPassRate(intel.tests);
  const completedExperiments = intel.experiments.filter((e) =>
    ['completed', 'done', 'success'].includes(e.status.toLowerCase())
  ).length;
  const hasFunding = intel.fundingPitches.length > 0;
  const approvedFunding = intel.fundingPitches.some((p) =>
    ['approved', 'funded', 'submitted'].includes(p.status.toLowerCase())
  );

  const documentation = Math.min(
    100,
    Math.round(
      (hasDescription ? 35 : 0) +
        (fileCount > 0 ? 25 : 0) +
        (proto.thumbnail_url ? 15 : 0) +
        Math.min(fileCount * 5, 25)
    )
  );

  const engineering = Math.min(
    100,
    Math.round(
      (hasFile ? 40 : 0) +
        buildSuccessBuildRate(intel.builds) * 35 +
        (intel.builds.length > 0 ? 15 : 0) +
        (intel.architectureLayers > 0 ? 10 : 0)
    )
  );

  const testing = Math.min(
    100,
    Math.round(intel.tests.length === 0 ? 15 : passRate * 85 + (intel.tests.length >= 3 ? 15 : 0))
  );

  const validation = Math.min(
    100,
    Math.round(
      (completedExperiments > 0 ? 40 : 0) +
        passRate * 30 +
        (proto.lifecycle_status === 'success' ? 30 : proto.lifecycle_status === 'testing' ? 15 : 0)
    )
  );

  const funding = Math.min(
    100,
    Math.round(
      (hasFunding ? 30 : 0) +
        (approvedFunding ? 40 : 0) +
        validation * 0.2 +
        (proto.project_id ? 10 : 0)
    )
  );

  const commercialization = Math.min(
    100,
    Math.round(
      funding * 0.35 +
        validation * 0.35 +
        engineering * 0.2 +
        (proto.lifecycle_status === 'success' && proto.project_id ? 10 : 0)
    )
  );

  const overall = Math.round(
    documentation * 0.12 +
      engineering * 0.22 +
      testing * 0.18 +
      validation * 0.2 +
      funding * 0.14 +
      commercialization * 0.14
  );

  const aiAnalysis = analyzePrototypeRisk({
    prototype: proto,
    buildSuccessRate: buildSuccessBuildRate(intel.builds),
    testPassRate: passRate,
  });

  const aiConfidence = Math.min(
    100,
    Math.round(
      100 -
        aiAnalysis.riskScore * 0.4 +
        (intel.tests.length > 0 ? 10 : 0) +
        (intel.experiments.length > 0 ? 10 : 0)
    )
  );

  return {
    documentation,
    engineering,
    testing,
    validation,
    funding,
    commercialization,
    overall,
    aiConfidence,
  };
}

export function computeRiskBreakdown(
  proto: PrototypeRecord,
  intel: PrototypeIntelContext,
  readiness: PrototypeReadinessBreakdown
): PrototypeRiskBreakdown {
  const passRate = testPassRate(intel.tests);
  const ai = analyzePrototypeRisk({
    prototype: proto,
    buildSuccessRate: buildSuccessBuildRate(intel.builds),
    testPassRate: passRate,
  });

  const technicalScore =
    ai.riskScore * 0.5 +
    (intel.builds.some((b) => b.status === 'failed') ? 25 : 0) +
    (passRate < 0.5 && intel.tests.length > 0 ? 20 : 0);

  const operationalScore =
    (proto.lifecycle_status === 'failed' ? 60 : 0) +
    (intel.builds.length === 0 && proto.lifecycle_status === 'building' ? 25 : 0);

  const securityScore =
    (intel.files.some((f) => /security|audit|pen/i.test(f.file_name)) ? 10 : 35) +
    (readiness.documentation < 40 ? 20 : 0);

  const manufacturingScore =
    readiness.engineering < 50 ? 55 : readiness.engineering < 70 ? 30 : 15;

  const financialScore =
    intel.fundingPitches.length === 0 && readiness.funding > 60 ? 40 : 15;

  const complianceScore = readiness.documentation < 50 ? 45 : 20;
  const ipScore = intel.files.some((f) => /patent|ip|trademark/i.test(f.file_name)) ? 15 : 40;
  const marketScore = readiness.commercialization < 40 ? 50 : 20;

  const aggregateScore = Math.round(
    (technicalScore +
      operationalScore +
      securityScore +
      manufacturingScore +
      financialScore +
      complianceScore +
      ipScore +
      marketScore) /
      8
  );

  return {
    technical: scoreToRiskLevel(technicalScore),
    operational: scoreToRiskLevel(operationalScore),
    security: scoreToRiskLevel(securityScore),
    manufacturing: scoreToRiskLevel(manufacturingScore),
    financial: scoreToRiskLevel(financialScore),
    compliance: scoreToRiskLevel(complianceScore),
    ip: scoreToRiskLevel(ipScore),
    market: scoreToRiskLevel(marketScore),
    aggregate: scoreToRiskLevel(aggregateScore),
    aggregateScore,
  };
}

export function mapExecutiveStage(
  proto: PrototypeRecord,
  intel: PrototypeIntelContext,
  readiness: PrototypeReadinessBreakdown,
  projectStatus?: string | null
): ExecutivePrototypeStage {
  const lifecycle = proto.lifecycle_status;

  if (
    lifecycle === 'success' &&
    (projectStatus === 'launched' || readiness.commercialization >= 75)
  ) {
    return 'commercialization_ready';
  }

  if (
    intel.fundingPitches.some((p) =>
      ['approved', 'funded', 'submitted'].includes(p.status.toLowerCase())
    ) ||
    readiness.funding >= 70
  ) {
    return 'funding_ready';
  }

  if (readiness.validation >= 70 && lifecycle === 'success') {
    return 'validation_ready';
  }

  if (
    intel.experiments.length > 0 &&
    intel.experiments.some((e) =>
      ['completed', 'running', 'active'].includes(e.status.toLowerCase())
    )
  ) {
    return 'experiment_ready';
  }

  if (lifecycle === 'testing') {
    const hasExternal = intel.tests.some((t) =>
      /field|external|usability|acceptance/i.test(t.name)
    );
    return hasExternal ? 'external_testing' : 'internal_testing';
  }

  if (lifecycle === 'building') {
    if (proto.file_url && intel.builds.length > 0) return 'development';
    if (proto.description?.trim()) return 'prototype_design';
    return 'concept_design';
  }

  if (proto.research_id || proto.project_id) return 'research';
  return 'idea';
}

export function buildDigitalTwin(
  proto: PrototypeRecord,
  intel: PrototypeIntelContext,
  readiness: PrototypeReadinessBreakdown,
  risks: PrototypeRiskBreakdown,
  executiveStage: ExecutivePrototypeStage
): PrototypeDigitalTwin {
  const passRate = buildPassRate(intel.tests);
  const completedExperiments = intel.experiments.filter((e) =>
    ['completed', 'done'].includes(e.status.toLowerCase())
  ).length;

  const daysSinceCreate = Math.max(
    1,
    Math.round((Date.now() - new Date(proto.created_at).getTime()) / (1000 * 60 * 60 * 24))
  );

  const remainingStages = EXECUTIVE_PROTOTYPE_STAGES.findIndex((s) => s.id === executiveStage);
  const stagesLeft = Math.max(1, EXECUTIVE_PROTOTYPE_STAGES.length - remainingStages);
  const timelineForecastDays = Math.round(stagesLeft * (daysSinceCreate / Math.max(remainingStages, 1)));

  const baseCost = 12000;
  const costForecastUsd = Math.round(
    baseCost + intel.builds.length * 3500 + intel.tests.length * 1200 + risks.aggregateScore * 150
  );

  return {
    currentStatus: proto.lifecycle_status,
    technicalState:
      readiness.engineering >= 70
        ? 'Engineering mature'
        : readiness.engineering >= 40
          ? 'In development'
          : 'Early technical',
    experimentStatus:
      completedExperiments > 0
        ? `${completedExperiments} completed`
        : intel.experiments.length > 0
          ? `${intel.experiments.length} linked`
          : 'No experiments',
    validationStatus:
      readiness.validation >= 70 ? 'Validation ready' : passRate >= 50 ? 'In progress' : 'Not started',
    fundingStatus:
      intel.fundingPitches.length > 0
        ? intel.fundingPitches[0].status
        : readiness.funding >= 60
          ? 'Eligible'
          : 'Not ready',
    commercializationStatus:
      readiness.commercialization >= 70 ? 'Go-to-market ready' : 'Pre-commercial',
    readinessForecast: Math.min(100, readiness.overall + Math.round((100 - risks.aggregateScore) * 0.15)),
    failurePrediction: risks.aggregateScore,
    timelineForecastDays,
    costForecastUsd,
  };
}

export function buildAdminPrototypeRow(
  proto: PrototypeRecord,
  intel: PrototypeIntelContext,
  owner: { name: string; email: string },
  project: { name?: string; sector?: string; status?: string } | null,
  researchTitle: string | null,
  technicalLead: string
): AdminPrototypeRow {
  const readiness = computeReadinessBreakdown(proto, intel);
  const risks = computeRiskBreakdown(proto, intel, readiness);
  const executiveStage = mapExecutiveStage(proto, intel, readiness, project?.status);
  const digitalTwin = buildDigitalTwin(proto, intel, readiness, risks, executiveStage);

  const lastActivity = [
    proto.updated_at,
    ...intel.tests.map((t) => t.name),
    ...intel.builds.filter((b) => b.completed_at).map((b) => b.completed_at!),
  ]
    .filter(Boolean)
    .sort()
    .reverse()[0] ?? proto.updated_at;

  return {
    id: proto.id,
    displayId: formatPrototypeDisplayId(proto.id, proto.created_at),
    name: proto.name,
    parentProjectId: proto.project_id,
    parentProjectName: project?.name ?? null,
    researchProgram: researchTitle,
    department: project?.sector?.trim() || 'General Innovation',
    ownerId: proto.user_id,
    ownerName: owner.name,
    ownerEmail: owner.email,
    technicalLead,
    version: proto.version,
    executiveStage,
    status: proto.status,
    lifecycleStatus: proto.lifecycle_status,
    readinessScore: readiness.overall,
    riskScore: risks.aggregateScore,
    validationScore: readiness.validation,
    fundingScore: readiness.funding,
    commercializationScore: readiness.commercialization,
    riskLevel: risks.aggregate,
    lastActivity,
    createdAt: proto.created_at,
    updatedAt: proto.updated_at,
    record: proto,
    readiness,
    risks,
    digitalTwin,
    intel,
  };
}

export function buildAdminPrototypeStats(rows: AdminPrototypeRow[]): AdminPrototypeOpsStats {
  const total = rows.length;
  const active = rows.filter((r) =>
    !['archived', 'failed'].includes(r.lifecycleStatus) &&
    !['commercialization_ready', 'funding_ready'].includes(r.executiveStage)
  ).length;
  const successful = rows.filter((r) => r.lifecycleStatus === 'success').length;
  const completedOrActive = rows.filter((r) => r.lifecycleStatus !== 'draft').length;
  const successRate =
    completedOrActive > 0 ? Math.round((successful / completedOrActive) * 100) : 0;

  const experimentReady = rows.filter((r) =>
    [
      'experiment_ready',
      'validation_ready',
      'funding_ready',
      'commercialization_ready',
    ].includes(r.executiveStage)
  ).length;

  const validationReady = rows.filter((r) =>
    ['validation_ready', 'funding_ready', 'commercialization_ready'].includes(r.executiveStage)
  ).length;

  const commercializationReady = rows.filter(
    (r) => r.executiveStage === 'commercialization_ready'
  ).length;

  const highRisk = rows.filter((r) => ['high', 'critical'].includes(r.riskLevel)).length;

  const fundingEligible = rows.filter((r) => r.fundingScore >= 60).length;

  const avgDevelopmentDays =
    total === 0
      ? 0
      : Math.round(
          rows.reduce((s, r) => {
            const days =
              (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            return s + days;
          }, 0) / total
        );

  const portfolioHealthScore =
    total === 0
      ? 0
      : Math.round(rows.reduce((s, r) => s + r.readinessScore, 0) / total / 10);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;

  const recentTotal = rows.filter((r) => new Date(r.createdAt).getTime() > thirtyDaysAgo).length;
  const priorTotal = rows.filter((r) => {
    const t = new Date(r.createdAt).getTime();
    return t > sixtyDaysAgo && t <= thirtyDaysAgo;
  }).length;

  const trendTotalPct =
    priorTotal > 0 ? Math.round(((recentTotal - priorTotal) / priorTotal) * 100) : recentTotal > 0 ? 100 : 0;

  const recentActive = rows.filter(
    (r) =>
      new Date(r.updatedAt).getTime() > thirtyDaysAgo &&
      !['archived'].includes(r.status)
  ).length;
  const priorActive = rows.filter((r) => {
    const t = new Date(r.updatedAt).getTime();
    return t > sixtyDaysAgo && t <= thirtyDaysAgo && !['archived'].includes(r.status);
  }).length;
  const trendActivePct =
    priorActive > 0
      ? Math.round(((recentActive - priorActive) / priorActive) * 100)
      : recentActive > 0
        ? 100
        : 0;

  const recentSuccess = rows.filter(
    (r) =>
      r.lifecycleStatus === 'success' && new Date(r.updatedAt).getTime() > thirtyDaysAgo
  ).length;
  const trendSuccessPct =
    successful > 0 ? Math.round((recentSuccess / Math.max(successful, 1)) * 100) : 0;

  return {
    total,
    active,
    successRate,
    experimentReady,
    validationReady,
    commercializationReady,
    highRisk,
    fundingEligible,
    avgDevelopmentDays,
    portfolioHealthScore,
    trendTotalPct,
    trendActivePct,
    trendSuccessPct,
  };
}

export function buildExecutiveStageCounts(
  rows: AdminPrototypeRow[]
): Record<ExecutivePrototypeStage, number> {
  const counts = Object.fromEntries(
    EXECUTIVE_PROTOTYPE_STAGES.map((s) => [s.id, 0])
  ) as Record<ExecutivePrototypeStage, number>;
  for (const row of rows) {
    counts[row.executiveStage] += 1;
  }
  return counts;
}

export function buildLifecycleInsights(
  rows: AdminPrototypeRow[]
): PrototypeLifecycleInsight[] {
  const maxCount = Math.max(...EXECUTIVE_PROTOTYPE_STAGES.map((s) => rows.filter((r) => r.executiveStage === s.id).length), 1);
  const now = Date.now();

  return EXECUTIVE_PROTOTYPE_STAGES.map((stage) => {
    const items = rows.filter((r) => r.executiveStage === stage.id);
    const avgDays =
      items.length === 0
        ? 0
        : Math.round(
            items.reduce((s, r) => {
              const days = (now - new Date(r.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
              return s + days;
            }, 0) / items.length
          );
    const bottleneck = items.length >= maxCount * 0.35 && items.length > 2;

    let recommendation = 'Stage operating within normal parameters.';
    if (bottleneck) {
      recommendation = `Bottleneck detected — ${items.length} prototypes stalled at ${stage.label}. Prioritize gate reviews and resource allocation.`;
    } else if (items.length === 0) {
      recommendation = `No prototypes at ${stage.label}. Review upstream conversion.`;
    } else if (avgDays > 21) {
      recommendation = `Average ${avgDays}d in ${stage.label} exceeds SLA. Maya recommends acceleration workflow.`;
    }

    return {
      stage: stage.id,
      count: items.length,
      bottleneck,
      avgDaysInStage: avgDays,
      recommendation,
    };
  });
}

export function buildPortfolioMaya(rows: AdminPrototypeRow[]): PrototypeOpsMaya {
  const insights = buildLifecycleInsights(rows);
  const bottleneck = insights.find((i) => i.bottleneck) ?? null;
  const highRisk = rows.filter((r) => ['high', 'critical'].includes(r.riskLevel));
  const stalled = rows.filter((r) => {
    const days = (Date.now() - new Date(r.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    return days > 21 && r.executiveStage !== 'commercialization_ready';
  });

  const avgReadiness =
    rows.length === 0 ? 0 : Math.round(rows.reduce((s, r) => s + r.readinessScore, 0) / rows.length);

  const avgFailure =
    rows.length === 0 ? 0 : Math.round(rows.reduce((s, r) => s + r.riskScore, 0) / rows.length);

  const priority =
    [...rows].sort((a, b) => b.riskScore - a.riskScore || b.readinessScore - a.readinessScore)[0] ??
    null;

  const patterns: string[] = [];
  if (bottleneck) patterns.push(`Pipeline bottleneck at ${bottleneck.stage.replace(/_/g, ' ')}`);
  if (highRisk.length > rows.length * 0.2) patterns.push('Elevated portfolio risk concentration');
  if (avgReadiness >= 70) patterns.push('Portfolio readiness trending positive');

  const anomalies: string[] = [];
  if (stalled.length > 0) {
    anomalies.push(`${stalled.length} prototype(s) inactive >21 days`);
  }
  if (highRisk.length > 0) {
    anomalies.push(`${highRisk.length} high/critical risk prototype(s) require review`);
  }

  const improvements: string[] = [];
  if (bottleneck) improvements.push(bottleneck.recommendation);
  for (const r of highRisk.slice(0, 2)) {
    improvements.push(`Address risk on "${r.name}" (score ${r.riskScore})`);
  }

  const recommendations = insights
    .filter((i) => i.bottleneck || i.avgDaysInStage > 14)
    .map((i) => i.recommendation)
    .slice(0, 4);

  const manufacturingReadiness =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((s, r) => s + r.readiness.engineering, 0) / rows.length);

  const commercializationPrediction =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((s, r) => s + r.commercializationScore, 0) / rows.length);

  const aiConfidence =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((s, r) => s + r.readiness.aiConfidence, 0) / rows.length);

  return {
    bullets: [
      `${rows.length} prototypes under governance`,
      `${avgReadiness}% average readiness`,
      bottleneck ? `Bottleneck: ${bottleneck.stage.replace(/_/g, ' ')}` : 'No critical bottlenecks',
    ],
    patterns,
    anomalies,
    improvements,
    executiveSummary: `Portfolio of ${rows.length} prototypes at ${avgReadiness}% average readiness. ${highRisk.length} high-risk assets. ${bottleneck ? `Primary bottleneck at ${bottleneck.stage.replace(/_/g, ' ')}.` : 'Pipeline flow is healthy.'}`,
    technicalSummary: `Engineering readiness averages ${manufacturingReadiness}%. ${rows.filter((r) => r.intel.builds.length > 0).length} prototypes have build artifacts. Test pass rate portfolio-wide: ${rows.length === 0 ? 0 : Math.round(rows.reduce((s, r) => s + buildPassRate(r.intel.tests), 0) / rows.length)}%.`,
    engineeringReport: `Maya analysis: ${recommendations.join(' ') || 'Continue standard governance cadence.'} Failure risk index: ${avgFailure}/100.`,
    validationReadiness:
      rows.length === 0
        ? 0
        : Math.round(rows.reduce((s, r) => s + r.validationScore, 0) / rows.length),
    successProbability: Math.max(0, 100 - avgFailure),
    failureRisk: avgFailure,
    manufacturingReadiness,
    commercializationPrediction,
    aiConfidence,
    priorityPrototype: priority ? { id: priority.id, name: priority.name } : null,
    priorityAction: priority
      ? `Review "${priority.name}" — risk ${priority.riskScore}, stage ${priority.executiveStage.replace(/_/g, ' ')}`
      : 'No immediate action required',
    bottleneckStage: bottleneck?.stage ?? null,
    recommendations,
  };
}

export function buildPrototypeAnalytics(rows: AdminPrototypeRow[]): PrototypeAnalyticsData {
  const monthKey = (iso: string) => iso.slice(0, 7);
  const months = [...new Set(rows.map((r) => monthKey(r.createdAt)))].sort().slice(-6);

  const successTrend = months.map((month) => {
    const inMonth = rows.filter((r) => monthKey(r.createdAt) === month);
    const rate =
      inMonth.length === 0
        ? 0
        : Math.round(
            (inMonth.filter((r) => r.lifecycleStatus === 'success').length / inMonth.length) * 100
          );
    return { month, rate };
  });

  const failureTrend = months.map((month) => ({
    month,
    count: rows.filter(
      (r) => monthKey(r.updatedAt) === month && r.lifecycleStatus === 'failed'
    ).length,
  }));

  const readinessBands = ['0-39', '40-59', '60-79', '80-100'];
  const readinessDistribution = readinessBands.map((band) => {
    const [lo, hi] = band.split('-').map(Number);
    return {
      band,
      count: rows.filter((r) => r.readinessScore >= lo && r.readinessScore <= hi).length,
    };
  });

  const fundingFunnel = [
    { stage: 'Eligible', count: rows.filter((r) => r.fundingScore >= 60).length },
    { stage: 'Pitch Ready', count: rows.filter((r) => r.fundingScore >= 70).length },
    { stage: 'Submitted', count: rows.filter((r) => r.intel.fundingPitches.length > 0).length },
    {
      stage: 'Approved',
      count: rows.filter((r) =>
        r.intel.fundingPitches.some((p) =>
          ['approved', 'funded'].includes(p.status.toLowerCase())
        )
      ).length,
    },
  ];

  const commercializationFunnel = [
    { stage: 'Development', count: rows.filter((r) => r.readiness.engineering >= 50).length },
    { stage: 'Validation', count: rows.filter((r) => r.validationScore >= 60).length },
    { stage: 'Funding', count: rows.filter((r) => r.fundingScore >= 60).length },
    { stage: 'GTM Ready', count: rows.filter((r) => r.commercializationScore >= 70).length },
  ];

  const deptMap = new Map<string, { total: number; readiness: number }>();
  for (const row of rows) {
    const cur = deptMap.get(row.department) ?? { total: 0, readiness: 0 };
    cur.total += 1;
    cur.readiness += row.readinessScore;
    deptMap.set(row.department, cur);
  }

  const departmentPerformance = [...deptMap.entries()]
    .map(([department, v]) => ({
      department,
      avgReadiness: Math.round(v.readiness / v.total),
      count: v.total,
    }))
    .sort((a, b) => b.avgReadiness - a.avgReadiness)
    .slice(0, 8);

  const innovationVelocity = months.map((month) => ({
    month,
    created: rows.filter((r) => monthKey(r.createdAt) === month).length,
    promoted: rows.filter(
      (r) =>
        monthKey(r.updatedAt) === month &&
        ['commercialization_ready', 'funding_ready'].includes(r.executiveStage)
    ).length,
  }));

  const riskDistribution: Record<PrototypeRiskLevel, number> = {
    low: rows.filter((r) => r.riskLevel === 'low').length,
    medium: rows.filter((r) => r.riskLevel === 'medium').length,
    high: rows.filter((r) => r.riskLevel === 'high').length,
    critical: rows.filter((r) => r.riskLevel === 'critical').length,
  };

  const allTests = rows.flatMap((r) => r.intel.tests);
  const testingPassRate = buildPassRate(allTests);

  return {
    successTrend,
    failureTrend,
    readinessDistribution,
    fundingFunnel,
    commercializationFunnel,
    departmentPerformance,
    innovationVelocity,
    riskDistribution,
    testingPassRate,
  };
}

export function extractPrototypeActivity(rows: AdminPrototypeRow[]): PrototypeActivityItem[] {
  return rows
    .flatMap((row) => {
      const events: PrototypeActivityItem[] = [
        {
          id: `${row.id}-updated`,
          prototypeId: row.id,
          prototypeName: row.name,
          action: `Updated — ${row.executiveStage.replace(/_/g, ' ')}`,
          user: row.ownerName,
          at: row.updatedAt,
        },
        {
          id: `${row.id}-created`,
          prototypeId: row.id,
          prototypeName: row.name,
          action: 'Created prototype',
          user: row.ownerName,
          at: row.createdAt,
        },
      ];
      for (const test of row.intel.tests.slice(0, 2)) {
        events.push({
          id: `${row.id}-test-${test.name}`,
          prototypeId: row.id,
          prototypeName: row.name,
          action: `Test "${test.name}" — ${test.verdict}`,
          at: row.updatedAt,
        });
      }
      return events;
    })
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 40);
}

export function extractEvidenceItems(rows: AdminPrototypeRow[]): PrototypeEvidenceItem[] {
  const iconFor = (type: string, name: string) => {
    const n = name.toLowerCase();
    if (/\.(png|jpg|jpeg|gif|webp|svg)/.test(n) || type.startsWith('image')) return '🖼';
    if (/\.(mp4|webm|mov)/.test(n) || type.startsWith('video')) return '🎬';
    if (/\.(stl|step|dwg|cad)/.test(n)) return '📐';
    if (/patent|ip/.test(n)) return '⚖';
    if (/test|result/.test(n)) return '🧪';
    if (/\.pdf/.test(n)) return '📄';
    return '📎';
  };

  return rows
    .flatMap((row) =>
      row.intel.files.map((f, idx) => ({
        id: `${row.id}-file-${idx}`,
        prototypeId: row.id,
        prototypeName: row.name,
        name: f.file_name,
        fileType: f.file_type,
        icon: iconFor(f.file_type, f.file_name),
      }))
    )
    .slice(0, 24);
}

export function extractApprovalItems(rows: AdminPrototypeRow[]): PrototypeApprovalItem[] {
  return rows
    .flatMap((row) =>
      row.intel.approvals.map((a, idx) => ({
        id: `${row.id}-approval-${idx}`,
        prototypeId: row.id,
        prototypeName: row.name,
        reviewerRole: a.reviewer_role,
        status: a.status,
        at: row.updatedAt,
      }))
    )
    .filter((a) => ['pending', 'revision_requested'].includes(a.status))
    .slice(0, 12);
}

export function buildRiskHeatmap(rows: AdminPrototypeRow[]) {
  const cells: { impact: number; likelihood: number; count: number; tone: string }[] = [];
  for (let impact = 0; impact <= 2; impact++) {
    for (let likelihood = 0; likelihood <= 2; likelihood++) {
      const count = rows.filter((r) => {
        const imp = r.riskScore >= 60 ? 2 : r.riskScore >= 35 ? 1 : 0;
        const lik =
          r.riskLevel === 'critical' || r.riskLevel === 'high'
            ? 2
            : r.riskLevel === 'medium'
              ? 1
              : 0;
        return imp === impact && lik === likelihood;
      }).length;
      const tone =
        impact + likelihood >= 3 ? 'critical' : impact + likelihood >= 2 ? 'high' : 'low';
      cells.push({ impact, likelihood, count, tone });
    }
  }
  return cells;
}

export function riskLevelLabel(level: PrototypeRiskLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function prototypeStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  const s = status.toLowerCase();
  if (['success', 'published', 'completed'].includes(s)) return 'success';
  if (['failed', 'archived', 'rejected'].includes(s)) return 'danger';
  if (['testing', 'building', 'running'].includes(s)) return 'info';
  if (['draft', 'pending', 'hold'].includes(s)) return 'warning';
  return 'default';
}

export function exportPrototypesCsv(rows: AdminPrototypeRow[]): string {
  const headers = [
    'Prototype ID',
    'Name',
    'Project',
    'Department',
    'Owner',
    'Stage',
    'Status',
    'Readiness',
    'Risk',
    'Validation',
    'Funding',
    'Commercialization',
    'Version',
    'Created',
    'Last Activity',
  ];
  const lines = rows.map((r) =>
    [
      r.displayId,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${(r.parentProjectName ?? '').replace(/"/g, '""')}"`,
      `"${r.department.replace(/"/g, '""')}"`,
      `"${r.ownerName.replace(/"/g, '""')}"`,
      r.executiveStage,
      r.status,
      r.readinessScore,
      r.riskScore,
      r.validationScore,
      r.fundingScore,
      r.commercializationScore,
      r.version,
      r.createdAt,
      r.lastActivity,
    ].join(',')
  );
  return [headers.join(','), ...lines].join('\n');
}

export const SAVED_VIEWS_KEY = 'maylet-admin-prototype-views';

export function loadSavedViews(): import('../types/prototypeOpsAdmin.types').SavedPrototypeView[] {
  try {
    const raw = localStorage.getItem(SAVED_VIEWS_KEY);
    if (raw) return JSON.parse(raw) as import('../types/prototypeOpsAdmin.types').SavedPrototypeView[];
  } catch {
    /* ignore */
  }
  return [];
}

export function persistSavedViews(
  views: import('../types/prototypeOpsAdmin.types').SavedPrototypeView[]
): void {
  localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
}
