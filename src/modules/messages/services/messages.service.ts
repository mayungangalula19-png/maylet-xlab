import { supabase } from '../../../lib/supabase/client';
import { sanitizeText } from '../../../core/utils/sanitize';
import {
  getSeedConversations,
  getSeedCurrentUser,
  getSeedMessages,
  isSeedConversationId,
} from '../lib/messagesSeed';
import type {
  Conversation,
  ConversationLastMessage,
  ConversationType,
  CreateDmPayload,
  Message,
  MessageStatus,
  MessageUser,
  MessagesPageData,
  SendMessagePayload,
} from '../types/messages.types';

type DbConversation = {
  id: string;
  type: ConversationType;
  title: string | null;
  project_id: string | null;
  team_id: string | null;
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
  created_at: string;
};

type DbProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

let seedMode = false;

function mapStatus(row: DbMessage): MessageStatus {
  if (row.read) return 'read';
  if (row.status === 'delivered' || row.status === 'read') return row.status as MessageStatus;
  return (row.status as MessageStatus) || 'sent';
}

function mapMessage(row: DbMessage): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    status: mapStatus(row),
    type: (row.message_type as Message['type']) || 'text',
    createdAt: row.created_at,
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
    msg.includes('could not find the table')
  );
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

async function getConversationMemberIds(conv: DbConversation, userId: string): Promise<string[]> {
  const { data: members } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conv.id);

  const ids = (members ?? []).map((m) => String(m.user_id));
  if (ids.length) return ids;

  const legacy: string[] = [];
  if (conv.user1_id) legacy.push(conv.user1_id);
  if (conv.user2_id) legacy.push(conv.user2_id);
  if (!legacy.includes(userId)) legacy.push(userId);
  return [...new Set(legacy)];
}

function resolveTitle(
  conv: DbConversation,
  members: MessageUser[],
  userId: string
): string {
  if (conv.title?.trim()) return conv.title.trim();
  if (conv.type === 'dm') {
    const other = members.find((m) => m.id !== userId);
    return other?.name ?? 'Direct message';
  }
  return conv.type === 'channel' ? '#general' : 'Group chat';
}

async function buildConversation(
  conv: DbConversation,
  userId: string,
  lastByConv: Map<string, DbMessage>,
  unreadByConv: Map<string, number>,
  profileMap: Map<string, MessageUser>
): Promise<Conversation> {
  const memberIds = await getConversationMemberIds(conv, userId);
  const members = memberIds
    .map((id) => profileMap.get(id) ?? { id, name: 'User', avatar: null })
    .filter((m) => m.id !== userId);

  const lastRow = lastByConv.get(conv.id);
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
    id: conv.id,
    type: conv.type ?? 'dm',
    title: resolveTitle(conv, members, userId),
    members,
    lastMessage,
    unreadCount: unreadByConv.get(conv.id) ?? 0,
    projectId: conv.project_id,
    teamId: conv.team_id,
  };
}

export const messagesService = {
  isSeedMode(): boolean {
    return seedMode;
  },

  async getPageData(userId: string, displayName: string): Promise<MessagesPageData> {
    const conversations = await messagesService.fetchConversations(userId);
    return {
      conversations,
      currentUser: seedMode
        ? getSeedCurrentUser(userId, displayName)
        : { id: userId, name: displayName || 'You', avatar: null, status: 'online' },
    };
  },

  async fetchConversations(userId: string): Promise<Conversation[]> {
    const { data: convRows, error } = await supabase
      .from('conversations')
      .select('id, type, title, project_id, team_id, user1_id, user2_id, created_at, updated_at')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId},created_by.eq.${userId}`);

    if (error && isSchemaError(error)) {
      seedMode = true;
      return getSeedConversations(userId);
    }
    if (error) throw new Error(error.message);

    const memberConvRes = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);

    const convIdsFromMembers = (memberConvRes.data ?? []).map((r) => String(r.conversation_id));
    let allConvs = (convRows ?? []) as DbConversation[];

    if (convIdsFromMembers.length) {
      const { data: extra } = await supabase
        .from('conversations')
        .select('id, type, title, project_id, team_id, user1_id, user2_id, created_at, updated_at')
        .in('id', convIdsFromMembers);
      const byId = new Map(allConvs.map((c) => [c.id, c]));
      for (const row of (extra ?? []) as DbConversation[]) {
        if (!byId.has(row.id)) allConvs.push(row);
      }
    }

    if (!allConvs.length) {
      seedMode = true;
      return getSeedConversations(userId);
    }

    seedMode = false;
    const convIds = allConvs.map((c) => c.id);
    const allMemberIds = new Set<string>([userId]);
    for (const c of allConvs) {
      if (c.user1_id) allMemberIds.add(c.user1_id);
      if (c.user2_id) allMemberIds.add(c.user2_id);
    }

    const [{ data: allMessages }, profileMap] = await Promise.all([
      supabase
        .from('messages')
        .select('id, conversation_id, sender_id, receiver_id, content, message_type, status, read, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false }),
      fetchProfiles([...allMemberIds]),
    ]);

    const lastByConv = new Map<string, DbMessage>();
    const unreadByConv = new Map<string, number>();
    for (const msg of (allMessages ?? []) as DbMessage[]) {
      if (!lastByConv.has(msg.conversation_id)) lastByConv.set(msg.conversation_id, msg);
      const unread =
        !msg.read && msg.sender_id !== userId && (msg.receiver_id === userId || !msg.receiver_id);
      if (unread) {
        unreadByConv.set(msg.conversation_id, (unreadByConv.get(msg.conversation_id) ?? 0) + 1);
      }
    }

    const list = await Promise.all(
      allConvs.map((conv) => buildConversation(conv, userId, lastByConv, unreadByConv, profileMap))
    );

    list.sort((a, b) => {
      const at = a.lastMessage?.createdAt ?? '';
      const bt = b.lastMessage?.createdAt ?? '';
      return bt.localeCompare(at);
    });

    return list;
  },

  async fetchMessages(conversationId: string, userId: string): Promise<Message[]> {
    if (seedMode || isSeedConversationId(conversationId)) {
      return getSeedMessages(conversationId, userId);
    }

    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, receiver_id, content, message_type, status, read, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    const rows = (data ?? []) as DbMessage[];
    const unreadIds = rows.filter((m) => !m.read && m.sender_id !== userId).map((m) => m.id);
    if (unreadIds.length) {
      await supabase
        .from('messages')
        .update({ read: true, status: 'read' })
        .in('id', unreadIds);
    }
    return rows.map(mapMessage);
  },

  async sendMessage(payload: SendMessagePayload): Promise<Message> {
    const content = sanitizeText(payload.content);
    if (!content) throw new Error('Message cannot be empty');

    if (seedMode || isSeedConversationId(payload.conversationId)) {
      return {
        id: `seed-local-${Date.now()}`,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        content,
        status: 'sent',
        type: 'text',
        createdAt: new Date().toISOString(),
        clientId: payload.clientId,
      };
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', payload.conversationId)
      .maybeSingle();

    let receiverId: string | null = null;
    if (conv) {
      const c = conv as { user1_id: string | null; user2_id: string | null };
      receiverId =
        c.user1_id === payload.senderId ? c.user2_id : c.user1_id === payload.senderId ? c.user1_id : null;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: payload.conversationId,
        sender_id: payload.senderId,
        receiver_id: receiverId,
        content,
        message_type: 'text',
        status: 'sent',
        read: false,
      })
      .select('id, conversation_id, sender_id, receiver_id, content, message_type, status, read, created_at')
      .single();

    if (error) throw new Error(error.message);
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', payload.conversationId);

    return mapMessage(data as DbMessage);
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

    if (error) throw new Error(error.message);
    const convId = String(created.id);

    await supabase.from('conversation_members').upsert([
      { conversation_id: convId, user_id: userId, role: 'member' },
      { conversation_id: convId, user_id: otherUserId, role: 'member' },
    ]);

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
    if (messageId.startsWith('seed-') || messageId.startsWith('client-')) return;
    const patch: Record<string, unknown> = { status };
    if (status === 'read') patch.read = true;
    await supabase.from('messages').update(patch).eq('id', messageId);
  },
};
