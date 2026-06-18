-- Research RLS: allow project owners AND team members to read/write research data
-- Repairs partial schemas (tables created before user_id column existed)

DO $$ BEGIN
  CREATE TYPE public.gate_decision AS ENUM (
    'go', 'conditional_go', 'hold', 'no_go', 'pending'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.research_gate_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  system_completion INTEGER NOT NULL DEFAULT 0,
  section_a JSONB NOT NULL DEFAULT '[]',
  section_b JSONB NOT NULL DEFAULT '[]',
  section_c JSONB NOT NULL DEFAULT '[]',
  decision public.gate_decision NOT NULL DEFAULT 'pending',
  v1_scope TEXT,
  out_of_scope TEXT,
  open_risks TEXT,
  reviewer_name TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.research_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.research_notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.literature_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.research_findings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.research_gate_reviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

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

UPDATE public.research_gate_reviews rg
SET user_id = p.user_id
FROM public.projects p
WHERE rg.project_id = p.id AND rg.user_id IS NULL;

DROP POLICY IF EXISTS "research_profiles_project" ON public.research_profiles;
CREATE POLICY "research_profiles_project" ON public.research_profiles FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
    OR public.is_project_team_member(project_id, auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
    OR public.is_project_team_member(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "research_notes_project" ON public.research_notes;
CREATE POLICY "research_notes_project" ON public.research_notes FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
    OR public.is_project_team_member(project_id, auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
    OR public.is_project_team_member(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "literature_items_project" ON public.literature_items;
CREATE POLICY "literature_items_project" ON public.literature_items FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
    OR public.is_project_team_member(project_id, auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
    OR public.is_project_team_member(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "research_findings_project" ON public.research_findings;
CREATE POLICY "research_findings_project" ON public.research_findings FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
    OR public.is_project_team_member(project_id, auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
    OR public.is_project_team_member(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "research_gate_reviews_project" ON public.research_gate_reviews;
CREATE POLICY "research_gate_reviews_project" ON public.research_gate_reviews FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
    OR public.is_project_team_member(project_id, auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    )
    OR public.is_project_team_member(project_id, auth.uid())
  );
