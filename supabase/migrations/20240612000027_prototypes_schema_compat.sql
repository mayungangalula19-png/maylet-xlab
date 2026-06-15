-- Prototypes table compat for remote Supabase DBs created before prototype module extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.prototypes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.prototypes ADD COLUMN IF NOT EXISTS research_id UUID;
ALTER TABLE public.prototypes ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.prototypes ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE public.prototypes ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0;
ALTER TABLE public.prototypes ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.prototypes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.prototypes ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0';
ALTER TABLE public.prototypes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.prototypes ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.prototypes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_prototypes_user_id ON public.prototypes(user_id);
CREATE INDEX IF NOT EXISTS idx_prototypes_project_id ON public.prototypes(project_id);
CREATE INDEX IF NOT EXISTS idx_prototypes_research_id ON public.prototypes(research_id);

ALTER TABLE public.prototypes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prototypes_own" ON public.prototypes;
CREATE POLICY "prototypes_own" ON public.prototypes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prototypes TO authenticated;
