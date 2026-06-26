import type { AgentHandler, AgentInsight, WorkspaceContext } from '../types/workspace.types.js';
import { AiReasoningService } from '../aiReasoning.service.js';

const reasoning = new AiReasoningService();

export const communicationAgent: AgentHandler = {
  id: 'communication',
  async handle(ctx: WorkspaceContext): Promise<AgentInsight[]> {
    const result = reasoning.analyze(ctx);
    const insights: AgentInsight[] = [
      {
        agentId: 'communication',
        event: 'agent:summary',
        workspaceId: ctx.workspaceId,
        conversationId: ctx.conversationId,
        content: result.summary,
        confidence: result.confidence,
      },
    ];
    if (result.insights.length) {
      insights.push({
        agentId: 'communication',
        event: 'agent:insight',
        workspaceId: ctx.workspaceId,
        conversationId: ctx.conversationId,
        content: result.insights.join(' '),
        confidence: result.confidence * 0.9,
      });
    }
    return insights;
  },
};
