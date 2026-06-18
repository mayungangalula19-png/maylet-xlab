-- Allow admins to update any profile (status, role, plan) for Admin Users operations center.
-- Run after fix-profiles-admin-columns.sql if activate/suspend/role changes fail with RLS errors.

DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

NOTIFY pgrst, 'reload schema';

SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'UPDATE'
ORDER BY policyname;
