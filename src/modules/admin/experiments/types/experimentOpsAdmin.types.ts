import type { ExperimentOpsMaya, ExperimentRecord, PipelineStage } from '../../../../lib/experiment/experimentOps';

export type ExecutivePipelineStage =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'completed'
  | 'under_review'
  | 'approved'
  | 'validation_ready'
  | 'funding_ready';

export type ExperimentRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ExecutiveStageDef {
  id: ExecutivePipelineStage;
  label: string;
  color: string;
}

export const EXECUTIVE_PIPELINE_STAGES: ExecutiveStageDef[] = [
  { id: 'draft', label: 'Draft', color: '#718096' },
  { id: 'scheduled', label: 'Scheduled', color: '#4299e1' },
  { id: 'running', label: 'Running', color: '#48bb78' },
  { id: 'completed', label: 'Completed', color: '#2fd4ff' },
  { id: 'under_review', label: 'Under Review', color: '#f6c90e' },
  { id: 'approved', label: 'Approved', color: '#9f7aea' },
  { id: 'validation_ready', label: 'Validation Ready', color: '#7c5fe6' },
  { id: 'funding_ready', label: 'Funding Ready', color: '#38b2ac' },
];

export interface AdminExperimentOpsStats {
  total: number;
  active: number;
  completed: number;
  failed: number;
  validationReady: number;
  fundingReady: number;
  successRate: number;
  pendingReview: number;
}

export interface AdminExperimentRow {
  id: string;
  displayId: string;
  title: string;
  projectId: string | null;
  projectName: string | null;
  leadResearcher: string;
  leadEmail: string;
  riskLevel: ExperimentRiskLevel;
  validationScore: number;
  budget: number;
  status: string;
  executiveStage: ExecutivePipelineStage;
  pipelineStage: PipelineStage;
  category: string;
  confidenceScore: number;
  updatedAt: string;
  createdAt: string;
  record: ExperimentRecord;
}

export interface ExperimentActivityItem {
  id: string;
  experimentId: string;
  experimentTitle: string;
  action: string;
  user?: string;
  at: string;
}

export interface ExperimentAnalyticsData {
  successTrend: { month: string; rate: number }[];
  budgetVsOutcome: { label: string; budget: number; outcome: number }[];
  categoryBreakdown: { category: string; count: number }[];
  validationFunnel: { stage: string; count: number }[];
  riskDistribution: Record<ExperimentRiskLevel, number>;
}

export interface AdminExperimentOpsSnapshot {
  rows: AdminExperimentRow[];
  stats: AdminExperimentOpsStats;
  executiveStageCounts: Record<ExecutivePipelineStage, number>;
  maya: ExperimentOpsMaya;
  activity: ExperimentActivityItem[];
  analytics: ExperimentAnalyticsData;
  platformTotal: number;
  scopeWarning: string | null;
}

export interface AdminExperimentFilters {
  search?: string;
  executiveStage?: ExecutivePipelineStage | 'all';
  riskLevel?: ExperimentRiskLevel | 'all';
  status?: string;
  category?: string;
}

export type ExperimentRowAction = 'view' | 'edit' | 'review' | 'approve';
