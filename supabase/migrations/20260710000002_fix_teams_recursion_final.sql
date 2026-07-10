-- Drop all existing policies on teams and team_members
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

-- 1. Create SECURITY DEFINER functions to bypass RLS and break recursion

-- Get all teams the user is a member of
CREATE OR REPLACE FUNCTION public.get_my_team_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM team_members WHERE user_id = auth.uid();
$$;

-- Check if user is the owner of a specific team
CREATE OR REPLACE FUNCTION public.is_team_owner(check_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teams 
    WHERE id = check_team_id AND (owner_id = auth.uid() OR user_id = auth.uid())
  );
$$;

-- 2. Teams Policies
CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (
  auth.uid() = owner_id
  OR auth.uid() = user_id
  OR public.is_admin()
  OR id IN (SELECT public.get_my_team_ids())
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

-- 3. Team Members Policies
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_admin()
  OR team_id IN (SELECT public.get_my_team_ids())
);

CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR public.is_admin()
  OR public.is_team_owner(team_id)
);

CREATE POLICY "team_members_update" ON public.team_members FOR UPDATE USING (
  public.is_admin()
  OR public.is_team_owner(team_id)
);

CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE USING (
  user_id = auth.uid()
  OR public.is_admin()
  OR public.is_team_owner(team_id)
);
