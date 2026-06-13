-- Allow users to insert their own activity rows; admins can insert any
DROP POLICY IF EXISTS "activities_insert_own" ON public.activities;

CREATE POLICY "activities_insert_own" ON public.activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());
