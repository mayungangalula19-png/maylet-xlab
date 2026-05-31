// Embeds document text into ai_memories (placeholder — wire OpenAI embeddings in production)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { user_id, project_id, title, content } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabase.from('ai_memories').insert({
    user_id,
    project_id,
    memory_type: 'document_chunk',
    title,
    content,
    metadata: { embedded: false, note: 'Enable pgvector + OpenAI for vectors' },
  }).select().single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ memory: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
