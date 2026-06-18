-- Run in Supabase SQL Editor if /admin/experiments fails to load.
-- Run ONE block at a time if you hit deadlocks; then NOTIFY reload.

-- 1) Ensure experiments table + core columns exist
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT,
  hypothesis TEXT NOT NULL DEFAULT 'Untitled hypothesis',
  type TEXT,
  status TEXT DEFAULT 'draft',
  results TEXT,
  findings TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.experiments ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.experiments ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.experiments ADD COLUMN IF NOT EXISTS results TEXT;
ALTER TABLE public.experiments ADD COLUMN IF NOT EXISTS findings TEXT;
ALTER TABLE public.experiments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2) RLS + admin read access
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "experiments_own" ON public.experiments;
CREATE POLICY "experiments_own" ON public.experiments
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "admin_experiments_select" ON public.experiments;
CREATE POLICY "admin_experiments_select" ON public.experiments
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- 3) Grants for PostgREST
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiments TO service_role;

-- 4) Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 5) Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'experiments'
ORDER BY ordinal_position;

SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'experiments';
