export type ConversationType = 'dm' | 'group' | 'channel';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export type MessageContentType = 'text' | 'image' | 'file' | 'system';

export type ComposerPriority = 'normal' | 'high' | 'critical';

export type PresenceStatus = 'online' | 'offline' | 'away';

export interface MessageMetadata {
  priority?: ComposerPriority;
  composerType?: string;
  mentionedIds?: string[];
  conversationType?: string;
  workspaceId?: string | null;
  attachmentMeta?: Array<{
    name: string;
    size: number;
    mimeType: string;
  }>;
  [key: string]: unknown;
}

export interface AsyncState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

export interface MessageUser {
  id: string;
  name: string;
  avatar: string | null;
  status?: PresenceStatus;
}

export interface ConversationLastMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  status: MessageStatus;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string;
  members: MessageUser[];
  lastMessage: ConversationLastMessage | null;
  unreadCount: number;
  projectId?: string | null;
  teamId?: string | null;
  workspaceId?: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: MessageStatus;
  type: MessageContentType;
  createdAt: string;
  clientId?: string;
  metadata?: MessageMetadata;
}

export interface SendMessagePayload {
  conversationId: string;
  senderId: string;
  content: string;
  clientId?: string;
  messageType?: string;
  priority?: ComposerPriority;
  mentionedIds?: string[];
  workspaceId?: string | null;
  conversationType?: string;
  attachmentMeta?: MessageMetadata['attachmentMeta'];
}

export interface CreateDmPayload {
  userId: string;
  otherUserId: string;
}

export interface AiAssistantPayload {
  summary: string;
  suggestedReplies: string[];
  actionItems: string[];
  insights: string[];
  topics: string[];
  decisions: string[];
  risks: string[];
  importanceScore: number;
}

export interface MessagesPageData {
  conversations: Conversation[];
  currentUser: MessageUser;
}

export class MessagingSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MessagingSchemaError';
  }
}
