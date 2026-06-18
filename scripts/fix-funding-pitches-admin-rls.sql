-- Run in Supabase SQL Editor if /admin/funding returns empty or permission errors.

DROP POLICY IF EXISTS "admin_funding_pitches" ON public.funding_pitches;
CREATE POLICY "admin_funding_pitches" ON public.funding_pitches
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_pitch_investor_applications" ON public.pitch_investor_applications;
CREATE POLICY "admin_pitch_investor_applications" ON public.pitch_investor_applications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('funding_pitches', 'pitch_investor_applications')
ORDER BY tablename, policyname;
