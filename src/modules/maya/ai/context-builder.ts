import { supabase } from '../../../lib/supabase/client';
import type { MayaAgentRole, MayaContext, MayaChatMessage } from './types';
import { fetchMemoriesForContext } from './memory';
import { AGENT_ROUTE_KEYWORDS, DEFAULT_AGENT } from './constants';

export function detectAgentFromMessage(message: string): MayaAgentRole {
  const lower = message.toLowerCase();
  for (const [agent, keywords] of Object.entries(AGENT_ROUTE_KEYWORDS) as [MayaAgentRole, string[]][]) {
    if (agent === 'chat') continue;
    if (keywords.some((k) => lower.includes(k))) return agent;
  }
  return DEFAULT_AGENT;
}

export async function buildMayaContext(params: {
  userId: string;
  userName?: string;
  userType?: string;
  sessionId?: string;
  projectId?: string;
  experimentId?: string;
  nodeId?: string;
  recentMessages?: MayaChatMessage[];
  forceAgent?: MayaAgentRole;
}): Promise<MayaContext> {
  const {
    userId,
    userName,
    userType,
    sessionId,
    projectId,
    experimentId,
    nodeId,
    recentMessages = [],
  } = params;

  let projectName: string | undefined;
  let projectStage: string | undefined;
  let projectProgress: number | undefined;
  let scores: MayaContext['scores'];

  if (projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('name, status, progress, progress_score')
      .eq('id', projectId)
      .single();

    if (project) {
      projectName = project.name;
      projectStage = project.status;
      projectProgress = Number(project.progress ?? project.progress_score ?? 0);
    }

    const { data: node } = await supabase
      .from('innovation_nodes')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (node) {
      scores = {
        innovation_score: node.innovation_score ?? 0,
        market_potential: node.market_potential ?? 0,
        technical_feasibility: node.technical_feasibility ?? 0,
        funding_readiness: node.funding_readiness ?? 0,
      };
    }
  }

  const memories = await fetchMemoriesForContext(userId, {
    projectId,
    nodeId,
    types: ['project_summary', 'user_dna', 'session_summary', 'experiment_result'],
  });

  return {
    userId,
    userName,
    userType,
    sessionId,
    projectId,
    projectName,
    projectStage,
    projectProgress,
    experimentId,
    nodeId,
    memories,
    recentMessages,
    scores,
  };
}
