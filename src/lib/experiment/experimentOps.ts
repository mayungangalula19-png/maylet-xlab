export const PIPELINE_STAGES = [
  'Draft',
  'Planned',
  'Approved',
  'Running',
  'Data Collection',
  'Analysis',
  'Review',
  'Validation Ready',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const EXPERIMENT_CATEGORIES = [
  'engineering',
  'scientific',
  'market',
  'product',
  'business',
  'structured',
] as const;

export type ExperimentCategory = (typeof EXPERIMENT_CATEGORIES)[number];

export const LIFECYCLE_STAGES = [
  'Research',
  'Prototype',
  'Experiment Design',
  'Execution',
  'Data Collection',
  'Analysis',
  'Validation Readiness',
  'Validation',
] as const;

export interface ExperimentAuditEntry {
  at: string;
  action: string;
  user?: string;
}

export interface ExperimentConfig {
  description?: string;
  objectives?: string;
  success_criteria?: string;
  failure_criteria?: string;
  independent_variables?: string;
  dependent_variables?: string;
  secondary_hypotheses?: string;
  methodology?: string;
  constraints?: string;
  resources?: string;
  risks?: string;
  prototype_id?: string | null;
  research_id?: string | null;
  team_member_ids?: string[];
  document_ids?: string[];
  file_uploads?: string[];
  attachment_notes?: string;
  start_date?: string;
  end_date?: string;
  assumptions?: string;
  expected_outcomes?: string;
  observations?: string;
  metrics?: string;
  sensor_readings?: string;
  csv_imports?: string;
  actual_results?: string;
  key_findings?: string;
  category?: string;
  approved?: boolean;
  evidence_approved?: boolean;
  results_reviewed?: boolean;
  department?: string;
  audit_log?: ExperimentAuditEntry[];
  version?: number;
}

export interface ExperimentRecord {
  id: string;
  title: string;
  hypothesis: string;
  type: string;
  status: string;
  pipelineStage: PipelineStage;
  project_id: string | null;
  project_name: string | null;
  project_sector: string | null;
  prototype_id: string | null;
  prototype_name: string | null;
  results: string | null;
  findings: string | null;
  config: ExperimentConfig;
  confidenceScore: number;
  evidenceQuality: number;
  dataQuality: number;
  dataCompleteness: number;
  validationReady: boolean;
  daysInStage: number;
  created_at: string;
  updated_at: string;
}

export interface ResultsAnalytics {
  expected: string;
  actual: string;
  variance: number | null;
  confidenceLevel: number;
  statisticalSignificance: 'low' | 'medium' | 'high' | 'unknown';
  evidenceStrength: 'weak' | 'moderate' | 'strong';
}

export interface ExperimentIntelligence {
  successProbability: number;
  failureRisk: number;
  rootCauses: string[];
  keyFindings: string[];
  strategicRecommendations: string[];
}

export interface PipelineBottleneck {
  stage: PipelineStage;
  count: number;
  stalledCount: number;
  avgDaysStalled: number;
  severity: 'low' | 'medium' | 'high';
}

export interface PrototypeExperimentTree {
  prototypeId: string;
  prototypeName: string;
  experiments: ExperimentRecord[];
}

export interface ExperimentOpsMetrics {
  total: number;
  active: number;
  planned: number;
  completed: number;
  failed: number;
  validationReady: number;
  successRate: number;
  failureRate: number;
  avgConfidence: number;
  evidenceQuality: number;
  innovationReadiness: number;
}

export interface ExperimentOpsMaya {
  bullets: string[];
  patterns: string[];
  anomalies: string[];
  improvements: string[];
  validationReadiness: number;
  successProbability: number;
  failureRisk: number;
  predictedValidationOutcome: 'PASS' | 'HOLD' | 'FAIL';
  priorityExperiment: ExperimentRecord | null;
  priorityAction: string;
  futureExperiments: string[];
}

export interface ExperimentOpsSnapshot {
  experiments: ExperimentRecord[];
  metrics: ExperimentOpsMetrics;
  pipelineCounts: Record<PipelineStage, number>;
  bottlenecks: PipelineBottleneck[];
  prototypeTrees: PrototypeExperimentTree[];
  maya: ExperimentOpsMaya;
}

export interface ExperimentFilters {
  search: string;
  stage: PipelineStage | 'All';
  category: string;
  type: string;
  status: string;
}

const STALL_THRESHOLD_DAYS = 7;

export function parseExperimentConfig(findings: string | null): ExperimentConfig {
  if (!findings) return {};
  try {
    const parsed = JSON.parse(findings) as ExperimentConfig;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return { description: findings };
  }
}

export function computeDataCompleteness(config: ExperimentConfig, results: string | null): number {
  const fields = [
    config.objectives,
    config.success_criteria,
    config.independent_variables,
    config.dependent_variables,
    config.methodology,
    config.metrics,
    config.observations,
    results,
    config.key_findings,
  ];
  const filled = fields.filter((f) => f?.trim()).length;
  return Math.round((filled / fields.length) * 100);
}

export function computeDataQuality(config: ExperimentConfig, results: string | null): number {
  let score = 0;
  if (config.metrics?.trim()) score += 25;
  if (config.observations?.trim()) score += 20;
  if (config.document_ids?.length) score += 15;
  if (config.file_uploads?.length) score += 10;
  if (config.sensor_readings?.trim()) score += 10;
  if (results?.trim()) score += 20;
  return Math.min(100, score);
}

export function computeEvidenceQuality(exp: {
  results: string | null;
  config: ExperimentConfig;
  confidenceScore: number;
}): number {
  let score = exp.confidenceScore * 0.4;
  if (exp.config.document_ids?.length) score += 15;
  if (exp.config.prototype_id) score += 10;
  if (exp.config.key_findings?.trim()) score += 15;
  if (exp.config.results_reviewed) score += 10;
  if (exp.config.evidence_approved) score += 10;
  return Math.min(100, Math.round(score));
}

export function computeExperimentConfidence(exp: {
  status: string;
  results: string | null;
  config: ExperimentConfig;
}): number {
  let score = 15;
  const status = exp.status.toLowerCase();
  if (['completed', 'done', 'analyzed', 'reviewed'].includes(status)) score += 30;
  if (['active', 'running', 'in_progress', 'approved'].includes(status)) score += 15;
  if (exp.results?.trim()) score += 15;
  if (exp.config.objectives?.trim()) score += 8;
  if (exp.config.success_criteria?.trim()) score += 8;
  if (exp.config.failure_criteria?.trim()) score += 5;
  if (exp.config.independent_variables?.trim()) score += 4;
  if (exp.config.dependent_variables?.trim()) score += 4;
  if (exp.config.document_ids?.length) score += 5;
  if (exp.config.observations?.trim()) score += 5;
  if (exp.config.key_findings?.trim()) score += 6;
  if (exp.config.evidence_approved) score += 5;
  return Math.min(100, score);
}

export function getExperimentPipelineStage(
  status: string,
  results: string | null,
  config: ExperimentConfig,
  confidenceScore: number
): PipelineStage {
  const s = status.toLowerCase();

  if (s === 'draft') return 'Draft';
  if (['planned', 'scheduled', 'ready'].includes(s)) return 'Planned';
  if (s === 'approved' || config.approved) return 'Approved';

  if (['active', 'running', 'in_progress'].includes(s)) {
    if (config.observations?.trim() || config.metrics?.trim() || config.sensor_readings?.trim()) {
      return 'Data Collection';
    }
    return 'Running';
  }

  if (s === 'failed') {
    if (config.key_findings?.trim() || results?.trim()) return 'Review';
    return 'Analysis';
  }

  if (['completed', 'done', 'closed', 'analyzed', 'reviewed'].includes(s)) {
    if (
      confidenceScore >= 70 &&
      config.results_reviewed &&
      (config.evidence_approved || results?.trim()) &&
      (results?.trim() || config.success_criteria?.trim())
    ) {
      return 'Validation Ready';
    }
    if (config.key_findings?.trim() || config.results_reviewed) return 'Review';
    if (results?.trim() || config.observations?.trim() || config.actual_results?.trim()) {
      return 'Analysis';
    }
    if (config.metrics?.trim() || config.observations?.trim()) return 'Data Collection';
    return 'Analysis';
  }

  if (s === 'archived') return 'Review';
  return 'Draft';
}

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export function resolveExperimentResults(row: Record<string, unknown>): string | null {
  if (row.results != null && String(row.results).trim()) return String(row.results);
  if (row.result != null && String(row.result).trim()) return String(row.result);
  return null;
}

export function resolveExperimentFindings(row: Record<string, unknown>): string | null {
  if (row.findings != null && String(row.findings).trim()) return String(row.findings);
  if (Array.isArray(row.recommendations)) {
    return JSON.stringify({ recommendations: row.recommendations });
  }
  if (row.recommendations != null) return String(row.recommendations);
  return null;
}

export function resolveExperimentTitle(row: Record<string, unknown>, config: ExperimentConfig): string {
  if (row.title != null && String(row.title).trim()) return String(row.title);
  if (config.description?.trim()) return config.description.slice(0, 80);
  if (row.hypothesis != null && String(row.hypothesis).trim()) {
    return String(row.hypothesis).slice(0, 80);
  }
  return 'Untitled experiment';
}

export function normalizeExperimentRow(
  row: Record<string, unknown>,
  project?: { name?: string; sector?: string } | null,
  prototypeName?: string | null
): ExperimentRecord {
  const findingsRaw = resolveExperimentFindings(row);
  const config = parseExperimentConfig(findingsRaw);
  const results = resolveExperimentResults(row);
  const status = String(row.status ?? 'draft');
  const confidenceScore = computeExperimentConfidence({ status, results, config });
  const pipelineStage = getExperimentPipelineStage(status, results, config, confidenceScore);
  const prototypeId = config.prototype_id ? String(config.prototype_id) : null;

  return {
    id: String(row.id),
    title: resolveExperimentTitle(row, config),
    hypothesis: String(row.hypothesis ?? ''),
    type: String(row.type ?? config.category ?? 'structured'),
    status,
    pipelineStage,
    project_id: row.project_id ? String(row.project_id) : null,
    project_name: project?.name ? String(project.name) : null,
    project_sector: project?.sector ? String(project.sector) : null,
    prototype_id: prototypeId,
    prototype_name: prototypeName ?? null,
    results,
    findings: findingsRaw,
    config,
    confidenceScore,
    evidenceQuality: computeEvidenceQuality({ results, config, confidenceScore }),
    dataQuality: computeDataQuality(config, results),
    dataCompleteness: computeDataCompleteness(config, results),
    validationReady: pipelineStage === 'Validation Ready',
    daysInStage: daysSince(String(row.updated_at)),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function computeResultsAnalytics(exp: ExperimentRecord): ResultsAnalytics {
  const expected = exp.config.expected_outcomes || exp.config.success_criteria || '';
  const actual = exp.config.actual_results || exp.results || exp.config.observations || '';
  let variance: number | null = null;

  const expectedNum = parseFloat(expected.replace(/[^0-9.]/g, ''));
  const actualNum = parseFloat(actual.replace(/[^0-9.]/g, ''));
  if (!Number.isNaN(expectedNum) && !Number.isNaN(actualNum) && expectedNum !== 0) {
    variance = Math.round(((actualNum - expectedNum) / expectedNum) * 100);
  }

  let statisticalSignificance: ResultsAnalytics['statisticalSignificance'] = 'unknown';
  if (exp.config.metrics?.toLowerCase().includes('p<') || exp.config.metrics?.includes('95%')) {
    statisticalSignificance = 'high';
  } else if (exp.dataCompleteness >= 70) {
    statisticalSignificance = 'medium';
  } else if (exp.dataCompleteness > 0) {
    statisticalSignificance = 'low';
  }

  let evidenceStrength: ResultsAnalytics['evidenceStrength'] = 'weak';
  if (exp.evidenceQuality >= 75) evidenceStrength = 'strong';
  else if (exp.evidenceQuality >= 50) evidenceStrength = 'moderate';

  return {
    expected,
    actual,
    variance,
    confidenceLevel: exp.confidenceScore,
    statisticalSignificance,
    evidenceStrength,
  };
}

export function computeExperimentIntelligence(exp: ExperimentRecord): ExperimentIntelligence {
  const successProbability = Math.min(
    95,
    Math.round(exp.confidenceScore * 0.5 + exp.evidenceQuality * 0.3 + exp.dataCompleteness * 0.2)
  );
  const failureRisk = Math.max(5, 100 - successProbability);

  const rootCauses: string[] = [];
  if (exp.status.toLowerCase() === 'failed') {
    if (!exp.config.failure_criteria) rootCauses.push('Failure criteria were not defined pre-test.');
    if (!exp.config.observations) rootCauses.push('Insufficient observation data to diagnose failure.');
  }
  if (exp.dataCompleteness < 50) rootCauses.push('Incomplete data collection reduced analytical confidence.');

  const keyFindings = exp.config.key_findings
    ? exp.config.key_findings.split('\n').filter(Boolean)
    : exp.results
      ? [exp.results.slice(0, 200)]
      : [];

  const strategicRecommendations: string[] = [];
  if (!exp.config.prototype_id) {
    strategicRecommendations.push('Link prototype to strengthen innovation traceability.');
  }
  if (exp.pipelineStage === 'Review' && !exp.config.results_reviewed) {
    strategicRecommendations.push('Mark results as reviewed before validation gate submission.');
  }
  if (exp.validationReady) {
    strategicRecommendations.push('Proceed to validation gate with collected evidence package.');
  }

  return { successProbability, failureRisk, rootCauses, keyFindings, strategicRecommendations };
}

export function detectBottlenecks(experiments: ExperimentRecord[]): PipelineBottleneck[] {
  return PIPELINE_STAGES.map((stage) => {
    const inStage = experiments.filter((e) => e.pipelineStage === stage);
    const stalled = inStage.filter((e) => e.daysInStage >= STALL_THRESHOLD_DAYS);
    const avgDays =
      inStage.length > 0
        ? Math.round(inStage.reduce((s, e) => s + e.daysInStage, 0) / inStage.length)
        : 0;
    let severity: PipelineBottleneck['severity'] = 'low';
    if (stalled.length >= 3 || avgDays >= 14) severity = 'high';
    else if (stalled.length >= 1 || avgDays >= 7) severity = 'medium';

    return {
      stage,
      count: inStage.length,
      stalledCount: stalled.length,
      avgDaysStalled: avgDays,
      severity,
    };
  }).filter((b) => b.count > 0 || b.stalledCount > 0);
}

export function groupByPrototype(
  experiments: ExperimentRecord[],
  prototypeNames: Record<string, string>
): PrototypeExperimentTree[] {
  const map = new Map<string, ExperimentRecord[]>();
  for (const exp of experiments) {
    const pid = exp.prototype_id ?? 'unlinked';
    const list = map.get(pid) ?? [];
    list.push(exp);
    map.set(pid, list);
  }
  return [...map.entries()].map(([prototypeId, exps]) => ({
    prototypeId,
    prototypeName:
      prototypeId === 'unlinked'
        ? 'Unlinked experiments'
        : prototypeNames[prototypeId] ?? exps[0]?.prototype_name ?? 'Prototype',
    experiments: exps,
  }));
}

export function filterExperiments(
  experiments: ExperimentRecord[],
  filters: ExperimentFilters
): ExperimentRecord[] {
  const q = filters.search.toLowerCase();
  return experiments.filter((e) => {
    if (filters.stage !== 'All' && e.pipelineStage !== filters.stage) return false;
    if (filters.category !== 'All' && e.type !== filters.category && e.config.category !== filters.category) {
      return false;
    }
    if (filters.type !== 'All' && e.type !== filters.type) return false;
    if (filters.status !== 'All' && e.status !== filters.status) return false;
    if (!q) return true;
    return (
      e.title.toLowerCase().includes(q) ||
      e.hypothesis.toLowerCase().includes(q) ||
      (e.project_name?.toLowerCase().includes(q) ?? false) ||
      (e.prototype_name?.toLowerCase().includes(q) ?? false) ||
      (e.config.methodology?.toLowerCase().includes(q) ?? false)
    );
  });
}

export function buildPortfolioMaya(experiments: ExperimentRecord[]): ExperimentOpsMaya {
  const bullets: string[] = [];
  const patterns: string[] = [];
  const anomalies: string[] = [];
  const improvements: string[] = [];
  const futureExperiments: string[] = [];

  if (experiments.length === 0) {
    return {
      bullets: ['No experiments yet — create structured tests to generate validation evidence.'],
      patterns: [],
      anomalies: [],
      improvements: ['Link experiments to prototypes before entering validation gate.'],
      validationReadiness: 0,
      successProbability: 0,
      failureRisk: 100,
      predictedValidationOutcome: 'HOLD',
      priorityExperiment: null,
      priorityAction: 'Create your first experiment from a project with an active prototype.',
      futureExperiments: ['Run a market validation test after prototype build.'],
    };
  }

  const ready = experiments.filter((e) => e.validationReady);
  const running = experiments.filter((e) =>
    ['Running', 'Data Collection'].includes(e.pipelineStage)
  );
  const drafts = experiments.filter((e) => e.pipelineStage === 'Draft');
  const lowConfidence = experiments.filter((e) => e.confidenceScore < 50);
  const lowEvidence = experiments.filter((e) => e.evidenceQuality < 50);

  const validationReadiness = Math.round(
    experiments.reduce((s, e) => s + e.confidenceScore, 0) / experiments.length
  );
  const successProbability = Math.round(
    experiments.reduce((s, e) => s + computeExperimentIntelligence(e).successProbability, 0) /
      experiments.length
  );
  const failureRisk = Math.max(5, 100 - successProbability);

  let predictedValidationOutcome: ExperimentOpsMaya['predictedValidationOutcome'] = 'HOLD';
  if (successProbability >= 75 && ready.length > 0) predictedValidationOutcome = 'PASS';
  else if (failureRisk >= 60 || experiments.filter((e) => e.status === 'failed').length > experiments.length * 0.3) {
    predictedValidationOutcome = 'FAIL';
  }

  let priorityExperiment: ExperimentRecord | null = null;
  let priorityAction = 'Review experiment registry and assign test owners.';

  if (ready.length > 0) {
    priorityExperiment = ready[0];
    priorityAction = `Promote "${ready[0].title}" into the validation gate with collected evidence.`;
    bullets.push(`${ready.length} experiment(s) are validation-ready.`);
  } else if (running.length > 0) {
    priorityExperiment = running[0];
    priorityAction = `Complete data collection for "${running[0].title}" and record actual results.`;
    bullets.push(`${running.length} experiment(s) in execution — monitor metrics.`);
  } else if (drafts.length > 0) {
    priorityExperiment = drafts[0];
    priorityAction = `Finalize test design for "${drafts[0].title}" and move to Approved.`;
    bullets.push(`${drafts.length} draft experiment(s) need design completion.`);
  }

  const typeCounts = experiments.reduce<Record<string, number>>((acc, e) => {
    const t = e.config.category ?? e.type;
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const dominant = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominant) patterns.push(`Dominant category: ${dominant[0]} (${dominant[1]} records).`);

  const stalled = experiments.filter(
    (e) => e.daysInStage >= STALL_THRESHOLD_DAYS && !['Validation Ready', 'Review'].includes(e.pipelineStage)
  );
  if (stalled.length > 0) {
    patterns.push(`${stalled.length} experiment(s) stalled ≥${STALL_THRESHOLD_DAYS} days in current stage.`);
    improvements.push('Resolve pipeline bottlenecks — assign owners to stalled tests.');
  }

  const noPrototype = experiments.filter((e) => !e.prototype_id).length;
  if (noPrototype > experiments.length * 0.4) {
    anomalies.push(`${noPrototype} experiments lack prototype linkage.`);
    futureExperiments.push('Add prototype-linked engineering tests for core innovations.');
  }

  if (lowConfidence.length > 0) {
    improvements.push(`${lowConfidence.length} experiment(s) below 50% confidence — strengthen variables and criteria.`);
  }
  if (lowEvidence.length > 0) {
    improvements.push(`${lowEvidence.length} experiment(s) have weak evidence quality — attach documents and metrics.`);
  }

  if (experiments.filter((e) => e.pipelineStage === 'Analysis').length > 2) {
    futureExperiments.push('Run follow-up A/B tests on top-performing variants.');
  }

  improvements.push('Export portfolio CSV before validation gate reviews.');

  if (bullets.length === 0) {
    bullets.push('Experiment portfolio is progressing across pipeline stages.');
  }

  return {
    bullets,
    patterns,
    anomalies,
    improvements,
    validationReadiness,
    successProbability,
    failureRisk,
    predictedValidationOutcome,
    priorityExperiment,
    priorityAction,
    futureExperiments,
  };
}

export function buildPortfolioMetrics(experiments: ExperimentRecord[]): ExperimentOpsMetrics {
  const pipelineCounts = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = experiments.filter((e) => e.pipelineStage === stage).length;
      return acc;
    },
    {} as Record<PipelineStage, number>
  );

  const completed = experiments.filter((e) =>
    ['Analysis', 'Review', 'Validation Ready'].includes(e.pipelineStage)
  ).length;
  const failed = experiments.filter((e) => e.status.toLowerCase() === 'failed').length;
  const successRate = completed > 0 ? Math.round(((completed - failed) / completed) * 100) : 0;
  const failureRate = experiments.length > 0 ? Math.round((failed / experiments.length) * 100) : 0;

  const avgConfidence =
    experiments.length > 0
      ? Math.round(experiments.reduce((s, e) => s + e.confidenceScore, 0) / experiments.length)
      : 0;
  const evidenceQuality =
    experiments.length > 0
      ? Math.round(experiments.reduce((s, e) => s + e.evidenceQuality, 0) / experiments.length)
      : 0;
  const innovationReadiness =
    experiments.length > 0
      ? Math.round(
          experiments.reduce(
            (s, e) => s + e.confidenceScore * 0.4 + e.evidenceQuality * 0.35 + e.dataCompleteness * 0.25,
            0
          ) / experiments.length
        )
      : 0;

  return {
    total: experiments.length,
    active: pipelineCounts.Running + pipelineCounts['Data Collection'],
    planned: pipelineCounts.Planned + pipelineCounts.Approved + pipelineCounts.Draft,
    completed,
    failed,
    validationReady: pipelineCounts['Validation Ready'],
    successRate,
    failureRate,
    avgConfidence,
    evidenceQuality,
    innovationReadiness,
  };
}

export function buildExperimentDetailMaya(exp: ExperimentRecord): {
  bullets: string[];
  improvements: string[];
  nextAction: string;
} {
  const intel = computeExperimentIntelligence(exp);
  const bullets: string[] = [...intel.keyFindings.slice(0, 2)];
  const improvements = [...intel.strategicRecommendations];
  let nextAction = 'Review test design and assign data collection owners.';

  switch (exp.pipelineStage) {
    case 'Draft':
      nextAction = 'Complete objectives, variables, and failure criteria — then move to Planned.';
      improvements.push('Add success criteria before starting the test.');
      break;
    case 'Planned':
      nextAction = 'Submit for approval and assign team resources.';
      break;
    case 'Approved':
      nextAction = 'Start execution and begin recording observations.';
      break;
    case 'Running':
      nextAction = 'Log metrics and observations during the test run.';
      if (!exp.config.observations && !exp.results) {
        bullets.push('No observations recorded yet — capture evidence during the run.');
      }
      break;
    case 'Data Collection':
      nextAction = 'Complete data capture and mark experiment as completed for analysis.';
      break;
    case 'Analysis':
      nextAction = 'Document key findings and compare against success criteria.';
      improvements.push('Compare actual results against success and failure criteria.');
      break;
    case 'Review':
      nextAction = 'Approve evidence and mark results reviewed to reach Validation Ready.';
      break;
    case 'Validation Ready':
      nextAction = 'Submit this experiment as evidence in the validation gate.';
      bullets.push('Experiment meets validation readiness threshold.');
      break;
  }

  if (exp.confidenceScore < 50) {
    improvements.push('Low confidence — add variables, metrics, and linked documents.');
  }
  if (!exp.prototype_id) {
    improvements.push('Link a prototype to strengthen prototype → experiment traceability.');
  }

  if (bullets.length === 0) {
    bullets.push(
      `Pipeline: ${exp.pipelineStage} · Confidence ${exp.confidenceScore}% · Success probability ${intel.successProbability}%.`
    );
  }

  return { bullets, improvements, nextAction };
}

export function formatExperimentTimeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function validationGateStatus(exp: ExperimentRecord): {
  canStart: boolean;
  checks: Array<{ label: string; met: boolean }>;
  decision: 'PASS' | 'HOLD' | 'FAIL';
} {
  const checks = [
    {
      label: 'Experiment completed',
      met: ['completed', 'done', 'analyzed', 'reviewed', 'failed'].includes(exp.status.toLowerCase()) ||
        ['Analysis', 'Review', 'Validation Ready'].includes(exp.pipelineStage),
    },
    {
      label: 'Results reviewed',
      met: Boolean(exp.config.results_reviewed || exp.pipelineStage === 'Validation Ready'),
    },
    {
      label: 'Evidence approved',
      met: Boolean(exp.config.evidence_approved || exp.validationReady),
    },
    {
      label: 'Confidence threshold met (≥70%)',
      met: exp.confidenceScore >= 70,
    },
  ];
  const canStart = checks.every((c) => c.met);
  let decision: 'PASS' | 'HOLD' | 'FAIL' = 'HOLD';
  if (canStart) decision = 'PASS';
  else if (exp.status === 'failed' || exp.confidenceScore < 40) decision = 'FAIL';
  return { canStart, checks, decision };
}
