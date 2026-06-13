-- Collaboration + activity read policies required by Projects dashboard

CREATE POLICY "activities_select_own"
  ON public.activities
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "team_activities_select_member"
  ON public.team_activities
  FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.team_id = team_activities.team_id
        AND tm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = team_activities.team_id
        AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "team_activities_insert_member"
  ON public.team_activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.team_id = team_activities.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin', 'member')
    )
    OR EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = team_activities.team_id
        AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "ai_analyses_select_project_owner"
  ON public.ai_analyses
  FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = ai_analyses.project_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "profiles_select_teammates"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.team_members me
      JOIN public.team_members them ON me.team_id = them.team_id
      WHERE me.user_id = auth.uid()
        AND them.user_id = profiles.id
    )
  );

CREATE POLICY "projects_select_team_member"
  ON public.projects
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.teams t
      JOIN public.team_members tm ON tm.team_id = t.id
      WHERE t.project_id = projects.id
        AND tm.user_id = auth.uid()
    )
  );
