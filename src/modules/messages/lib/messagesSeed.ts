import type { Conversation, Message, MessageUser } from '../types/messages.types';

const DEMO_USER: MessageUser = {
  id: 'seed-user-1',
  name: 'Alex Kim',
  avatar: null,
  status: 'online',
};

const DEMO_USER_2: MessageUser = {
  id: 'seed-user-2',
  name: 'Jordan Lee',
  avatar: null,
  status: 'away',
};

export function getSeedCurrentUser(userId: string, name: string): MessageUser {
  return { id: userId, name: name || 'You', avatar: null, status: 'online' };
}

export function getSeedConversations(userId: string): Conversation[] {
  const now = Date.now();
  return [
    {
      id: 'seed-conv-1',
      type: 'dm',
      title: DEMO_USER.name,
      members: [DEMO_USER],
      unreadCount: 1,
      lastMessage: {
        id: 'seed-msg-3',
        content: 'Can you review the prototype wireframes?',
        senderId: DEMO_USER.id,
        createdAt: new Date(now - 120_000).toISOString(),
        status: 'delivered',
      },
    },
    {
      id: 'seed-conv-2',
      type: 'channel',
      title: '#project-alpha',
      members: [DEMO_USER, DEMO_USER_2],
      unreadCount: 0,
      lastMessage: {
        id: 'seed-msg-5',
        content: 'Sprint planning moved to Thursday.',
        senderId: DEMO_USER_2.id,
        createdAt: new Date(now - 3_600_000).toISOString(),
        status: 'read',
      },
    },
    {
      id: 'seed-conv-3',
      type: 'group',
      title: 'Innovation Squad',
      members: [DEMO_USER, DEMO_USER_2],
      unreadCount: 0,
      lastMessage: {
        id: 'seed-msg-7',
        content: 'Uploaded validation results to Documents.',
        senderId: userId,
        createdAt: new Date(now - 86_400_000).toISOString(),
        status: 'read',
      },
    },
  ];
}

export function getSeedMessages(conversationId: string, userId: string): Message[] {
  const base = new Date();
  if (conversationId === 'seed-conv-1') {
    return [
      {
        id: 'seed-msg-1',
        conversationId,
        senderId: userId,
        content: 'Hey Alex — sharing the latest experiment results.',
        status: 'read',
        type: 'text',
        createdAt: new Date(base.getTime() - 300_000).toISOString(),
      },
      {
        id: 'seed-msg-2',
        conversationId,
        senderId: DEMO_USER.id,
        content: 'Thanks! I will take a look this afternoon.',
        status: 'read',
        type: 'text',
        createdAt: new Date(base.getTime() - 240_000).toISOString(),
      },
      {
        id: 'seed-msg-3',
        conversationId,
        senderId: DEMO_USER.id,
        content: 'Can you review the prototype wireframes?',
        status: 'delivered',
        type: 'text',
        createdAt: new Date(base.getTime() - 120_000).toISOString(),
      },
    ];
  }
  return [
    {
      id: `seed-msg-${conversationId}`,
      conversationId,
      senderId: userId,
      content: 'Welcome to Maylet X Lab messaging (demo mode).',
      status: 'sent',
      type: 'system',
      createdAt: base.toISOString(),
    },
  ];
}

export function isSeedConversationId(id: string): boolean {
  return id.startsWith('seed-');
}
