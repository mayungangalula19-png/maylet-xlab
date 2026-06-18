-- Ensure vault_entries exists (idempotent — safe on DBs that already have core schema)
-- Do NOT re-run 20240101000002_core_schema.sql if enums/tables already exist.

CREATE TABLE IF NOT EXISTS public.vault_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_confidential BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Repair partial installs (table existed without these columns)
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT TRUE;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_vault_entries_user_id ON public.vault_entries(user_id);

ALTER TABLE public.vault_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vault_entries_own" ON public.vault_entries;
CREATE POLICY "vault_entries_own" ON public.vault_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_entries TO authenticated;

-- Refresh PostgREST schema cache (Supabase picks this up automatically; NOTIFY helps immediately)
NOTIFY pgrst, 'reload schema';
