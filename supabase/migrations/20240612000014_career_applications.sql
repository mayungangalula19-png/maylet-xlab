-- Career applications — public apply form at /careers

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

DROP POLICY IF EXISTS "career_applications_admin_update" ON public.career_applications;
CREATE POLICY "career_applications_admin_update" ON public.career_applications
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT INSERT ON public.career_applications TO anon, authenticated;
GRANT SELECT, UPDATE ON public.career_applications TO authenticated;
