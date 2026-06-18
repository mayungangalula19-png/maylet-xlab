-- Prototype Operations Center — governance, architecture, approvals, audit
-- Idempotent migration for admin prototype command center

-- Extend prototypes with ops metadata (optional overrides)
ALTER TABLE public.prototypes
  ADD COLUMN IF NOT EXISTS technical_lead_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS governance_stage TEXT;

CREATE INDEX IF NOT EXISTS idx_prototypes_governance_stage ON public.prototypes(governance_stage);
CREATE INDEX IF NOT EXISTS idx_prototypes_department ON public.prototypes(department);
CREATE INDEX IF NOT EXISTS idx_prototypes_status ON public.prototypes(status);
CREATE INDEX IF NOT EXISTS idx_prototypes_updated_at ON public.prototypes(updated_at DESC);

-- Architecture documentation layers
CREATE TABLE IF NOT EXISTS public.prototype_architecture (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prototype_id UUID NOT NULL REFERENCES public.prototypes(id) ON DELETE CASCADE,
  layer_type TEXT NOT NULL CHECK (layer_type IN (
    'hardware', 'software', 'cloud', 'ai', 'network', 'security', 'integration', 'dependency'
  )),
  title TEXT NOT NULL,
  description TEXT,
  diagram_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'deprecated')),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prototype_architecture_proto ON public.prototype_architecture(prototype_id);
CREATE INDEX IF NOT EXISTS idx_prototype_architecture_layer ON public.prototype_architecture(layer_type);

-- Engineering workspace documents
CREATE TABLE IF NOT EXISTS public.prototype_engineering_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prototype_id UUID NOT NULL REFERENCES public.prototypes(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN (
    'requirements', 'specifications', 'technical_doc', 'system_design',
    'architecture_diagram', 'schematic', 'engineering_note', 'dev_log'
  )),
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  version TEXT DEFAULT '1.0',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prototype_engineering_docs_proto ON public.prototype_engineering_docs(prototype_id);

-- Version control center
CREATE TABLE IF NOT EXISTS public.prototype_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prototype_id UUID NOT NULL REFERENCES public.prototypes(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  release_type TEXT NOT NULL DEFAULT 'minor' CHECK (release_type IN ('major', 'minor', 'experimental', 'patch')),
  changelog TEXT,
  file_url TEXT,
  approved BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prototype_versions_proto ON public.prototype_versions(prototype_id);

-- Approval governance workflow
CREATE TABLE IF NOT EXISTS public.prototype_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prototype_id UUID NOT NULL REFERENCES public.prototypes(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN (
    'engineer', 'research_lead', 'validator', 'program_manager', 'admin'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'revision_requested', 'escalated', 'archived'
  )),
  comments TEXT,
  decision TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prototype_approvals_proto ON public.prototype_approvals(prototype_id);
CREATE INDEX IF NOT EXISTS idx_prototype_approvals_status ON public.prototype_approvals(status);

-- Audit center
CREATE TABLE IF NOT EXISTS public.prototype_audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prototype_id UUID NOT NULL REFERENCES public.prototypes(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN (
    'created', 'updated', 'reviewed', 'approved', 'rejected', 'archived',
    'transferred', 'published', 'version_released', 'test_completed', 'escalated'
  )),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prototype_audit_proto ON public.prototype_audit_events(prototype_id);
CREATE INDEX IF NOT EXISTS idx_prototype_audit_created ON public.prototype_audit_events(created_at DESC);

-- Readiness score snapshots (for historical comparison)
CREATE TABLE IF NOT EXISTS public.prototype_readiness_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prototype_id UUID NOT NULL REFERENCES public.prototypes(id) ON DELETE CASCADE,
  documentation_score INT CHECK (documentation_score BETWEEN 0 AND 100),
  engineering_score INT CHECK (engineering_score BETWEEN 0 AND 100),
  testing_score INT CHECK (testing_score BETWEEN 0 AND 100),
  validation_score INT CHECK (validation_score BETWEEN 0 AND 100),
  funding_score INT CHECK (funding_score BETWEEN 0 AND 100),
  commercialization_score INT CHECK (commercialization_score BETWEEN 0 AND 100),
  overall_score INT CHECK (overall_score BETWEEN 0 AND 100),
  ai_confidence INT CHECK (ai_confidence BETWEEN 0 AND 100),
  risk_score INT CHECK (risk_score BETWEEN 0 AND 100),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prototype_readiness_proto ON public.prototype_readiness_snapshots(prototype_id);

-- RLS
ALTER TABLE public.prototype_architecture ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prototype_engineering_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prototype_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prototype_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prototype_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prototype_readiness_snapshots ENABLE ROW LEVEL SECURITY;

-- Owner access via prototype ownership
DROP POLICY IF EXISTS "prototype_architecture_owner" ON public.prototype_architecture;
CREATE POLICY "prototype_architecture_owner" ON public.prototype_architecture FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.prototypes p WHERE p.id = prototype_id AND (p.user_id = auth.uid() OR public.is_admin())
  ));

DROP POLICY IF EXISTS "prototype_engineering_docs_owner" ON public.prototype_engineering_docs;
CREATE POLICY "prototype_engineering_docs_owner" ON public.prototype_engineering_docs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.prototypes p WHERE p.id = prototype_id AND (p.user_id = auth.uid() OR public.is_admin())
  ));

DROP POLICY IF EXISTS "prototype_versions_owner" ON public.prototype_versions;
CREATE POLICY "prototype_versions_owner" ON public.prototype_versions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.prototypes p WHERE p.id = prototype_id AND (p.user_id = auth.uid() OR public.is_admin())
  ));

DROP POLICY IF EXISTS "prototype_approvals_access" ON public.prototype_approvals;
CREATE POLICY "prototype_approvals_access" ON public.prototype_approvals FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.prototypes p WHERE p.id = prototype_id AND (p.user_id = auth.uid() OR public.is_admin())
  ));

DROP POLICY IF EXISTS "prototype_audit_access" ON public.prototype_audit_events;
CREATE POLICY "prototype_audit_access" ON public.prototype_audit_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.prototypes p WHERE p.id = prototype_id AND (p.user_id = auth.uid() OR public.is_admin())
  ));

DROP POLICY IF EXISTS "prototype_audit_insert" ON public.prototype_audit_events;
CREATE POLICY "prototype_audit_insert" ON public.prototype_audit_events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.prototypes p WHERE p.id = prototype_id AND (p.user_id = auth.uid() OR public.is_admin())
  ));

DROP POLICY IF EXISTS "prototype_readiness_access" ON public.prototype_readiness_snapshots;
CREATE POLICY "prototype_readiness_access" ON public.prototype_readiness_snapshots FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.prototypes p WHERE p.id = prototype_id AND (p.user_id = auth.uid() OR public.is_admin())
  ));

-- Admin full read on prototypes (ensure policy exists)
DROP POLICY IF EXISTS "prototypes_admin_read" ON public.prototypes;
CREATE POLICY "prototypes_admin_read" ON public.prototypes FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "prototypes_admin_update" ON public.prototypes;
CREATE POLICY "prototypes_admin_update" ON public.prototypes FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prototype_architecture TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prototype_engineering_docs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prototype_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prototype_approvals TO authenticated;
GRANT SELECT, INSERT ON public.prototype_audit_events TO authenticated;
GRANT SELECT, INSERT ON public.prototype_readiness_snapshots TO authenticated;

-- Admin RPC for aggregated stats (server-side performance)
CREATE OR REPLACE FUNCTION public.get_admin_prototype_ops_stats()
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
    'total', (SELECT COUNT(*)::int FROM public.prototypes),
    'active', (SELECT COUNT(*)::int FROM public.prototypes WHERE status NOT IN ('archived', 'failed')),
    'success', (SELECT COUNT(*)::int FROM public.prototypes WHERE status IN ('success', 'published')),
    'high_risk', (
      SELECT COUNT(*)::int FROM public.prototypes
      WHERE status = 'failed' OR (status = 'draft' AND updated_at < NOW() - INTERVAL '30 days')
    ),
    'with_builds', (SELECT COUNT(DISTINCT prototype_id)::int FROM public.prototype_builds),
    'with_tests', (SELECT COUNT(DISTINCT prototype_id)::int FROM public.prototype_test_runs),
    'with_files', (SELECT COUNT(DISTINCT prototype_id)::int FROM public.prototype_files),
    'pending_approvals', (
      SELECT COUNT(*)::int FROM public.prototype_approvals WHERE status = 'pending'
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_prototype_ops_stats() TO authenticated;
