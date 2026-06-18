-- RLS policies required for authenticated workspace creation from the Messages UI

DROP POLICY IF EXISTS "workspace_owner_insert" ON public.messaging_workspaces;
CREATE POLICY "workspace_owner_insert" ON public.messaging_workspaces
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "workspace_owner_update" ON public.messaging_workspaces;
CREATE POLICY "workspace_owner_update" ON public.messaging_workspaces
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "workspace_channels_insert" ON public.workspace_channels;
CREATE POLICY "workspace_channels_insert" ON public.workspace_channels
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messaging_workspaces w
      WHERE w.id = workspace_id AND w.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_channels.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "conversation_memory_insert" ON public.conversation_memory;
CREATE POLICY "conversation_memory_insert" ON public.conversation_memory
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_memory.conversation_id
        AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_memory.conversation_id
        AND (c.created_by = auth.uid() OR c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "conversation_memory_update" ON public.conversation_memory;
CREATE POLICY "conversation_memory_update" ON public.conversation_memory
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_memory.conversation_id
        AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_memory.conversation_id
        AND (c.created_by = auth.uid() OR c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );
