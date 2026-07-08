// Quick script to check and fix admin role for a user in the production database.
// Usage: node --env-file=.env scripts/fix-admin-role.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TARGET_EMAIL = 'admintest@gmail.com';
const TARGET_PASSWORD = 'augustinera';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase:', SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Step 1: Sign in as the user
console.log(`\n📧 Signing in as: ${TARGET_EMAIL}`);
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: TARGET_EMAIL,
  password: TARGET_PASSWORD,
});

if (authError) {
  console.error('❌ Sign-in failed:', authError.message);
  console.error('   Full error:', JSON.stringify(authError, null, 2));
  process.exit(1);
}

const userId = authData.user.id;
console.log('✅ Signed in! User ID:', userId);
console.log('   Email:', authData.user.email);

// Step 2: Check the current profile
console.log('\n📋 Checking profiles table...');
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, email, role, full_name, created_at')
  .eq('id', userId)
  .maybeSingle();

if (profileError) {
  console.error('❌ Profile query failed:', profileError.message);
  console.error('   Code:', profileError.code);
  console.error('   Details:', profileError.details);
  console.error('   Hint:', profileError.hint);
} else if (!profile) {
  console.warn('⚠️  No profile row found for this user!');
  console.log('   The profile may not have been created. Trying ensure_profile RPC...');
  
  const { data: ensured, error: ensureErr } = await supabase.rpc('ensure_profile', {
    p_full_name: 'Admin Test',
  });
  
  if (ensureErr) {
    console.error('❌ ensure_profile RPC failed:', ensureErr.message);
  } else {
    console.log('   ensure_profile result:', JSON.stringify(ensured, null, 2));
  }
} else {
  console.log('✅ Profile found:');
  console.log('   ID:', profile.id);
  console.log('   Email:', profile.email);
  console.log('   Role:', profile.role);
  console.log('   Full Name:', profile.full_name);
  console.log('   Created At:', profile.created_at);
}

// Step 3: Try get_my_role RPC
console.log('\n🔍 Testing get_my_role() RPC...');
const { data: rpcRole, error: rpcError } = await supabase.rpc('get_my_role');

if (rpcError) {
  console.error('❌ get_my_role RPC failed:', rpcError.message);
} else {
  console.log('   get_my_role() returned:', rpcRole);
}

// Step 4: Try updating to admin (this will fail via anon key due to protect_profile_role trigger)
console.log('\n⚠️  The role cannot be changed via the anon key (protected by trigger).');
console.log('   To set admin role, go to Supabase Dashboard → SQL Editor and run:');
console.log('');
console.log(`   UPDATE public.profiles SET role = 'admin' WHERE id = '${userId}';`);
console.log('');

await supabase.auth.signOut();
console.log('Done.');
