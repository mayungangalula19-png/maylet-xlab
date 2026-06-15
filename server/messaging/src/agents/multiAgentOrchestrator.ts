import type { AgentHandler, AgentInsight, WorkspaceEvent } from './types/workspace.types.js';
import type { EventBus } from './eventBus.js';
import type { ServerEvent } from '../types/events.js';
import { envelope } from '../types/events.js';
import { ContextBuilder } from './contextBuilder.js';
import { MemoryEngine } from './memoryEngine.js';
import { DecisionEngine } from './decisionEngine.js';
import { ActionExecutor } from './actionExecutor.js';
import { communicationAgent } from './agents/communicationAgent.js';
import { taskAgent } from './agents/taskAgent.js';
import { projectAgent } from './agents/projectAgent.js';
import { riskAgent } from './agents/riskAgent.js';
import { productivityAgent } from './agents/productivityAgent.js';
import { createMemoryAgent } from './agents/memoryAgent.js';
import { logger } from '../utils/logger.js';

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

export class MultiAgentOrchestrator {
  private readonly memory = new MemoryEngine();
  private readonly contextBuilder: ContextBuilder;
  private readonly decisionEngine = new DecisionEngine();
  private readonly actionExecutor = new ActionExecutor();
  private readonly agents: AgentHandler[];

  constructor(private readonly bus: EventBus) {
    this.contextBuilder = new ContextBuilder(this.memory);
    this.agents = [
      communicationAgent,
      taskAgent,
      projectAgent,
      riskAgent,
      productivityAgent,
      createMemoryAgent(this.memory),
    ];
  }

  start(): void {
    this.bus.onWorkspace((event) => {
      this.scheduleProcess(event);
    });
  }

  scheduleProcess(
    event: WorkspaceEvent,
    recentMessages: Array<{ id: string; content: string; senderId: string; createdAt: string }> = []
  ): void {
    const key = `${event.workspaceId}:${event.conversationId ?? 'global'}`;
    if (debounceTimers.has(key)) clearTimeout(debounceTimers.get(key)!);
    debounceTimers.set(
      key,
      setTimeout(() => {
        debounceTimers.delete(key);
        void this.process(event, recentMessages);
      }, 350)
    );
  }

  private async process(
    event: WorkspaceEvent,
    recentMessages: Array<{ id: string; content: string; senderId: string; createdAt: string }>
  ): Promise<void> {
    const ctx = this.contextBuilder.build(event, recentMessages);
    const allInsights: AgentInsight[] = [];

    for (const agent of this.agents) {
      try {
        const insights = await agent.handle(ctx);
        allInsights.push(...insights);
      } catch (err) {
        logger.error('agent_failed', {
          agentId: agent.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    for (const insight of allInsights) {
      this.emitAgentOutput(insight);
      const decision = this.decisionEngine.evaluate(insight);
      if (decision.mode === 'auto_execute' && decision.action) {
        void this.actionExecutor.execute(decision.action);
      } else if (decision.mode === 'escalate' && decision.action) {
        void this.actionExecutor.execute(decision.action);
      }
    }
  }

  private emitAgentOutput(insight: AgentInsight): void {
    const eventName = insight.event as ServerEvent['event'];
    const serverEvent = envelope(eventName, {
      agentId: insight.agentId,
      workspaceId: insight.workspaceId,
      conversationId: insight.conversationId,
      event: insight.event,
      content: insight.content,
      confidence: insight.confidence,
      metadata: insight.metadata,
    });
    this.bus.publishServer(serverEvent);
  }
}
