import { invokeMayaChat } from '../../../lib/maya/mayaChat.service';
import { supabase } from '../../../lib/supabase/client';
import type { ConversationMemory } from '../types/aiMemory.types';
import type { AiAssistantPayload, Message } from '../types/messages.types';
import { messagesAIMemoryService } from './messagesAIMemory.service';

function buildSuggestions(messages: Message[]): string[] {
  const last = messages[messages.length - 1];
  if (!last) {
    return ['Hello! How can I help with your project today?', 'Sharing an update from my side.'];
  }
  const lower = last.content.toLowerCase();
  if (lower.includes('?')) {
    return [
      'Yes — I can take that on today.',
      'Let me check and get back to you shortly.',
      'Good question. Here is what I know so far…',
    ];
  }
  if (lower.includes('review') || lower.includes('prototype')) {
    return [
      'I will review and leave comments in the workspace.',
      'Looks good — a few small tweaks and we can ship.',
      'Can we sync on this in a quick call?',
    ];
  }
  if (/\b(blocker|risk|delay)\b/i.test(lower)) {
    return [
      'Thanks for flagging this — let us unblock it today.',
      'I can own the follow-up on this risk.',
      'Should we escalate to the project channel?',
    ];
  }
  return [
    'Thanks — noted.',
    'Sounds good. I will update the team channel.',
    'Let us prioritize this for the next sprint.',
  ];
}

function buildInsights(memory: ConversationMemory, messages: Message[]): string[] {
  const insights: string[] = [];
  const questionCount = messages.filter((m) => m.content.includes('?')).length;
  if (questionCount >= 2) insights.push(`${questionCount} open questions — consider a quick sync.`);
  if (memory.risks.length) insights.push(`${memory.risks.length} risk signal(s) detected in this thread.`);
  if (memory.decisions.length) insights.push(`${memory.decisions.length} decision(s) captured for workspace memory.`);
  if (memory.importanceScore >= 70) insights.push('High-importance conversation — summary stored for AI context.');
  if (!insights.length) insights.push('Conversation is on track. No blockers detected.');
  return insights;
}

async function summarizeWithBackend(messages: Message[], fallback: string): Promise<string> {
  if (!messages.length) return fallback;

  const transcript = messages
    .slice(-14)
    .map((m) => `${m.senderId}: ${m.content}`)
    .join('\n');

  try {
    const summary = await invokeMayaChat([
      {
        role: 'system',
        content:
          'You are MAYA. Summarize this team message thread in 2-3 concise sentences. Focus on decisions, blockers, and next steps. Do not invent facts.',
      },
      { role: 'user', content: transcript },
    ]);
    return summary.trim() || fallback;
  } catch {
    return fallback;
  }
}

type MemoryRow = {
  conversation_id: string;
  summary: string;
  topics: string[];
  decisions: string[];
  action_items: string[];
  risks: string[];
  importance_score: number;
  payload: ConversationMemory;
  updated_at: string;
};

export const messagesAIService = {
  async analyze(conversationId: string, messages: Message[]): Promise<AiAssistantPayload> {
    const memory = messagesAIMemoryService.extractMemory(conversationId, messages);
    const summary = await summarizeWithBackend(messages, memory.summary);

    return {
      summary,
      suggestedReplies: buildSuggestions(messages),
      actionItems: memory.actionItems.length
        ? memory.actionItems
        : ['Review the latest messages and confirm next steps.'],
      insights: buildInsights(memory, messages),
      topics: memory.topics,
      decisions: memory.decisions,
      risks: memory.risks,
      importanceScore: memory.importanceScore,
    };
  },

  async loadPersistedMemory(conversationId: string): Promise<ConversationMemory | null> {
    const { data, error } = await supabase
      .from('conversation_memory')
      .select(
        'conversation_id, summary, topics, decisions, action_items, risks, importance_score, payload, updated_at'
      )
      .eq('conversation_id', conversationId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as MemoryRow;
    return (
      row.payload ?? {
        conversationId: row.conversation_id,
        summary: row.summary,
        topics: row.topics ?? [],
        decisions: row.decisions ?? [],
        actionItems: row.action_items ?? [],
        risks: row.risks ?? [],
        importanceScore: row.importance_score ?? 0,
        items: [],
        updatedAt: row.updated_at,
      }
    );
  },

  async persistMemory(memory: ConversationMemory): Promise<void> {
    await supabase.from('conversation_memory').upsert({
      conversation_id: memory.conversationId,
      summary: memory.summary,
      topics: memory.topics,
      decisions: memory.decisions,
      action_items: memory.actionItems,
      risks: memory.risks,
      importance_score: memory.importanceScore,
      payload: memory,
      updated_at: memory.updatedAt,
    });
  },
};
