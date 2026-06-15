-- Workspace + AI memory layer for messaging subsystem

CREATE TABLE IF NOT EXISTS public.messaging_workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id UUID NOT NULL REFERENCES public.messaging_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.workspace_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.messaging_workspaces(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'public',
  visibility TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_memory (
  conversation_id UUID PRIMARY KEY REFERENCES public.conversations(id) ON DELETE CASCADE,
  summary TEXT NOT NULL DEFAULT '',
  topics TEXT[] NOT NULL DEFAULT '{}',
  decisions TEXT[] NOT NULL DEFAULT '{}',
  action_items TEXT[] NOT NULL DEFAULT '{}',
  risks TEXT[] NOT NULL DEFAULT '{}',
  importance_score INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}',
  embedding_ready BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.messaging_workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_channels_workspace ON public.workspace_channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_updated ON public.conversation_memory(updated_at DESC);

ALTER TABLE public.messaging_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_member_select" ON public.messaging_workspaces;
CREATE POLICY "workspace_member_select" ON public.messaging_workspaces FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_members_access" ON public.workspace_members;
CREATE POLICY "workspace_members_access" ON public.workspace_members FOR ALL TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid()
  ))
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "workspace_channels_member" ON public.workspace_channels;
CREATE POLICY "workspace_channels_member" ON public.workspace_channels FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_channels.workspace_id AND wm.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "conversation_memory_member" ON public.conversation_memory;
CREATE POLICY "conversation_memory_member" ON public.conversation_memory FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conversation_memory.conversation_id AND cm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_memory.conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conversation_memory.conversation_id AND cm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_memory.conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  ));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messaging_workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_channels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_memory TO authenticated;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['messaging_workspaces', 'workspace_members', 'workspace_channels', 'conversation_memory']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
