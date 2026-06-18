-- Quick repair: add all Innovation Vault columns (paste in Supabase SQL Editor)

ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT TRUE;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill title for rows that only have content
UPDATE public.vault_entries
SET title = LEFT(COALESCE(NULLIF(TRIM(content), ''), NULLIF(TRIM(description), ''), 'Vault entry'), 120)
WHERE title IS NULL;

UPDATE public.vault_entries SET title = 'Vault entry' WHERE title IS NULL;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vault_entries' AND column_name = 'title'
  ) AND NOT EXISTS (SELECT 1 FROM public.vault_entries WHERE title IS NULL) THEN
    ALTER TABLE public.vault_entries ALTER COLUMN title SET NOT NULL;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
