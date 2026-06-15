import { supabase } from '../supabase/client';

export interface MayaChatMessage {
  role: string;
  content: string;
}

const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function callGroqDirect(messages: MayaChatMessage[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error('VITE_GROQ_API_KEY is not set in .env');
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
    }),
  });

  const data = (await res.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    throw new Error(data.error?.message ?? `Groq API error (${res.status})`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq API returned no content');
  return content;
}

/**
 * MAYA chat: prefers Supabase Edge Function (keys stay server-side).
 * Falls back to direct Groq when the function is not deployed and VITE_GROQ_API_KEY is set.
 */
export async function invokeMayaChat(
  messages: MayaChatMessage[],
  model = 'groq'
): Promise<string> {
  const groqKey = import.meta.env.VITE_GROQ_API_KEY?.trim();

  if (groqKey && import.meta.env.DEV) {
    return callGroqDirect(messages);
  }

  let edgeError: Error | null = null;
  let edgeData: { error?: string; choices?: Array<{ message?: { content?: string } }> } | null = null;

  try {
    const { data, error } = await supabase.functions.invoke('maya-chat', {
      body: { messages, model },
    });
    edgeData = data;
    if (!error && data && !data.error) {
      const content = data.choices?.[0]?.message?.content as string | undefined;
      if (content) return content;
    }
    if (error) {
      edgeError = new Error(error.message);
    } else if (data?.error) {
      edgeError = new Error(typeof data.error === 'string' ? data.error : 'Edge function error');
    }
  } catch (err) {
    edgeError = err instanceof Error ? err : new Error(String(err));
  }

  if (groqKey) {
    try {
      return await callGroqDirect(messages);
    } catch (directErr) {
      const directMsg = directErr instanceof Error ? directErr.message : String(directErr);
      const edgeMsg = edgeError?.message ?? 'maya-chat Edge Function is not deployed';
      throw new Error(
        `${edgeMsg}. Groq fallback failed: ${directMsg}`
      );
    }
  }

  const edgeMsg =
    edgeError?.message ??
    (typeof edgeData?.error === 'string' ? edgeData.error : null) ??
    'maya-chat Edge Function is not deployed';

  throw new Error(
    `${edgeMsg}. For production: deploy \`supabase functions deploy maya-chat\` and run ` +
      `\`supabase secrets set GROQ_API_KEY=your-key\`. For local dev: add VITE_GROQ_API_KEY to .env`
  );
}
