import type { AgentHandler, AgentInsight, WorkspaceContext } from '../types/workspace.types.js';
import { AiReasoningService } from '../aiReasoning.service.js';

const reasoning = new AiReasoningService();

export const productivityAgent: AgentHandler = {
  id: 'productivity',
  async handle(ctx: WorkspaceContext): Promise<AgentInsight[]> {
    const result = reasoning.analyze(ctx);
    if (result.tasks.length < 3) return [];
    const senders = new Set(ctx.recentMessages.map((m) => m.senderId));
    if (senders.size <= 1) {
      return [
        {
          agentId: 'productivity',
          event: 'agent:recommendation',
          workspaceId: ctx.workspaceId,
          conversationId: ctx.conversationId,
          content: 'Workload imbalance: most tasks originate from one participant. Consider redistribution.',
          confidence: 0.7,
        },
      ];
    }
    return [
      {
        agentId: 'productivity',
        event: 'agent:insight',
        workspaceId: ctx.workspaceId,
        content: `Team workload appears balanced across ${senders.size} participants.`,
        confidence: 0.6,
      },
    ];
  },
};
