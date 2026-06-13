import type { ProjectPriority, ProjectStatus, ProjectStatusDb } from '../types';

const STATUS_DB_TO_UI: Record<ProjectStatusDb, ProjectStatus> = {
  idea: 'Idea',
  experiment: 'Experiment',
  prototype: 'Prototype',
  launched: 'Launched',
  archived: 'Archived',
};

const STATUS_UI_TO_DB: Record<ProjectStatus, ProjectStatusDb> = {
  Idea: 'idea',
  Experiment: 'experiment',
  Prototype: 'prototype',
  Launched: 'launched',
  Archived: 'archived',
};

export function toDisplayStatus(status: string): ProjectStatus {
  const key = status.toLowerCase() as ProjectStatusDb;
  return STATUS_DB_TO_UI[key] ?? 'Idea';
}

export function toDbStatus(status: ProjectStatus): ProjectStatusDb {
  return STATUS_UI_TO_DB[status];
}

export function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case 'Idea':
      return '#f6c90e';
    case 'Experiment':
      return '#2fd4ff';
    case 'Prototype':
      return '#7c5fe6';
    case 'Launched':
      return '#48bb78';
    case 'Archived':
      return 'rgba(255,255,255,0.4)';
    default:
      return 'rgba(255,255,255,0.5)';
  }
}

export interface SectorTheme {
  color: string;
}

export function getSectorTheme(sector: string): SectorTheme {
  const value = sector.toLowerCase();
  if (value.includes('agri')) return { color: '#48bb78' };
  if (value.includes('block')) return { color: '#2fd4ff' };
  if (value.includes('health')) return { color: '#fc8181' };
  if (value.includes('edu')) return { color: '#9b7ff0' };
  if (value.includes('environment') || value.includes('climate')) return { color: '#38a169' };
  if (value.includes('fintech') || value.includes('finance')) return { color: '#f6c90e' };
  return { color: '#7c5fe6' };
}

export function getActivityTypeLabel(type: string): string {
  switch (type) {
    case 'task':
      return 'Task update';
    case 'document':
      return 'Document';
    case 'team':
      return 'Team activity';
    case 'experiment':
      return 'Experiment';
    default:
      return 'Activity';
  }
}

export function getNotificationTypeLabel(type: string): string {
  switch (type) {
    case 'ai':
      return 'AI insight';
    case 'team':
      return 'Team update';
    case 'funding':
      return 'Funding';
    case 'project_review':
      return 'Project review';
    default:
      return 'Notification';
  }
}

export function derivePriority(
  status: ProjectStatus,
  progress: number
): ProjectPriority {
  if (status === 'Launched' || progress >= 70) return 'high';
  if (status === 'Experiment' || status === 'Prototype' || progress >= 30) return 'medium';
  return 'low';
}
