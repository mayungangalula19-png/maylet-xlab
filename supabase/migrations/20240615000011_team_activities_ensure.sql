CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role::text IN ('admin', 'super_admin')
  );
$$;

-- Ensure team_activities exists (idempotent — safe on partial Supabase installs)

CREATE TABLE IF NOT EXISTS public.team_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.team_activities ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.team_activities ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.team_activities ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.team_activities ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
ALTER TABLE public.team_activities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_team_activities_team_id ON public.team_activities(team_id);
CREATE INDEX IF NOT EXISTS idx_team_activities_created_at ON public.team_activities(created_at DESC);

ALTER TABLE public.team_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_activities_select_member" ON public.team_activities;
CREATE POLICY "team_activities_select_member" ON public.team_activities
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_activities.team_id AND tm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_activities.team_id AND t.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "team_activities_insert_member" ON public.team_activities;
CREATE POLICY "team_activities_insert_member" ON public.team_activities
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_activities.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin', 'member')
    )
    OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_activities.team_id AND t.owner_id = auth.uid()
    )
  );

GRANT SELECT, INSERT ON public.team_activities TO authenticated;

NOTIFY pgrst, 'reload schema';
