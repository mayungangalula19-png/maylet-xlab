export type MemoryKind = 'summary' | 'decision' | 'action_item' | 'topic' | 'risk';

export interface ExtractedMemoryItem {
  kind: MemoryKind;
  content: string;
  importance: number;
  sourceMessageIds: string[];
}

export interface ConversationMemory {
  conversationId: string;
  summary: string;
  topics: string[];
  decisions: string[];
  actionItems: string[];
  risks: string[];
  importanceScore: number;
  items: ExtractedMemoryItem[];
  updatedAt: string;
}

export interface AiMemoryContext {
  systemPrompt: string;
  recentTranscript: string;
  structuredMemory: ConversationMemory;
}
