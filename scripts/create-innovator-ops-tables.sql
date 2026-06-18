-- Run in Supabase SQL Editor for /admin/innovators IOC Dashboard

DO $$ BEGIN
  CREATE TYPE public.innovator_pipeline_stage AS ENUM (
    'IDEA_SUBMITTED', 'SCREENING', 'TECH_REVIEW', 'BUSINESS_REVIEW', 'APPROVED', 'REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.innovator_review_decision AS ENUM (
    'approve', 'request_revision', 'reject', 'pending'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.innovator_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  idea_title TEXT NOT NULL DEFAULT 'Untitled innovation',
  idea_description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  stage public.innovator_pipeline_stage NOT NULL DEFAULT 'IDEA_SUBMITTED',
  impact_score INTEGER NOT NULL DEFAULT 0,
  feasibility_score INTEGER NOT NULL DEFAULT 0,
  market_score INTEGER NOT NULL DEFAULT 0,
  final_score INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.innovator_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  innovator_id UUID NOT NULL REFERENCES public.innovator_pipeline(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL DEFAULT 'Admin',
  impact_score INTEGER NOT NULL DEFAULT 0,
  feasibility_score INTEGER NOT NULL DEFAULT 0,
  market_score INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  decision public.innovator_review_decision NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.innovator_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  innovator_id UUID NOT NULL REFERENCES public.innovator_pipeline(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.innovator_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.innovator_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.innovator_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "innovator_pipeline_admin" ON public.innovator_pipeline;
CREATE POLICY "innovator_pipeline_admin" ON public.innovator_pipeline
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "innovator_reviews_admin" ON public.innovator_reviews;
CREATE POLICY "innovator_reviews_admin" ON public.innovator_reviews
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "innovator_activity_admin" ON public.innovator_activity_logs;
CREATE POLICY "innovator_activity_admin" ON public.innovator_activity_logs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.innovator_pipeline TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.innovator_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.innovator_activity_logs TO authenticated;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['innovator_pipeline', 'innovator_reviews', 'innovator_activity_logs']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
