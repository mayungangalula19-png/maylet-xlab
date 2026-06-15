import type { NewsletterUtmParams } from '../types/newsletter.types';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

export function captureUtmParams(search = typeof window !== 'undefined' ? window.location.search : ''): NewsletterUtmParams {
  const params = new URLSearchParams(search);
  const utm: NewsletterUtmParams = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value.slice(0, 200);
  }
  return utm;
}

export function captureReferrer(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const ref = document.referrer?.trim();
  if (!ref || ref === window.location.href) return undefined;
  return ref.slice(0, 500);
}
