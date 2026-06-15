-- Documents table + storage compat for remote DBs missing research columns or RLS WITH CHECK

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS size_bytes BIGINT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from project owner when absent
UPDATE public.documents d
SET user_id = p.user_id
FROM public.projects p
WHERE d.project_id = p.id AND d.user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_project ON public.documents(project_id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_project" ON public.documents;
CREATE POLICY "documents_project" ON public.documents FOR ALL TO authenticated
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
