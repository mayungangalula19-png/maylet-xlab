// Supabase Edge Function: career application email notifications (optional Resend)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyPayload {
  type: 'new_application' | 'status_update';
  applicantEmail: string;
  applicantName: string;
  roleInterest: string;
  status?: string;
  applicationId?: string;
}

async function sendResendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('CAREERS_FROM_EMAIL') ?? 'Maylet XLab <noreply@mayletxlab.com>';
  if (!apiKey) return { sent: false, reason: 'RESEND_API_KEY not configured' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { sent: false, reason: err };
  }
  return { sent: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as NotifyPayload;
    const notifyInbox = Deno.env.get('CAREERS_NOTIFY_EMAIL') ?? 'careers@mayletxlab.com';

    if (payload.type === 'new_application') {
      const subject = `New application: ${payload.applicantName} — ${payload.roleInterest}`;
      const html = `
        <p><strong>${payload.applicantName}</strong> applied for <strong>${payload.roleInterest}</strong>.</p>
        <p>Email: ${payload.applicantEmail}</p>
        <p>Review in admin: /admin/careers/${payload.applicationId ?? ''}</p>
      `;
      const team = await sendResendEmail(notifyInbox, subject, html);
      return new Response(JSON.stringify({ ok: true, team }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payload.type === 'status_update') {
      const subject = `Maylet XLab application update — ${payload.status}`;
      const html = `
        <p>Hi ${payload.applicantName},</p>
        <p>Your application for <strong>${payload.roleInterest}</strong> is now <strong>${payload.status}</strong>.</p>
        <p>Thank you for your interest in Maylet XLab.</p>
      `;
      const applicant = await sendResendEmail(payload.applicantEmail, subject, html);
      return new Response(JSON.stringify({ ok: true, applicant }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown notification type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
