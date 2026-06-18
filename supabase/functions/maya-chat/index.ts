// Supabase Edge Function: secure MAYA chat proxy (JWT required)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAYA_SYSTEM = `You are MAYA, the AI assistant for Maylet XLab — an enterprise innovation operating system.
Help users with research, prototypes, experiments, validation, and funding workflows.
Be precise, professional, and never invent data the user did not provide.`;

const MAX_MESSAGES = 24;
const MAX_CONTENT_LEN = 8000;

interface ChatMessage {
  role: string;
  content: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: 'Invalid or expired session' }, 401);
  }

  try {
    const body = await req.json();
    const rawMessages = (body?.messages ?? []) as ChatMessage[];

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return json({ error: 'messages array required' }, 400);
    }

    const sanitized = rawMessages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
      .slice(-MAX_MESSAGES)
      .map((m) => ({
        role: m.role,
        content: String(m.content ?? '').slice(0, MAX_CONTENT_LEN),
      }));

    if (sanitized.length === 0 || sanitized[sanitized.length - 1]?.role !== 'user') {
      return json({ error: 'Last message must be from user' }, 400);
    }

    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (!groqKey) {
      return json({ error: 'GROQ_API_KEY not configured on server' }, 500);
    }

    const messages = [{ role: 'system', content: MAYA_SYSTEM }, ...sanitized];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    return json(data, res.ok ? 200 : res.status);
  } catch (e) {
    return json({ error: String(e) }, 400);
  }
});
