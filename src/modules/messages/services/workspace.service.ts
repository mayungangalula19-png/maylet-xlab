import { supabase } from '../../../lib/supabase/client';
import type { ConversationType } from '../types/messages.types';
import { MessagingSchemaError } from '../types/messages.types';
import type {
  CreateWorkspaceResult,
  WorkspaceCreationPayload,
  WorkspaceParticipant,
  WorkspaceType,
  WorkspaceVisibility,
} from '../types/workspaceCreation.types';
import type { Workspace, WorkspaceChannel } from '../types/workspace.types';

const MIGRATION_HINT =
  'Apply messaging migrations including 20250617000004_notifications_schema_align.sql';

function isSchemaError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  return error.code === '42P01' || msg.includes('does not exist') || msg.includes('could not find');
}

function schemaError(message?: string): MessagingSchemaError {
  return new MessagingSchemaError(message ? `${message}. ${MIGRATION_HINT}` : MIGRATION_HINT);
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return base || 'workspace';
}

async function uniqueSlug(base: string): Promise<string> {
  const slug = slugify(base);
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  return `${slug}-${suffix}`;
}

function mapConversationType(workspaceType: WorkspaceType): ConversationType {
  if (workspaceType === 'direct') return 'dm';
  if (['research', 'prototype', 'experiment', 'validation'].includes(workspaceType)) {
    return 'channel';
  }
  return 'group';
}

function mapChannelVisibility(visibility: WorkspaceVisibility): 'public' | 'private' {
  return visibility === 'public' ? 'public' : 'private';
}

function mapMemberRole(participant: WorkspaceParticipant): string {
  if (participant.role === 'owner' || participant.role === 'admin') return participant.role;
  return 'member';
}

function linkedProjectId(payload: WorkspaceCreationPayload): string | null {
  const projectAsset = payload.attachedAssets.find((a) => a.type === 'project');
  return projectAsset?.id ?? null;
}

function buildMemoryPayload(payload: WorkspaceCreationPayload) {
  return {
    workspaceType: payload.workspaceType,
    purpose: payload.purpose,
    objectives: payload.objectives,
    expectedOutcomes: payload.expectedOutcomes,
    successMetrics: payload.successMetrics,
    priority: payload.priority,
    timeline: payload.timeline,
    attachedAssets: payload.attachedAssets,
    visibility: payload.visibility,
    moderationEnabled: payload.moderationEnabled,
    approvalRequired: payload.approvalRequired,
    knowledgeSettings: payload.knowledgeSettings,
    participants: payload.participants.map((p) => ({
      id: p.id,
      role: p.role,
      name: p.name,
    })),
  };
}

function defaultChannelName(workspaceType: WorkspaceType): string {
  if (workspaceType === 'enterprise') return 'executive';
  if (workspaceType === 'funding') return 'investor-updates';
  if (workspaceType === 'research') return 'research-lab';
  return 'general';
}

export const workspaceService = {
  async listWorkspaces(userId: string): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspace_id, messaging_workspaces(id, name, slug, description)')
      .eq('user_id', userId);

    if (error && isSchemaError(error)) return [];
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as unknown as Array<{
      workspace_id: string;
      messaging_workspaces:
        | { id: string; name: string; slug: string; description: string | null }
        | { id: string; name: string; slug: string; description: string | null }[]
        | null;
    }>;

    if (!rows.length) return [];

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
    const { data, error } = await supabase
      .from('workspace_channels')
      .select('id, workspace_id, name, channel_type, visibility, conversation_id')
      .eq('workspace_id', workspaceId);

    if (error && isSchemaError(error)) return [];
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

  async createWorkspace(
    userId: string,
    payload: WorkspaceCreationPayload
  ): Promise<CreateWorkspaceResult> {
    if (payload.workspaceType === 'direct') {
      throw new Error('Direct conversations use createDm, not createWorkspace');
    }

    const title = payload.title.trim();
    const purpose = payload.purpose.trim();
    if (!title || !purpose) {
      throw new Error('Workspace title and purpose are required');
    }

    const slug = await uniqueSlug(title);
    const conversationType = mapConversationType(payload.workspaceType);
    const channelName = defaultChannelName(payload.workspaceType);
    const projectId = linkedProjectId(payload);

    const { data: workspace, error: workspaceError } = await supabase
      .from('messaging_workspaces')
      .insert({
        name: title,
        slug,
        description: purpose,
        owner_id: userId,
      })
      .select('id')
      .single();

    if (workspaceError && isSchemaError(workspaceError)) {
      throw schemaError(workspaceError.message);
    }
    if (workspaceError) throw new Error(workspaceError.message);

    const workspaceId = String(workspace.id);

    const memberRows = new Map<string, { workspace_id: string; user_id: string; role: string }>();
    memberRows.set(userId, { workspace_id: workspaceId, user_id: userId, role: 'owner' });

    for (const participant of payload.participants) {
      if (!participant.id || participant.id === userId) continue;
      memberRows.set(participant.id, {
        workspace_id: workspaceId,
        user_id: participant.id,
        role: mapMemberRole(participant),
      });
    }

    const { error: membersError } = await supabase
      .from('workspace_members')
      .insert([...memberRows.values()]);

    if (membersError && isSchemaError(membersError)) throw schemaError(membersError.message);
    if (membersError) throw new Error(membersError.message);

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        type: conversationType,
        title,
        project_id: projectId,
        workspace_id: workspaceId,
        created_by: userId,
      })
      .select('id')
      .single();

    if (conversationError && isSchemaError(conversationError)) {
      throw schemaError(conversationError.message);
    }
    if (conversationError) throw new Error(conversationError.message);

    const conversationId = String(conversation.id);

    const convMemberRows = [...memberRows.keys()].map((uid) => ({
      conversation_id: conversationId,
      user_id: uid,
      role: uid === userId ? 'owner' : memberRows.get(uid)?.role ?? 'member',
    }));

    const { error: convMembersError } = await supabase
      .from('conversation_members')
      .insert(convMemberRows);

    if (convMembersError && isSchemaError(convMembersError)) {
      throw schemaError(convMembersError.message);
    }
    if (convMembersError) throw new Error(convMembersError.message);

    const { data: channel, error: channelError } = await supabase
      .from('workspace_channels')
      .insert({
        workspace_id: workspaceId,
        conversation_id: conversationId,
        name: channelName,
        channel_type: payload.workspaceType,
        visibility: mapChannelVisibility(payload.visibility),
      })
      .select('id')
      .single();

    if (channelError && isSchemaError(channelError)) throw schemaError(channelError.message);
    if (channelError) throw new Error(channelError.message);

    const memoryPayload = buildMemoryPayload(payload);
    const { error: memoryError } = await supabase.from('conversation_memory').insert({
      conversation_id: conversationId,
      summary: purpose,
      topics: payload.objectives
        ? payload.objectives
            .split(/[\n,;]+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 8)
        : [],
      action_items: payload.successMetrics
        ? payload.successMetrics
            .split(/[\n,;]+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 8)
        : [],
      importance_score:
        payload.priority === 'critical' ? 90 : payload.priority === 'high' ? 75 : payload.priority === 'medium' ? 50 : 25,
      payload: memoryPayload,
      embedding_ready: false,
    });

    if (memoryError && isSchemaError(memoryError)) throw schemaError(memoryError.message);
    if (memoryError) throw new Error(memoryError.message);

    const welcomeContent = [
      `Workspace **${title}** created.`,
      purpose ? `Purpose: ${purpose}` : null,
      payload.participants.length
        ? `Members: ${payload.participants.map((p) => p.name).join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: welcomeContent,
      message_type: 'system',
      status: 'sent',
      read: false,
      metadata: {
        workspaceId,
        workspaceType: payload.workspaceType,
        priority: payload.priority === 'critical' || payload.priority === 'high' ? 'high' : 'normal',
        composerType: 'system',
      },
    });

    return {
      workspaceId,
      conversationId,
      channelId: String(channel.id),
      channelName,
    };
  },
};
