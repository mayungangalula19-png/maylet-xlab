import type { CommunityAnalyticsEvent } from '../types/community.types';

const QUEUE_KEY = 'mxl_community_analytics';

export function trackEvent(eventName: CommunityAnalyticsEvent, payload?: Record<string, unknown>): void {
  const body = {
    ...payload,
    at: new Date().toISOString(),
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
  };

  if (import.meta.env.DEV) {
    console.info(`[analytics] ${eventName}`, body);
  }

  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const queue = raw ? (JSON.parse(raw) as unknown[]) : [];
    queue.push({ eventName, body });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-80)));
  } catch {
    /* ignore storage errors */
  }

  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    gtag?.('event', eventName, body);
  }
}
