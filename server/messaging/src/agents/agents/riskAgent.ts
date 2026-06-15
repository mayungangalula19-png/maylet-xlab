import type { AgentHandler, AgentInsight, WorkspaceContext } from '../../types/workspace.types.js';
import { AiReasoningService } from '../../aiReasoning.service.js';

const reasoning = new AiReasoningService();

export const riskAgent: AgentHandler = {
  id: 'risk',
  async handle(ctx: WorkspaceContext): Promise<AgentInsight[]> {
    const result = reasoning.analyze(ctx);
    const insights: AgentInsight[] = [];
    for (const risk of result.risks) {
      insights.push({
        agentId: 'risk',
        event: 'agent:risk_detected',
        workspaceId: ctx.workspaceId,
        conversationId: ctx.conversationId,
        content: risk,
        confidence: Math.min(0.9, result.confidence + 0.15),
      });
    }
    if (result.risks.length >= 2) {
      insights.push({
        agentId: 'risk',
        event: 'agent:warning',
        workspaceId: ctx.workspaceId,
        conversationId: ctx.conversationId,
        content: `Multiple risks detected (${result.risks.length}). Escalation recommended.`,
        confidence: 0.8,
      });
    }
    return insights;
  },
};
