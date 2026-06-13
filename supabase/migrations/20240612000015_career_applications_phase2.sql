-- Career applications Phase 2 — resume storage, reviewer notes, admin notifications trigger
-- Safe to re-run.

ALTER TABLE public.career_applications
  ADD COLUMN IF NOT EXISTS resume_path TEXT,
  ADD COLUMN IF NOT EXISTS resume_file_name TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Private bucket for resumes (5 MB, PDF/DOC/DOCX)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'career-resumes',
  'career-resumes',
  false,
  5242880,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "career_resumes_insert" ON storage.objects;
CREATE POLICY "career_resumes_insert" ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'career-resumes');

DROP POLICY IF EXISTS "career_resumes_admin_select" ON storage.objects;
CREATE POLICY "career_resumes_admin_select" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'career-resumes' AND public.is_admin());

DROP POLICY IF EXISTS "career_resumes_admin_delete" ON storage.objects;
CREATE POLICY "career_resumes_admin_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'career-resumes' AND public.is_admin());

-- Notify admins when a new application is submitted (works for anon inserts)
CREATE OR REPLACE FUNCTION public.notify_admins_new_career_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT
    p.id,
    'New career application',
    NEW.full_name || ' applied for ' || NEW.role_interest,
    'career_application',
    '/admin/careers/' || NEW.id::text
  FROM public.profiles p
  WHERE p.role::text IN ('admin', 'super_admin');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_career_application_admin_notify ON public.career_applications;
CREATE TRIGGER trg_career_application_admin_notify
  AFTER INSERT ON public.career_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_career_application();

GRANT EXECUTE ON FUNCTION public.notify_admins_new_career_application() TO authenticated, anon;
