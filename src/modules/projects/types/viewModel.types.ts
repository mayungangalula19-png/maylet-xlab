/** DB enum values (PostgreSQL project_status) */
export type ProjectStatusDb =
  | 'idea'
  | 'experiment'
  | 'prototype'
  | 'launched'
  | 'archived';

import type { ProjectStatus } from './commandCenter.types';

export type ProjectPriority = 'low' | 'medium' | 'high';

export type StatusFilter = 'all' | 'active' | 'completed' | 'hold' | 'archived';

export type PriorityFilter = 'all' | 'low' | 'medium' | 'high';

export type DateRangeFilter = 'all' | '7d' | '30d' | '90d';

export type SortField = 'updated_at' | 'created_at' | 'name' | 'progress';

export type SortOrder = 'asc' | 'desc';

export interface ProjectRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  sector: string | null;
  progress: number | null;
  progress_score: number | null;
  status: ProjectStatusDb;
  created_at: string;
  updated_at: string;
}

export type TeamMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export type CollaborationScopeFilter = 'all' | 'owned' | 'shared';

/** Enriched view model for the Projects dashboard */
export interface ProjectViewModel {
  id: string;
  user_id: string;
  name: string;
  description: string;
  sector: string;
  progress: number;
  status: ProjectStatus;
  statusDb: ProjectStatusDb;
  priority: ProjectPriority;
  created_at: string;
  updated_at: string;
  team_size: number;
  tasks_completed: number;
  tasks_total: number;
  ai_score?: number;
  team_id?: string;
  team_name?: string;
  is_owned: boolean;
  access_role: TeamMemberRole;
  collaborator_names: string[];
}

export interface CollaborationStats {
  teams: number;
  shared_projects: number;
  collaborators: number;
}

export interface TeamMemberPreview {
  id: string;
  user_id: string;
  name: string;
  role: TeamMemberRole;
}

export interface ProjectListStats {
  total: number;
  inProgress: number;
  completed: number;
  onHold: number;
  avgProgress: number;
}

export interface ProjectListParams {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  statusFilter?: StatusFilter;
  priorityFilter?: PriorityFilter;
  dateRange?: DateRangeFilter;
  collaborationScope?: CollaborationScopeFilter;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

export interface ProjectListResult {
  items: ProjectViewModel[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProjectFilters {
  search: string;
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  dateRange: DateRangeFilter;
  collaborationScope: CollaborationScopeFilter;
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
}

export type ActivityType = 'task' | 'document' | 'team' | 'experiment' | 'system';

export interface ActivityViewModel {
  id: string;
  user_name: string;
  action: string;
  project_name: string;
  created_at: string;
  type: ActivityType;
}

export type NotificationType = 'ai' | 'team' | 'funding' | 'system' | 'project_review';

export interface NotificationViewModel {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}

export interface AIProjectInsight {
  projectId: string;
  projectName: string;
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
  tip: string;
  source: 'ai_analyses' | 'heuristic';
}

/** RBAC-ready context passed into services/hooks */
export interface ProjectAccessContext {
  userId: string;
  role?: string;
}

export interface ServiceError {
  message: string;
  code?: string;
}
