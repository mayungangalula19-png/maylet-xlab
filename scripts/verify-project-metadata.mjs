/**
 * Verify projects.metadata column exists on remote Supabase.
 * Run: node --env-file=.env scripts/verify-project-metadata.mjs
 */

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
  console.error('Run: node --env-file=.env scripts/verify-project-metadata.mjs');
  process.exit(1);
}

const endpoint = `${url.replace(/\/$/, '')}/rest/v1/projects?select=id,metadata&limit=1`;

const res = await fetch(endpoint, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
  },
});

const body = await res.text();

if (!res.ok) {
  if (/metadata/i.test(body) && /column|schema cache|42703|PGRST/i.test(body)) {
    console.log('STATUS: migration NOT applied');
    console.log('The projects.metadata column is missing.');
    console.log('');
    console.log('Apply in Supabase Dashboard → SQL Editor:');
    console.log('  supabase/migrations/20240612000017_project_workspace_metadata.sql');
    process.exit(2);
  }
  console.error('STATUS: check failed');
  console.error(`HTTP ${res.status}: ${body.slice(0, 400)}`);
  process.exit(1);
}

let rows;
try {
  rows = JSON.parse(body);
} catch {
  console.error('STATUS: unexpected response');
  console.error(body.slice(0, 400));
  process.exit(1);
}

const sample = rows[0];
console.log('STATUS: migration applied');
console.log(`projects.metadata is queryable (${rows.length} row(s) sampled).`);
if (sample?.metadata && typeof sample.metadata === 'object') {
  const keys = Object.keys(sample.metadata);
  console.log(`Sample metadata keys: ${keys.length ? keys.join(', ') : '(empty object)'}`);
} else {
  console.log('Sample metadata: {} (default — ready for control center saves)');
}
