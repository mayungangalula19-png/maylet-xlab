import { supabase } from '../../../lib/supabase/client';
import type { Workspace, WorkspaceChannel } from '../types/workspace.types';

const SEED_WORKSPACE: Workspace = {
  id: 'seed-workspace-1',
  name: 'Maylet X Lab',
  slug: 'maylet-xlab',
  description: 'Default innovation workspace',
  memberCount: 1,
};

const SEED_CHANNELS: WorkspaceChannel[] = [
  {
    id: 'seed-ch-general',
    workspaceId: SEED_WORKSPACE.id,
    name: 'general',
    type: 'public',
    visibility: 'public',
    conversationId: 'seed-conv-2',
    unreadCount: 0,
  },
  {
    id: 'seed-ch-innovation',
    workspaceId: SEED_WORKSPACE.id,
    name: 'innovation-squad',
    type: 'team',
    visibility: 'private',
    conversationId: 'seed-conv-3',
    unreadCount: 0,
  },
];

function isSchemaError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  return error.code === '42P01' || msg.includes('does not exist') || msg.includes('could not find');
}

export const workspaceService = {
  async listWorkspaces(userId: string): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspace_id, messaging_workspaces(id, name, slug, description)')
      .eq('user_id', userId);

    if (error && isSchemaError(error)) return [SEED_WORKSPACE];
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as unknown as Array<{
      workspace_id: string;
      messaging_workspaces:
        | { id: string; name: string; slug: string; description: string | null }
        | { id: string; name: string; slug: string; description: string | null }[]
        | null;
    }>;

    if (!rows.length) return [SEED_WORKSPACE];

    return rows.map((r) => {
      const ws = Array.isArray(r.messaging_workspaces)
        ? r.messaging_workspaces[0]
        : r.messaging_workspaces;
      return {
        id: ws?.id ?? r.workspace_id,
        name: ws?.name ?? 'Workspace',
        slug: ws?.slug ?? 'workspace',
        description: ws?.description ?? null,
        memberCount: 1,
      };
    });
  },

  async listChannels(workspaceId: string, userId: string): Promise<WorkspaceChannel[]> {
    if (workspaceId.startsWith('seed-')) return SEED_CHANNELS;

    const { data, error } = await supabase
      .from('workspace_channels')
      .select('id, workspace_id, name, channel_type, visibility, conversation_id')
      .eq('workspace_id', workspaceId);

    if (error && isSchemaError(error)) return SEED_CHANNELS;
    if (error) throw new Error(error.message);

    const channels = (data ?? []) as Array<{
      id: string;
      workspace_id: string;
      name: string;
      channel_type: string;
      visibility: string;
      conversation_id: string;
    }>;

    const convIds = channels.map((c) => c.conversation_id);
    const unreadByConv = new Map<string, number>();

    if (convIds.length) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('conversation_id, read, sender_id')
        .in('conversation_id', convIds);
      for (const m of msgs ?? []) {
        if (!m.read && m.sender_id !== userId) {
          const id = String(m.conversation_id);
          unreadByConv.set(id, (unreadByConv.get(id) ?? 0) + 1);
        }
      }
    }

    return channels.map((c) => ({
      id: c.id,
      workspaceId: c.workspace_id,
      name: c.name,
      type: (c.channel_type as WorkspaceChannel['type']) ?? 'public',
      visibility: (c.visibility as WorkspaceChannel['visibility']) ?? 'public',
      conversationId: c.conversation_id,
      unreadCount: unreadByConv.get(c.conversation_id) ?? 0,
    }));
  },
};
