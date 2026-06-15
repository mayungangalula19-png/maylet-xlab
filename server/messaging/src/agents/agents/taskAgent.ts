import type { AgentHandler, AgentInsight, WorkspaceContext } from '../../types/workspace.types.js';
import { AiReasoningService } from '../../aiReasoning.service.js';

const reasoning = new AiReasoningService();

export const taskAgent: AgentHandler = {
  id: 'task',
  async handle(ctx: WorkspaceContext): Promise<AgentInsight[]> {
    const result = reasoning.analyze(ctx);
    return result.tasks.map((task) => ({
      agentId: 'task',
      event: 'agent:task_created' as const,
      workspaceId: ctx.workspaceId,
      conversationId: ctx.conversationId,
      content: task,
      confidence: Math.min(0.92, result.confidence + 0.1),
      metadata: { sourceEventId: ctx.event.id },
    }));
  },
};
