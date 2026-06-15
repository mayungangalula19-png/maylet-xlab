import { useCallback, useId, useRef, useState } from 'react';
import { trackSignupFailed, trackSignupStarted, trackSignupSuccess } from '../lib/newsletterAnalytics';
import { validateNewsletterEmail } from '../lib/newsletterValidation';
import { buildSubscribePayload, subscribeNewsletter } from '../services/newsletter.service';
import type {
  NewsletterComponentProps,
  NewsletterSubscribeSuccess,
  NewsletterSource,
} from '../types/newsletter.types';

export interface UseNewsletterOptions {
  source?: NewsletterSource;
  onSuccess?: NewsletterComponentProps['onSuccess'];
  metadataExtras?: () => Partial<import('../types/newsletter.types').NewsletterSubscribeMetadata>;
}

export interface UseNewsletterReturn {
  email: string;
  setEmail: (value: string) => void;
  honeypot: string;
  setHoneypot: (value: string) => void;
  fieldError: string | null;
  globalError: string | null;
  loading: boolean;
  success: NewsletterSubscribeSuccess | null;
  inputId: string;
  errorId: string;
  successId: string;
  submit: () => Promise<void>;
  reset: () => void;
  retry: () => Promise<void>;
}

export function useNewsletter(options: UseNewsletterOptions = {}): UseNewsletterReturn {
  const source = options.source ?? 'landing_page';
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<NewsletterSubscribeSuccess | null>(null);
  const inFlight = useRef(false);

  const baseId = useId();
  const inputId = `${baseId}-email`;
  const errorId = `${baseId}-error`;
  const successId = `${baseId}-success`;

  const reset = useCallback(() => {
    setFieldError(null);
    setGlobalError(null);
    setSuccess(null);
    inFlight.current = false;
  }, []);

  const submit = useCallback(async () => {
    if (inFlight.current || loading || success) return;

    setFieldError(null);
    setGlobalError(null);

    const { email: normalized, error: validationError } = validateNewsletterEmail(email);
    if (validationError) {
      setFieldError(validationError);
      trackSignupFailed(source, validationError, normalized);
      return;
    }

    if (honeypot.trim()) {
      setSuccess({
        ok: true,
        subscriberId: 'spam-filtered',
        duplicate: false,
        message: 'Thanks for subscribing!',
      });
      return;
    }

    inFlight.current = true;
    setLoading(true);
    trackSignupStarted(source, normalized);

    const payload = buildSubscribePayload(normalized, source, {
      honeypot: honeypot || undefined,
      ...options.metadataExtras?.(),
    });
    const result = await subscribeNewsletter(payload);

    setLoading(false);
    inFlight.current = false;

    if (result.ok) {
      setSuccess(result);
      trackSignupSuccess(source, normalized, result.duplicate);
      options.onSuccess?.(result);
      return;
    }

    setGlobalError(result.error);
    trackSignupFailed(source, result.error, normalized);
  }, [email, honeypot, loading, options, source, success]);

  const retry = useCallback(async () => {
    setGlobalError(null);
    setFieldError(null);
    inFlight.current = false;
    await submit();
  }, [submit]);

  return {
    email,
    setEmail,
    honeypot,
    setHoneypot,
    fieldError,
    globalError,
    loading,
    success,
    inputId,
    errorId,
    successId,
    submit,
    reset,
    retry,
  };
}
