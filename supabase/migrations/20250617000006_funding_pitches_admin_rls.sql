-- Allow admins to manage all funding pitches (required for /admin/funding).

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

NOTIFY pgrst, 'reload schema';
