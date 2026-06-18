import type { AdminServiceResult } from '../../types/projectAdmin.types';

export type InnovatorStage =
  | 'IDEA_SUBMITTED'
  | 'SCREENING'
  | 'TECH_REVIEW'
  | 'BUSINESS_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type InnovatorPriority = 'low' | 'medium' | 'high' | 'critical';

export type ReviewDecision = 'approve' | 'request_revision' | 'reject' | 'pending';

export const INNOVATOR_STAGES: ReadonlyArray<{
  id: InnovatorStage;
  label: string;
  color: string;
}> = [
  { id: 'IDEA_SUBMITTED', label: 'Idea Submitted', color: '#718096' },
  { id: 'SCREENING', label: 'Screening', color: '#2fd4ff' },
  { id: 'TECH_REVIEW', label: 'Tech Review', color: '#7c5fe6' },
  { id: 'BUSINESS_REVIEW', label: 'Business Review', color: '#f6c90e' },
  { id: 'APPROVED', label: 'Approved', color: '#48bb78' },
  { id: 'REJECTED', label: 'Rejected', color: '#fc8181' },
];

export const INNOVATOR_CATEGORIES = [
  'All',
  'General',
  'HealthTech',
  'FinTech',
  'AgriTech',
  'EdTech',
  'CleanTech',
  'AI / ML',
  'IoT',
  'Social Impact',
] as const;

export interface Innovator {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  organization: string | null;
  ideaTitle: string;
  ideaDescription: string;
  category: string;
  stage: InnovatorStage;
  impactScore: number;
  feasibilityScore: number;
  marketScore: number;
  finalScore: number;
  priority: InnovatorPriority;
  lastContactedAt: string | null;
  nextFollowUpDate: string | null;
  updatedAt: string;
  createdAt: string;
  reviewCount: number;
  messageCount: number;
}

export interface InnovatorReview {
  id: string;
  innovatorId: string;
  reviewerId: string | null;
  reviewerName: string;
  impactScore: number;
  feasibilityScore: number;
  marketScore: number;
  notes: string;
  decision: ReviewDecision;
  createdAt: string;
}

export interface InnovatorActivity {
  id: string;
  innovatorId: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface InnovatorActivityFeedItem extends InnovatorActivity {
  innovatorName: string;
}

export interface InnovatorOpsStats {
  total: number;
  activeInnovations: number;
  underReview: number;
  approvedFundable: number;
  overdueFollowUps: number;
}

export interface InnovatorFollowUp {
  innovator: Innovator;
  reason: 'overdue' | 'stale_contact' | 'pending_evaluation';
  urgencyScore: number;
}

export interface InnovatorFilters {
  search?: string;
  category?: string;
  stage?: InnovatorStage | 'all';
  priority?: InnovatorPriority | 'all';
}

export interface ReviewFormValues {
  impactScore: number;
  feasibilityScore: number;
  marketScore: number;
  notes: string;
  decision: ReviewDecision;
}

export function computeFinalScore(impact: number, feasibility: number, market = 0): number {
  if (market > 0) {
    return Math.min(100, Math.round(impact * 0.45 + feasibility * 0.35 + market * 0.2));
  }
  return Math.min(100, Math.round(impact * 0.6 + feasibility * 0.4));
}

export function stageLabel(stage: InnovatorStage): string {
  return INNOVATOR_STAGES.find((s) => s.id === stage)?.label ?? stage;
}

export function priorityColor(priority: InnovatorPriority): string {
  switch (priority) {
    case 'critical':
      return '#fc8181';
    case 'high':
      return '#f6c90e';
    case 'medium':
      return '#2fd4ff';
    default:
      return '#718096';
  }
}

export type { AdminServiceResult };
