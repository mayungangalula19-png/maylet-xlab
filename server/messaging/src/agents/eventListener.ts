import type { EventBus } from './eventBus.js';
import type { WorkspaceEvent } from './types/workspace.types.js';
import { WorkspaceAgent } from './workspaceAgent.js';

export class EventListener {
  constructor(
    private readonly bus: EventBus,
    private readonly agent: WorkspaceAgent
  ) {}

  start(): void {
    this.bus.onWorkspace((event) => {
      this.agent.ingest(event);
    });
  }

  emit(event: WorkspaceEvent): void {
    this.bus.publishWorkspace(event);
  }

  ingestWithMessages(
    event: WorkspaceEvent,
    recentMessages: Array<{ id: string; content: string; senderId: string; createdAt: string }>
  ): void {
    this.agent.ingest(event, recentMessages);
  }
}
