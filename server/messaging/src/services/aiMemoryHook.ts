import { AiMemoryService } from './aiMemoryService.js';
import { logger } from '../utils/logger.js';

const memoryService = new AiMemoryService();

export interface MemoryHookInput {
  conversationId: string;
  workspaceId?: string;
  sourceEventId: string;
  messages: Array<{ id: string; content: string; sender_id: string; created_at: string }>;
}

/** Non-blocking AI memory extraction — never await in hot path. */
export function triggerMemoryHook(input: MemoryHookInput): void {
  setImmediate(() => {
    void (async () => {
      try {
        const snapshot = memoryService.extractFromMessages(input.conversationId, input.messages);
        await memoryService.persist(snapshot);
        logger.debug('ai_memory_persisted', {
          conversationId: input.conversationId,
          importance: snapshot.importanceScore,
          sourceEventId: input.sourceEventId,
        });
      } catch (err) {
        logger.error('ai_memory_hook_failed', {
          conversationId: input.conversationId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();
  });
}
