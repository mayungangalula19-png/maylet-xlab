import type { ProjectStatus } from '../../projects/types/commandCenter.types';

export interface AdminServiceError {
  code: string;
  message: string;
}

export interface AdminServiceResult<T> {
  data: T | null;
  error: AdminServiceError | null;
  meta?: { total?: number; page?: number; pageSize?: number };
}

export interface AdminListParams {
  page: number;
  pageSize: number;
  search?: string;
  sort?: { field: string; direction: 'asc' | 'desc' };
  filters?: AdminProjectFilters;
}

export interface AdminProjectRow {
  id: string;
  name: string;
  description: string | null;
  sector: string | null;
  progress: number;
  status: ProjectStatus;
  user_id: string;
  user_name: string;
  user_email: string;
  team_size: number;
  tasks_completed: number;
  tasks_total: number;
  created_at: string;
  updated_at: string;
}

export interface AdminProjectStats {
  total: number;
  byStatus: {
    idea: number;
    experiment: number;
    prototype: number;
    launched: number;
  };
  avgProgress: number;
  totalTeamMembers: number;
  totalTasks: number;
}

export interface AdminProjectFilters {
  search?: string;
  status?: string;
  sector?: string;
}

export const ADMIN_PROJECT_SECTORS = [
  'All',
  'Agriculture',
  'Health',
  'Education',
  'FinTech',
  'Environment',
  'Blockchain',
  'AI/ML',
  'IoT',
  'E-commerce',
  'Logistics',
  'Tourism',
  'Other',
] as const;

export type AdminProjectView = 'table' | 'grid';

export interface AdminProjectDetail extends AdminProjectRow {
  budget_used: number;
  budget_total: number;
  tech_stack: string[];
}

export interface AdminProjectTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  assigned_to_name: string;
  due_date: string | null;
  created_at: string | null;
}

export interface AdminProjectTeamMember {
  id: string;
  user_id: string;
  role: string;
  full_name: string;
  email: string;
  joined_at: string | null;
}

export interface AdminProjectDocument {
  id: string;
  name: string;
  file_url: string | null;
  file_type: string | null;
  size: number;
  uploaded_by: string | null;
  uploaded_by_name: string;
  created_at: string | null;
}

export interface AdminProjectActivity {
  id: string;
  user_name: string;
  action: string;
  target_type: string;
  target_name: string;
  created_at: string;
}

export interface AdminProjectDetailBundle {
  project: AdminProjectDetail;
  tasks: AdminProjectTask[];
  teamMembers: AdminProjectTeamMember[];
  documents: AdminProjectDocument[];
  activities: AdminProjectActivity[];
}

export const PROJECT_DETAIL_TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'tasks', label: 'Tasks', icon: '✅' },
  { id: 'team', label: 'Team', icon: '👥' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'activities', label: 'Activities', icon: '📝' },
] as const;

export type AdminProjectDetailTab = (typeof PROJECT_DETAIL_TABS)[number]['id'];
