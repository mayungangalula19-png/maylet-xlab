// Cron-invoked: create proactive MAYA alerts for stalled projects
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: stale } = await supabase
    .from('projects')
    .select('id, user_id, name, updated_at')
    .lt('updated_at', weekAgo)
    .limit(50);

  for (const p of stale ?? []) {
    await supabase.from('maya_alerts').insert({
      user_id: p.user_id,
      project_id: p.id,
      alert_type: 'stalled_project',
      title: 'Project may need attention',
      message: `"${p.name}" has not been updated in 7+ days. Open MAYA for a pivot plan.`,
      severity: 'warning',
    });
  }

  return new Response(JSON.stringify({ processed: stale?.length ?? 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
