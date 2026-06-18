-- Prototype visual proof / screenshot gallery

CREATE TABLE IF NOT EXISTS public.prototype_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prototype_id UUID NOT NULL REFERENCES public.prototypes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ui'
    CHECK (category IN ('ui', 'workflow', 'architecture', 'analytics', 'other')),
  context TEXT,

  purpose TEXT,
  ux_description TEXT,
  functionality TEXT,
  user_value TEXT,

  is_hero BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prototype_screenshots_proto
  ON public.prototype_screenshots(prototype_id, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prototype_screenshots_one_hero
  ON public.prototype_screenshots(prototype_id)
  WHERE is_hero = TRUE;

ALTER TABLE public.prototype_screenshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prototype_screenshots_owner" ON public.prototype_screenshots;
CREATE POLICY "prototype_screenshots_owner" ON public.prototype_screenshots
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.prototypes p
      WHERE p.id = prototype_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.prototypes p
      WHERE p.id = prototype_id AND p.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prototype_screenshots TO authenticated;
