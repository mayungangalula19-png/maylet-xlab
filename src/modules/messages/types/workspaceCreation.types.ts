import type { MessageUser } from './messages.types';

export type WorkspaceType =
  | 'direct'
  | 'team'
  | 'project'
  | 'research'
  | 'prototype'
  | 'experiment'
  | 'validation'
  | 'funding'
  | 'commercialization'
  | 'enterprise'
  | 'community'
  | 'partnership';

export type WorkspacePriority = 'low' | 'medium' | 'high' | 'critical';

export type WorkspaceVisibility = 'private' | 'team' | 'organization' | 'public';

export interface AttachedAsset {
  id: string;
  type:
    | 'project'
    | 'research'
    | 'prototype'
    | 'experiment'
    | 'validation'
    | 'funding'
    | 'document'
    | 'post';
  title: string;
  subtitle?: string;
  status?: string;
}

export interface WorkspaceParticipant extends MessageUser {
  role:
    | 'owner'
    | 'admin'
    | 'member'
    | 'researcher'
    | 'engineer'
    | 'mentor'
    | 'investor'
    | 'reviewer'
    | 'observer';
}

export interface KnowledgeSettings {
  knowledgeCapture: boolean;
  discussionSummaries: boolean;
  decisionTracking: boolean;
  actionTracking: boolean;
  meetingRecords: boolean;
  insightExtraction: boolean;
}

export interface WorkspaceCreationPayload {
  workspaceType: WorkspaceType;
  title: string;
  purpose: string;
  objectives: string;
  expectedOutcomes: string;
  successMetrics: string;
  priority: WorkspacePriority;
  timeline: string;
  attachedAssets: AttachedAsset[];
  participants: WorkspaceParticipant[];
  visibility: WorkspaceVisibility;
  moderationEnabled: boolean;
  approvalRequired: boolean;
  knowledgeSettings: KnowledgeSettings;
}

export interface CreateWorkspaceResult {
  workspaceId: string;
  conversationId: string;
  channelId: string;
  channelName: string;
}
