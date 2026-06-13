import { supabase } from '../../../lib/supabase/client';
import type { MayaAgentRole, MayaModelId, InnovationNode } from '../ai/types';
import { buildMayaContext, detectAgentFromMessage } from '../ai/context-builder';
import { getMayaAgent } from '../ai/agents';
import { calculateInnovationScores } from '../ai/scoring';
import { saveMemory } from '../ai/memory';

export async function createChatSession(params: {
  userId: string;
  projectId?: string;
  nodeId?: string;
  agentRole?: MayaAgentRole;
  modelId?: MayaModelId;
  title?: string;
}) {
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .insert({
      user_id: params.userId,
      project_id: params.projectId ?? null,
      node_id: params.nodeId ?? null,
      agent_role: params.agentRole ?? 'chat',
      model_id: params.modelId ?? 'groq',
      title: params.title ?? 'MAYA conversation',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function appendChatMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  tokensUsed = 0
) {
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .insert({ session_id: sessionId, role, content, tokens_used: tokensUsed })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loadSessionMessages(sessionId: string) {
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMayaMessage(params: {
  userId: string;
  message: string;
  sessionId?: string;
  projectId?: string;
  experimentId?: string;
  modelId?: MayaModelId;
  userName?: string;
  userType?: string;
}) {
  let sessionId: string = params.sessionId ?? '';
  if (!sessionId) {
    const session = await createChatSession({
      userId: params.userId,
      projectId: params.projectId,
      modelId: params.modelId,
    });
    sessionId = session.id as string;
  }

  const history = await loadSessionMessages(sessionId);
  const context = await buildMayaContext({
    userId: params.userId,
    userName: params.userName,
    userType: params.userType,
    sessionId,
    projectId: params.projectId,
    experimentId: params.experimentId,
    recentMessages: history.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      id: m.id,
    })),
  });

  await appendChatMessage(sessionId, 'user', params.message);

  const agent = getMayaAgent(detectAgentFromMessage(params.message));
  const response = await agent.run({
    message: params.message,
    context,
    modelId: params.modelId,
  });

  await appendChatMessage(sessionId, 'assistant', response.content);

  return { sessionId, response, context };
}

export async function getOrCreateInnovationNode(params: {
  userId: string;
  projectId?: string;
  title: string;
  description?: string;
}): Promise<InnovationNode | null> {
  if (params.projectId) {
    const { data: existing } = await supabase
      .from('innovation_nodes')
      .select('*')
      .eq('project_id', params.projectId)
      .maybeSingle();
    if (existing) return existing as InnovationNode;
  }

  const scores = calculateInnovationScores({
    title: params.title,
    description: params.description,
    stage: 'idea',
  });

  const { data, error } = await supabase
    .from('innovation_nodes')
    .insert({
      user_id: params.userId,
      project_id: params.projectId ?? null,
      title: params.title,
      description: params.description,
      current_stage: 'idea',
      ...scores,
    })
    .select()
    .single();

  if (error) {
    console.warn('[maya.service] innovation_nodes:', error.message);
    return null;
  }
  return data as InnovationNode;
}

export async function fetchMayaAlerts(userId: string, dismissed = false) {
  const { data, error } = await supabase
    .from('maya_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('dismissed', dismissed)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) return [];
  return data ?? [];
}

export async function persistProjectMemory(
  userId: string,
  projectId: string,
  summary: string,
  nodeId?: string
) {
  return saveMemory(userId, {
    memory_type: 'project_summary',
    title: 'Project context',
    content: summary,
    project_id: projectId,
    node_id: nodeId,
  });
}
