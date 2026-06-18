import { logActivity } from '../../../lib/supabase/dbHelpers';
import { getAdminSession } from './adminAuth.service';

export type AdminAuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'archive'
  | 'restore'
  | 'approve'
  | 'reject'
  | 'verify'
  | 'export'
  | 'broadcast';

export interface AdminAuditEventInput {
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  action: AdminAuditAction;
  projectId?: string | null;
  metadata?: Record<string, unknown>;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

/** Unified admin audit bridge — writes to activities today; migrate to admin_audit_events later. */
export async function logAdminAudit(event: AdminAuditEventInput): Promise<void> {
  const session = await getAdminSession();
  if (!session) return;

  const title = buildAuditTitle(event);
  await logActivity({
    user_id: session.userId,
    project_id: event.projectId ?? null,
    type: 'admin',
    title,
    metadata: {
      target_type: event.resourceType,
      target_name: event.resourceName ?? event.resourceId,
      action: event.action,
      actor_email: session.email,
      actor_role: session.role,
      before: event.before,
      after: event.after,
      ...event.metadata,
    },
  });
}

function buildAuditTitle(event: AdminAuditEventInput): string {
  const name = event.resourceName ? `"${event.resourceName}"` : event.resourceId ?? 'record';
  return `Admin ${event.action} ${event.resourceType} ${name}`;
}
