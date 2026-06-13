-- Career applications — copy ALL of this file, paste in Supabase SQL Editor, click RUN once.
-- Enables /careers application form (including resume upload).
-- Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS).

DO $$ BEGIN
  CREATE TYPE public.career_application_status AS ENUM (
    'pending', 'reviewing', 'shortlisted', 'rejected', 'accepted'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.career_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  email TEXT NOT NULL CHECK (char_length(trim(email)) >= 5),
  role_interest TEXT NOT NULL CHECK (char_length(trim(role_interest)) >= 2),
  skills TEXT NOT NULL CHECK (char_length(trim(skills)) >= 2),
  portfolio TEXT NOT NULL DEFAULT 'N/A' CHECK (char_length(trim(portfolio)) >= 2),
  status public.career_application_status NOT NULL DEFAULT 'pending',
  maya_match_snapshot JSONB,
  resume_path TEXT,
  resume_file_name TEXT,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add phase-2 columns if table already existed from an older script
ALTER TABLE public.career_applications
  ADD COLUMN IF NOT EXISTS resume_path TEXT,
  ADD COLUMN IF NOT EXISTS resume_file_name TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_career_applications_status ON public.career_applications(status);
CREATE INDEX IF NOT EXISTS idx_career_applications_email ON public.career_applications(email);
CREATE INDEX IF NOT EXISTS idx_career_applications_created ON public.career_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_applications_user ON public.career_applications(user_id);

ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "career_applications_admin_select" ON public.career_applications;

DROP POLICY IF EXISTS "career_applications_admin_update" ON public.career_applications;
CREATE POLICY "career_applications_admin_update" ON public.career_applications
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT INSERT ON public.career_applications TO anon, authenticated;
GRANT SELECT, UPDATE ON public.career_applications TO authenticated;

-- Resume storage bucket (optional file upload on /careers)
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

-- Admin in-app notification (never blocks applicant insert)
CREATE OR REPLACE FUNCTION public.notify_admins_new_career_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_career_application_admin_notify ON public.career_applications;
CREATE TRIGGER trg_career_application_admin_notify
  AFTER INSERT ON public.career_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_career_application();

GRANT EXECUTE ON FUNCTION public.notify_admins_new_career_application() TO authenticated, anon;
