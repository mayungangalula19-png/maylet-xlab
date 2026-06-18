-- CUT P0: rich message metadata + messaging notification triggers

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_messages_metadata ON public.messages USING gin (metadata);

CREATE TABLE IF NOT EXISTS public.message_mentions (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, mentioned_user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_mentions_user ON public.message_mentions(mentioned_user_id);

ALTER TABLE public.message_mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "message_mentions_member_select" ON public.message_mentions;
CREATE POLICY "message_mentions_member_select" ON public.message_mentions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_mentions.message_id AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_mentions.message_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "message_mentions_sender_insert" ON public.message_mentions;
CREATE POLICY "message_mentions_sender_insert" ON public.message_mentions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_mentions.message_id AND m.sender_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, DELETE ON public.message_mentions TO authenticated;

-- Notify conversation members on new message (and mentions)
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
  preview TEXT;
  mention_id TEXT;
BEGIN
  SELECT COALESCE(NULLIF(trim(full_name), ''), 'Someone')
  INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  preview := left(NEW.content, 120);
  IF length(NEW.content) > 120 THEN
    preview := preview || '…';
  END IF;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT DISTINCT uid, 'New message', sender_name || ': ' || preview, 'message',
    '/messages?c=' || NEW.conversation_id::text
  FROM (
    SELECT cm.user_id AS uid
    FROM public.conversation_members cm
    WHERE cm.conversation_id = NEW.conversation_id AND cm.user_id <> NEW.sender_id
    UNION
    SELECT c.user1_id FROM public.conversations c
    WHERE c.id = NEW.conversation_id AND c.user1_id IS NOT NULL AND c.user1_id <> NEW.sender_id
    UNION
    SELECT c.user2_id FROM public.conversations c
    WHERE c.id = NEW.conversation_id AND c.user2_id IS NOT NULL AND c.user2_id <> NEW.sender_id
  ) recipients
  WHERE uid IS NOT NULL;

  IF NEW.metadata ? 'mentionedIds' AND jsonb_typeof(NEW.metadata->'mentionedIds') = 'array' THEN
    FOR mention_id IN
      SELECT jsonb_array_elements_text(NEW.metadata->'mentionedIds')
    LOOP
      IF mention_id::uuid <> NEW.sender_id THEN
        INSERT INTO public.notifications (user_id, title, body, type, link)
        VALUES (
          mention_id::uuid,
          'You were mentioned',
          sender_name || ' mentioned you in a message',
          'message_mention',
          '/messages?c=' || NEW.conversation_id::text
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_new_message ON public.messages;
CREATE TRIGGER trg_notify_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_message();

-- Notify user when added to a conversation
CREATE OR REPLACE FUNCTION public.notify_on_conversation_member_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_creator UUID;
  conv_title TEXT;
  inviter_name TEXT;
BEGIN
  SELECT c.created_by, COALESCE(NULLIF(trim(c.title), ''), 'a conversation')
  INTO conv_creator, conv_title
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;

  IF conv_creator IS NULL OR NEW.user_id = conv_creator THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(trim(full_name), ''), 'Someone')
  INTO inviter_name
  FROM public.profiles
  WHERE id = conv_creator;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (
    NEW.user_id,
    'Conversation invitation',
    inviter_name || ' added you to ' || conv_title,
    'conversation_invite',
    '/messages?c=' || NEW.conversation_id::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_conversation_member ON public.conversation_members;
CREATE TRIGGER trg_notify_conversation_member
  AFTER INSERT ON public.conversation_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_conversation_member_added();

-- Notify user when added to a workspace
CREATE OR REPLACE FUNCTION public.notify_on_workspace_member_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws_owner UUID;
  ws_name TEXT;
BEGIN
  SELECT w.owner_id, w.name INTO ws_owner, ws_name
  FROM public.messaging_workspaces w
  WHERE w.id = NEW.workspace_id;

  IF ws_owner IS NULL OR NEW.user_id = ws_owner THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (
    NEW.user_id,
    'Workspace invitation',
    'You were invited to workspace: ' || ws_name,
    'workspace_invite',
    '/messages'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_workspace_member ON public.workspace_members;
CREATE TRIGGER trg_notify_workspace_member
  AFTER INSERT ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_workspace_member_added();

GRANT EXECUTE ON FUNCTION public.notify_on_new_message() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_on_conversation_member_added() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_on_workspace_member_added() TO authenticated;
