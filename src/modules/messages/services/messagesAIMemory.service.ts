import type { ConversationMemory, ExtractedMemoryItem, MemoryKind } from '../types/aiMemory.types';
import type { Message } from '../types/messages.types';

const ACTION_RE = /\b(todo|task|follow up|deadline|review|ship|launch|fix|assign)\b/i;
const DECISION_RE = /\b(decided|agreed|approved|confirmed|will go with|let's proceed)\b/i;
const RISK_RE = /\b(blocker|risk|concern|delay|issue|problem|stuck|urgent)\b/i;
const TOPIC_STOP = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'your']);

function tokenizeTopics(messages: Message[]): string[] {
  const freq = new Map<string, number>();
  for (const msg of messages) {
    for (const raw of msg.content.toLowerCase().split(/\W+/)) {
      const word = raw.trim();
      if (word.length < 4 || TOPIC_STOP.has(word)) continue;
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);
}

function pushItem(
  items: ExtractedMemoryItem[],
  kind: MemoryKind,
  content: string,
  messageId: string,
  importance: number
): void {
  const existing = items.find((i) => i.kind === kind && i.content === content);
  if (existing) {
    if (!existing.sourceMessageIds.includes(messageId)) {
      existing.sourceMessageIds.push(messageId);
    }
    existing.importance = Math.max(existing.importance, importance);
    return;
  }
  items.push({ kind, content, importance, sourceMessageIds: [messageId] });
}

function buildSummary(messages: Message[]): string {
  if (!messages.length) return 'No messages yet.';
  const recent = messages.slice(-10);
  const participants = new Set(recent.map((m) => m.senderId)).size;
  const last = recent[recent.length - 1]?.content ?? '';
  return `${recent.length} recent messages · ${participants} participant(s). Latest: "${last.slice(0, 96)}${last.length > 96 ? '…' : ''}"`;
}

function scoreImportance(messages: Message[], items: ExtractedMemoryItem[]): number {
  const base = Math.min(100, messages.length * 4);
  const boost = items.reduce((sum, i) => sum + i.importance, 0);
  return Math.min(100, Math.round(base * 0.4 + boost * 0.6));
}

export const messagesAIMemoryService = {
  extractMemory(conversationId: string, messages: Message[]): ConversationMemory {
    const items: ExtractedMemoryItem[] = [];
    const decisions: string[] = [];
    const actionItems: string[] = [];
    const risks: string[] = [];

    for (const msg of messages) {
      const text = msg.content.trim();
      if (!text) continue;
      if (DECISION_RE.test(text)) {
        const snippet = text.slice(0, 140);
        decisions.push(snippet);
        pushItem(items, 'decision', snippet, msg.id, 75);
      }
      if (ACTION_RE.test(text)) {
        const snippet = text.slice(0, 140);
        actionItems.push(snippet);
        pushItem(items, 'action_item', snippet, msg.id, 70);
      }
      if (RISK_RE.test(text)) {
        const snippet = text.slice(0, 140);
        risks.push(snippet);
        pushItem(items, 'risk', snippet, msg.id, 85);
      }
    }

    const topics = tokenizeTopics(messages);
    for (const topic of topics) {
      pushItem(items, 'topic', topic, messages[messages.length - 1]?.id ?? 'n/a', 40);
    }

    const summary = buildSummary(messages);
    pushItem(items, 'summary', summary, messages[messages.length - 1]?.id ?? 'n/a', 50);

    const unique = <T,>(arr: T[]): T[] => [...new Set(arr)];

    return {
      conversationId,
      summary,
      topics,
      decisions: unique(decisions).slice(0, 5),
      actionItems: unique(actionItems).slice(0, 6),
      risks: unique(risks).slice(0, 5),
      importanceScore: scoreImportance(messages, items),
      items,
      updatedAt: new Date().toISOString(),
    };
  },

  buildContext(memory: ConversationMemory, messages: Message[]): { systemPrompt: string; recentTranscript: string; structuredMemory: ConversationMemory } {
    const recent = messages
      .slice(-12)
      .map((m) => `[${m.createdAt}] ${m.senderId}: ${m.content}`)
      .join('\n');

    const systemPrompt = [
      'You are MAYA, the Maylet X Lab collaboration assistant.',
      `Conversation summary: ${memory.summary}`,
      memory.topics.length ? `Topics: ${memory.topics.join(', ')}` : '',
      memory.decisions.length ? `Decisions: ${memory.decisions.join(' | ')}` : '',
      memory.actionItems.length ? `Action items: ${memory.actionItems.join(' | ')}` : '',
      memory.risks.length ? `Risks: ${memory.risks.join(' | ')}` : '',
      `Importance score: ${memory.importanceScore}/100`,
    ]
      .filter(Boolean)
      .join('\n');

    return { systemPrompt, recentTranscript: recent, structuredMemory: memory };
  },
};
