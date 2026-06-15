import type { AgentHandler, AgentInsight, MemoryRecord, WorkspaceContext } from '../../types/workspace.types.js';
import type { MemoryEngine } from '../../memoryEngine.js';
import { AiReasoningService } from '../../aiReasoning.service.js';

const reasoning = new AiReasoningService();

export function createMemoryAgent(memory: MemoryEngine): AgentHandler {
  return {
    id: 'memory',
    async handle(ctx: WorkspaceContext): Promise<AgentInsight[]> {
      const result = reasoning.analyze(ctx);
      const records: MemoryRecord[] = [];

      records.push({
        id: crypto.randomUUID(),
        workspaceId: ctx.workspaceId,
        agentId: 'memory',
        type: 'summary',
        content: result.summary,
        confidenceScore: result.confidence,
        importanceScore: Math.round(result.confidence * 100),
        sourceEventId: ctx.event.id,
        timestamp: new Date().toISOString(),
      });

      for (const decision of result.decisions) {
        records.push({
          id: crypto.randomUUID(),
          workspaceId: ctx.workspaceId,
          agentId: 'memory',
          type: 'decision',
          content: decision,
          confidenceScore: result.confidence,
          importanceScore: 75,
          sourceEventId: ctx.event.id,
          timestamp: new Date().toISOString(),
        });
      }

      for (const record of records) memory.store(ctx.workspaceId, record);

      return [
        {
          agentId: 'memory',
          event: 'agent:insight',
          workspaceId: ctx.workspaceId,
          conversationId: ctx.conversationId,
          content: `Memory updated: ${records.length} record(s) stored.`,
          confidence: result.confidence,
          metadata: { memoryCount: records.length },
        },
      ];
    },
  };
}
