import type { AdminServiceError, AdminServiceResult } from './projectAdmin.types';

export type CareerOpportunityType =
  | 'job'
  | 'internship'
  | 'fellowship'
  | 'research_opportunity'
  | 'hackathon'
  | 'innovation_challenge'
  | 'mentorship_program';

export type CareerOpportunityStatus = 'draft' | 'published' | 'closed' | 'archived';

export interface AdminCareerRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: CareerOpportunityType;
  department: string;
  location: string;
  is_remote: boolean;
  status: CareerOpportunityStatus;
  requirements: string;
  benefits: string;
  application_deadline: string | null;
  published_at: string | null;
  created_by: string | null;
  created_by_name: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  application_count: number;
}

export interface AdminCareerStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  applicationsReceived: number;
}

export interface AdminCareerFilters {
  search?: string;
  status?: CareerOpportunityStatus | 'all';
  type?: CareerOpportunityType | 'all';
  department?: string;
  location?: string;
  remote?: 'all' | 'remote' | 'onsite';
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminCareerListParams {
  page: number;
  pageSize: number;
  filters?: AdminCareerFilters;
}

export interface AdminCareerFormValues {
  title: string;
  type: CareerOpportunityType;
  department: string;
  location: string;
  is_remote: boolean;
  description: string;
  requirements: string;
  benefits: string;
  application_deadline: string;
  status: CareerOpportunityStatus;
}

export interface AdminCareerApplicationSummary {
  id: string;
  full_name: string;
  email: string;
  role_interest: string;
  status: string;
  created_at: string;
}

export const CAREER_TYPE_OPTIONS: { value: CareerOpportunityType; label: string }[] = [
  { value: 'job', label: 'Job' },
  { value: 'internship', label: 'Internship' },
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'research_opportunity', label: 'Research Opportunity' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'innovation_challenge', label: 'Innovation Challenge' },
  { value: 'mentorship_program', label: 'Mentorship Program' },
];

export const CAREER_STATUS_OPTIONS: { value: CareerOpportunityStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

export const CAREER_DEPARTMENTS = [
  'All',
  'Engineering',
  'Product',
  'Design',
  'Research',
  'Data',
  'Ecosystem',
  'Operations',
  'Marketing',
  'Finance',
  'Legal',
] as const;

export function careerTypeLabel(type: CareerOpportunityType): string {
  return CAREER_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function careerStatusVariant(
  status: CareerOpportunityStatus
): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' {
  switch (status) {
    case 'published':
      return 'success';
    case 'draft':
      return 'warning';
    case 'closed':
      return 'info';
    case 'archived':
      return 'default';
    default:
      return 'default';
  }
}

export type { AdminServiceError, AdminServiceResult };
