import type { WorkspaceContext, WorkspaceEvent } from './types/workspace.types.js';
import { MemoryEngine } from './memoryEngine.js';

export class ContextBuilder {
  constructor(private readonly memory: MemoryEngine) {}

  build(event: WorkspaceEvent, recentMessages: WorkspaceContext['recentMessages']): WorkspaceContext {
    const memories = this.memory.getRelevant(event.workspaceId, event.conversationId);
    return {
      workspaceId: event.workspaceId,
      conversationId: event.conversationId,
      recentMessages,
      memories,
      event,
    };
  }
}
