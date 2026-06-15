export type AgentId =
  | 'communication'
  | 'task'
  | 'project'
  | 'risk'
  | 'productivity'
  | 'memory';

export type WorkspaceEventType =
  | 'message:new'
  | 'message:edited'
  | 'message:deleted'
  | 'conversation:update'
  | 'task:created'
  | 'task:updated'
  | 'project:updated'
  | 'user:joined'
  | 'deadline:near'
  | 'workspace:activity';

export type AgentOutputEvent =
  | 'agent:insight'
  | 'agent:task_created'
  | 'agent:risk_detected'
  | 'agent:recommendation'
  | 'agent:summary'
  | 'agent:warning';

export type ActionType =
  | 'create_task'
  | 'assign_user'
  | 'send_notification'
  | 'generate_summary'
  | 'update_project_status'
  | 'escalate_issue';

export type DecisionMode = 'auto_execute' | 'suggest' | 'escalate' | 'ignore';

export interface WorkspaceEvent {
  id: string;
  type: WorkspaceEventType;
  workspaceId: string;
  conversationId?: string;
  userId?: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface MemoryRecord {
  id: string;
  workspaceId: string;
  agentId: AgentId;
  type: 'summary' | 'task' | 'decision' | 'risk' | 'insight';
  content: string;
  confidenceScore: number;
  importanceScore: number;
  sourceEventId: string;
  timestamp: string;
}

export interface AgentAction {
  id: string;
  type: ActionType;
  workspaceId: string;
  payload: Record<string, unknown>;
  confidence: number;
  impact: number;
  urgency: number;
  idempotencyKey: string;
}

export interface AgentDecision {
  mode: DecisionMode;
  action: AgentAction | null;
  reason: string;
  confidence: number;
}

export interface AgentInsight {
  agentId: AgentId;
  event: AgentOutputEvent;
  workspaceId: string;
  conversationId?: string;
  content: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceContext {
  workspaceId: string;
  conversationId?: string;
  recentMessages: Array<{ id: string; content: string; senderId: string; createdAt: string }>;
  memories: MemoryRecord[];
  event: WorkspaceEvent;
}

export interface AgentHandler {
  id: AgentId;
  handle(ctx: WorkspaceContext): Promise<AgentInsight[]>;
}
