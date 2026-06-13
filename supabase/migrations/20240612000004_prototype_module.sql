-- Prototype module extensions

ALTER TABLE public.prototypes
  ADD COLUMN IF NOT EXISTS research_id UUID,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.prototype_builds (
  id TEXT PRIMARY KEY,
  prototype_id UUID NOT NULL REFERENCES public.prototypes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  build_config TEXT,
  output_url TEXT,
  logs JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.prototype_test_runs (
  id TEXT PRIMARY KEY,
  prototype_id UUID NOT NULL REFERENCES public.prototypes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  verdict TEXT NOT NULL DEFAULT 'pending',
  score INTEGER,
  notes TEXT,
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prototype_builds_proto ON public.prototype_builds(prototype_id);
CREATE INDEX IF NOT EXISTS idx_prototype_tests_proto ON public.prototype_test_runs(prototype_id);

ALTER TABLE public.prototype_builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prototype_test_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prototype_builds_via_proto" ON public.prototype_builds FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.prototypes p WHERE p.id = prototype_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "prototype_tests_via_proto" ON public.prototype_test_runs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.prototypes p WHERE p.id = prototype_id AND p.user_id = auth.uid()
  ));
