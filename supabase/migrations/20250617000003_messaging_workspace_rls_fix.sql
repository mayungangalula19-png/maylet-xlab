-- Fix infinite recursion between messaging_workspaces <-> workspace_members RLS policies.
-- Run in Supabase SQL Editor if workspace create fails with "infinite recursion detected".

DROP POLICY IF EXISTS "workspace_members_access" ON public.workspace_members;

DROP POLICY IF EXISTS "workspace_member_select" ON public.messaging_workspaces;
CREATE POLICY "workspace_member_select" ON public.messaging_workspaces
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT wm.workspace_id
      FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- SELECT on workspace_members must NOT join back to messaging_workspaces.
DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
CREATE POLICY "workspace_members_select" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "workspace_members_insert" ON public.workspace_members;
CREATE POLICY "workspace_members_insert" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messaging_workspaces w
      WHERE w.id = workspace_id AND w.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_members_delete" ON public.workspace_members;
CREATE POLICY "workspace_members_delete" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.messaging_workspaces w
      WHERE w.id = workspace_id AND w.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_channels_insert" ON public.workspace_channels;
CREATE POLICY "workspace_channels_insert" ON public.workspace_channels
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messaging_workspaces w
      WHERE w.id = workspace_id AND w.owner_id = auth.uid()
    )
  );
