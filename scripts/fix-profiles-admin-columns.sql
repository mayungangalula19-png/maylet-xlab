-- Run in Supabase SQL Editor if /admin/users returns column errors on profiles.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_name TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type TEXT;

-- Allow admins to update user status/role from Admin Users UI
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Verify columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'email', 'status', 'last_active', 'two_factor_enabled',
    'plan', 'role', 'organization_name', 'user_type'
  )
ORDER BY column_name;
