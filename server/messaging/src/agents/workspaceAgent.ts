import type { EventBus } from './eventBus.js';
import { MultiAgentOrchestrator } from './multiAgentOrchestrator.js';
import type { WorkspaceEvent } from './types/workspace.types.js';

export class WorkspaceAgent {
  private readonly orchestrator: MultiAgentOrchestrator;

  constructor(bus: EventBus) {
    this.orchestrator = new MultiAgentOrchestrator(bus);
  }

  start(): void {
    this.orchestrator.start();
  }

  ingest(
    event: WorkspaceEvent,
    recentMessages: Array<{ id: string; content: string; senderId: string; createdAt: string }> = []
  ): void {
    this.orchestrator.scheduleProcess(event, recentMessages);
  }
}
