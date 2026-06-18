-- Mentor Operations Center: assignments, feedback, activity, column extensions

ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS last_session_at TIMESTAMPTZ;

-- Ensure updated_at exists (some remote schemas predate this column)
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN
  ALTER TYPE public.mentorship_session_status ADD VALUE IF NOT EXISTS 'missed';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.mentorship_session_status ADD VALUE IF NOT EXISTS 'rescheduled';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.mentorship_sessions
  ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS outcome TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.mentor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  innovator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  progress_status TEXT NOT NULL DEFAULT 'active',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mentor_id, innovator_id)
);

CREATE TABLE IF NOT EXISTS public.mentor_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  innovator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mentor_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_assignments_mentor ON public.mentor_assignments(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_innovator ON public.mentor_assignments(innovator_id);
CREATE INDEX IF NOT EXISTS idx_mentor_feedback_mentor ON public.mentor_feedback(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_activity_created ON public.mentor_activity_logs(created_at DESC);

ALTER TABLE public.mentor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentor_assignments_admin" ON public.mentor_assignments;
CREATE POLICY "mentor_assignments_admin" ON public.mentor_assignments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "mentor_feedback_admin" ON public.mentor_feedback;
CREATE POLICY "mentor_feedback_admin" ON public.mentor_feedback
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "mentor_activity_admin" ON public.mentor_activity_logs;
CREATE POLICY "mentor_activity_admin" ON public.mentor_activity_logs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_activity_logs TO authenticated;

-- Admin ops need write access on core mentorship tables (RLS still enforces is_admin())
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_requests TO authenticated;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'mentors', 'mentorship_requests', 'mentorship_sessions',
    'mentor_assignments', 'mentor_feedback', 'mentor_activity_logs'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
