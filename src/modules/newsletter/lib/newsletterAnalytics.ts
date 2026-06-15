import { supabase } from '../../../lib/supabase/client';
import type {
  NewsletterAnalyticsEvent,
  NewsletterAnalyticsPayload,
  NewsletterSource,
} from '../types/newsletter.types';

const QUEUE_KEY = 'mxl_newsletter_analytics_queue';

function hashEmail(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (Math.imul(31, h) + email.charCodeAt(i)) | 0;
  return `e_${Math.abs(h)}`;
}

function persistQueue(event: NewsletterAnalyticsEvent, payload: NewsletterAnalyticsPayload) {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const queue = raw ? (JSON.parse(raw) as unknown[]) : [];
    queue.push({ event, payload, at: new Date().toISOString() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-50)));
  } catch {
    /* ignore storage errors */
  }
}

async function persistServer(event: NewsletterAnalyticsEvent, payload: NewsletterAnalyticsPayload) {
  try {
    await supabase.from('newsletter_events').insert({
      event_name: event,
      payload,
      created_at: new Date().toISOString(),
    });
  } catch {
    /* table may be absent on older DBs */
  }
}

export function trackEvent(
  event: NewsletterAnalyticsEvent,
  payload: NewsletterAnalyticsPayload = {}
): void {
  const enriched = {
    ...payload,
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    at: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    console.info(`[analytics] ${event}`, enriched);
  }

  persistQueue(event, enriched);
  void persistServer(event, enriched);

  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    gtag?.('event', event, enriched);
  }
}

export function trackSignupStarted(source: NewsletterSource, email?: string) {
  trackEvent('newsletter_signup_started', {
    source,
    emailHash: email ? hashEmail(email) : undefined,
  });
}

export function trackSignupSuccess(source: NewsletterSource, email: string, duplicate?: boolean) {
  trackEvent('newsletter_signup_success', {
    source,
    emailHash: hashEmail(email),
    duplicate,
  });
}

export function trackSignupFailed(source: NewsletterSource, error: string, email?: string) {
  trackEvent('newsletter_signup_failed', {
    source,
    error,
    emailHash: email ? hashEmail(email) : undefined,
  });
}
