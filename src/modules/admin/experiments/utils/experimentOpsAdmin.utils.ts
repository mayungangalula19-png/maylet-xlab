import {
  computeExperimentIntelligence,
  type ExperimentRecord,
} from '../../../../lib/experiment/experimentOps';
import type { AdminServiceResult } from '../../types/projectAdmin.types';
import type {
  AdminExperimentOpsStats,
  AdminExperimentRow,
  ExecutivePipelineStage,
  ExperimentActivityItem,
  ExperimentAnalyticsData,
  ExperimentRiskLevel,
} from '../types/experimentOpsAdmin.types';

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
      message: `${extractErrorMessage(err)}. Run scripts/fix-experiments-admin-access.sql in Supabase SQL Editor.`,
    },
  };
}

const EXPERIMENT_SELECTS = [
  'id, user_id, project_id, title, hypothesis, type, status, results, findings, created_at, updated_at',
  'id, user_id, project_id, title, hypothesis, status, results, findings, created_at, updated_at',
  'id, user_id, project_id, hypothesis, status, results, findings, created_at, updated_at',
  'id, user_id, project_id, hypothesis, status, created_at, updated_at',
  '*',
];

export async function queryExperimentsWithFallback(
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
  for (const select of EXPERIMENT_SELECTS) {
    const { data, error, count } = await supabase
      .from('experiments')
      .select(select, { count: 'exact' })
      .order('updated_at', { ascending: false });
    if (!error) {
      return { rows: (data ?? []) as Record<string, unknown>[], count };
    }
    if (!isSchemaError(error)) throw error;
  }
  return { rows: [], count: 0 };
}

export function formatExperimentDisplayId(id: string, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  const suffix = id.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `EXP-${year}-${suffix}`;
}

export function mapExecutiveStage(exp: ExperimentRecord): ExecutivePipelineStage {
  if (exp.validationReady && exp.confidenceScore >= 75 && exp.evidenceQuality >= 70) {
    return 'funding_ready';
  }
  if (exp.validationReady) return 'validation_ready';
  if (exp.pipelineStage === 'Approved' || exp.config.approved) return 'approved';
  if (exp.pipelineStage === 'Review') return 'under_review';
  if (['Analysis', 'Validation Ready'].includes(exp.pipelineStage)) return 'completed';
  if (['Running', 'Data Collection'].includes(exp.pipelineStage)) return 'running';
  if (exp.pipelineStage === 'Planned') return 'scheduled';
  return 'draft';
}

export function computeExperimentRisk(exp: ExperimentRecord): ExperimentRiskLevel {
  const intel = computeExperimentIntelligence(exp);
  if (exp.status.toLowerCase() === 'failed') return 'high';
  if (intel.failureRisk >= 70) return 'critical';
  if (intel.failureRisk >= 50) return 'high';
  if (intel.failureRisk >= 30) return 'medium';
  return 'low';
}

export function estimateExperimentBudget(exp: ExperimentRecord): number {
  const resources = exp.config.resources;
  if (resources?.trim()) {
    const match = resources.match(/\$?\s*([\d,]+(?:\.\d+)?)/);
    if (match) return Math.round(parseFloat(match[1].replace(/,/g, '')));
  }
  const base: Record<string, number> = {
    market: 18000,
    scientific: 42000,
    engineering: 35000,
    product: 22000,
    business: 12000,
    structured: 15000,
  };
  return base[exp.type] ?? base[exp.config.category ?? 'structured'] ?? 15000;
}

export function buildAdminExperimentRow(
  exp: ExperimentRecord,
  owner: { name: string; email: string }
): AdminExperimentRow {
  return {
    id: exp.id,
    displayId: formatExperimentDisplayId(exp.id, exp.created_at),
    title: exp.title,
    projectId: exp.project_id,
    projectName: exp.project_name,
    leadResearcher: owner.name,
    leadEmail: owner.email,
    riskLevel: computeExperimentRisk(exp),
    validationScore: Math.round(
      exp.confidenceScore * 0.45 + exp.evidenceQuality * 0.35 + exp.dataCompleteness * 0.2
    ),
    budget: estimateExperimentBudget(exp),
    status: exp.status,
    executiveStage: mapExecutiveStage(exp),
    pipelineStage: exp.pipelineStage,
    category: exp.config.category ?? exp.type,
    confidenceScore: exp.confidenceScore,
    updatedAt: exp.updated_at,
    createdAt: exp.created_at,
    record: exp,
  };
}

export function buildAdminExperimentStats(rows: AdminExperimentRow[]): AdminExperimentOpsStats {
  const failed = rows.filter((r) => r.status.toLowerCase() === 'failed').length;
  const completed = rows.filter((r) =>
    ['completed', 'under_review', 'approved', 'validation_ready', 'funding_ready'].includes(
      r.executiveStage
    )
  ).length;
  const active = rows.filter((r) => r.executiveStage === 'running').length;
  const validationReady = rows.filter((r) =>
    ['validation_ready', 'funding_ready'].includes(r.executiveStage)
  ).length;
  const fundingReady = rows.filter((r) => r.executiveStage === 'funding_ready').length;
  const pendingReview = rows.filter((r) => r.executiveStage === 'under_review').length;
  const successRate =
    completed > 0 ? Math.round(((completed - failed) / Math.max(completed, 1)) * 100) : 0;

  return {
    total: rows.length,
    active,
    completed,
    failed,
    validationReady,
    fundingReady,
    successRate,
    pendingReview,
  };
}

export function buildExecutiveStageCounts(
  rows: AdminExperimentRow[]
): Record<ExecutivePipelineStage, number> {
  const counts: Record<ExecutivePipelineStage, number> = {
    draft: 0,
    scheduled: 0,
    running: 0,
    completed: 0,
    under_review: 0,
    approved: 0,
    validation_ready: 0,
    funding_ready: 0,
  };
  for (const row of rows) counts[row.executiveStage] += 1;
  return counts;
}

export function extractExperimentActivity(rows: AdminExperimentRow[]): ExperimentActivityItem[] {
  const items: ExperimentActivityItem[] = [];
  for (const row of rows) {
    const audit = row.record.config.audit_log ?? [];
    for (const entry of audit) {
      items.push({
        id: `${row.id}-${entry.at}`,
        experimentId: row.id,
        experimentTitle: row.title,
        action: entry.action,
        user: entry.user,
        at: entry.at,
      });
    }
    items.push({
      id: `${row.id}-updated`,
      experimentId: row.id,
      experimentTitle: row.title,
      action: `Status: ${row.status} · ${row.pipelineStage}`,
      at: row.updatedAt,
    });
  }
  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 20);
}

export function buildExperimentAnalytics(rows: AdminExperimentRow[]): ExperimentAnalyticsData {
  const monthMap = new Map<string, { total: number; success: number }>();
  const categoryMap = new Map<string, number>();
  const riskDistribution: Record<ExperimentRiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const row of rows) {
    const month = row.createdAt.slice(0, 7);
    const bucket = monthMap.get(month) ?? { total: 0, success: 0 };
    bucket.total += 1;
    if (row.status.toLowerCase() !== 'failed') bucket.success += 1;
    monthMap.set(month, bucket);

    const cat = row.category || 'General';
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
    riskDistribution[row.riskLevel] += 1;
  }

  const successTrend = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, { total, success }]) => ({
      month,
      rate: total > 0 ? Math.round((success / total) * 100) : 0,
    }));

  const budgetVsOutcome = rows.slice(0, 6).map((row) => ({
    label: row.displayId,
    budget: row.budget,
    outcome: Math.round(row.validationScore * row.budget * 0.01),
  }));

  const categoryBreakdown = [...categoryMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const stageCounts = buildExecutiveStageCounts(rows);
  const validationFunnel = [
    { stage: 'Draft', count: stageCounts.draft + stageCounts.scheduled },
    { stage: 'Running', count: stageCounts.running },
    { stage: 'Completed', count: stageCounts.completed },
    { stage: 'Review', count: stageCounts.under_review },
    { stage: 'Approved', count: stageCounts.approved },
    { stage: 'Validation', count: stageCounts.validation_ready + stageCounts.funding_ready },
  ];

  return {
    successTrend,
    budgetVsOutcome,
    categoryBreakdown,
    validationFunnel,
    riskDistribution,
  };
}

export function riskLevelLabel(level: ExperimentRiskLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function riskLevelVariant(level: ExperimentRiskLevel): 'success' | 'warning' | 'danger' | 'info' {
  switch (level) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'danger';
    default:
      return 'danger';
  }
}

export function experimentStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const s = status.toLowerCase();
  if (['running', 'active', 'in_progress', 'completed', 'done'].includes(s)) return 'success';
  if (['failed', 'cancelled'].includes(s)) return 'danger';
  if (['draft', 'planned', 'scheduled'].includes(s)) return 'info';
  return 'warning';
}

export interface RiskHeatmapCell {
  impact: number;
  likelihood: number;
  count: number;
  tone: 'low' | 'medium' | 'high' | 'critical';
}

export function buildRiskHeatmap(rows: AdminExperimentRow[]): RiskHeatmapCell[] {
  const cells: RiskHeatmapCell[] = [];
  for (let impact = 0; impact < 3; impact++) {
    for (let likelihood = 0; likelihood < 3; likelihood++) {
      cells.push({ impact, likelihood, count: 0, tone: 'low' });
    }
  }

  for (const row of rows) {
    const impact =
      row.validationScore >= 75 ? 2 : row.validationScore >= 45 ? 1 : 0;
    const likelihood =
      row.riskLevel === 'critical' ? 2 : row.riskLevel === 'high' ? 2 : row.riskLevel === 'medium' ? 1 : 0;
    const idx = impact * 3 + likelihood;
    cells[idx].count += 1;
  }

  for (const cell of cells) {
    const score = cell.impact + cell.likelihood;
    if (score >= 4 || cell.count >= 5) cell.tone = 'critical';
    else if (score >= 3) cell.tone = 'high';
    else if (score >= 2) cell.tone = 'medium';
    else cell.tone = 'low';
  }

  return cells;
}

export interface EvidenceItem {
  id: string;
  name: string;
  icon: string;
  experimentTitle: string;
}

export function extractEvidenceItems(rows: AdminExperimentRow[]): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  for (const row of rows) {
    const cfg = row.record.config;
    for (const docId of cfg.document_ids ?? []) {
      items.push({
        id: `${row.id}-doc-${docId}`,
        name: `Document ${docId.slice(0, 8)}`,
        icon: '📄',
        experimentTitle: row.title,
      });
    }
    for (const file of cfg.file_uploads ?? []) {
      items.push({
        id: `${row.id}-file-${file}`,
        name: file.split('/').pop() ?? file,
        icon: '📊',
        experimentTitle: row.title,
      });
    }
    if (cfg.key_findings?.trim()) {
      items.push({
        id: `${row.id}-findings`,
        name: 'Key findings report',
        icon: '🔍',
        experimentTitle: row.title,
      });
    }
  }
  if (items.length === 0) {
    return [];
  }
  return items.slice(0, 6);
}

export interface ApprovalItem {
  id: string;
  title: string;
  researcher: string;
  kind: 'Approval' | 'Validation';
  detail: string;
}

export function extractApprovalItems(rows: AdminExperimentRow[]): ApprovalItem[] {
  return rows
    .filter((r) => ['under_review', 'approved', 'validation_ready'].includes(r.executiveStage))
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      title: r.title,
      researcher: r.leadResearcher,
      kind: r.executiveStage === 'validation_ready' ? 'Validation' : 'Approval',
      detail:
        r.executiveStage === 'validation_ready'
          ? `Validation score: ${(r.validationScore / 10).toFixed(1)}`
          : `Risk: ${riskLevelLabel(r.riskLevel)}`,
    }));
}
