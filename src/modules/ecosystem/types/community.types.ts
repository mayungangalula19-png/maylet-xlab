export type UserRole = 'researcher' | 'developer' | 'student' | 'innovator';
export type PostType = 'research' | 'update' | 'announcement' | 'project';
export type FeedFilter = 'all' | PostType | 'trending' | 'teams';
export type FeedSort = 'latest' | 'trending' | 'recommended';

export interface CommunityUser {
  id: string;
  name: string;
  role: UserRole;
  expertise: string;
  avatar?: string;
}

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
}

export interface CommunityPost {
  id: string;
  author: CommunityUser;
  type: PostType;
  title: string;
  content: string;
  tags: string[];
  projectId?: string;
  teamId?: string;
  createdAt: string;
  engagement: EngagementMetrics;
  trendingScore?: number;
}

export interface CommunityComment {
  id: string;
  postId: string;
  author: CommunityUser;
  content: string;
  createdAt: string;
}

export interface FeedPage {
  posts: CommunityPost[];
  nextCursor: string | null;
}

export interface SuggestionUser {
  id: string;
  name: string;
  role: UserRole;
  expertise: string;
  mutualProjects: number;
}

export interface SuggestionProject {
  id: string;
  name: string;
  sector: string;
  contributors: number;
}

export interface SuggestionsPayload {
  users: SuggestionUser[];
  projects: SuggestionProject[];
}

export interface CreatePostPayload {
  type: PostType;
  title: string;
  content: string;
  tags: string;
}

export type CollaborationAction =
  | 'join_team'
  | 'contribute_project'
  | 'view_research'
  | 'request_collaboration'
  | 'suggested_project'
  | 'hackathons'
  | 'mentorship'
  | 'ecosystem_hub';

export type CommunityAnalyticsEvent =
  | 'feed_view'
  | 'post_like'
  | 'post_comment'
  | 'post_share'
  | 'post_save'
  | 'post_create'
  | 'post_open'
  | 'collaboration_click'
  | 'feed_scroll_depth';
