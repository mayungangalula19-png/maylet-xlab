import type { CommunityPost, FeedFilter, FeedSort } from '../types/community.types';

export const PAGE_SIZE = 8;
export const POST_COOLDOWN_MS = 8000;
export const ESTIMATED_POST_HEIGHT = 320;
export const VIRTUAL_OVERSCAN = 2;

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeText(raw: string, max = 4000): string {
  return escapeHtml(raw.trim().slice(0, max));
}

export function parseTags(raw: string): string[] {
  return raw
    .split(/[,\s#]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((t) => (t.startsWith('#') ? t : `#${t}`));
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function debounce<T extends (...args: never[]) => void>(fn: T, waitMs: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  }) as T;
}

export function recommendedScore(post: CommunityPost): number {
  const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / 3600000;
  const recency = Math.max(0, 72 - ageHours) / 72;
  const engagement = post.engagement.likes * 2 + post.engagement.comments * 3 + post.engagement.shares * 4;
  const trending = (post.trendingScore ?? 0) / 100;
  return engagement * 0.45 + recency * 100 * 0.3 + trending * 100 * 0.25;
}

export function filterAndSortPosts(
  posts: CommunityPost[],
  filter: FeedFilter,
  sort: FeedSort
): CommunityPost[] {
  let list = [...posts];

  if (filter === 'trending') {
    list.sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0));
  } else if (filter === 'teams') {
    list = list.filter((p) => Boolean(p.teamId));
  } else if (filter !== 'all') {
    list = list.filter((p) => p.type === filter);
  }

  if (sort === 'trending') {
    list.sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0));
  } else if (sort === 'recommended') {
    list.sort((a, b) => recommendedScore(b) - recommendedScore(a));
  } else {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return list;
}

export function validatePostInput(title: string, content: string): string | null {
  const t = title.trim();
  const c = content.trim();
  if (!t) return 'Title is required.';
  if (t.length < 3) return 'Title must be at least 3 characters.';
  if (!c) return 'Content is required.';
  if (c.length < 10) return 'Content must be at least 10 characters.';
  return null;
}
