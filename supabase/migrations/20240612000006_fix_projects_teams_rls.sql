-- Fix project reads blocked by missing teams.project_id + RLS recursion
-- Run: supabase db push

-- 1) Emergency: drop broken policy that references teams.project_id before column exists
DROP POLICY IF EXISTS "projects_select_team_member" ON public.projects;

-- 2) Ensure teams ↔ projects link exists
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_teams_project_id ON public.teams(project_id);

-- 3) Security definer helpers — break teams ↔ team_members RLS recursion
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

-- 4) Replace recursive team policies
DROP POLICY IF EXISTS "teams_select" ON public.teams;
CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (
  auth.uid() = owner_id
  OR public.is_admin()
  OR public.is_team_member(id, auth.uid())
);

DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_team_owner(team_id, auth.uid())
  OR public.is_admin()
);

-- 5) Re-create team-member project access (safe now that project_id exists)
CREATE POLICY "projects_select_team_member" ON public.projects FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.teams t ON t.id = tm.team_id
    WHERE t.project_id = projects.id
      AND tm.user_id = auth.uid()
  )
);

-- 6) Activities FK for project joins in the app
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_activities_project_id ON public.activities(project_id);
