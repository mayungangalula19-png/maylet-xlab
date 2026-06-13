-- Research Gate Reviews — Research → Prototype authorization

CREATE TYPE public.gate_decision AS ENUM (
  'go',
  'conditional_go',
  'hold',
  'no_go',
  'pending'
);

CREATE TABLE public.research_gate_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_research_gate_reviews_project ON public.research_gate_reviews(project_id);
CREATE UNIQUE INDEX idx_research_gate_reviews_project_latest
  ON public.research_gate_reviews(project_id, created_at DESC);

ALTER TABLE public.research_gate_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "research_gate_reviews_project" ON public.research_gate_reviews FOR ALL
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
