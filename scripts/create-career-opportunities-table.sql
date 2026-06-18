-- Career opportunities admin table — run entire file in Supabase SQL Editor.
-- Same as supabase/migrations/20250617000005_career_opportunities.sql

DO $$ BEGIN
  CREATE TYPE public.career_opportunity_type AS ENUM (
    'job', 'internship', 'fellowship', 'research_opportunity',
    'hackathon', 'innovation_challenge', 'mentorship_program'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.career_opportunity_status AS ENUM (
    'draft', 'published', 'closed', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.career_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 2),
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  type public.career_opportunity_type NOT NULL DEFAULT 'job',
  department TEXT NOT NULL DEFAULT 'Engineering',
  location TEXT NOT NULL DEFAULT 'Remote',
  is_remote BOOLEAN NOT NULL DEFAULT true,
  status public.career_opportunity_status NOT NULL DEFAULT 'draft',
  requirements TEXT NOT NULL DEFAULT '',
  benefits TEXT NOT NULL DEFAULT '',
  application_deadline TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_opportunities_status ON public.career_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_career_opportunities_type ON public.career_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_career_opportunities_department ON public.career_opportunities(department);
CREATE INDEX IF NOT EXISTS idx_career_opportunities_created ON public.career_opportunities(created_at DESC);

ALTER TABLE public.career_applications
  ADD COLUMN IF NOT EXISTS career_id UUID REFERENCES public.career_opportunities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_career_applications_career ON public.career_applications(career_id);

ALTER TABLE public.career_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "career_opportunities_published_select" ON public.career_opportunities;
CREATE POLICY "career_opportunities_published_select" ON public.career_opportunities
  FOR SELECT TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS "career_opportunities_admin_select" ON public.career_opportunities;
CREATE POLICY "career_opportunities_admin_select" ON public.career_opportunities
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "career_opportunities_admin_insert" ON public.career_opportunities;
CREATE POLICY "career_opportunities_admin_insert" ON public.career_opportunities
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "career_opportunities_admin_update" ON public.career_opportunities;
CREATE POLICY "career_opportunities_admin_update" ON public.career_opportunities
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "career_opportunities_admin_delete" ON public.career_opportunities;
CREATE POLICY "career_opportunities_admin_delete" ON public.career_opportunities
  FOR DELETE TO authenticated USING (public.is_admin());

GRANT SELECT ON public.career_opportunities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.career_opportunities TO authenticated;
