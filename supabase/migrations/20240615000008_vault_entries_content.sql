-- vault_entries: columns expected by Innovation Vault UI and SaveIdea

ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT TRUE;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

NOTIFY pgrst, 'reload schema';
