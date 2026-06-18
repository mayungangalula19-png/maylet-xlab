-- Innovation Vault Command Center — governance, audit, approvals, versioning
-- Idempotent migration for admin vault operations

ALTER TABLE public.vault_entries
  ADD COLUMN IF NOT EXISTS asset_type TEXT,
  ADD COLUMN IF NOT EXISTS classification TEXT DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS folder TEXT,
  ADD COLUMN IF NOT EXISTS collection TEXT,
  ADD COLUMN IF NOT EXISTS knowledge_domain TEXT,
  ADD COLUMN IF NOT EXISTS innovation_stage TEXT,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_type TEXT;

CREATE INDEX IF NOT EXISTS idx_vault_entries_classification ON public.vault_entries(classification);
CREATE INDEX IF NOT EXISTS idx_vault_entries_status ON public.vault_entries(status);
CREATE INDEX IF NOT EXISTS idx_vault_entries_project ON public.vault_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_vault_entries_updated ON public.vault_entries(updated_at DESC);

-- Vault folders (organizational hierarchy)
CREATE TABLE IF NOT EXISTS public.vault_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.vault_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '/',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_folders_user ON public.vault_folders(user_id);

-- Vault collections (curated sets)
CREATE TABLE IF NOT EXISTS public.vault_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asset version history
CREATE TABLE IF NOT EXISTS public.vault_asset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_source TEXT NOT NULL,
  asset_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  file_url TEXT,
  content_hash TEXT,
  changelog TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_asset_versions_asset ON public.vault_asset_versions(asset_source, asset_id);

-- Approval workflow
CREATE TABLE IF NOT EXISTS public.vault_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_source TEXT NOT NULL,
  asset_id UUID NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN (
    'research_lead', 'project_lead', 'validator', 'admin', 'executive'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'archived', 'restored', 'escalated'
  )),
  comments TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_approvals_status ON public.vault_approvals(status);

-- Audit trail
CREATE TABLE IF NOT EXISTS public.vault_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_source TEXT NOT NULL,
  asset_id UUID NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN (
    'created', 'viewed', 'downloaded', 'updated', 'shared',
    'archived', 'deleted', 'restored', 'approved', 'rejected'
  )),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_audit_asset ON public.vault_audit_events(asset_source, asset_id);
CREATE INDEX IF NOT EXISTS idx_vault_audit_created ON public.vault_audit_events(created_at DESC);

-- Knowledge graph edges (explicit relationships)
CREATE TABLE IF NOT EXISTS public.vault_knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_source TEXT NOT NULL,
  from_id UUID NOT NULL,
  to_source TEXT NOT NULL,
  to_id UUID NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'related',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_knowledge_from ON public.vault_knowledge_edges(from_source, from_id);
CREATE INDEX IF NOT EXISTS idx_vault_knowledge_to ON public.vault_knowledge_edges(to_source, to_id);

-- RLS
ALTER TABLE public.vault_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_asset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_knowledge_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vault_entries_admin_read" ON public.vault_entries;
CREATE POLICY "vault_entries_admin_read" ON public.vault_entries FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "vault_items_admin_read" ON public.vault_items;
CREATE POLICY "vault_items_admin_read" ON public.vault_items FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "vault_folders_access" ON public.vault_folders;
CREATE POLICY "vault_folders_access" ON public.vault_folders FOR ALL
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "vault_collections_access" ON public.vault_collections;
CREATE POLICY "vault_collections_access" ON public.vault_collections FOR ALL
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "vault_asset_versions_access" ON public.vault_asset_versions;
CREATE POLICY "vault_asset_versions_access" ON public.vault_asset_versions FOR ALL
  USING (public.is_admin() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "vault_approvals_access" ON public.vault_approvals;
CREATE POLICY "vault_approvals_access" ON public.vault_approvals FOR ALL
  USING (public.is_admin() OR auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "vault_audit_access" ON public.vault_audit_events;
CREATE POLICY "vault_audit_access" ON public.vault_audit_events FOR SELECT
  USING (public.is_admin() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "vault_audit_insert" ON public.vault_audit_events;
CREATE POLICY "vault_audit_insert" ON public.vault_audit_events FOR INSERT
  WITH CHECK (public.is_admin() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "vault_knowledge_edges_access" ON public.vault_knowledge_edges;
CREATE POLICY "vault_knowledge_edges_access" ON public.vault_knowledge_edges FOR ALL
  USING (public.is_admin() OR auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_collections TO authenticated;
GRANT SELECT, INSERT ON public.vault_asset_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vault_approvals TO authenticated;
GRANT SELECT, INSERT ON public.vault_audit_events TO authenticated;
GRANT SELECT, INSERT ON public.vault_knowledge_edges TO authenticated;

-- Admin RPC for vault stats
CREATE OR REPLACE FUNCTION public.get_admin_vault_ops_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'vault_entries', (SELECT COUNT(*)::int FROM public.vault_entries),
    'vault_items', (SELECT COUNT(*)::int FROM public.vault_items),
    'documents', (SELECT COUNT(*)::int FROM public.documents),
    'prototype_files', (SELECT COUNT(*)::int FROM public.prototype_files),
    'confidential', (
      SELECT COUNT(*)::int FROM public.vault_entries WHERE is_confidential = TRUE
    ),
    'pending_approvals', (
      SELECT COUNT(*)::int FROM public.vault_approvals WHERE status = 'pending'
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_vault_ops_stats() TO authenticated;

NOTIFY pgrst, 'reload schema';
