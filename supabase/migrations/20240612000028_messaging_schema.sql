-- Messaging: conversations, members, messages, presence (DM + group + channel)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE public.conversation_type AS ENUM ('dm', 'group', 'channel');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type public.conversation_type NOT NULL DEFAULT 'dm',
  title TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS type public.conversation_type NOT NULL DEFAULT 'dm';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  status TEXT NOT NULL DEFAULT 'sent',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.message_receipts (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'delivered',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON public.conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_project ON public.conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_team ON public.conversations(team_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON public.conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Conversations: member or legacy DM participant
DROP POLICY IF EXISTS "conversations_member_select" ON public.conversations;
CREATE POLICY "conversations_member_select" ON public.conversations FOR SELECT TO authenticated
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id OR auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = id AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "conversations_member_insert" ON public.conversations;
CREATE POLICY "conversations_member_insert" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by OR auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "conversation_members_access" ON public.conversation_members;
CREATE POLICY "conversation_members_access" ON public.conversation_members FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()
    )
  )
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND (c.created_by = auth.uid() OR c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  ));

DROP POLICY IF EXISTS "messages_member_access" ON public.messages;
CREATE POLICY "messages_member_access" ON public.messages FOR ALL TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  )
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "message_receipts_access" ON public.message_receipts;
CREATE POLICY "message_receipts_access" ON public.message_receipts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "presence_select" ON public.user_presence;
CREATE POLICY "presence_select" ON public.user_presence FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "presence_upsert_own" ON public.user_presence;
CREATE POLICY "presence_upsert_own" ON public.user_presence FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_presence TO authenticated;

-- Realtime publication (idempotent)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['conversations', 'conversation_members', 'messages', 'message_receipts', 'user_presence']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
