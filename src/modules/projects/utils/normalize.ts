import type {
  ActivityType,
  ActivityViewModel,
  NotificationType,
  NotificationViewModel,
  ProjectRecord,
  ProjectViewModel,
} from '../types';
import { derivePriority, toDisplayStatus } from './statusHelpers';

export function normalizeProject(
  raw: ProjectRecord,
  enrichment?: Partial<
    Pick<
      ProjectViewModel,
      | 'team_size'
      | 'tasks_completed'
      | 'tasks_total'
      | 'ai_score'
      | 'team_id'
      | 'team_name'
      | 'is_owned'
      | 'access_role'
      | 'collaborator_names'
    >
  >
): ProjectViewModel {
  const progress = Math.round(Number(raw.progress ?? raw.progress_score ?? 0));
  const status = toDisplayStatus(raw.status);
  return {
    id: raw.id,
    user_id: raw.user_id,
    name: raw.name,
    description: raw.description ?? '',
    sector: raw.sector ?? 'General',
    progress,
    status,
    statusDb: raw.status,
    priority: derivePriority(status, progress),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    team_size: enrichment?.team_size ?? 1,
    tasks_completed: enrichment?.tasks_completed ?? 0,
    tasks_total: enrichment?.tasks_total ?? 0,
    ai_score: enrichment?.ai_score,
    team_id: enrichment?.team_id,
    team_name: enrichment?.team_name,
    is_owned: enrichment?.is_owned ?? true,
    access_role: enrichment?.access_role ?? 'owner',
    collaborator_names: enrichment?.collaborator_names ?? [],
  };
}

/** Handles both migration schema (title/type) and legacy app columns */
export function normalizeActivity(raw: Record<string, unknown>): ActivityViewModel {
  const type = (raw.type as string) ?? 'system';
  return {
    id: String(raw.id ?? ''),
    user_name: String(
      raw.user_name ?? raw.user_email ?? 'Team member'
    ),
    action: String(raw.action ?? raw.title ?? 'performed an action'),
    project_name: String(
      raw.project_name ?? raw.target_name ?? 'a project'
    ),
    created_at: String(raw.created_at ?? new Date().toISOString()),
    type: (['task', 'document', 'team', 'experiment'].includes(type)
      ? type
      : 'system') as ActivityType,
  };
}

export function normalizeNotification(raw: Record<string, unknown>): NotificationViewModel {
  const type = String(raw.type ?? 'system');
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? 'Notification'),
    message: String(raw.message ?? raw.body ?? ''),
    type: (['ai', 'team', 'funding', 'project_review'].includes(type)
      ? type
      : 'system') as NotificationType,
    read: Boolean(raw.read),
    created_at: String(raw.created_at ?? new Date().toISOString()),
  };
}
