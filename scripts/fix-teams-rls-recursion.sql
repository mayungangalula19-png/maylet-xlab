-- FIX: infinite recursion in teams / team_members RLS
-- Symptom in browser console:
--   [db] owned teams lookup failed: infinite recursion detected in policy for relation "teams"
--
-- Copy ALL of this file → Supabase Dashboard → SQL Editor → RUN once.

-- ── 1. Drop ALL policies on team_members and teams ───────────
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'team_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_members', pol.policyname);
  END LOOP;

  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'teams'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.teams', pol.policyname);
  END LOOP;
END $$;

-- ── 2. Columns the app expects ─────────────────────────────────
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS purpose TEXT;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

UPDATE public.teams
SET user_id = owner_id
WHERE user_id IS NULL AND owner_id IS NOT NULL;

-- ── 3. Security-definer helpers (bypass RLS — no recursion) ──
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
    WHERE id = p_team_id AND (owner_id = p_user_id OR user_id = p_user_id)
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

CREATE OR REPLACE FUNCTION public.get_owned_team_ids(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(team_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id
  FROM public.teams
  WHERE owner_id = p_user_id OR user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_team_owner(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_project_team_member(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_team_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_owned_team_ids(UUID) TO authenticated;

-- ── 4. Non-recursive teams policies ───────────────────────────
CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (
  auth.uid() = owner_id
  OR auth.uid() = user_id
  OR public.is_admin()
  OR public.is_team_member(id, auth.uid())
);

CREATE POLICY "teams_insert_owner" ON public.teams FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    OR auth.uid() = user_id
  );

CREATE POLICY "teams_update_owner" ON public.teams FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = user_id OR public.is_admin());

CREATE POLICY "teams_delete_owner" ON public.teams FOR DELETE
  USING (auth.uid() = owner_id OR auth.uid() = user_id OR public.is_admin());

-- ── 5. Non-recursive team_members policies ────────────────────
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_team_owner(team_id, auth.uid())
  OR public.is_admin()
);

CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_team_owner(team_id, auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "team_members_update" ON public.team_members FOR UPDATE
  USING (
    public.is_team_owner(team_id, auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.is_team_owner(team_id, auth.uid())
    OR public.is_admin()
  );

-- ── 6. Projects: team members can read linked projects ─────────
DROP POLICY IF EXISTS "projects_select_team_member" ON public.projects;
CREATE POLICY "projects_select_team_member" ON public.projects FOR SELECT USING (
  public.is_project_team_member(id, auth.uid())
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
