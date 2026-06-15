import { PAGE_SIZE } from '../lib/communityUtils';
import { seedComments, seedPosts, seedSuggestions } from '../lib/communitySeed';
import type {
  CommunityComment,
  CommunityPost,
  FeedPage,
  FeedSort,
  SuggestionsPayload,
} from '../types/community.types';

const API_BASE = import.meta.env.VITE_COMMUNITY_API_URL?.replace(/\/$/, '') ?? '';
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  signal?: AbortSignal;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  const { method = 'GET', body, signal } = options;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort);

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        if (attempt < MAX_RETRIES && res.status >= 500) {
          await sleep(300 * (attempt + 1));
          continue;
        }
        return null;
      }

      return (await res.json()) as T;
    } catch {
      if (attempt < MAX_RETRIES) {
        await sleep(300 * (attempt + 1));
        continue;
      }
      return null;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
    }
  }

  return null;
}

export async function fetchFeed(cursor: string | null, sort: FeedSort): Promise<FeedPage> {
  const qs = new URLSearchParams({ limit: String(PAGE_SIZE), sort });
  if (cursor) qs.set('cursor', cursor);

  const remote = await request<FeedPage>(`/api/feed?${qs}`);
  if (remote?.posts?.length) return remote;

  const all = seedPosts();
  const start = cursor ? parseInt(cursor, 10) : 0;
  const slice = all.slice(start, start + PAGE_SIZE);
  return {
    posts: slice,
    nextCursor: start + PAGE_SIZE < all.length ? String(start + PAGE_SIZE) : null,
  };
}

export async function fetchTrending(): Promise<CommunityPost[]> {
  const remote = await request<{ posts: CommunityPost[] }>('/api/trending');
  if (remote?.posts?.length) return remote.posts;
  return [...seedPosts()].sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0)).slice(0, 5);
}

export async function fetchSuggestions(): Promise<SuggestionsPayload> {
  const remote = await request<SuggestionsPayload>('/api/suggestions');
  if (remote?.users?.length && remote?.projects?.length) return remote;
  return seedSuggestions();
}

export async function createPost(body: Record<string, unknown>): Promise<CommunityPost | null> {
  return request<CommunityPost>('/api/posts', { method: 'POST', body });
}

export async function likePost(postId: string, userId: string): Promise<boolean> {
  const result = await request<{ ok: boolean }>('/api/posts/like', {
    method: 'POST',
    body: { postId, userId },
  });
  return result !== null;
}

export async function commentOnPost(
  postId: string,
  userId: string,
  content: string
): Promise<CommunityComment | null> {
  return request<CommunityComment>('/api/posts/comment', {
    method: 'POST',
    body: { postId, userId, content },
  });
}

export async function sharePost(postId: string): Promise<boolean> {
  const result = await request<{ ok: boolean }>('/api/posts/share', {
    method: 'POST',
    body: { postId },
  });
  return result !== null;
}

export function getSeedComments(): CommunityComment[] {
  return seedComments();
}
