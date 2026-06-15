export type NewsletterSubscriberStatus = 'active' | 'unsubscribed' | 'bounced';

export type NewsletterSource =
  | 'landing_page'
  | 'resources_page'
  | 'blog'
  | 'footer'
  | 'webinar'
  | 'enterprise'
  | string;

export interface NewsletterUtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface NewsletterSubscribeMetadata {
  referrer?: string;
  utm?: NewsletterUtmParams;
  userAgent?: string;
  ipHash?: string;
  tags?: string[];
  segment?: string;
  honeypot?: string;
  organization?: string;
  role?: string;
}

export interface NewsletterSubscribePayload {
  email: string;
  source: NewsletterSource;
  timestamp: string;
  metadata?: NewsletterSubscribeMetadata;
}

export interface NewsletterSubscribeSuccess {
  ok: true;
  subscriberId: string;
  duplicate: boolean;
  message: string;
}

export interface NewsletterSubscribeError {
  ok: false;
  error: string;
  code?: 'VALIDATION' | 'RATE_LIMIT' | 'DUPLICATE' | 'TIMEOUT' | 'SERVER' | 'SPAM';
  retryable?: boolean;
}

export type NewsletterSubscribeResponse = NewsletterSubscribeSuccess | NewsletterSubscribeError;

export type NewsletterAnalyticsEvent =
  | 'newsletter_signup_started'
  | 'newsletter_signup_success'
  | 'newsletter_signup_failed';

export interface NewsletterAnalyticsPayload {
  emailHash?: string;
  source?: NewsletterSource;
  error?: string;
  duplicate?: boolean;
  metadata?: Record<string, unknown>;
}

export interface NewsletterSubscriberRow {
  id: string;
  email: string;
  source: string;
  status: NewsletterSubscriberStatus;
  metadata: NewsletterSubscribeMetadata | null;
  created_at: string;
  last_seen_at: string | null;
}

export interface NewsletterComponentProps {
  source?: NewsletterSource;
  variant?: 'default' | 'enterprise';
  title?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
  onSuccess?: (response: NewsletterSubscribeSuccess) => void;
  showDashboardCta?: boolean;
  showFeaturesCta?: boolean;
  dashboardRoute?: string;
  featuresRoute?: string;
  dashboardLabel?: string;
  featuresLabel?: string;
}
