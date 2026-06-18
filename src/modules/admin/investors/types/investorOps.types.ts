import type { AdminServiceResult } from '../../types/projectAdmin.types';

export type DealStage = 'lead' | 'contacted' | 'negotiation' | 'committed' | 'closed';

export const DEAL_STAGES: ReadonlyArray<{ id: DealStage; label: string; color: string }> = [
  { id: 'lead', label: 'Lead', color: '#718096' },
  { id: 'contacted', label: 'Contacted', color: '#2fd4ff' },
  { id: 'negotiation', label: 'Negotiation', color: '#f6c90e' },
  { id: 'committed', label: 'Committed', color: '#7c5fe6' },
  { id: 'closed', label: 'Closed', color: '#48bb78' },
];

export interface Investor {
  id: string;
  name: string;
  email: string;
  company: string;
  type: string;
  totalInvested: number;
  activeDeals: number;
  engagementScore: number;
  riskScore: number;
  investorScore: number;
  lastActivity: string | null;
  tags: string[];
  isActive: boolean;
  applicationCount: number;
  investmentRangeMin: number;
  investmentRangeMax: number;
}

export interface Deal {
  id: string;
  investorId: string;
  investorName: string;
  title: string;
  amount: number;
  stage: DealStage;
  probabilityScore: number;
  expectedCloseDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealFormValues {
  investorId: string;
  title: string;
  amount: number;
  stage: DealStage;
  probabilityScore: number;
  expectedCloseDate: string;
  notes: string;
}

export interface CapitalOverview {
  totalCapitalAvailable: number;
  committedCapital: number;
  pendingDealsValue: number;
  closedCapital: number;
  weightedPipelineValue: number;
  averageDealProbability: number;
  activeDealsCount: number;
  runwayMonthsEstimate: number;
  revenueProjection90d: number;
}

export type AIInsightType =
  | 'hot_lead'
  | 'follow_up'
  | 'risk_alert'
  | 'opportunity'
  | 'recommendation';

export type AIInsightSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface AIInsight {
  id: string;
  type: AIInsightType;
  severity: AIInsightSeverity;
  title: string;
  message: string;
  investorId?: string;
  dealId?: string;
  score?: number;
  createdAt: string;
}

export interface InvestorAIAnalysis {
  rankedInvestors: Investor[];
  insights: AIInsight[];
  suggestedContact: Investor | null;
  hotLeads: Investor[];
  portfolioRiskScore: number;
  successProbability: number;
}

export interface InvestorActivityEvent {
  id: string;
  investorId: string;
  type: 'deal_created' | 'deal_updated' | 'deal_closed' | 'application' | 'profile_update';
  label: string;
  timestamp: string;
  metadata?: Record<string, string | number>;
}

export interface InvestorFilters {
  search?: string;
  tag?: string;
  minScore?: number;
  sortBy?: 'score' | 'engagement' | 'capital' | 'activity' | 'name';
}

export interface DealFilters {
  investorId?: string;
  stage?: DealStage | 'all';
}

export type InvestorOpsEventType =
  | 'investor:updated'
  | 'deal:created'
  | 'deal:updated'
  | 'ai:insight_generated';

export interface InvestorOpsEvent {
  type: InvestorOpsEventType;
  payload: Record<string, unknown>;
  at: string;
}

export const STAGE_PROBABILITY_DEFAULTS: Record<DealStage, number> = {
  lead: 10,
  contacted: 25,
  negotiation: 55,
  committed: 85,
  closed: 100,
};

export type { AdminServiceResult };
