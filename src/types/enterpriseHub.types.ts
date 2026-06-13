import type { InnovationStage } from '../lib/innovation/lifecycle';
import type { Project } from './project.types';

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
}

export interface EnterpriseMayaInsight {
  bullets: string[];
  priorityProject: Project | null;
  priorityAction: string;
}

export interface EnterpriseHubSnapshot {
  profile: EnterpriseProfile;
  subscription: EnterpriseSubscription;
  metrics: EnterpriseHubMetrics;
  projects: Project[];
  teams: EnterpriseTeamRow[];
  vault: EnterpriseVaultRow[];
  timeline: EnterpriseActivityRow[];
  maya: EnterpriseMayaInsight;
}
