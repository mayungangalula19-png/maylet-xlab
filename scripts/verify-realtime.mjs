/**
 * Verify Supabase Realtime subscription for control-center tables.
 * Run (Windows SSL): $env:NODE_OPTIONS="--use-system-ca"; node --env-file=.env scripts/verify-realtime.mjs
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const supabase = createClient(url, key);
const TABLES = [
  'projects',
  'activities',
  'prototypes',
  'experiments',
  'validations',
  'funding_pitches',
  'documents',
];

function subscribeOnce(table) {
  return new Promise((resolve) => {
    const channel = supabase
      .channel(`verify_rt_${table}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {}
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          void supabase.removeChannel(channel);
          resolve({ table, ok: true });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          void supabase.removeChannel(channel);
          resolve({ table, ok: false, error: err?.message ?? status });
        }
      });

    setTimeout(() => {
      void supabase.removeChannel(channel);
      resolve({ table, ok: false, error: 'timeout (10s)' });
    }, 10000);
  });
}

console.log('Checking Realtime subscriptions…');

const results = await Promise.all(TABLES.map((table) => subscribeOnce(table)));

const failed = results.filter((r) => !r.ok);
const passed = results.filter((r) => r.ok);

for (const r of passed) {
  console.log(`  OK  ${r.table}`);
}

for (const r of failed) {
  console.log(`  FAIL ${r.table} — ${r.error}`);
}

if (failed.length === 0) {
  console.log('\nSTATUS: Realtime enabled for all control-center tables.');
  process.exit(0);
}

console.log('\nSTATUS: Realtime not fully enabled.');
console.log('Apply in Supabase Dashboard → SQL Editor:');
console.log('  supabase/migrations/20240612000018_project_control_center_realtime.sql');
process.exit(2);
