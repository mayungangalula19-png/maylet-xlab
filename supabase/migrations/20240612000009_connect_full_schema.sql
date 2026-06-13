-- Connect full project relations: helpers, RLS, research tables, profile role
-- Safe to re-run (idempotent). Paste in Supabase SQL Editor if migrations not synced.

-- ── 1. Enums ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'user', 'innovator', 'mentor', 'investor', 'admin', 'super_admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Drop legacy CHECK on status if present (app sends lowercase enum values)
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM (
    'idea', 'experiment', 'prototype', 'launched', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.literature_type AS ENUM (
    'paper', 'journal', 'white_paper', 'report', 'reference'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.finding_type AS ENUM (
    'finding', 'observation', 'insight', 'conclusion'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Profile columns ─────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'innovator';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- ── 3. Project link columns ────────────────────────────────────
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_teams_project_id ON public.teams(project_id);

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_activities_project_id ON public.activities(project_id);

-- ── 4. Research tables (project children) ──────────────────────
CREATE TABLE IF NOT EXISTS public.research_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_statement TEXT,
  target_users TEXT,
  pain_points TEXT,
  existing_solutions TEXT,
  research_questions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.literature_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  item_type public.literature_type NOT NULL DEFAULT 'paper',
  source TEXT,
  authors TEXT,
  publication_date DATE,
  citation_count INTEGER,
  relevance_score INTEGER,
  url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  finding_type public.finding_type NOT NULL DEFAULT 'finding',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_profiles_project ON public.research_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_project ON public.research_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_literature_items_project ON public.literature_items(project_id);
CREATE INDEX IF NOT EXISTS idx_research_findings_project ON public.research_findings(project_id);

-- ── 5. Security definer helpers (no RLS recursion) ─────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role::text IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_owner(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = p_team_id AND owner_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_team_member(p_project_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.teams t ON t.id = tm.team_id
    WHERE t.project_id = p_project_id
      AND tm.user_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_team_owner(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_project_team_member(UUID, UUID) TO authenticated, anon;

-- ── 6. RLS: teams + team_members + projects ───────────────────
DROP POLICY IF EXISTS "teams_select" ON public.teams;
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_select_team_member" ON public.projects;
DROP POLICY IF EXISTS "admin_projects" ON public.projects;
DROP POLICY IF EXISTS "profiles_select_teammates" ON public.profiles;

CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (
  auth.uid() = owner_id
  OR public.is_admin()
  OR public.is_team_member(id, auth.uid())
);

CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_team_owner(team_id, auth.uid())
  OR public.is_admin()
);

CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (
  auth.uid() = user_id
  OR public.is_admin()
);

CREATE POLICY "projects_select_team_member" ON public.projects FOR SELECT USING (
  public.is_project_team_member(id, auth.uid())
);

CREATE POLICY "admin_projects" ON public.projects FOR SELECT USING (
  public.is_admin()
);

-- ── 7. RLS: research (linked to project owner) ─────────────────
ALTER TABLE public.research_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.literature_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "research_profiles_project" ON public.research_profiles;
DROP POLICY IF EXISTS "research_notes_project" ON public.research_notes;
DROP POLICY IF EXISTS "literature_items_project" ON public.literature_items;
DROP POLICY IF EXISTS "research_findings_project" ON public.research_findings;

CREATE POLICY "research_profiles_project" ON public.research_profiles FOR ALL
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "research_notes_project" ON public.research_notes FOR ALL
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "literature_items_project" ON public.literature_items FOR ALL
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "research_findings_project" ON public.research_findings FOR ALL
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- ── 8. Activities insert ───────────────────────────────────────
DROP POLICY IF EXISTS "activities_insert_own" ON public.activities;
DROP POLICY IF EXISTS "activities_select_own" ON public.activities;

CREATE POLICY "activities_select_own" ON public.activities FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "activities_insert_own" ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ── 9. Grant API access ────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.literature_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_findings TO authenticated;
