import { supabase } from '../../../lib/supabase/client';
import { sanitizeText } from '../../../core/utils/sanitize';
import type {
  Conversation,
  ConversationLastMessage,
  ConversationType,
  CreateDmPayload,
  Message,
  MessageMetadata,
  MessageStatus,
  MessageUser,
  MessagesPageData,
  SendMessagePayload,
} from '../types/messages.types';
import { MessagingSchemaError } from '../types/messages.types';
import { dedupeById } from '../lib/messageUtils';

type DbConversation = {
  id: string;
  type: ConversationType;
  title: string | null;
  project_id: string | null;
  team_id: string | null;
  workspace_id: string | null;
  user1_id: string | null;
  user2_id: string | null;
  created_at: string;
  updated_at: string;
};

type DbMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string | null;
  content: string;
  message_type: string;
  status: string;
  read: boolean;
  metadata: MessageMetadata | null;
  created_at: string;
};

type DbProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

const MIGRATION_HINT =
  'Apply messaging migrations: 20240612000028_messaging_schema.sql, 20240612000029_messaging_workspace_memory.sql, and 20250617000001_messaging_cut_p0.sql';

function mapStatus(row: DbMessage): MessageStatus {
  if (row.read) return 'read';
  if (row.status === 'delivered' || row.status === 'read') return row.status as MessageStatus;
  return (row.status as MessageStatus) || 'sent';
}

function mapDbMessageType(messageType: string): Message['type'] {
  if (messageType === 'image' || messageType === 'file' || messageType === 'system') {
    return messageType;
  }
  return 'text';
}

function mapMessage(row: DbMessage): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    status: mapStatus(row),
    type: mapDbMessageType(row.message_type),
    createdAt: row.created_at,
    metadata: row.metadata ?? undefined,
  };
}

function mapProfile(p: DbProfile): MessageUser {
  return {
    id: p.id,
    name: p.full_name?.trim() || 'User',
    avatar: p.avatar_url,
  };
}

function isSchemaError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes('column') && msg.includes('metadata')
  );
}

function schemaError(message?: string): MessagingSchemaError {
  return new MessagingSchemaError(message ? `${message}. ${MIGRATION_HINT}` : MIGRATION_HINT);
}

async function fetchProfiles(ids: string[]): Promise<Map<string, MessageUser>> {
  const map = new Map<string, MessageUser>();
  if (!ids.length) return map;
  const { data } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', ids);
  for (const row of (data ?? []) as DbProfile[]) {
    map.set(row.id, mapProfile(row));
  }
  return map;
}

function buildConversation(
  conv: DbConversation,
  userId: string,
  lastByConv: Map<string, DbMessage>,
  unreadByConv: Map<string, number>,
  profileMap: Map<string, MessageUser>,
  membersByConv: Map<string, string[]>
): Conversation {
  const convId = String(conv.id);
  const memberIds = membersByConv.get(convId) ?? membersByConv.get(conv.id) ?? [];
  let resolvedMemberIds = [...new Set(memberIds.map(String))];
  if (!resolvedMemberIds.length) {
    const legacy: string[] = [];
    if (conv.user1_id) legacy.push(String(conv.user1_id));
    if (conv.user2_id) legacy.push(String(conv.user2_id));
    resolvedMemberIds = [...new Set(legacy)];
  }

  const members = [...new Map(
    resolvedMemberIds
      .map((id) => profileMap.get(id) ?? { id, name: 'User', avatar: null })
      .filter((m) => m.id !== userId)
      .map((m) => [String(m.id), m] as const)
  ).values()];

  const lastRow = lastByConv.get(convId) ?? lastByConv.get(conv.id);
  const lastMessage: ConversationLastMessage | null = lastRow
    ? {
        id: lastRow.id,
        content: lastRow.content,
        senderId: lastRow.sender_id,
        createdAt: lastRow.created_at,
        status: mapStatus(lastRow),
      }
    : null;

  return {
    id: convId,
    type: conv.type ?? 'dm',
    title: resolveTitle(conv, members, userId),
    members,
    lastMessage,
    unreadCount: unreadByConv.get(convId) ?? unreadByConv.get(conv.id) ?? 0,
    projectId: conv.project_id,
    teamId: conv.team_id,
    workspaceId: conv.workspace_id,
  };
}

function resolveTitle(conv: DbConversation, members: MessageUser[], userId: string): string {
  if (conv.title?.trim()) return conv.title.trim();
  if (conv.type === 'dm') {
    const other = members.find((m) => m.id !== userId);
    return other?.name ?? 'Direct message';
  }
  return conv.type === 'channel' ? '#general' : 'Group chat';
}

function indexMembersByConversation(
  rows: { conversation_id: string; user_id: string }[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const cid = String(row.conversation_id);
    const uid = String(row.user_id);
    const list = map.get(cid) ?? [];
    list.push(uid);
    map.set(cid, list);
  }
  return map;
}

function buildMessageMetadata(payload: SendMessagePayload): MessageMetadata {
  return {
    priority: payload.priority ?? 'normal',
    composerType: payload.messageType ?? 'standard',
    mentionedIds: payload.mentionedIds ?? [],
    conversationType: payload.conversationType,
    workspaceId: payload.workspaceId ?? null,
    attachmentMeta: payload.attachmentMeta ?? [],
  };
}

async function persistMentions(messageId: string, mentionedIds: string[]): Promise<void> {
  const unique = [...new Set(mentionedIds.filter(Boolean))];
  if (!unique.length) return;

  const rows = unique.map((mentioned_user_id) => ({ message_id: messageId, mentioned_user_id }));
  const { error } = await supabase.from('message_mentions').insert(rows);
  if (error && !isSchemaError(error)) {
    console.warn('[messages] mention persistence failed:', error.message);
  }
}

export const messagesService = {
  async getPageData(userId: string, displayName: string): Promise<MessagesPageData> {
    const conversations = await messagesService.fetchConversations(userId);
    return {
      conversations,
      currentUser: { id: userId, name: displayName || 'You', avatar: null, status: 'online' },
    };
  },

  async fetchConversations(userId: string): Promise<Conversation[]> {
    const { data: convRows, error } = await supabase
      .from('conversations')
      .select(
        'id, type, title, project_id, team_id, workspace_id, user1_id, user2_id, created_at, updated_at'
      )
      .or(`user1_id.eq.${userId},user2_id.eq.${userId},created_by.eq.${userId}`);

    if (error && isSchemaError(error)) throw schemaError(error.message);
    if (error) throw new Error(error.message);

    const memberConvRes = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);

    const convIdsFromMembers = (memberConvRes.data ?? []).map((r) => String(r.conversation_id));
    const byId = new Map<string, DbConversation>();
    for (const row of (convRows ?? []) as DbConversation[]) {
      byId.set(String(row.id), row);
    }

    if (convIdsFromMembers.length) {
      const { data: extra } = await supabase
        .from('conversations')
        .select(
          'id, type, title, project_id, team_id, workspace_id, user1_id, user2_id, created_at, updated_at'
        )
        .in('id', convIdsFromMembers);
      for (const row of (extra ?? []) as DbConversation[]) {
        const id = String(row.id);
        if (!byId.has(id)) byId.set(id, row);
      }
    }

    const allConvs = [...byId.values()];

    if (!allConvs.length) return [];

    const convIds = allConvs.map((c) => c.id);
    const allMemberIds = new Set<string>([userId]);
    for (const c of allConvs) {
      if (c.user1_id) allMemberIds.add(c.user1_id);
      if (c.user2_id) allMemberIds.add(c.user2_id);
    }

    const recentLimit = Math.min(400, Math.max(80, convIds.length * 15));

    const [{ data: memberRows }, { data: unreadRows }, { data: recentMessages }, profileMap] =
      await Promise.all([
        supabase.from('conversation_members').select('conversation_id, user_id').in('conversation_id', convIds),
        supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', convIds)
          .eq('read', false)
          .neq('sender_id', userId),
        supabase
          .from('messages')
          .select(
            'id, conversation_id, sender_id, receiver_id, content, message_type, status, read, metadata, created_at'
          )
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false })
          .limit(recentLimit),
        fetchProfiles([...allMemberIds]),
      ]);

    const membersByConv = indexMembersByConversation(
      (memberRows ?? []) as { conversation_id: string; user_id: string }[]
    );
    for (const ids of membersByConv.values()) {
      for (const id of ids) allMemberIds.add(id);
    }
    if (allMemberIds.size > profileMap.size) {
      const missing = [...allMemberIds].filter((id) => !profileMap.has(id));
      const extra = await fetchProfiles(missing);
      for (const [id, user] of extra) profileMap.set(id, user);
    }

    const lastByConv = new Map<string, DbMessage>();
    const unreadByConv = new Map<string, number>();
    for (const row of (unreadRows ?? []) as { conversation_id: string }[]) {
      const cid = String(row.conversation_id);
      unreadByConv.set(cid, (unreadByConv.get(cid) ?? 0) + 1);
    }
    for (const msg of (recentMessages ?? []) as DbMessage[]) {
      if (!lastByConv.has(msg.conversation_id)) lastByConv.set(msg.conversation_id, msg);
    }

    const list = allConvs.map((conv) =>
      buildConversation(conv, userId, lastByConv, unreadByConv, profileMap, membersByConv)
    );

    list.sort((a, b) => {
      const at = a.lastMessage?.createdAt ?? '';
      const bt = b.lastMessage?.createdAt ?? '';
      return bt.localeCompare(at);
    });

    return dedupeById(list);
  },

  async fetchMessages(conversationId: string, userId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(
        'id, conversation_id, sender_id, receiver_id, content, message_type, status, read, metadata, created_at'
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error && isSchemaError(error)) throw schemaError(error.message);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as DbMessage[];
    const unreadIds = rows.filter((m) => !m.read && m.sender_id !== userId).map((m) => m.id);
    if (unreadIds.length) {
      void supabase.from('messages').update({ read: true, status: 'read' }).in('id', unreadIds);
    }
    return dedupeById(rows.map(mapMessage));
  },

  async sendMessage(payload: SendMessagePayload): Promise<Message> {
    const content = sanitizeText(payload.content);
    if (!content) throw new Error('Message cannot be empty');

    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id, workspace_id, type')
      .eq('id', payload.conversationId)
      .maybeSingle();

    if (convError && isSchemaError(convError)) throw schemaError(convError.message);

    let receiverId: string | null = null;
    if (conv) {
      const c = conv as {
        user1_id: string | null;
        user2_id: string | null;
        workspace_id: string | null;
        type: string;
      };
      receiverId =
        c.user1_id === payload.senderId ? c.user2_id : c.user1_id === payload.senderId ? c.user1_id : null;
      if (!payload.workspaceId && c.workspace_id) {
        payload = { ...payload, workspaceId: c.workspace_id };
      }
      if (!payload.conversationType) {
        payload = { ...payload, conversationType: c.type };
      }
    }

    const metadata = buildMessageMetadata(payload);
    const messageType = payload.messageType ?? 'standard';

    const insertRow: Record<string, unknown> = {
      conversation_id: payload.conversationId,
      sender_id: payload.senderId,
      receiver_id: receiverId,
      content,
      message_type: messageType,
      status: 'sent',
      read: false,
      metadata,
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(insertRow)
      .select(
        'id, conversation_id, sender_id, receiver_id, content, message_type, status, read, metadata, created_at'
      )
      .single();

    if (error && isSchemaError(error)) throw schemaError(error.message);
    if (error) throw new Error(error.message);

    const saved = mapMessage(data as DbMessage);
    await persistMentions(saved.id, payload.mentionedIds ?? []);

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', payload.conversationId);

    return { ...saved, clientId: payload.clientId };
  },

  async createDm({ userId, otherUserId }: CreateDmPayload): Promise<string> {
    if (userId === otherUserId) throw new Error('Cannot message yourself');

    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('id')
      .eq('type', 'dm')
      .or(
        `and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`
      )
      .maybeSingle();

    if (findError && isSchemaError(findError)) throw schemaError(findError.message);
    if (!findError && existing?.id) return String(existing.id);

    const { data: created, error } = await supabase
      .from('conversations')
      .insert({
        type: 'dm',
        created_by: userId,
        user1_id: userId,
        user2_id: otherUserId,
      })
      .select('id')
      .single();

    if (error && isSchemaError(error)) throw schemaError(error.message);
    if (error) throw new Error(error.message);
    const convId = String(created.id);

    const { error: memberError } = await supabase.from('conversation_members').upsert([
      { conversation_id: convId, user_id: userId, role: 'member' },
      { conversation_id: convId, user_id: otherUserId, role: 'member' },
    ]);

    if (memberError && isSchemaError(memberError)) throw schemaError(memberError.message);
    if (memberError) throw new Error(memberError.message);

    return convId;
  },

  async searchUsers(query: string, excludeUserId: string): Promise<MessageUser[]> {
    const q = query.trim();
    if (!q) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .ilike('full_name', `%${q}%`)
      .neq('id', excludeUserId)
      .limit(12);
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbProfile[]).map(mapProfile);
  },

  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
    if (messageId.startsWith('client-')) return;
    const patch: Record<string, unknown> = { status };
    if (status === 'read') patch.read = true;
    await supabase.from('messages').update(patch).eq('id', messageId);
  },
};
