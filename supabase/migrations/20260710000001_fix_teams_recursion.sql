-- Migration to fix Teams RLS Infinite Recursion

-- First, drop the recursive functions and policies
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

-- Drop the functions that might be causing recursion
DROP FUNCTION IF EXISTS public.is_team_member(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_team_owner(UUID, UUID);

-- Teams Policies
-- A user can see a team if they own it, or if they are in the team_members table
CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (
  auth.uid() = owner_id
  OR auth.uid() = user_id
  OR public.is_admin()
  OR id IN (
    -- Direct subquery on team_members. 
    -- To avoid recursion, team_members policy MUST NOT query teams.
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "teams_insert" ON public.teams FOR INSERT WITH CHECK (
  auth.uid() = owner_id OR auth.uid() = user_id OR public.is_admin()
);

CREATE POLICY "teams_update" ON public.teams FOR UPDATE USING (
  auth.uid() = owner_id OR auth.uid() = user_id OR public.is_admin()
);

CREATE POLICY "teams_delete" ON public.teams FOR DELETE USING (
  auth.uid() = owner_id OR auth.uid() = user_id OR public.is_admin()
);

-- Team Members Policies
-- A user can see team members if they are in the same team.
-- We use a subquery on team_members itself to avoid querying the teams table, thus breaking the recursion.
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_admin()
  OR team_id IN (
    SELECT tm.team_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
  )
);

CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR public.is_admin()
  OR team_id IN (
    SELECT t.id FROM public.teams t WHERE t.owner_id = auth.uid() OR t.user_id = auth.uid()
  )
);

CREATE POLICY "team_members_update" ON public.team_members FOR UPDATE USING (
  public.is_admin()
  OR team_id IN (
    SELECT t.id FROM public.teams t WHERE t.owner_id = auth.uid() OR t.user_id = auth.uid()
  )
);

CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE USING (
  user_id = auth.uid()
  OR public.is_admin()
  OR team_id IN (
    SELECT t.id FROM public.teams t WHERE t.owner_id = auth.uid() OR t.user_id = auth.uid()
  )
);
