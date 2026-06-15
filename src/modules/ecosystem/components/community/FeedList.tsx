import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trackEvent } from '../../lib/communityAnalytics';
import {
  ESTIMATED_POST_HEIGHT,
  VIRTUAL_OVERSCAN,
  debounce,
  filterAndSortPosts,
} from '../../lib/communityUtils';
import type {
  CollaborationAction,
  CommunityComment,
  CommunityPost,
  FeedFilter,
  FeedSort,
} from '../../types/community.types';
import FeedSkeleton from './FeedSkeleton';
import PostCard from './PostCard';

interface FeedListProps {
  posts: CommunityPost[];
  filter: FeedFilter;
  sort: FeedSort;
  loading: boolean;
  loadingMore: boolean;
  likedIds: Set<string>;
  savedIds: Set<string>;
  comments: CommunityComment[];
  openComments: Set<string>;
  onLike: (id: string) => void;
  onShare: (id: string) => void;
  onSave: (id: string) => void;
  onToggleComments: (id: string) => void;
  onComment: (postId: string, text: string) => void;
  onCollaboration: (action: CollaborationAction, post: CommunityPost) => void;
  onLoadMore: () => void;
  onOpenComposer: () => void;
  onSortChange: (sort: FeedSort) => void;
}

const FeedList = memo(function FeedList({
  posts,
  filter,
  sort,
  loading,
  loadingMore,
  likedIds,
  savedIds,
  comments,
  openComments,
  onLike,
  onShare,
  onSave,
  onToggleComments,
  onComment,
  onCollaboration,
  onLoadMore,
  onOpenComposer,
  onSortChange,
}: FeedListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(800);

  const visiblePosts = useMemo(() => filterAndSortPosts(posts, filter, sort), [posts, filter, sort]);

  const commentsByPost = useMemo(() => {
    const map = new Map<string, CommunityComment[]>();
    for (const c of comments) {
      const list = map.get(c.postId) ?? [];
      list.push(c);
      map.set(c.postId, list);
    }
    return map;
  }, [comments]);

  const virtualWindow = useMemo(() => {
    if (visiblePosts.length <= 12) {
      return { start: 0, end: visiblePosts.length, offsetY: 0, totalHeight: visiblePosts.length * ESTIMATED_POST_HEIGHT };
    }
    const start = Math.max(0, Math.floor(scrollTop / ESTIMATED_POST_HEIGHT) - VIRTUAL_OVERSCAN);
    const visibleCount = Math.ceil(viewportHeight / ESTIMATED_POST_HEIGHT) + VIRTUAL_OVERSCAN * 2;
    const end = Math.min(visiblePosts.length, start + visibleCount);
    return {
      start,
      end,
      offsetY: start * ESTIMATED_POST_HEIGHT,
      totalHeight: visiblePosts.length * ESTIMATED_POST_HEIGHT,
    };
  }, [scrollTop, viewportHeight, visiblePosts.length]);

  const slicedPosts = useMemo(
    () => visiblePosts.slice(virtualWindow.start, virtualWindow.end),
    [visiblePosts, virtualWindow.end, virtualWindow.start]
  );

  const handleScroll = useMemo(
    () =>
      debounce(() => {
        const el = scrollRef.current;
        if (!el) return;
        setScrollTop(el.scrollTop);
        const depth = Math.round((el.scrollTop / Math.max(el.scrollHeight - el.clientHeight, 1)) * 100);
        trackEvent('feed_scroll_depth', { depth });
      }, 150),
    []
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const resize = () => setViewportHeight(el.clientHeight);
    resize();
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', resize);
    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', resize);
    };
  }, [handleScroll]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { root: scrollRef.current, rootMargin: '240px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onLoadMore]);

  const handleToggleComments = useCallback(
    (id: string) => {
      onToggleComments(id);
      trackEvent('post_open', { postId: id, surface: 'comments' });
    },
    [onToggleComments]
  );

  return (
    <main className="mxl-comm__main">
      <div className="mxl-comm__sort" role="group" aria-label="Sort feed">
        {(
          [
            ['latest', 'Latest'],
            ['trending', 'Trending'],
            ['recommended', 'Recommended'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={sort === id ? 'is-active' : ''}
            onClick={() => onSortChange(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <button type="button" className="mxl-comm__composer" onClick={onOpenComposer}>
        Share research, project updates, or announcements with the ecosystem…
      </button>

      <div ref={scrollRef} className="mxl-comm__feed mxl-comm__feed--virtual">
        {loading ? (
          <FeedSkeleton />
        ) : visiblePosts.length === 0 ? (
          <div className="mxl-comm__empty">
            No posts match this filter yet. Be the first to publish an update.
          </div>
        ) : (
          <div style={{ height: virtualWindow.totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${virtualWindow.offsetY}px)` }}>
              {slicedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  liked={likedIds.has(post.id)}
                  saved={savedIds.has(post.id)}
                  comments={commentsByPost.get(post.id) ?? []}
                  showComments={openComments.has(post.id)}
                  onLike={onLike}
                  onShare={onShare}
                  onSave={onSave}
                  onToggleComments={handleToggleComments}
                  onComment={onComment}
                  onCollaboration={onCollaboration}
                />
              ))}
            </div>
          </div>
        )}
        {loadingMore && <FeedSkeleton />}
        <div ref={sentinelRef} className="mxl-comm__sentinel" aria-hidden="true" />
      </div>
    </main>
  );
});

export default FeedList;
