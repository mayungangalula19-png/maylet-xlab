export type WorkspaceRole = 'owner' | 'admin' | 'member';

export type ChannelVisibility = 'public' | 'private';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  memberCount: number;
}

export interface WorkspaceChannel {
  id: string;
  workspaceId: string;
  name: string;
  type: 'dm' | 'team' | 'project' | 'public';
  visibility: ChannelVisibility;
  conversationId: string;
  unreadCount: number;
}

export interface WorkspaceMember {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  name: string;
}
