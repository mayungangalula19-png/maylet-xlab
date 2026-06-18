-- Allow DM initiator (user1) to add the other participant when created_by is unset

DROP POLICY IF EXISTS "conversation_members_insert" ON public.conversation_members;

CREATE POLICY "conversation_members_insert" ON public.conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.created_by = auth.uid()
    )
    OR (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
          AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.type = 'dm'
        AND c.user1_id = auth.uid()
    )
  );
