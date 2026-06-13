-- Quick fix: career application RLS (run in Supabase SQL Editor if apply form shows permission errors)
-- Safe to re-run.

DROP POLICY IF EXISTS "career_applications_insert" ON public.career_applications;
CREATE POLICY "career_applications_insert" ON public.career_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL
    OR user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "career_applications_select" ON public.career_applications;
CREATE POLICY "career_applications_select" ON public.career_applications
  FOR SELECT
  TO authenticated
  USING (
    (user_id IS NOT NULL AND user_id = (SELECT auth.uid()))
    OR public.is_admin()
  );

GRANT INSERT ON public.career_applications TO anon, authenticated;
GRANT SELECT, UPDATE ON public.career_applications TO authenticated;

-- Storage (resume upload)
DROP POLICY IF EXISTS "career_resumes_insert" ON storage.objects;
CREATE POLICY "career_resumes_insert" ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'career-resumes');
