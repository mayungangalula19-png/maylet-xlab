export type InnovationStage =
  | 'idea'
  | 'experiment'
  | 'prototype'
  | 'project'
  | 'funding'
  | 'business';

export type MemoryType =
  | 'session_summary'
  | 'user_dna'
  | 'project_summary'
  | 'experiment_result'
  | 'document_chunk'
  | 'team_context'
  | 'knowledge_base';

export type MayaAgentRole =
  | 'chat'
  | 'project'
  | 'experiment'
  | 'research'
  | 'code'
  | 'document'
  | 'funding'
  | 'team';

export type MayaModelId = 'groq' | 'gemini' | 'gpt' | 'deepseek' | 'maylet';

export interface InnovationScores {
  innovation_score: number;
  market_potential: number;
  technical_feasibility: number;
  funding_readiness: number;
}

export interface InnovationNode {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  current_stage: InnovationStage;
  innovation_score: number;
  market_potential: number;
  technical_feasibility: number;
  funding_readiness: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AiMemory {
  id: string;
  user_id: string;
  node_id: string | null;
  project_id: string | null;
  memory_type: MemoryType;
  title: string | null;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface MayaChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface MayaChatSession {
  id: string;
  user_id: string;
  node_id: string | null;
  project_id: string | null;
  title: string;
  agent_role: MayaAgentRole;
  model_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MayaContext {
  userId: string;
  userName?: string;
  userType?: string;
  sessionId?: string;
  projectId?: string;
  projectName?: string;
  projectStage?: string;
  projectProgress?: number;
  experimentId?: string;
  nodeId?: string;
  memories: AiMemory[];
  recentMessages: MayaChatMessage[];
  scores?: InnovationScores;
}

export interface MayaAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  project_id?: string | null;
  dismissed: boolean;
  created_at: string;
}

export interface MayaCompletionRequest {
  message: string;
  context: MayaContext;
  agentRole?: MayaAgentRole;
  modelId?: MayaModelId;
}

export interface MayaCompletionResponse {
  content: string;
  agentRole: MayaAgentRole;
  modelId: MayaModelId;
  tokensUsed?: number;
  suggestedActions?: string[];
}
