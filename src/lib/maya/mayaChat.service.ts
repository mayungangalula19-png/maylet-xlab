import { supabase } from '../supabase/client';

export interface MayaChatMessage {
  role: string;
  content: string;
}

/**
 * MAYA chat — Supabase Edge Function only (no client-side API keys).
 */
export async function invokeMayaChat(
  messages: MayaChatMessage[],
  model = 'groq'
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('maya-chat', {
    body: { messages, model },
  });

  if (!error && data && !data.error) {
    const content = data.choices?.[0]?.message?.content as string | undefined;
    if (content) return content;
  }

  const edgeMsg =
    error?.message ??
    (typeof data?.error === 'string' ? data.error : null) ??
    'maya-chat Edge Function is not available';

  throw new Error(
    `${edgeMsg}. Deploy with: supabase functions deploy maya-chat && supabase secrets set GROQ_API_KEY=your-key`
  );
}
