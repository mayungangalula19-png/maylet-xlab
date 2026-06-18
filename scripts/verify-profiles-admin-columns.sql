-- Verify Admin Users prerequisites after fix-profiles-admin-columns.sql

-- 1) Required columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('status', 'last_active', 'plan', 'role', 'email', 'two_factor_enabled', 'organization_name')
ORDER BY column_name;

-- 2) Admin can read all profiles (policy check — run while signed in as admin in app, or use service role)
SELECT COUNT(*) AS profile_count FROM public.profiles;

-- 3) Sample rows for Admin Users UI
SELECT id, full_name, email, role, plan, status, last_active, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- 4) RLS policies on profiles
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- 5) is_admin() helper exists
SELECT proname FROM pg_proc WHERE proname = 'is_admin' AND pronamespace = 'public'::regnamespace;
