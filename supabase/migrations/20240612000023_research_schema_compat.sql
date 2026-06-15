-- Research module schema compat (remote DBs may lack user_id or whole tables)
-- Fixes 400 errors on research_notes / literature_items / research_findings / research_profiles

-- Enums (idempotent)
DO $$ BEGIN
  CREATE TYPE public.literature_type AS ENUM ('paper', 'journal', 'white_paper', 'report', 'reference');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.finding_type AS ENUM ('finding', 'observation', 'insight', 'conclusion');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.research_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_statement TEXT,
  target_users TEXT,
  pain_points TEXT,
  existing_solutions TEXT,
  research_questions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Note',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.literature_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Literature',
  item_type public.literature_type NOT NULL DEFAULT 'paper',
  source TEXT,
  authors TEXT,
  publication_date DATE,
  citation_count INTEGER,
  relevance_score INTEGER,
  url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Finding',
  content TEXT NOT NULL DEFAULT '',
  finding_type public.finding_type NOT NULL DEFAULT 'finding',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Missing columns on partial schemas
ALTER TABLE public.research_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.research_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.research_notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.research_notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.research_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.literature_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.literature_items ADD COLUMN IF NOT EXISTS item_type public.literature_type NOT NULL DEFAULT 'paper';
ALTER TABLE public.literature_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.literature_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.research_findings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.research_findings ADD COLUMN IF NOT EXISTS finding_type public.finding_type NOT NULL DEFAULT 'finding';
ALTER TABLE public.research_findings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.research_findings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill user_id from project owner
UPDATE public.research_profiles rp
SET user_id = p.user_id
FROM public.projects p
WHERE rp.project_id = p.id AND rp.user_id IS NULL;

UPDATE public.research_notes rn
SET user_id = p.user_id
FROM public.projects p
WHERE rn.project_id = p.id AND rn.user_id IS NULL;

UPDATE public.literature_items li
SET user_id = p.user_id
FROM public.projects p
WHERE li.project_id = p.id AND li.user_id IS NULL;

UPDATE public.research_findings rf
SET user_id = p.user_id
FROM public.projects p
WHERE rf.project_id = p.id AND rf.user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_research_profiles_project ON public.research_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_project ON public.research_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_user ON public.research_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_literature_items_project ON public.literature_items(project_id);
CREATE INDEX IF NOT EXISTS idx_literature_items_user ON public.literature_items(user_id);
CREATE INDEX IF NOT EXISTS idx_research_findings_project ON public.research_findings(project_id);
CREATE INDEX IF NOT EXISTS idx_research_findings_user ON public.research_findings(user_id);

-- RLS
ALTER TABLE public.research_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.literature_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "research_profiles_project" ON public.research_profiles;
CREATE POLICY "research_profiles_project" ON public.research_profiles FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "research_notes_project" ON public.research_notes;
CREATE POLICY "research_notes_project" ON public.research_notes FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "literature_items_project" ON public.literature_items;
CREATE POLICY "literature_items_project" ON public.literature_items FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "research_findings_project" ON public.research_findings;
CREATE POLICY "research_findings_project" ON public.research_findings FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.literature_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_findings TO authenticated;
