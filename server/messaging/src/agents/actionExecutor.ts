import { adminSupabase } from '../auth/verifyToken.js';
import type { AgentAction } from './types/workspace.types.js';
import { logger } from '../utils/logger.js';

export class ActionExecutor {
  private readonly executed = new Set<string>();

  async execute(action: AgentAction): Promise<boolean> {
    if (this.executed.has(action.idempotencyKey)) {
      logger.debug('action_idempotent_skip', { key: action.idempotencyKey });
      return false;
    }

    this.executed.add(action.idempotencyKey);
    await this.audit(action);

    switch (action.type) {
      case 'create_task':
        return this.createTask(action);
      case 'send_notification':
        return this.sendNotification(action);
      case 'generate_summary':
        return true;
      case 'escalate_issue':
        return this.escalate(action);
      case 'assign_user':
      case 'update_project_status':
        logger.info('action_deferred', { type: action.type, workspaceId: action.workspaceId });
        return true;
      default:
        return false;
    }
  }

  private async audit(action: AgentAction): Promise<void> {
    if (!adminSupabase) return;
    await adminSupabase.from('agent_audit_log').insert({
      action_id: action.id,
      action_type: action.type,
      workspace_id: action.workspaceId,
      payload: action.payload,
      confidence: action.confidence,
      created_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) logger.debug('audit_log_skipped', { reason: error.message });
    });
  }

  private async createTask(action: AgentAction): Promise<boolean> {
    if (!adminSupabase) return true;
    const content = String(action.payload.content ?? 'Agent task');
    const { error } = await adminSupabase.from('tasks').insert({
      title: content.slice(0, 120),
      description: content,
      status: 'todo',
      user_id: String(action.payload.userId ?? action.workspaceId),
    });
    if (error) {
      logger.warn('create_task_failed', { error: error.message });
      return false;
    }
    return true;
  }

  private async sendNotification(action: AgentAction): Promise<boolean> {
    if (!adminSupabase) return true;
    const userId = String(action.payload.userId ?? '');
    if (!userId) return false;
    const { error } = await adminSupabase.from('notifications').insert({
      user_id: userId,
      title: 'MAYA Agent',
      message: String(action.payload.content ?? ''),
      type: 'agent',
    });
    return !error;
  }

  private async escalate(action: AgentAction): Promise<boolean> {
    logger.warn('agent_escalation', {
      workspaceId: action.workspaceId,
      content: action.payload.content,
    });
    return true;
  }
}
