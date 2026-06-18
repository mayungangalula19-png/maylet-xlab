import type { PrototypeRecord } from '../../../prototype/types/prototype.types';

/** Executive lifecycle stages for prototype governance */
export type ExecutivePrototypeStage =
  | 'idea'
  | 'research'
  | 'concept_design'
  | 'prototype_design'
  | 'development'
  | 'internal_testing'
  | 'external_testing'
  | 'experiment_ready'
  | 'validation_ready'
  | 'funding_ready'
  | 'commercialization_ready';

export type PrototypeRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type PrototypeRowAction = 'view' | 'edit' | 'approve' | 'archive' | 'export';

export interface ExecutiveStageDef {
  id: ExecutivePrototypeStage;
  label: string;
  color: string;
}

export const EXECUTIVE_PROTOTYPE_STAGES: ExecutiveStageDef[] = [
  { id: 'idea', label: 'Idea', color: '#718096' },
  { id: 'research', label: 'Research', color: '#4299e1' },
  { id: 'concept_design', label: 'Concept Design', color: '#63b3ed' },
  { id: 'prototype_design', label: 'Prototype Design', color: '#9f7aea' },
  { id: 'development', label: 'Development', color: '#805ad5' },
  { id: 'internal_testing', label: 'Internal Testing', color: '#48bb78' },
  { id: 'external_testing', label: 'External Testing', color: '#38a169' },
  { id: 'experiment_ready', label: 'Experiment Ready', color: '#2fd4ff' },
  { id: 'validation_ready', label: 'Validation Ready', color: '#7c5fe6' },
  { id: 'funding_ready', label: 'Funding Ready', color: '#38b2ac' },
  { id: 'commercialization_ready', label: 'Commercialization Ready', color: '#f6c90e' },
];

export interface PrototypeReadinessBreakdown {
  documentation: number;
  engineering: number;
  testing: number;
  validation: number;
  funding: number;
  commercialization: number;
  overall: number;
  aiConfidence: number;
}

export interface PrototypeRiskBreakdown {
  technical: PrototypeRiskLevel;
  operational: PrototypeRiskLevel;
  security: PrototypeRiskLevel;
  manufacturing: PrototypeRiskLevel;
  financial: PrototypeRiskLevel;
  compliance: PrototypeRiskLevel;
  ip: PrototypeRiskLevel;
  market: PrototypeRiskLevel;
  aggregate: PrototypeRiskLevel;
  aggregateScore: number;
}

export interface PrototypeDigitalTwin {
  currentStatus: string;
  technicalState: string;
  experimentStatus: string;
  validationStatus: string;
  fundingStatus: string;
  commercializationStatus: string;
  readinessForecast: number;
  failurePrediction: number;
  timelineForecastDays: number;
  costForecastUsd: number;
}

export interface PrototypeIntelContext {
  builds: { status: string; completed_at: string | null }[];
  tests: { name: string; verdict: string; score: number | null }[];
  files: { file_name: string; file_type: string }[];
  experiments: { id: string; status: string; title: string }[];
  fundingPitches: { id: string; status: string; title: string }[];
  approvals: { status: string; reviewer_role: string }[];
  architectureLayers: number;
}

export interface AdminPrototypeOpsStats {
  total: number;
  active: number;
  successRate: number;
  experimentReady: number;
  validationReady: number;
  commercializationReady: number;
  highRisk: number;
  fundingEligible: number;
  avgDevelopmentDays: number;
  portfolioHealthScore: number;
  trendTotalPct: number;
  trendActivePct: number;
  trendSuccessPct: number;
}

export interface AdminPrototypeRow {
  id: string;
  displayId: string;
  name: string;
  parentProjectId: string | null;
  parentProjectName: string | null;
  researchProgram: string | null;
  department: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  technicalLead: string;
  version: string;
  executiveStage: ExecutivePrototypeStage;
  status: string;
  lifecycleStatus: string;
  readinessScore: number;
  riskScore: number;
  validationScore: number;
  fundingScore: number;
  commercializationScore: number;
  riskLevel: PrototypeRiskLevel;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
  record: PrototypeRecord;
  readiness: PrototypeReadinessBreakdown;
  risks: PrototypeRiskBreakdown;
  digitalTwin: PrototypeDigitalTwin;
  intel: PrototypeIntelContext;
}

export interface PrototypeActivityItem {
  id: string;
  prototypeId: string;
  prototypeName: string;
  action: string;
  user?: string;
  at: string;
}

export interface PrototypeApprovalItem {
  id: string;
  prototypeId: string;
  prototypeName: string;
  reviewerRole: string;
  status: string;
  at: string;
}

export interface PrototypeEvidenceItem {
  id: string;
  prototypeId: string;
  prototypeName: string;
  name: string;
  fileType: string;
  icon: string;
}

export interface PrototypeAnalyticsData {
  successTrend: { month: string; rate: number }[];
  failureTrend: { month: string; count: number }[];
  readinessDistribution: { band: string; count: number }[];
  fundingFunnel: { stage: string; count: number }[];
  commercializationFunnel: { stage: string; count: number }[];
  departmentPerformance: { department: string; avgReadiness: number; count: number }[];
  innovationVelocity: { month: string; created: number; promoted: number }[];
  riskDistribution: Record<PrototypeRiskLevel, number>;
  testingPassRate: number;
}

export interface PrototypeOpsMaya {
  bullets: string[];
  patterns: string[];
  anomalies: string[];
  improvements: string[];
  executiveSummary: string;
  technicalSummary: string;
  engineeringReport: string;
  validationReadiness: number;
  successProbability: number;
  failureRisk: number;
  manufacturingReadiness: number;
  commercializationPrediction: number;
  aiConfidence: number;
  priorityPrototype: { id: string; name: string } | null;
  priorityAction: string;
  bottleneckStage: ExecutivePrototypeStage | null;
  recommendations: string[];
}

export interface PrototypeLifecycleInsight {
  stage: ExecutivePrototypeStage;
  count: number;
  bottleneck: boolean;
  avgDaysInStage: number;
  recommendation: string;
}

export interface AdminPrototypeOpsSnapshot {
  rows: AdminPrototypeRow[];
  stats: AdminPrototypeOpsStats;
  executiveStageCounts: Record<ExecutivePrototypeStage, number>;
  lifecycleInsights: PrototypeLifecycleInsight[];
  maya: PrototypeOpsMaya;
  activity: PrototypeActivityItem[];
  analytics: PrototypeAnalyticsData;
  platformTotal: number;
  scopeWarning: string | null;
  departments: string[];
}

export interface AdminPrototypeFilters {
  search?: string;
  executiveStage?: ExecutivePrototypeStage | 'all';
  riskLevel?: PrototypeRiskLevel | 'all';
  status?: string;
  department?: string;
}

export interface SavedPrototypeView {
  id: string;
  name: string;
  filters: AdminPrototypeFilters;
}

export type BulkPrototypeAction = 'archive' | 'export' | 'request_review';
