import { adminSupabase } from '../auth/verifyToken.js';
import { sanitizeContent } from '../utils/sanitize.js';
import { logger } from '../utils/logger.js';

export interface StoredMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  status: string;
  read: boolean;
  created_at: string;
}

export class MessageService {
  async canAccessConversation(userId: string, conversationId: string): Promise<boolean> {
    if (!adminSupabase) return true;
    const { data: conv } = await adminSupabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .maybeSingle();
    if (!conv) return false;
    if (conv.user1_id === userId || conv.user2_id === userId) return true;
    const { data: member } = await adminSupabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();
    return Boolean(member);
  }

  async getMessage(messageId: string): Promise<StoredMessage | null> {
    if (!adminSupabase) return null;
    const { data } = await adminSupabase.from('messages').select('*').eq('id', messageId).maybeSingle();
    return (data as StoredMessage) ?? null;
  }

  async sendMessage(input: {
    conversationId: string;
    senderId: string;
    content: string;
  }): Promise<StoredMessage | null> {
    if (!adminSupabase) {
      return {
        id: crypto.randomUUID(),
        conversation_id: input.conversationId,
        sender_id: input.senderId,
        content: sanitizeContent(input.content),
        message_type: 'text',
        status: 'sent',
        read: false,
        created_at: new Date().toISOString(),
      };
    }

    const allowed = await this.canAccessConversation(input.senderId, input.conversationId);
    if (!allowed) return null;

    const { data: conv } = await adminSupabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', input.conversationId)
      .maybeSingle();

    const receiverId =
      conv?.user1_id === input.senderId
        ? conv.user2_id
        : conv?.user2_id === input.senderId
          ? conv.user1_id
          : null;

    const { data, error } = await adminSupabase
      .from('messages')
      .insert({
        conversation_id: input.conversationId,
        sender_id: input.senderId,
        receiver_id: receiverId,
        content: sanitizeContent(input.content),
        message_type: 'text',
        status: 'sent',
        read: false,
      })
      .select('*')
      .single();

    if (error || !data) {
      logger.error('message_send_failed', { error: error?.message });
      return null;
    }

    await adminSupabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', input.conversationId);

    return data as StoredMessage;
  }

  async editMessage(input: {
    messageId: string;
    userId: string;
    content: string;
  }): Promise<StoredMessage | null> {
    if (!adminSupabase) return null;
    const existing = await this.getMessage(input.messageId);
    if (!existing || existing.sender_id !== input.userId) return null;

    const { data, error } = await adminSupabase
      .from('messages')
      .update({
        content: sanitizeContent(input.content),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.messageId)
      .select('*')
      .single();

    if (error || !data) return null;
    return data as StoredMessage;
  }

  async deleteMessage(messageId: string, userId: string): Promise<StoredMessage | null> {
    if (!adminSupabase) return null;
    const existing = await this.getMessage(messageId);
    if (!existing || existing.sender_id !== userId) return null;

    const { error } = await adminSupabase.from('messages').delete().eq('id', messageId);
    if (error) return null;
    return existing;
  }

  async markRead(userId: string, conversationId: string, messageIds: string[]): Promise<void> {
    if (!adminSupabase || !messageIds.length) return;
    const allowed = await this.canAccessConversation(userId, conversationId);
    if (!allowed) return;
    await adminSupabase
      .from('messages')
      .update({ read: true, status: 'read' })
      .in('id', messageIds)
      .eq('conversation_id', conversationId);
  }

  async recentMessages(conversationId: string, limit = 20): Promise<StoredMessage[]> {
    if (!adminSupabase) return [];
    const { data } = await adminSupabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data ?? []) as StoredMessage[];
  }
}
