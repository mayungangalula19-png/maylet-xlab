import type { MemoryRecord } from './types/workspace.types.js';

export class MemoryEngine {
  private readonly shortTerm = new Map<string, MemoryRecord[]>();
  private readonly longTerm = new Map<string, MemoryRecord[]>();
  private readonly maxShort = 40;
  private readonly maxLong = 500;

  store(workspaceId: string, record: MemoryRecord): void {
    const short = this.shortTerm.get(workspaceId) ?? [];
    short.unshift(record);
    this.shortTerm.set(workspaceId, short.slice(0, this.maxShort));

    const long = this.longTerm.get(workspaceId) ?? [];
    long.unshift(record);
    this.longTerm.set(workspaceId, long.slice(0, this.maxLong));
  }

  getShortTerm(workspaceId: string): MemoryRecord[] {
    return [...(this.shortTerm.get(workspaceId) ?? [])];
  }

  getLongTerm(workspaceId: string, limit = 50): MemoryRecord[] {
    return (this.longTerm.get(workspaceId) ?? []).slice(0, limit);
  }

  getRelevant(workspaceId: string, conversationId?: string): MemoryRecord[] {
    const pool = this.getLongTerm(workspaceId, 100);
    if (!conversationId) return pool.slice(0, 20);
    return pool
      .filter((m) => String(m.sourceEventId).includes(conversationId) || m.content.includes(conversationId))
      .slice(0, 20);
  }

  toSemanticPayload(record: MemoryRecord): Record<string, unknown> {
    return {
      id: record.id,
      workspaceId: record.workspaceId,
      agentId: record.agentId,
      type: record.type,
      content: record.content,
      importanceScore: record.importanceScore,
      embeddingReady: true,
    };
  }
}
