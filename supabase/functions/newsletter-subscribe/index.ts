import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

interface SubscribeBody {
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

function sanitizeEmail(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 254);
}

function isValidEmail(email: string): boolean {
  return Boolean(email) && email.length <= 254 && EMAIL_RE.test(email);
}

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'edge';
}

async function checkRateLimit(supabase: ReturnType<typeof createClient>, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('newsletter_rate_limits')
    .select('attempt_count')
    .eq('identifier', ip)
    .gte('window_start', since)
    .maybeSingle();
  return (data?.attempt_count ?? 0) < 10;
}

async function bumpRateLimit(supabase: ReturnType<typeof createClient>, ip: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('newsletter_rate_limits')
    .select('id, attempt_count')
    .eq('identifier', ip)
    .gte('window_start', since)
    .maybeSingle();

  if (data?.id) {
    await supabase
      .from('newsletter_rate_limits')
      .update({ attempt_count: (data.attempt_count ?? 0) + 1 })
      .eq('id', data.id);
    return;
  }

  await supabase.from('newsletter_rate_limits').insert({
    identifier: ip,
    attempt_count: 1,
    window_start: new Date().toISOString(),
  });
}

async function sendWelcomeEmail(email: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return;
  const from = Deno.env.get('NEWSLETTER_FROM_EMAIL') ?? 'Maylet XLab <newsletter@mayletxlab.com>';
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Welcome to Maylet X Lab',
      html: `<p>Thanks for subscribing. Weekly innovation insights are on the way.</p>`,
    }),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as SubscribeBody;

    if (body.metadata?.honeypot?.trim()) {
      return new Response(
        JSON.stringify({ ok: true, subscriberId: 'filtered', duplicate: false, message: 'Thanks!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = sanitizeEmail(body.email);
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid email.', code: 'VALIDATION' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const ip = clientIp(req);
    if (!(await checkRateLimit(supabase, ip))) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Rate limit exceeded.', code: 'RATE_LIMIT', retryable: true }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    await bumpRateLimit(supabase, ip);

    const metadata = {
      ...(body.metadata ?? {}),
      tags: [...new Set([...(body.metadata?.tags ?? []), 'newsletter_lead'])],
      segment: body.metadata?.segment ?? 'landing_users',
    };

    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('newsletter_subscribers')
        .update({ last_seen_at: new Date().toISOString(), metadata })
        .eq('id', existing.id);

      return new Response(
        JSON.stringify({
          ok: true,
          subscriberId: existing.id,
          duplicate: true,
          message: "You're already subscribed.",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: inserted, error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email,
        source: body.source || 'landing_page',
        status: 'active',
        metadata,
        last_seen_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !inserted) {
      return new Response(JSON.stringify({ ok: false, error: error?.message ?? 'Insert failed', code: 'SERVER' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('newsletter_events').insert({
      event_name: 'newsletter_signup_success',
      payload: { source: body.source, subscriberId: inserted.id },
    });

    await supabase.from('newsletter_automation_queue').insert({
      subscriber_id: inserted.id,
      email,
      pipeline: 'welcome_sequence',
      status: 'pending',
      tags: ['newsletter_lead', 'landing_users'],
    });

    await sendWelcomeEmail(email);

    return new Response(
      JSON.stringify({
        ok: true,
        subscriberId: inserted.id,
        duplicate: false,
        message: 'Welcome aboard! Check your inbox.',
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e), code: 'SERVER' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
