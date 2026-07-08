// Quick script to check the actual column type and profile data
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sign in first
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'admintest@gmail.com',
  password: 'augustinera',
});

if (authError) {
  console.error('Sign-in failed:', authError.message);
  process.exit(1);
}

console.log('Signed in as:', authData.user.id);

// Try a raw select with explicit cast to text to avoid enum issues
console.log('\n--- Trying raw query via PostgREST ---');

// Try selecting just id and email (no role column) to see if the profile exists
const { data: basicProfile, error: basicError } = await supabase
  .from('profiles')
  .select('id, email, full_name, created_at')
  .eq('id', authData.user.id)
  .maybeSingle();

if (basicError) {
  console.error('Basic profile query failed:', basicError.message, basicError.code);
} else {
  console.log('Basic profile (without role):', JSON.stringify(basicProfile, null, 2));
}

// Now try selecting with role
const { data: roleProfile, error: roleError } = await supabase
  .from('profiles')
  .select('id, role')
  .eq('id', authData.user.id)
  .maybeSingle();

if (roleError) {
  console.error('Role query failed:', roleError.message, roleError.code);
  console.error('Full error:', JSON.stringify(roleError, null, 2));
} else {
  console.log('Profile with role:', JSON.stringify(roleProfile, null, 2));
}

// Try an RPC that's simpler
console.log('\n--- Trying simple RPC ---');
const { data: rpcData, error: rpcErr } = await supabase.rpc('ensure_profile', { p_full_name: 'Admin Test' });
if (rpcErr) {
  console.error('ensure_profile failed:', rpcErr.message, rpcErr.code);
} else {
  console.log('ensure_profile result:', JSON.stringify(rpcData, null, 2));
}

await supabase.auth.signOut();
