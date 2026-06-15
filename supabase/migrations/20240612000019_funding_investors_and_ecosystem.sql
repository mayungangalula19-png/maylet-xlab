-- Sprint 2: Funding investor matching + Ecosystem (hackathons, mentorship, learning)
-- Tables referenced by FundingHubPage, Hackathons, Mentorship, LearningHub

-- ---------------------------------------------------------------------------
-- Funding pitch columns used by FundingHub UI (idempotent)
-- ---------------------------------------------------------------------------
ALTER TABLE public.funding_pitches
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS equity_offered NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pitch_deck_url TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'Technology',
  ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'idea';

-- Backfill from legacy columns only when they exist (remote schemas vary)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'funding_pitches' AND column_name = 'summary'
  ) THEN
    EXECUTE $sql$
      UPDATE public.funding_pitches
      SET description = COALESCE(description, summary)
      WHERE description IS NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'funding_pitches' AND column_name = 'amount_sought'
  ) THEN
    EXECUTE $sql$
      UPDATE public.funding_pitches
      SET amount = COALESCE(amount, amount_sought)
      WHERE amount IS NULL
    $sql$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.investor_type AS ENUM ('angel', 'vc', 'grant', 'accelerator');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.pitch_application_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.hackathon_status AS ENUM ('upcoming', 'ongoing', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.hackathon_mode AS ENUM ('online', 'offline', 'hybrid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.mentorship_request_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.mentorship_session_status AS ENUM ('upcoming', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.learning_resource_type AS ENUM ('course', 'video', 'article', 'workshop');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.skill_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Investors & pitch applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.investor_type NOT NULL DEFAULT 'angel',
  focus_industries TEXT[] NOT NULL DEFAULT '{}',
  investment_range_min NUMERIC(14, 2) NOT NULL DEFAULT 0,
  investment_range_max NUMERIC(14, 2) NOT NULL DEFAULT 1000000,
  description TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  website TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investors_focus_industries ON public.investors USING GIN (focus_industries);
CREATE INDEX IF NOT EXISTS idx_investors_active ON public.investors(is_active);

CREATE TABLE IF NOT EXISTS public.pitch_investor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id UUID NOT NULL REFERENCES public.funding_pitches(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  status public.pitch_application_status NOT NULL DEFAULT 'pending',
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pitch_id, investor_id)
);

CREATE INDEX IF NOT EXISTS idx_pitch_apps_pitch ON public.pitch_investor_applications(pitch_id);
CREATE INDEX IF NOT EXISTS idx_pitch_apps_investor ON public.pitch_investor_applications(investor_id);

-- ---------------------------------------------------------------------------
-- Hackathons
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  mode public.hackathon_mode NOT NULL DEFAULT 'online',
  location TEXT,
  prize_pool NUMERIC(14, 2) NOT NULL DEFAULT 0,
  max_participants INTEGER,
  registered_count INTEGER NOT NULL DEFAULT 0,
  status public.hackathon_status NOT NULL DEFAULT 'upcoming',
  image_url TEXT,
  organizer TEXT NOT NULL DEFAULT 'Maylet X Lab',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hackathons_status ON public.hackathons(status);
CREATE INDEX IF NOT EXISTS idx_hackathons_start ON public.hackathons(start_date);

CREATE TABLE IF NOT EXISTS public.hackathon_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hackathon_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_hackathon_reg_user ON public.hackathon_registrations(user_id);

CREATE OR REPLACE FUNCTION public.increment_hackathon_registrations(hackathon_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.hackathons
  SET registered_count = registered_count + 1,
      updated_at = NOW()
  WHERE id = hackathon_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_hackathon_registrations(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Mentorship
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  title TEXT NOT NULL DEFAULT 'Innovation Mentor',
  expertise TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT NOT NULL DEFAULT '',
  years_experience INTEGER NOT NULL DEFAULT 0,
  hourly_rate NUMERIC(10, 2),
  rating NUMERIC(3, 2) NOT NULL DEFAULT 4.5,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentors_active ON public.mentors(is_active);

CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status public.mentorship_request_status NOT NULL DEFAULT 'pending',
  requested_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentorship_requests_user ON public.mentorship_requests(user_id);

CREATE TABLE IF NOT EXISTS public.mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.mentorship_requests(id) ON DELETE SET NULL,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  meeting_link TEXT,
  status public.mentorship_session_status NOT NULL DEFAULT 'upcoming',
  feedback TEXT,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_user ON public.mentorship_sessions(user_id);

-- ---------------------------------------------------------------------------
-- Learning hub
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type public.learning_resource_type NOT NULL DEFAULT 'course',
  skill_level public.skill_level NOT NULL DEFAULT 'beginner',
  duration TEXT NOT NULL DEFAULT '1 hour',
  thumbnail_url TEXT,
  url TEXT NOT NULL DEFAULT '#',
  author TEXT NOT NULL DEFAULT 'Maylet X Lab',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_resources_type ON public.learning_resources(type);

CREATE TABLE IF NOT EXISTS public.user_learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.learning_resources(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON public.user_learning_progress(user_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_investor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_progress ENABLE ROW LEVEL SECURITY;

-- Investors: catalog readable by authenticated users
DROP POLICY IF EXISTS "investors_select_authenticated" ON public.investors;
CREATE POLICY "investors_select_authenticated" ON public.investors
  FOR SELECT TO authenticated
  USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "investors_admin_all" ON public.investors;
CREATE POLICY "investors_admin_all" ON public.investors
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Pitch applications: pitch owner only
DROP POLICY IF EXISTS "pitch_apps_select_owner" ON public.pitch_investor_applications;
CREATE POLICY "pitch_apps_select_owner" ON public.pitch_investor_applications
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.funding_pitches fp
      WHERE fp.id = pitch_id AND fp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pitch_apps_insert_owner" ON public.pitch_investor_applications;
CREATE POLICY "pitch_apps_insert_owner" ON public.pitch_investor_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.funding_pitches fp
      WHERE fp.id = pitch_id AND fp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pitch_apps_delete_owner" ON public.pitch_investor_applications;
CREATE POLICY "pitch_apps_delete_owner" ON public.pitch_investor_applications
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.funding_pitches fp
      WHERE fp.id = pitch_id AND fp.user_id = auth.uid()
    )
  );

-- Hackathons: public catalog
DROP POLICY IF EXISTS "hackathons_select_all" ON public.hackathons;
CREATE POLICY "hackathons_select_all" ON public.hackathons
  FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "hackathons_admin_write" ON public.hackathons;
CREATE POLICY "hackathons_admin_write" ON public.hackathons
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "hackathon_reg_own" ON public.hackathon_registrations;
CREATE POLICY "hackathon_reg_own" ON public.hackathon_registrations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Mentors
DROP POLICY IF EXISTS "mentors_select_active" ON public.mentors;
CREATE POLICY "mentors_select_active" ON public.mentors
  FOR SELECT TO authenticated
  USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "mentors_admin_write" ON public.mentors;
CREATE POLICY "mentors_admin_write" ON public.mentors
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "mentorship_requests_own" ON public.mentorship_requests;
CREATE POLICY "mentorship_requests_own" ON public.mentorship_requests
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "mentorship_sessions_own" ON public.mentorship_sessions;
CREATE POLICY "mentorship_sessions_own" ON public.mentorship_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "mentorship_sessions_admin_write" ON public.mentorship_sessions;
CREATE POLICY "mentorship_sessions_admin_write" ON public.mentorship_sessions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Learning
DROP POLICY IF EXISTS "learning_resources_select" ON public.learning_resources;
CREATE POLICY "learning_resources_select" ON public.learning_resources
  FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "learning_resources_admin_write" ON public.learning_resources;
CREATE POLICY "learning_resources_admin_write" ON public.learning_resources
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "learning_progress_own" ON public.user_learning_progress;
CREATE POLICY "learning_progress_own" ON public.user_learning_progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

GRANT SELECT ON public.investors TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.pitch_investor_applications TO authenticated;
GRANT SELECT ON public.hackathons TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.hackathon_registrations TO authenticated;
GRANT SELECT ON public.mentors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_requests TO authenticated;
GRANT SELECT ON public.mentorship_sessions TO authenticated;
GRANT SELECT ON public.learning_resources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_learning_progress TO authenticated;

-- Realtime (Funding Hub + Hackathons pages)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['pitch_investor_applications', 'hackathons'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Seed catalog data (idempotent) — dollar-quoted text avoids parser edge cases
-- ---------------------------------------------------------------------------
INSERT INTO public.investors (name, type, focus_industries, investment_range_min, investment_range_max, description, website, contact_email)
SELECT name, type, focus_industries, investment_range_min, investment_range_max, description, website, contact_email
FROM (VALUES
  ('Horizon Angel Network', 'angel'::public.investor_type, ARRAY['Technology', 'HealthTech']::text[], 25000::numeric, 250000::numeric, $desc$Early-stage angels backing technical founders in Africa and diaspora markets.$desc$, 'https://example.com/horizon', 'deals@horizon.example'),
  ('Nexus Venture Partners', 'vc'::public.investor_type, ARRAY['Technology', 'FinTech', 'AgriTech']::text[], 500000::numeric, 5000000::numeric, $desc$Series A-B fund focused on scalable innovation platforms.$desc$, 'https://example.com/nexus', 'pitch@nexus.example'),
  ('Innovate Africa Grants', 'grant'::public.investor_type, ARRAY['AgriTech', 'Education', 'Environment']::text[], 10000::numeric, 150000::numeric, $desc$Non-dilutive grants for social-impact prototypes with validation evidence.$desc$, 'https://example.com/grants', 'apply@grants.example'),
  ('LaunchPad Accelerator', 'accelerator'::public.investor_type, ARRAY['Technology', 'HealthTech', 'FinTech']::text[], 50000::numeric, 500000::numeric, $desc$12-week accelerator with mentorship and demo-day investor intros.$desc$, 'https://example.com/launchpad', 'hello@launchpad.example')
) AS v(name, type, focus_industries, investment_range_min, investment_range_max, description, website, contact_email)
WHERE NOT EXISTS (SELECT 1 FROM public.investors LIMIT 1);

INSERT INTO public.hackathons (title, description, start_date, end_date, mode, location, prize_pool, max_participants, status, organizer)
SELECT title, description, start_date, end_date, mode, location, prize_pool, max_participants, status, organizer
FROM (VALUES
  (
    'Maylet Innovation Sprint 2026',
    $desc$Build and validate a minimum viable prototype in 48 hours across health, climate, and education tracks.$desc$,
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '16 days',
    'hybrid'::public.hackathon_mode,
    'Nairobi + Online',
    25000::numeric,
    200,
    'upcoming'::public.hackathon_status,
    'Maylet X Lab'
  ),
  (
    'AI for Good Hackathon',
    $desc$Apply responsible AI to real community problems with mentorship from industry experts.$desc$,
    NOW() + INTERVAL '45 days',
    NOW() + INTERVAL '47 days',
    'online'::public.hackathon_mode,
    NULL::text,
    15000::numeric,
    500,
    'upcoming'::public.hackathon_status,
    'Maylet Ecosystem'
  )
) AS v(title, description, start_date, end_date, mode, location, prize_pool, max_participants, status, organizer)
WHERE NOT EXISTS (SELECT 1 FROM public.hackathons LIMIT 1);

INSERT INTO public.mentors (full_name, title, expertise, bio, years_experience, hourly_rate, rating, total_sessions)
SELECT full_name, title, expertise, bio, years_experience, hourly_rate, rating, total_sessions
FROM (VALUES
  ('Dr. Amara Okafor', 'Product and PMF Strategist', ARRAY['Product', 'Validation', 'Funding']::text[], $bio$Former startup PM helping founders turn experiments into investor-ready narratives.$bio$, 12, 120::numeric, 4.9::numeric, 86),
  ('James Chen', 'Deep Tech and Prototype Coach', ARRAY['AI', 'Prototype', 'Research']::text[], $bio$Engineering lead supporting MVP builds and technical de-risking before investor conversations.$bio$, 15, 150::numeric, 4.8::numeric, 64),
  ('Priya Nair', 'Go-to-Market Mentor', ARRAY['Commercialization', 'Funding', 'Marketing']::text[], $bio$Scaled two B2B SaaS products from pilot to regional launch across emerging markets.$bio$, 10, 100::numeric, 4.7::numeric, 52)
) AS v(full_name, title, expertise, bio, years_experience, hourly_rate, rating, total_sessions)
WHERE NOT EXISTS (SELECT 1 FROM public.mentors LIMIT 1);

INSERT INTO public.learning_resources (title, description, type, skill_level, duration, url, author, tags)
SELECT title, description, type, skill_level, duration, url, author, tags
FROM (VALUES
  ('Innovation Lifecycle Playbook', $desc$Step-by-step guide from idea capture through commercialization gates.$desc$, 'course'::public.learning_resource_type, 'beginner'::public.skill_level, '3 hours', '/resources/guide', 'Maylet X Lab', ARRAY['lifecycle', 'framework']::text[]),
  ('Running Your First Experiment', $desc$Design hypotheses, metrics, and decision rules for validation experiments.$desc$, 'video'::public.learning_resource_type, 'intermediate'::public.skill_level, '45 min', '/resources/videos', 'Maylet Academy', ARRAY['experiment', 'validation']::text[]),
  ('Pitch Deck Essentials', $desc$Structure investor-ready narratives with evidence from validation and prototypes.$desc$, 'article'::public.learning_resource_type, 'intermediate'::public.skill_level, '20 min', '/blog', 'Funding Team', ARRAY['funding', 'pitch']::text[]),
  ('Prototype Testing Workshop', $desc$Live workshop on usability testing and iteration loops.$desc$, 'workshop'::public.learning_resource_type, 'advanced'::public.skill_level, '2 hours', '/resources/webinars', 'Prototype Lab', ARRAY['prototype', 'testing']::text[]),
  ('MAYA Prompt Library for Innovators', $desc$Curated prompts for research synthesis, experiment design, and funding readiness.$desc$, 'article'::public.learning_resource_type, 'beginner'::public.skill_level, '15 min', '/resources/prompts', 'MAYA Team', ARRAY['ai', 'prompts']::text[])
) AS v(title, description, type, skill_level, duration, url, author, tags)
WHERE NOT EXISTS (SELECT 1 FROM public.learning_resources LIMIT 1);
