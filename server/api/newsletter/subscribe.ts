import type { IncomingMessage, ServerResponse } from 'node:http';

export interface NewsletterSubscribeBody {
  email: string;
  source: string;
  timestamp: string;
  metadata?: {
    referrer?: string;
    utm?: Record<string, string>;
    userAgent?: string;
    tags?: string[];
    segment?: string;
    honeypot?: string;
  };
}

export interface NewsletterHandlerConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  resendApiKey?: string;
  welcomeFromEmail?: string;
  rateLimitPerIpPerHour?: number;
}

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function sanitizeEmail(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 254);
}

export function isValidEmail(email: string): boolean {
  return Boolean(email) && email.length <= 254 && EMAIL_RE.test(email);
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return req.socket.remoteAddress ?? 'unknown';
}

async function supabaseRest<T>(
  config: NewsletterHandlerConfig,
  path: string,
  init: RequestInit
): Promise<{ data: T | null; status: number; error?: string }> {
  const res = await fetch(`${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.supabaseServiceKey,
      Authorization: `Bearer ${config.supabaseServiceKey}`,
      'Content-Type': 'application/json',
      Prefer: init.method === 'POST' ? 'return=representation' : 'return=minimal',
      ...(init.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return { data: null, status: res.status, error: text };
  }

  const data = res.status === 204 ? null : ((await res.json()) as T);
  return { data, status: res.status };
}

async function checkRateLimit(config: NewsletterHandlerConfig, ip: string): Promise<boolean> {
  const limit = config.rateLimitPerIpPerHour ?? 10;
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const query = `newsletter_rate_limits?identifier=eq.${encodeURIComponent(ip)}&window_start=gte.${encodeURIComponent(since)}&select=attempt_count`;
  const { data } = await supabaseRest<{ attempt_count: number }[]>(config, query, { method: 'GET' });
  const count = data?.[0]?.attempt_count ?? 0;
  return count < limit;
}

async function bumpRateLimit(config: NewsletterHandlerConfig, ip: string): Promise<void> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const query = `newsletter_rate_limits?identifier=eq.${encodeURIComponent(ip)}&window_start=gte.${encodeURIComponent(since)}&select=id,attempt_count`;
  const { data } = await supabaseRest<{ id: string; attempt_count: number }[]>(config, query, { method: 'GET' });

  if (data?.[0]) {
    await supabaseRest(config, `newsletter_rate_limits?id=eq.${data[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({ attempt_count: data[0].attempt_count + 1 }),
    });
    return;
  }

  await supabaseRest(config, 'newsletter_rate_limits', {
    method: 'POST',
    body: JSON.stringify({ identifier: ip, attempt_count: 1, window_start: new Date().toISOString() }),
  });
}

async function sendWelcomeEmail(config: NewsletterHandlerConfig, email: string): Promise<void> {
  if (!config.resendApiKey) return;
  const from = config.welcomeFromEmail ?? 'Maylet XLab <newsletter@mayletxlab.com>';
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Welcome to Maylet X Lab — innovation insights inside',
      html: `
        <p>Thanks for subscribing to Maylet X Lab.</p>
        <p>You'll receive weekly innovation pipeline tips, MAYA prompts, and ecosystem updates.</p>
        <p><a href="https://mayletxlab.com/dashboard">Open your dashboard</a> to start building.</p>
      `,
    }),
  });
}

async function queueAutomation(
  config: NewsletterHandlerConfig,
  subscriberId: string,
  email: string
): Promise<void> {
  await supabaseRest(config, 'newsletter_automation_queue', {
    method: 'POST',
    body: JSON.stringify({
      subscriber_id: subscriberId,
      email,
      pipeline: 'welcome_sequence',
      status: 'pending',
      tags: ['newsletter_lead', 'landing_users'],
    }),
  });
}

export async function processNewsletterSubscribe(
  body: NewsletterSubscribeBody,
  config: NewsletterHandlerConfig,
  ip: string
) {
  if (body.metadata?.honeypot?.trim()) {
    return {
      status: 200,
      payload: {
        ok: true,
        subscriberId: 'filtered',
        duplicate: false,
        message: 'Thanks for subscribing!',
      },
    };
  }

  const email = sanitizeEmail(body.email);
  if (!isValidEmail(email)) {
    return {
      status: 400,
      payload: { ok: false, error: 'Invalid email address.', code: 'VALIDATION', retryable: false },
    };
  }

  const allowed = await checkRateLimit(config, ip);
  if (!allowed) {
    return {
      status: 429,
      payload: {
        ok: false,
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT',
        retryable: true,
      },
    };
  }

  await bumpRateLimit(config, ip);

  const metadata = {
    ...(body.metadata ?? {}),
    tags: [...new Set([...(body.metadata?.tags ?? []), 'newsletter_lead'])],
    segment: body.metadata?.segment ?? 'landing_users',
    ipHash: Buffer.from(ip).toString('base64url').slice(0, 24),
  };

  const existingQuery = `newsletter_subscribers?email=eq.${encodeURIComponent(email)}&select=id,status`;
  const existing = await supabaseRest<{ id: string; status: string }[]>(config, existingQuery, {
    method: 'GET',
  });

  if (existing.data?.[0]) {
    await supabaseRest(config, `newsletter_subscribers?id=eq.${existing.data[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({ last_seen_at: new Date().toISOString(), metadata }),
    });

    return {
      status: 200,
      payload: {
        ok: true,
        subscriberId: existing.data[0].id,
        duplicate: true,
        message: "You're already subscribed.",
      },
    };
  }

  const insert = await supabaseRest<{ id: string }[]>(config, 'newsletter_subscribers', {
    method: 'POST',
    body: JSON.stringify({
      email,
      source: body.source || 'landing_page',
      status: 'active',
      metadata,
      last_seen_at: new Date().toISOString(),
    }),
  });

  if (!insert.data?.[0]?.id) {
    return {
      status: 500,
      payload: {
        ok: false,
        error: insert.error ?? 'Failed to save subscription.',
        code: 'SERVER',
        retryable: true,
      },
    };
  }

  const subscriberId = insert.data[0].id;

  await supabaseRest(config, 'newsletter_events', {
    method: 'POST',
    body: JSON.stringify({
      event_name: 'newsletter_signup_success',
      payload: { source: body.source, subscriberId },
    }),
  });

  await queueAutomation(config, subscriberId, email);
  await sendWelcomeEmail(config, email);

  return {
    status: 201,
    payload: {
      ok: true,
      subscriberId,
      duplicate: false,
      message: 'Welcome aboard! Check your inbox for next steps.',
    },
  };
}

/** Node.js / Express-style handler for POST /api/newsletter/subscribe */
export async function handleNewsletterSubscribe(
  req: IncomingMessage,
  res: ServerResponse,
  config: NewsletterHandlerConfig
): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { ok: false, error: 'Method not allowed', code: 'SERVER' });
    return;
  }

  try {
    const raw = await readBody(req);
    const body = JSON.parse(raw) as NewsletterSubscribeBody;
    const ip = clientIp(req);
    const result = await processNewsletterSubscribe(body, config, ip);
    res.setHeader('Access-Control-Allow-Origin', '*');
    json(res, result.status, result.payload);
  } catch {
    json(res, 400, {
      ok: false,
      error: 'Invalid request body.',
      code: 'VALIDATION',
      retryable: false,
    });
  }
}
