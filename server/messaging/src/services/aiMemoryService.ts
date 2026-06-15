import type { StoredMessage } from '../services/messageService.js';
import { adminSupabase } from '../auth/verifyToken.js';

export type MemoryType = 'summary' | 'task' | 'decision' | 'risk' | 'insight';

export interface MemoryRecord {
  id: string;
  workspaceId: string;
  conversationId: string;
  agentId: string;
  type: MemoryType;
  content: string;
  confidenceScore: number;
  importanceScore: number;
  sourceEventId: string;
  timestamp: string;
}

export interface MemorySnapshot {
  conversationId: string;
  summary: string;
  topics: string[];
  decisions: string[];
  actionItems: string[];
  risks: string[];
  importanceScore: number;
}

const ACTION_RE = /\b(todo|task|follow up|deadline|review|ship|launch|fix)\b/i;
const DECISION_RE = /\b(decided|agreed|approved|confirmed)\b/i;
const RISK_RE = /\b(blocker|risk|concern|delay|issue|urgent)\b/i;

export class AiMemoryService {
  extractFromMessages(
    conversationId: string,
    rows: Array<{ id: string; content: string; sender_id: string; created_at: string }>
  ): MemorySnapshot {
    const decisions: string[] = [];
    const actionItems: string[] = [];
    const risks: string[] = [];
    const topics = new Map<string, number>();

    for (const row of rows) {
      const text = row.content.trim();
      if (DECISION_RE.test(text)) decisions.push(text.slice(0, 140));
      if (ACTION_RE.test(text)) actionItems.push(text.slice(0, 140));
      if (RISK_RE.test(text)) risks.push(text.slice(0, 140));
      for (const word of text.toLowerCase().split(/\W+/)) {
        if (word.length >= 4) topics.set(word, (topics.get(word) ?? 0) + 1);
      }
    }

    const topTopics = [...topics.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([w]) => w);

    const summary =
      rows.length > 0
        ? `${rows.length} messages analyzed. Latest: "${rows[rows.length - 1].content.slice(0, 80)}"`
        : 'No messages yet.';

    return {
      conversationId,
      summary,
      topics: topTopics,
      decisions: [...new Set(decisions)].slice(0, 5),
      actionItems: [...new Set(actionItems)].slice(0, 6),
      risks: [...new Set(risks)].slice(0, 5),
      importanceScore: Math.min(100, rows.length * 5 + risks.length * 15),
    };
  }

  async persist(snapshot: MemorySnapshot, workspaceId = 'default'): Promise<void> {
    if (!adminSupabase) return;
    await adminSupabase.from('conversation_memory').upsert({
      conversation_id: snapshot.conversationId,
      summary: snapshot.summary,
      topics: snapshot.topics,
      decisions: snapshot.decisions,
      action_items: snapshot.actionItems,
      risks: snapshot.risks,
      importance_score: snapshot.importanceScore,
      payload: { ...snapshot, workspaceId },
      embedding_ready: false,
      updated_at: new Date().toISOString(),
    });
  }

  toWireMessage(row: StoredMessage): Record<string, unknown> {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      content: row.content,
      status: row.read ? 'read' : row.status,
      type: row.message_type,
      createdAt: row.created_at,
    };
  }
}
