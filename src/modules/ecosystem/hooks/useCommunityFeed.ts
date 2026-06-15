import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { trackEvent } from '../lib/communityAnalytics';
import {
  POST_COOLDOWN_MS,
  parseTags,
  sanitizeText,
  validatePostInput,
} from '../lib/communityUtils';
import { usePageLoad } from '../../../core/hooks/usePageLoad';
import {
  commentOnPost,
  createPost,
  fetchFeed,
  fetchSuggestions,
  fetchTrending,
  getSeedComments,
  likePost,
  sharePost,
} from '../services/community.service';
import type {
  CollaborationAction,
  CommunityComment,
  CommunityPost,
  CommunityUser,
  CreatePostPayload,
  FeedFilter,
  FeedSort,
  SuggestionsPayload,
} from '../types/community.types';

export function useCommunityFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<FeedFilter>('all');
  const [sort, setSort] = useState<FeedSort>('latest');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [trending, setTrending] = useState<CommunityPost[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionsPayload>({ users: [], projects: [] });
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<CommunityComment[]>(getSeedComments());
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const lastPostAt = useRef(0);
  const scrollDepth = useRef(0);

  const requireAuth = useCallback(() => {
    if (!user) {
      navigate('/login');
      return false;
    }
    return true;
  }, [navigate, user]);

  usePageLoad(async ({ cancelled }) => {
    setLoading(true);
    const [feed, trend, sugg] = await Promise.all([
      fetchFeed(null, sort),
      fetchTrending(),
      fetchSuggestions(),
    ]);
    if (cancelled()) return;
    setPosts(feed.posts);
    setCursor(feed.nextCursor);
    setHasMore(Boolean(feed.nextCursor));
    setTrending(trend);
    setSuggestions(sugg);
    setLoading(false);
    trackEvent('feed_view', { sort, filter });
  }, [filter, sort]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    const page = await fetchFeed(cursor, sort);
    setPosts((prev) => [...prev, ...page.posts]);
    setCursor(page.nextCursor);
    setHasMore(Boolean(page.nextCursor));
    setLoadingMore(false);
    scrollDepth.current += 1;
    trackEvent('feed_scroll_depth', { depth: scrollDepth.current });
  }, [cursor, hasMore, loading, loadingMore, sort]);

  const handleLike = useCallback(
    async (postId: string) => {
      if (!requireAuth() || !user) return;
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (next.has(postId)) next.delete(postId);
        else next.add(postId);
        return next;
      });
      trackEvent('post_like', { postId });
      await likePost(postId, user.id);
    },
    [requireAuth, user]
  );

  const handleShare = useCallback(async (postId: string) => {
    const url = `${window.location.origin}/ecosystem/community?post=${postId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
    trackEvent('post_share', { postId });
    await sharePost(postId);
  }, []);

  const handleSave = useCallback((postId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
    trackEvent('post_save', { postId });
  }, []);

  const handleComment = useCallback(
    async (postId: string, text: string) => {
      if (!requireAuth() || !user) return;
      const clean = sanitizeText(text, 500);
      if (!clean) return;
      const local: CommunityComment = {
        id: `local-${Date.now()}`,
        postId,
        author: {
          id: user.id,
          name: user.email?.split('@')[0] ?? 'Member',
          role: 'innovator',
          expertise: 'Maylet X Lab member',
        },
        content: clean,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, local]);
      trackEvent('post_comment', { postId });
      await commentOnPost(postId, user.id, clean);
    },
    [requireAuth, user]
  );

  const handleCollaboration = useCallback((action: CollaborationAction, post: CommunityPost) => {
    trackEvent('collaboration_click', {
      action,
      postId: post.id,
      projectId: post.projectId,
      teamId: post.teamId,
    });
  }, []);

  const handleCreatePost = useCallback(
    async (payload: CreatePostPayload) => {
      if (!requireAuth() || !user) return;
      const now = Date.now();
      if (now - lastPostAt.current < POST_COOLDOWN_MS) {
        setPostError('Please wait a few seconds before posting again.');
        return;
      }
      const validationError = validatePostInput(payload.title, payload.content);
      if (validationError) {
        setPostError(validationError);
        return;
      }
      const title = sanitizeText(payload.title, 160);
      const content = sanitizeText(payload.content, 4000);
      setPosting(true);
      setPostError(null);
      const body = {
        type: payload.type,
        title,
        content,
        tags: parseTags(payload.tags),
        userId: user.id,
        timestamp: new Date().toISOString(),
      };
      const remote = await createPost(body);
      const author: CommunityUser = {
        id: user.id,
        name: user.email?.split('@')[0] ?? 'Member',
        role: 'innovator',
        expertise: 'Maylet X Lab member',
      };
      const created: CommunityPost =
        remote ?? {
          id: `local-${Date.now()}`,
          author,
          type: payload.type,
          title,
          content,
          tags: parseTags(payload.tags),
          createdAt: new Date().toISOString(),
          engagement: { likes: 0, comments: 0, shares: 0 },
          trendingScore: 10,
        };
      setPosts((prev) => [created, ...prev]);
      lastPostAt.current = now;
      setPosting(false);
      setModalOpen(false);
      trackEvent('post_create', { postId: created.id, type: created.type });
    },
    [requireAuth, user]
  );

  const openComposer = useCallback(() => {
    if (!requireAuth()) return;
    setModalOpen(true);
    trackEvent('post_open', { surface: 'composer' });
  }, [requireAuth]);

  const toggleComments = useCallback((id: string) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return {
    filter,
    setFilter,
    sort,
    setSort,
    posts,
    loading,
    loadingMore,
    trending,
    suggestions,
    likedIds,
    savedIds,
    comments,
    openComments,
    modalOpen,
    setModalOpen,
    posting,
    postError,
    loadMore,
    handleLike,
    handleShare,
    handleSave,
    handleComment,
    handleCollaboration,
    handleCreatePost,
    openComposer,
    toggleComments,
  };
}
