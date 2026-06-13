import { supabase } from '../../../lib/supabase/client';
import type { AiMemory, MemoryType, MayaContext } from './types';
import { MAX_CONTEXT_MEMORIES } from './constants';

export async function fetchMemoriesForContext(
  userId: string,
  options: {
    projectId?: string;
    nodeId?: string;
    types?: MemoryType[];
    limit?: number;
  } = {}
): Promise<AiMemory[]> {
  let query = supabase
    .from('ai_memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(options.limit ?? MAX_CONTEXT_MEMORIES);

  if (options.projectId) query = query.eq('project_id', options.projectId);
  if (options.nodeId) query = query.eq('node_id', options.nodeId);
  if (options.types?.length) query = query.in('memory_type', options.types);

  const { data, error } = await query;
  if (error) {
    console.warn('[MAYA] fetchMemoriesForContext:', error.message);
    return [];
  }
  return (data ?? []) as AiMemory[];
}

export async function saveMemory(
  userId: string,
  payload: {
    memory_type: MemoryType;
    content: string;
    title?: string;
    project_id?: string;
    node_id?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<AiMemory | null> {
  const { data, error } = await supabase
    .from('ai_memories')
    .insert({
      user_id: userId,
      memory_type: payload.memory_type,
      content: payload.content,
      title: payload.title ?? null,
      project_id: payload.project_id ?? null,
      node_id: payload.node_id ?? null,
      metadata: payload.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    console.warn('[MAYA] saveMemory:', error.message);
    return null;
  }
  return data as AiMemory;
}

export async function summarizeSessionToMemory(
  userId: string,
  sessionId: string,
  summary: string,
  projectId?: string
): Promise<void> {
  await saveMemory(userId, {
    memory_type: 'session_summary',
    title: `Session ${sessionId.slice(0, 8)}`,
    content: summary,
    project_id: projectId,
    metadata: { session_id: sessionId },
  });
}

export function mergeMemoriesIntoContext(
  context: MayaContext,
  memories: AiMemory[]
): MayaContext {
  return { ...context, memories };
}
