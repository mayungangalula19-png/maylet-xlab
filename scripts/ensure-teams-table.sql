-- =============================================================================
-- Ensure teams + team_members tables exist (run in Supabase SQL Editor)
-- Safe to re-run — uses IF NOT EXISTS / OR REPLACE / DROP IF EXISTS
-- =============================================================================

-- Enum for member roles
DO $$ BEGIN
  CREATE TYPE public.team_member_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── teams ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  purpose TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS purpose TEXT;

CREATE INDEX IF NOT EXISTS idx_teams_project_id ON public.teams(project_id);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON public.teams(user_id);

-- ── team_members ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.team_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- ── Sync user_id ↔ owner_id ──────────────────────────────────────────────────
UPDATE public.teams
SET owner_id = user_id
WHERE owner_id IS NULL AND user_id IS NOT NULL;

UPDATE public.teams
SET user_id = owner_id
WHERE user_id IS NULL AND owner_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_team_owner_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    NEW.owner_id := NEW.user_id;
  ELSIF NEW.owner_id IS NOT NULL AND NEW.user_id IS NULL THEN
    NEW.user_id := NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_team_owner_id_trigger ON public.teams;
CREATE TRIGGER sync_team_owner_id_trigger
  BEFORE INSERT OR UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_team_owner_id();

-- ── RLS helpers (no recursion) ───────────────────────────────────────────────
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

CREATE OR REPLACE FUNCTION public.get_user_team_ids(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(team_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT tm.team_id
  FROM public.team_members tm
  WHERE tm.user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_team_owner(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_team_ids(UUID) TO authenticated;

-- ── Enable RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop old policies (safe re-run)
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('teams', 'team_members')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (
  auth.uid() = owner_id
  OR auth.uid() = user_id
  OR public.is_team_member(id, auth.uid())
);

CREATE POLICY "teams_insert_owner" ON public.teams FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    OR auth.uid() = user_id
  );

CREATE POLICY "teams_update_owner" ON public.teams FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = user_id);

CREATE POLICY "teams_delete_owner" ON public.teams FOR DELETE
  USING (auth.uid() = owner_id OR auth.uid() = user_id);

CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_team_owner(team_id, auth.uid())
);

CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_team_owner(team_id, auth.uid())
  );

CREATE POLICY "team_members_update" ON public.team_members FOR UPDATE
  USING (public.is_team_owner(team_id, auth.uid()));

CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.is_team_owner(team_id, auth.uid())
  );

-- API access for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
