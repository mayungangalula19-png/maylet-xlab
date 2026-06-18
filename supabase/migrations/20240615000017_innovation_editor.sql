-- Innovation editor: drafts, version history, audit-friendly metadata.
-- Supports enterprise edit flows with future multi-tenancy via organization_id.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID;

CREATE TABLE IF NOT EXISTS public.innovation_entity_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  payload JSONB NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_innovation_drafts_user ON public.innovation_entity_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_innovation_drafts_project ON public.innovation_entity_drafts(project_id);

CREATE TABLE IF NOT EXISTS public.innovation_entity_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  version_number INT NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  save_mode TEXT NOT NULL DEFAULT 'publish' CHECK (save_mode IN ('draft', 'autosave', 'publish')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_innovation_versions_entity
  ON public.innovation_entity_versions(entity_type, entity_id, version_number DESC);

ALTER TABLE public.innovation_entity_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.innovation_entity_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS innovation_drafts_own ON public.innovation_entity_drafts;
CREATE POLICY innovation_drafts_own ON public.innovation_entity_drafts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS innovation_versions_read ON public.innovation_entity_versions;
CREATE POLICY innovation_versions_read ON public.innovation_entity_versions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS innovation_versions_insert ON public.innovation_entity_versions;
CREATE POLICY innovation_versions_insert ON public.innovation_entity_versions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.innovation_entity_drafts TO authenticated;
GRANT SELECT, INSERT ON public.innovation_entity_versions TO authenticated;
