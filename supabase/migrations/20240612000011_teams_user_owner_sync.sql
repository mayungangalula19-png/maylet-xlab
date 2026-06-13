-- Align teams.user_id with teams.owner_id + ensure app columns (purpose, project_id)
-- Safe to re-run: IF NOT EXISTS / OR REPLACE / DROP IF EXISTS

DO $$ BEGIN
  CREATE TYPE public.team_member_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

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

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.team_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS purpose TEXT;

CREATE INDEX IF NOT EXISTS idx_teams_project_id ON public.teams(project_id);

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

-- Allow CreateTeam inserts that send user_id only
DROP POLICY IF EXISTS "teams_insert_owner" ON public.teams;
CREATE POLICY "teams_insert_owner" ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
