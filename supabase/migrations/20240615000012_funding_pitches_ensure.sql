-- Ensure funding_pitches matches Funding Hub UI (idempotent partial-schema repair)

CREATE TABLE IF NOT EXISTS public.funding_pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  amount NUMERIC(14, 2),
  amount_sought NUMERIC(14, 2),
  equity_offered NUMERIC(5, 2) DEFAULT 0,
  pitch_deck_url TEXT,
  industry TEXT DEFAULT 'Technology',
  stage TEXT DEFAULT 'idea',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS amount NUMERIC(14, 2);
ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS amount_sought NUMERIC(14, 2);
ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS equity_offered NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS pitch_deck_url TEXT;
ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'Technology';
ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'idea';
ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.funding_pitches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.funding_pitches
SET description = COALESCE(description, summary)
WHERE description IS NULL AND summary IS NOT NULL;

UPDATE public.funding_pitches
SET amount = COALESCE(amount, amount_sought)
WHERE amount IS NULL AND amount_sought IS NOT NULL;

UPDATE public.funding_pitches
SET title = COALESCE(NULLIF(TRIM(title), ''), 'Funding pitch')
WHERE title IS NULL;

CREATE INDEX IF NOT EXISTS idx_funding_pitches_user_id ON public.funding_pitches(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_pitches_project_id ON public.funding_pitches(project_id);

ALTER TABLE public.funding_pitches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funding_own" ON public.funding_pitches;
CREATE POLICY "funding_own" ON public.funding_pitches
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.funding_pitches TO authenticated;

NOTIFY pgrst, 'reload schema';
