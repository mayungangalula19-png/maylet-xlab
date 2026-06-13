-- Prototype build file attachments

CREATE TABLE IF NOT EXISTS public.prototype_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prototype_id UUID NOT NULL REFERENCES public.prototypes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  url TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prototype_files_proto ON public.prototype_files(prototype_id);

ALTER TABLE public.prototype_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prototype_files_via_proto" ON public.prototype_files FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.prototypes p WHERE p.id = prototype_id AND p.user_id = auth.uid()
  ));
