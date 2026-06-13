import type { InnovationStage } from '../lib/innovation/lifecycle';
import type { Project } from './project.types';

export type EnterpriseDepartmentId =
  | 'Engineering'
  | 'Research'
  | 'ICT'
  | 'Agriculture'
  | 'Health'
  | 'Energy'
  | 'Manufacturing'
  | 'Business';

export const ENTERPRISE_DEPARTMENTS: EnterpriseDepartmentId[] = [
  'Engineering',
  'Research',
  'ICT',
  'Agriculture',
  'Health',
  'Energy',
  'Manufacturing',
  'Business',
];

export interface EnterpriseProfile {
  full_name: string;
  email: string;
  organization_name: string;
  plan: string;
}

export interface EnterpriseSubscription {
  plan: string;
  status: string;
  current_period_end: string | null;
}

export interface EnterpriseTeamRow {
  id: string;
  name: string;
  description: string | null;
  project_id: string | null;
  project_name: string | null;
  member_count: number;
  created_at: string;
  department: EnterpriseDepartmentId;
}

export interface EnterpriseMemberRow {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  team_id: string;
  team_name: string;
  role: string;
  enterprise_role: string;
  department: EnterpriseDepartmentId;
}

export interface EnterpriseVaultRow {
  id: string;
  title: string;
  description: string | null;
  is_confidential: boolean;
  created_at: string;
}

export interface EnterpriseActivityRow {
  id: string;
  type: string;
  title: string;
  project_id: string | null;
  created_at: string;
}

export interface EnterpriseDocumentRow {
  id: string;
  name: string;
  file_type: string | null;
  project_id: string;
  project_name: string | null;
  category: string | null;
  created_at: string;
}

export interface EnterprisePrototypeRow {
  id: string;
  name: string;
  status: string;
  version: string;
  project_id: string | null;
  project_name: string | null;
  created_at: string;
}

export interface EnterpriseExperimentRow {
  id: string;
  title: string;
  status: string;
  hypothesis: string;
  project_id: string | null;
  project_name: string | null;
  created_at: string;
}

export interface EnterpriseValidationRow {
  id: string;
  project_id: string;
  project_name: string | null;
  decision: string;
  overall_score: number;
  created_at: string;
}

export interface EnterpriseFundingRow {
  id: string;
  title: string;
  status: string;
  amount_sought: number | null;
  project_id: string | null;
  project_name: string | null;
  created_at: string;
}

export interface EnterpriseResearchAssetRow {
  id: string;
  title: string;
  asset_type: 'profile' | 'note' | 'literature' | 'finding';
  project_id: string;
  project_name: string | null;
  created_at: string;
}

export interface EnterpriseNotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface EnterpriseDepartmentMetrics {
  id: EnterpriseDepartmentId;
  projectCount: number;
  researchCount: number;
  memberCount: number;
  avgProgress: number;
  activePrototypes: number;
  runningExperiments: number;
}

export interface EnterpriseHubMetrics {
  projectCount: number;
  teamCount: number;
  memberCount: number;
  vaultCount: number;
  documentCount: number;
  experimentCount: number;
  pitchCount: number;
  validationCount: number;
  avgProgress: number;
  fundingReadyCount: number;
  stageCounts: Record<InnovationStage, number>;
  activeResearch: number;
  activePrototypes: number;
  experimentsRunning: number;
  validationsPending: number;
  fundingSecured: number;
  commercializedProducts: number;
  departmentCount: number;
  innovationHealthScore: number;
  prototypeCount: number;
  researchAssetCount: number;
}

export interface EnterprisePipelineAnalytics {
  conversionRates: { from: InnovationStage; to: InnovationStage; rate: number }[];
  bottleneck: InnovationStage | null;
  velocity: number;
  successRate: number;
}

export interface EnterpriseAnalytics {
  pipeline: EnterprisePipelineAnalytics;
  validationPassRate: number;
  validationHoldRate: number;
  validationFailRate: number;
  experimentCompletionRate: number;
  fundingApprovalRate: number;
  departmentLeader: EnterpriseDepartmentId | null;
  topPerformingTeam: string | null;
}

export interface EnterpriseMayaInsight {
  healthScore: number;
  innovationPerformance: number;
  fundingReadiness: number;
  commercializationForecast: number;
  riskLevel: 'low' | 'medium' | 'high';
  risks: string[];
  recommendations: string[];
  departmentInsights: string[];
  opportunities: string[];
  bullets: string[];
  priorityProject: Project | null;
  priorityAction: string;
}

export interface EnterpriseSearchResult {
  type: 'project' | 'research' | 'team' | 'document' | 'funding' | 'prototype' | 'experiment' | 'validation';
  id: string;
  title: string;
  subtitle: string;
  route: string;
}

export interface EnterpriseHubSnapshot {
  profile: EnterpriseProfile;
  subscription: EnterpriseSubscription;
  metrics: EnterpriseHubMetrics;
  analytics: EnterpriseAnalytics;
  departments: EnterpriseDepartmentMetrics[];
  projects: Project[];
  teams: EnterpriseTeamRow[];
  members: EnterpriseMemberRow[];
  vault: EnterpriseVaultRow[];
  documents: EnterpriseDocumentRow[];
  prototypes: EnterprisePrototypeRow[];
  experiments: EnterpriseExperimentRow[];
  validations: EnterpriseValidationRow[];
  funding: EnterpriseFundingRow[];
  researchAssets: EnterpriseResearchAssetRow[];
  timeline: EnterpriseActivityRow[];
  notifications: EnterpriseNotificationRow[];
  maya: EnterpriseMayaInsight;
  searchIndex: EnterpriseSearchResult[];
}
