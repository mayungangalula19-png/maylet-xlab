import type {
  NewsletterSubscribePayload,
  NewsletterSubscribeResponse,
  NewsletterSource,
  NewsletterSubscribeMetadata,
} from '../types/newsletter.types';
import { captureReferrer, captureUtmParams } from '../lib/utm';
import { supabase } from '../../../lib/supabase/client';

const DEFAULT_TIMEOUT_MS = 12_000;

function apiBase(): string {
  return import.meta.env.VITE_NEWSLETTER_API_URL?.replace(/\/$/, '') ?? '';
}

export function buildSubscribePayload(
  email: string,
  source: NewsletterSource,
  extras?: Partial<NewsletterSubscribeMetadata>
): NewsletterSubscribePayload {
  const utm = captureUtmParams();
  const metadata: NewsletterSubscribeMetadata = {
    referrer: captureReferrer(),
    utm: Object.keys(utm).length > 0 ? utm : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : undefined,
    tags: ['newsletter_lead'],
    segment: source === 'enterprise' ? 'enterprise_users' : 'landing_users',
    ...extras,
  };

  return {
    email,
    source,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

async function parseResponse(res: Response): Promise<NewsletterSubscribeResponse> {
  const body = (await res.json().catch(() => ({}))) as NewsletterSubscribeResponse;
  if (res.ok && body.ok) return body;
  if (!body.ok) return body;
  return {
    ok: false,
    error: res.statusText || 'Subscription failed.',
    code: res.status === 429 ? 'RATE_LIMIT' : 'SERVER',
    retryable: res.status >= 500 || res.status === 429,
  };
}

async function subscribeViaEdgeFunction(
  payload: NewsletterSubscribePayload
): Promise<NewsletterSubscribeResponse> {
  const { data, error } = await supabase.functions.invoke('newsletter-subscribe', { body: payload });
  if (error) {
    return {
      ok: false,
      error: error.message,
      code: 'SERVER',
      retryable: true,
    };
  }
  return (data ?? { ok: false, error: 'Empty response', code: 'SERVER' }) as NewsletterSubscribeResponse;
}

export async function subscribeNewsletter(
  payload: NewsletterSubscribePayload,
  signal?: AbortSignal
): Promise<NewsletterSubscribeResponse> {
  const base = apiBase();
  const url = base ? `${base}/api/newsletter/subscribe` : '/api/newsletter/subscribe';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: signal ?? controller.signal,
    });

    if (res.status === 404) {
      return subscribeViaEdgeFunction(payload);
    }

    return await parseResponse(res);
  } catch (err) {
    const edge = await subscribeViaEdgeFunction(payload);
    if (edge.ok || edge.code !== 'SERVER') return edge;

    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        ok: false,
        error: 'Request timed out. Check your connection and try again.',
        code: 'TIMEOUT',
        retryable: true,
      };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error. Please retry.',
      code: 'SERVER',
      retryable: true,
    };
  } finally {
    clearTimeout(timeout);
  }
}
