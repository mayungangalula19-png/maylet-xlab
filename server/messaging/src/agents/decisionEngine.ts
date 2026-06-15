import type { AgentAction, AgentDecision, AgentInsight } from './types/workspace.types.js';

export class DecisionEngine {
  evaluate(insight: AgentInsight): AgentDecision {
    const confidence = insight.confidence;
    const impact = insight.event === 'agent:risk_detected' ? 0.9 : 0.6;
    const urgency = insight.event === 'agent:warning' ? 0.85 : 0.5;

    if (confidence >= 0.85 && insight.event === 'agent:task_created') {
      return {
        mode: 'auto_execute',
        confidence,
        reason: 'High-confidence task detection',
        action: {
          id: crypto.randomUUID(),
          type: 'create_task',
          workspaceId: insight.workspaceId,
          payload: { content: insight.content, conversationId: insight.conversationId },
          confidence,
          impact,
          urgency,
          idempotencyKey: `${insight.event}:${insight.content.slice(0, 40)}`,
        },
      };
    }

    if (confidence >= 0.75 && insight.event === 'agent:risk_detected') {
      return {
        mode: 'escalate',
        confidence,
        reason: 'Risk threshold exceeded',
        action: {
          id: crypto.randomUUID(),
          type: 'escalate_issue',
          workspaceId: insight.workspaceId,
          payload: { content: insight.content },
          confidence,
          impact,
          urgency,
          idempotencyKey: `risk:${insight.content.slice(0, 40)}`,
        },
      };
    }

    if (confidence >= 0.55) {
      return {
        mode: 'suggest',
        confidence,
        reason: 'Moderate confidence — recommend to user',
        action: {
          id: crypto.randomUUID(),
          type: 'send_notification',
          workspaceId: insight.workspaceId,
          payload: { content: insight.content },
          confidence,
          impact,
          urgency,
          idempotencyKey: `suggest:${insight.event}:${insight.content.slice(0, 30)}`,
        },
      };
    }

    return { mode: 'ignore', confidence, reason: 'Low confidence', action: null };
  }
}
