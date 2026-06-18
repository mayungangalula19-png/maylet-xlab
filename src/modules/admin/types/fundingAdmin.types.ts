import type { AdminServiceResult } from './projectAdmin.types';

export type AdminFundingPitchStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'funded'
  | 'declined';

export type AdminFundingPitchStage = 'idea' | 'prototype' | 'mvp' | 'growth';

export interface AdminFundingRow {
  id: string;
  user_id: string;
  founder_name: string;
  founder_email: string;
  project_id: string | null;
  project_name: string | null;
  title: string;
  summary: string | null;
  amount: number;
  equity_offered: number;
  industry: string;
  stage: AdminFundingPitchStage;
  status: AdminFundingPitchStatus;
  pitch_deck_url: string | null;
  application_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminFundingStats {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  funded: number;
  declined: number;
  totalAmountSought: number;
  applicationsReceived: number;
}

export interface AdminFundingFilters {
  search?: string;
  status?: AdminFundingPitchStatus | 'all';
  stage?: AdminFundingPitchStage | 'all';
  industry?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminFundingListParams {
  page: number;
  pageSize: number;
  filters?: AdminFundingFilters;
}

export const FUNDING_STATUS_OPTIONS: ReadonlyArray<{
  value: AdminFundingFilters['status'];
  label: string;
}> = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'funded', label: 'Funded' },
  { value: 'declined', label: 'Declined' },
];

export const FUNDING_STAGE_OPTIONS: ReadonlyArray<{
  value: AdminFundingFilters['stage'];
  label: string;
}> = [
  { value: 'all', label: 'All stages' },
  { value: 'idea', label: 'Idea' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'mvp', label: 'MVP' },
  { value: 'growth', label: 'Growth' },
];

export const FUNDING_INDUSTRY_OPTIONS = [
  'All',
  'Technology',
  'Healthcare',
  'Education',
  'FinTech',
  'AgriTech',
  'Environment',
  'Blockchain',
  'AI / ML',
  'IoT',
] as const;

export function fundingStatusLabel(status: AdminFundingPitchStatus) {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'submitted':
      return 'Submitted';
    case 'under_review':
      return 'Under review';
    case 'funded':
      return 'Funded';
    case 'declined':
      return 'Declined';
    default:
      return status;
  }
}

export function fundingStatusVariant(
  status: AdminFundingPitchStatus
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'draft':
      return 'warning';
    case 'submitted':
      return 'info';
    case 'under_review':
      return 'default';
    case 'funded':
      return 'success';
    case 'declined':
      return 'danger';
    default:
      return 'default';
  }
}

export function fundingStageLabel(stage: AdminFundingPitchStage) {
  switch (stage) {
    case 'idea':
      return 'Idea';
    case 'prototype':
      return 'Prototype';
    case 'mvp':
      return 'MVP';
    case 'growth':
      return 'Growth';
    default:
      return stage;
  }
}

export type { AdminServiceResult };
